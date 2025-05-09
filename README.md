# UI5 task for indexing cachebuster files
UI5 Tooling Task that for resource and css assets indexing files to enable the cachebuster directly into the dist folder

## Install

```bash
npm install ui5-task-cachebuster-indexing-with-cssassets --save-dev
```

## Configuration options (in `$yourapp/ui5.yaml`)

- debug: `true|false`  
  verbose logging

## Usage

1. Define the dependency in `$yourapp/package.json`:

```json
"devDependencies": {
    // ...
    "ui5-task-cachebuster-indexing-with-cssassets": "*"
    // ...
},
"ui5": {
  "dependencies": [
    // ...
    "ui5-task-cachebuster-indexing-with-cssassets",
    // ...
  ]
}
```

> As the devDependencies are not recognized by the UI5 tooling, they need to be listed in the `ui5 > dependencies` array. In addition, once using the `ui5 > dependencies` array you need to list all UI5 tooling relevant dependencies.

2. configure it in `$yourapp/ui5.yaml`:

```yaml
builder:
  customTasks:
  - name: ui5-task-cachebuster-indexing-with-cssassets
    afterTask: generateVersionInfo
    configuration:
      debug: true
```
Or when the task "generateCachebusterInfo" is enabled
```yaml
builder:
  customTasks:
  - name: ui5-task-cachebuster-indexing-with-cssassets
    afterTask: generateCachebusterInfo
    configuration:
      debug: true
```

## How it works

The task will run the default generate cachebuster info task and make a clone of all resources with the timestamp from the cachebuster info in the path. This will generate the resources with a path that can be found by the cachebuster. 

For example a file with name "Component-dbg.js" will be cloned to  "~1618522173771~/Component-dbg.js", or another example "model/models.js" will be cloned to "~1618522173782~/model/models.js".

Additionally, assets with URLs, such as images in css files, will be copied using the timestamp of the css file. For example, if the timestamp of the "style.css" file is 1618522173782 and the timestamp of the "../images/hello.png" file, which is used as the url for the background-img in "style.css", is 1618522173771, then "../images/hello.png" will also be replicated under 1618522173782.

It is not needed to run the "generateCachebusterInfo" task as this already done inside this one. Nevertheless, this task should always be executed after the cachebuster info generation "generateCachebusterInfo".

## Known limitations

The task "generateCachebusterInfo" can be configured to use timestamp or hash. This task only supports timestamp as it's currently not possible to acces the global config inside a custom task.