# Tooling for Foundry VTT projects

Provides re-usable scripts for managing project build process.

## Setup

Following instructions assumes you install this in `utils`, which is not required naming.

### Adding submodule

Add submodule

```sh
git submodule add <> utils
```

### Configuration

Add the following to your `package.json`. See `package.sample.json` for actual example.

```json
{
  "build": {
    "dist": "path/to/dist",
    "manifest": "path/to/manifest.json",
    "js": {
      "path": "path/to/entry.mjs"
    },
    "css": {
      "path": "path/to/entry.css"
    },
    "packs": {
      "path": "path/to/packs",
      "transformers": "path/to/transformers.mjs",
      "folders": boolean,
      "yaml": boolean
    }
  }
}
```

`PACK_TRANSFORMERS` is for a script file that exports several functions for passing to pack compile/extract workflow.

Modify `package.json` with following:

```json
"workspaces":  ["utils"]
```

### Scripts

|...|Script|Description|
|:---:|:---|:---|
|All|`scripts/build.mjs`|Bundle & copy all.|
|JS|`scripts/build-js.mjs`|Bundle JS|
|CSS|`scripts/build-css.mjs`|Bundle CSS|
|Sync|`scripts/build-sync.mjs`|Sync static files.|
|Pack|`scripts/packs.mjs`|Handle packs.|

Simple `package.json` setup for the main project.

```json
"scripts": {
 "build:all": "npm run utils/all",
 "build:js": "npm run utils/js",
 "build:css": "npm run utils/css",
 "build:sync": "npm run utils/sync",
 "packs": "npm run utils/packs",
}
```

Example usage of above

```sh
npm run build:js
npm run packs compile
npm run packs compile packId
npm run packs extract
npm run packs extract packId
```

### Initializing submodule

When cloning the main project after the submodule has been added, you need to run the following:

```sh
git submodule update --init --recursive
```

This is not necessary for the user who added the submodule, since adding initializes it already.

## License

Public Domain / [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/)
