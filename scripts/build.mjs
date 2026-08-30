/**
 * Filesystem Watcher
 *   for synchronizing dist
 *
 * - Bundles CSS
 * - Bundles JS
 * - Copies static files
 *
 * Does not actually report to Foundry, so you need to have hot reload enabled on that side.
 */

import process from 'node:process';
import pc from 'picocolors';
import path from 'node:path';
import { Logger as log } from './lib/logger.mjs';
import * as js from './build-js.mjs';
import * as css from './build-css.mjs';
import * as fsh from './build-sync.mjs';

const isDev = process.argv.slice(2).some(arg => arg === '--dev');

async function buildJS() {
	const result = await js.build({ mode: isDev ? 'dev' : 'prod' });
	log.info('JS', `/${pc.bold(result.file.main)} ` + pc.dim(`(${result.time.total} ms)`));
}

async function buildCSS() {
	const result = await css.build();
	log.info('CSS', `/${pc.bold(path.basename(result.file.main))} ` + pc.dim(`(${result.time.total} ms)`));
}

async function syncFiles() {
	await fsh.sync();
}

log.info('CLI', 'Mode:', isDev ? pc.redBright('Development') : pc.green('Production'));
const t0 = performance.now();

// Slightly slower from being sequential, but has prettier output
await syncFiles();
await buildCSS();
await buildJS();

const t1 = performance.now();
const tt = Math.round((t1 - t0) * 10) / 10;
log.info('Build', `Completed in ${pc.bold(tt)} ms`);

// Print stats
