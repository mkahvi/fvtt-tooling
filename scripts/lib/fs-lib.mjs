/**
 * Filesystem helper functions
 */

import path from 'node:path';
import fs from 'node:fs';
import zlip from 'node:zlib';
import stream from 'node:stream';
import { Logger } from './logger.mjs';

export function normalize(fn) {
	return fn.replaceAll('\\', '/');
}

/**
 * Directory tree size
 *
 * @returns {{files:Set<string>,folders:number,size:number}}
 */
export function dirSize(fpath, filter, _seen = new Set()) {
	let size = 0, files = 0, folders = 0;

	fpath = normalize(path.resolve(fpath));

	for (const entry of fs.readdirSync(fpath, { withFileTypes: true })) {
		const full = path.posix.join(fpath, entry.name);
		if (entry.isDirectory()) {
			const sd = dirSize(full, filter, _seen);
			size += sd.size;
			folders += 1 + sd.folders;
		}
		else {
			_seen.add(full);
			if (!filter.some(endf => full.endsWith(endf))) continue;

			size += fs.statSync(full).size;
			files += 1;
		}
	}

	return { size, files: _seen, folders };
}

export async function copyFile(source, target, log = new Logger({ category: false })) {
	const targetDir = path.posix.dirname(target);
	if (!fs.existsSync(targetDir)) {
		fs.mkdirSync(targetDir, { recursive: true });
	}

	for (let retry = 0; retry < 5; retry++) {
		try {
			await fs.promises.copyFile(source, target);
			return true;
		}
		catch (err) {
			if (!['EBUSY', 'EPERM'].includes(err.code)) throw err;
			log.error(`Write Error [${pc.red(err.code)}] ${pc.italic(target)}`);
		}
	}

	throw new Error(`Repeated write errors copying to "${target}"`);
}
