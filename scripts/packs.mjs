import pc from "picocolors";
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { compilePack, extractPack } from '@foundryvtt/foundryvtt-cli';
import { Listr } from "listr2";
import { Logger } from "./lib/logger.mjs";

import pkg from "../../package.json" with { type: "json" };
const CONFIG = pkg.build;

const DEST_DIR = CONFIG.dist;
const DEST_PATH = `${DEST_DIR}/${CONFIG.packs.folder}`;

const SRC_PATH = CONFIG.packs.path;

let unpackTransformFn, packTransformFn, renameFn;
const tscript = CONFIG.packs.transformers;
if (tscript) {
	const m = await import(tscript);
	unpackTransformFn = m.unpack;
	packTransformFn = m.pack;
	renameFn = m.rename;
}

const yaml = CONFIG.yaml ?? false;
const manifest = JSON.parse(fs.readFileSync(CONFIG.manifest));

const logger = new Logger({ category: false });

yargs(hideBin(process.argv))
	.version(false)
	.scrict()
	.command({
		command: "compile [packs..]",
		describe: "Compile YAML files into Foundry database format.",
		builder: (yargs) =>
			yargs
				.positional("packs", { describe: "Limit to defined packs", type: "string" }),
		handler: async (argv) => {
			packCompendiums(argv.packs, { verbose: argv.verbose });
		}
	})
	.command({
		command: "extract [packs..]",
		describe: "Extract YAML files from Foundry database packs.",
		builder: (yargs) =>
			yargs
				.positional("packs", { describe: "Limit to defined packs", type: "string" }),
		handler: async (argv) => {
			unpackCompendiums(argv.packs, { verbose: argv.verbose });
		}
	})
	.option("verbose", {
		alias: "v",
		type: "boolean",
		default: false,
		desc: "Verbose output"
	})
	.help()
	.parse();

function getPackInfo(pack) {
	const info = manifest.packs.find(i => i.name === pack);
	if (!info) return null;

	return { id: pack, ...info }
}
/**
 * @param {string} pack - Pack name
 * @param {object} json - Pack JSON data
 * @returns {string} - New file name
 */
async function unpackRename(pack, json) {
	const { name, _id: id } = json;
	const ext = yaml ? 'yaml' : 'json';
	const filename = `${name}.${id}.${ext}`;
	if (typeof renameFn === "function")
		return renameFn(filename);
	return filename;
}

async function packCompendiums(packs, packOptions) {
	logger.info("Compiling packs...");

	const tasks = new Listr(packs.map(pack => {
		return {
			task: async (_, task) => {
				task.title = `Packing ${pc.cyan(pack)}...`,

				const packInfo = getPackInfo(pack);

				const inpath = path.join(SRC_PATH, pack);
				const outpath = path.join(DEST_PATH, pack);

				const options = {
					yaml,
				}

				if (typeof packTransformFn === "function")
					options.transformEntry = (json) => packTransformFn(packInfo, json);

				await compilePack(inpath, outpath, options);

				task.title = `Packed ${pc.cyan(pack)}`;
			}
		}));

	await tasks.run();

	const t1 = performance.now();
	const s = Math.floor((t1 - t0) / 10) / 100;
	logger.info("Packs compiled" + pc.dim(` (in ${s} s)`));
}

async function unpackCompendiums(packs, unpackOptions) {
	logger.info("Extracting packs...");

	const tasks = new Listr(packs.map(pack => {
		return {
			task: async (_, task) => {
				task.title = `Unpacking ${pc.cyan(pack)}...`,

				const packInfo = getPackInfo(pack);

				const inpath = path.join(DEST_PATH, pack);
				const outpath = path.join(SRC_PATH, pack);

				const options = {
					transformName: (json) => unpackRename(pack, json),
					yaml
				};

				if (typeof unpackTransformFn === "function")
					options.transformEntry = (json) => unpackTransformFn(packInfo, json);


				await extractPack(inpath, outpath, options);

				task.title = `Unpacked ${pc.cyan(pack)}`;
			}
		}
	}),
		{ concurrent: true, exitOnError: true, collectErrors: false },
	);

	await tasks.run();

	const t1 = performance.now();
	const s = Math.floor((t1 - t0) / 10) / 100;
	logger.info("Packs extracted" + pc.dim(` (in ${s} s)`));
}
