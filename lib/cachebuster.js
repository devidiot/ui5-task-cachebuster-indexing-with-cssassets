const processors = require("@ui5/builder").processors;
const tasks = require("@ui5/builder").tasks;
const postcss = require('postcss');
const postcssUrl = require('postcss-url');

/**
 * Custom task example
 *
 * @param {object} parameters Parameters
 * @param {module:@ui5/fs.DuplexCollection} parameters.workspace DuplexCollection to read and write files
 * @param {module:@ui5/fs.AbstractReader} parameters.dependencies Reader or Collection to read dependency files
 * @param {object} parameters.taskUtil Specification Version dependent interface to a
 *                [TaskUtil]{@link module:@ui5/builder.tasks.TaskUtil} instance
 * @param {object} parameters.options Options
 * @param {string} parameters.options.projectName Project name
 * @param {string} [parameters.options.projectNamespace] Project namespace if available
 * @param {string} [parameters.options.configuration] Task configuration if given in ui5.yaml
 * @returns {Promise<undefined>} Promise resolving with <code>undefined</code> once data has been written
 */
async function doTask({ workspace, dependencies, taskUtil, options }) {
    options.configuration && options.configuration.debug && console.log("Generate cachebuster info");
    await tasks.generateCachebusterInfo({ workspace, dependencies, options: { namespace: options.projectNamespace, signatureType: "time" } });

    const cachebusterInfoResources = await workspace.byGlob("**/sap-ui-cachebuster-info.json");
    if (cachebusterInfoResources.length > 0) {
        options.configuration && options.configuration.debug && console.log("Cachebuster info generated");
        let cachebusterInfo = JSON.parse(await cachebusterInfoResources[0].getString());
        /**
         * cachebusterInfo에서 .css 파일을 찾아 파일 내 url assets을 찾dk stylesheets에 담는다. 
         */
        for (let resourcePath in cachebusterInfo) {
            if(resourcePath.endsWith(".css")){
                let cssResources = await workspace.byGlob("**/" + resourcePath);
                if (cssResources.length > 0) {
                    let contents = await cssResources[0].getString();
                    let path = cssResources[0].getPath();
                    let assets = [];
                    await postcss([
                        postcssUrl({
                            url: (asset) => {
                                if (asset.url.startsWith(".")){
                                    assets.push(asset.url);
                                }
                                return asset.url;
                            }
                        })
                    ]).process(contents, { from: path });
                    stylesheets[resourcePath] = assets;
                }
            }
        }
        for (let resourcePath in cachebusterInfo) {
            let resource = await workspace.byPath("/resources/" + options.projectNamespace + "/" + resourcePath);
            let newResource = undefined;
            if (resource) {
                options.configuration && options.configuration.debug && console.log(`Clone file for cachebust: ${resourcePath}`);
                newResource = await resource.clone();
            }
            if (newResource) {
                newResource.setPath("/resources/" + options.projectNamespace + "/~" + cachebusterInfo[resourcePath] + "~/" + resourcePath);
                await workspace.write(newResource);
            }
            /**
             * resource가 url assets인지 확인한 후 맞을 경우 해당 .css 파일의 indexing된 폴더 경로 하위에도 resource를 추가한다.
             */
            let founds = findAssetInStyleSheet(resourcePath);
            if (founds.length > 0){
                for (let i = 0; i < founds.length; i++) {
                    let assetResource = undefined;
                    if (resource) {
                        assetResource = await resource.clone();
                    }
                    if (assetResource) {
                        assetResource.setPath("/resources/" + options.projectNamespace + "/~" + cachebusterInfo[founds[i]] + "~/" + resourcePath);
                        await workspace.write(assetResource);
                    }
                }
            }
        }
    }
}

const stylesheets = [];

function findAssetInStyleSheet(resourcePath) {
    let founds = [];
    for (let stylesheet in stylesheets) {
        let exists = stylesheets[stylesheet].some(path => {
            if (path.indexOf(resourcePath) > -1) return true;
        })
        if (exists) founds.push(stylesheet);
    }
    return founds;
}

module.exports = doTask;