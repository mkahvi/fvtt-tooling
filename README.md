# Tooling for Foundry VTT projects

Provides re-usable scripts for managing project build process.

## Setup

Following instructions assumes you install this in `utils`, which is not required naming.

### Adding submodule

Add submodule

```sh
git submodule add https://github.com/mkahvi/fvtt-tooling utils
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

`packs.transformers` is for a script file that exports several functions for passing to pack compile/extract workflow.

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
 "build:all": "npm --prefix=utils run all",
 "build:js": "npm --prefix=utils run js",
 "build:css": "npm --prefix=utils run css",
 "build:sync": "npm --prefix=utils run sync",
 "packs": "npm --prefix=utils run packs",
}
```

Example usage of above

```sh
npm run build:js
npm run packs compile
npm run packs compile pants bags
npm run packs extract
npm run packs extract shoes pencils
```

### Initializing submodule

When cloning the main project after the submodule has been added, you need to run the following:

```sh
git submodule update --init --recursive
```

This is not necessary for the user who added the submodule, since adding initializes it already.

### Updating submodule

```sh
git submodule update --remove --recursive
```

## License

Public Domain / [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/)
