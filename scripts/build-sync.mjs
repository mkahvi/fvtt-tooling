/**
 * Sync files
 */

import pc from 'picocolors';
import path from 'node:path';
import fs from 'node:fs';
import { Logger } from './lib/logger.mjs';
import { copyFile } from './lib/fs-lib.mjs';

import pkg from "../../package.json" with { type: "json" };
const CONFIG = pkg.build;

const FILES = [...(CONFIG.sync?.files ?? []), CONFIG.manifest, 'README.md', 'LICENSE'];
const FOLDERS = [...(CONFIG.sync?.folders ?? []), "lang", "templates"]

const WATCH_IGNORE = [`${CONFIG.dist}/`, 'node_modules/', '.git/', 'scripts/', /\.(yaml|d\.ts)$/, "foundry/"]

const CHECK_INTERVAL = 30_000;
const SLEEP_THRESHOLD = CHECK_INTERVAL * 2;

const log = new Logger({ category: 'Copy' });

async function copyToRoot(source) {
	const t0 = performance.now();
	const base = path.posix.basename(source);
	const dest = path.posix.join("..", CONFIG.dist, base);

	if (!fs.existsSync(path.posix.join("..", CONFIG.dist))) {
		fs.mkdirSync(path.posix.join("..", CONFIG.dist), { recursive: true });
	}

	await copyFile(path.posix.join("..", source), dest, false);

	const t1 = performance.now();
	const tcp = Math.floor((t1 - t0) * 10) / 10;
	log.info(pc.bold(base), pc.dim(`(in ${tcp} ms)`));
}

async function copyRelative(source) {
	const t0 = performance.now();

	const origin = path.posix.join("..", source);
	if (!fs.existsSync(origin)) return;


	const dest = path.posix.join("..", CONFIG.dist, source);
	const destFolder = path.posix.join("..", CONFIG.dist);

	if (!fs.existsSync(destFolder)) {
		fs.mkdirSync(destFolder, { recursive: true });
	}

	const t1 = performance.now();
	await fs.promises.cp(path.posix.join("..", source), dest, { recursive: true });
	const t2 = performance.now();

	const trm = Math.round((t1 - t0) * 10) / 10;
	const tcp = Math.round((t2 - t1) * 10) / 10;
	const tt = Math.round((t2 - t0) * 10) / 10;
	log.info(`${pc.bold(source)}/**`, pc.dim(`(in ${tt} ms)`));
}

export async function sync() {
	const promises = [];
	for (const fn of FILES) {
		const p = copyToRoot(fn);
		promises.push(p);
	}

	await Promise.all(promises);

	for (const dir of FOLDERS) {
		await copyRelative(dir);
	}
}

if (import.meta.main) {
	await sync();
}
