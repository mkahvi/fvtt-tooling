/**
 * Sync Files
 */

import pc from 'picocolors';
import path from 'node:path';
import fs from 'node:fs';
import { Logger } from './lib/logger.mjs';
import { copyFile } from './lib/fs-lib.mjs';

import pkg from "../../package.json" with { type: "json" };
const CONFIG = pkg.build;

const CONFIG = {
	STATIC_FILES: ['README.md', 'LICENSE', CONFIG.manifest],
	STATIC_FOLDERS: ['lang', 'templates'],

	WATCH_IGNORE: [`${CONFIG.dist}/`, 'node_modules/', '.git/', 'scripts/', /\.(yaml|d\.ts)$/],

	CHECK_INTERVAL: 30_000,
	get SLEEP_THRESHOLD() { return this.CHECK_INTERVAL * 2; },

	DEBUG: false,
	REPORT_MODIFIED: {
		CSS: true,
		JS: true,
		HBS: true,
	},
};

const log = new Logger({ category: 'Copy' });

async function copyToRoot(source) {
	const t0 = performance.now();
	const base = path.posix.basename(source);
	const dest = path.posix.join(CONFIG.DEST_DIR, base);
	await copyFile(source, dest, false);
	const t1 = performance.now();
	const tcp = Math.floor((t1 - t0) * 10) / 10;
	log.info(`/${pc.bold(base)} ` + pc.dim(`(${tcp} ms)`));
}

async function copyRelative(source) {
	const t0 = performance.now();
	const dest = path.posix.join(CONFIG.DEST_DIR, source);
	if (fs.existsSync(dest)) {
		fs.rmdirSync(dest, { recursive: true, force: true });
	}
	const t1 = performance.now();
	await fs.promises.cp(source, dest, { recursive: true });
	const t2 = performance.now();

	const trm = Math.round((t1 - t0) * 10) / 10;
	const tcp = Math.round((t2 - t1) * 10) / 10;
	const tt = Math.round((t2 - t0) * 10) / 10;
	log.info(`/${pc.bold(source)}/** ` + pc.dim(`(${tt} ms)`));
}

export async function sync() {
	const promises = [];
	for (const fn of CONFIG.STATIC_FILES) {
		const p = copyToRoot(fn);
		promises.push(p);
	}

	await Promise.all(promises);

	for (const dir of CONFIG.STATIC_FOLDERS) {
		if (fs.existsSync(dir))
			await copyRelative(dir);
	}
}

if (import.meta.main) {
	await sync();
}
