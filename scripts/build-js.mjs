import process from 'node:process';
import fs from 'node:fs';
import pc from 'picocolors';
import path from 'node:path';
import { rolldown } from 'rolldown';

import { getTime, sumArray } from './lib/utils.mjs';
import { compressedSize } from './lib/text-lib.mjs';
import { graphSize } from './lib/js-lib.mjs';
import { dirSize, normalize } from './lib/fs-lib.mjs';
import { Logger } from './lib/logger.mjs';

import pkg from "../../package.json" with { type: "json" };
const CONFIG = pkg.build;

export async function build({ mode = 'dev' } = {}) {
	const t0 = performance.now();

	const isDev = mode === 'dev';

	const INPUT = path.join("..", CONFIG.js.path);

	const bundle = await rolldown({
		input: INPUT,
		transform: {
			define: {
				'import.meta.DEV': isDev ? 'true' : 'false',
			},
			target: 'es2026',
		},
	});

	const esm = await bundle.generate({
		format: 'esm',
		sourcemap: true,
		entryFileNames: '[name].mjs',
		chunkFileNames: '[name]-[hash].mjs',
	});

	const t1 = performance.now();

	const outJS = esm.output.filter(e => e.type === 'chunk');
	const outMap = esm.output.filter(e => e.type === 'asset');

	// Write all files
	await Promise.all(
		esm.output.map(e => fs.promises.writeFile(path.posix.join("..", CONFIG.dist, e.fileName), e.type === 'chunk' ? e.code : e.source)),
	);

	const files = esm.output.map(e => e.fileName);

	const t2 = performance.now();

	const mainFile = path.join(CONFIG.dist, path.basename(CONFIG.js.path));

	return {
		files,
		file: {
			main: mainFile,
			map: `${mainFile}.map`,
		},
		size: {
			bundle: outJS.reduce((total, e) => total + e.code.size, 0),
			map: outMap.reduce((total, e) => total + e.source.length, 0),
		},
		content: {
			bundle: outJS.map(e => e.code),
		},
		time: {
			bundle: Math.floor((t1 - t0) * 10) / 10,
			write: Math.floor((t2 - t1) * 10) / 10,
			total: Math.floor((t2 - t0) * 10) / 10,
		},
	};
}

export async function printStats(result, logger) {
	logger.info(`Bundled /${pc.bold(path.basename(CONFIG.js.path))}`, pc.dim(`in ${pc.bold(result.time.total)} ms`), pc.dim(`(bundle: ${pc.bold(result.time.bundle)} ms; write ${pc.bold(result.time.write)} ms)`));

	// gzip size (server to client transfer size)
	const cs = sumArray(await Promise.all(result.content.bundle.map(e => compressedSize(e))));
	const bs = sumArray(result.content.bundle.map(e => e.length));
	const ratio = Math.floor((cs / bs) * 1000) / 10;
	logger.info(`Bundle size: ${pc.bold(Math.floor(bs / 100) / 10)} kB ` + pc.dim(`(compressed ${pc.bold(Math.floor(cs / 100) / 10)} kB; ${pc.bold(ratio)}% original)`));
	logger.info(`Map size:    ${pc.bold(Math.floor(result.size.map / 100) / 10)} kB`);

	let missingFiles = 0, missing = [];

	// Original size
	// Seems to misbehave
	const { size: gSize, files: gFiles, error: graphError } = graphSize(CONFIG.js.path);
	if (!graphError)
		logger.info(`Graph size:  ${pc.bold(Math.floor(gSize / 10) / 100)} kB ` + pc.dim(`in ${pc.bold(gFiles.size)} files`));

	// True source code size
	const { size: tSize, files: tFiles } = dirSize(path.join("..", path.dirname(CONFIG.js.path)), ['.mjs']);
	const missingSize = tSize - gSize;

	if (!graphError && gFiles.size !== tFiles.size) {
		const nbp = normalize(path.resolve(CONFIG.js.path, '../..'));
		missing = [...tFiles.difference(gFiles)]
			.map(f => f.replace(nbp + '/', ''))
			.filter(f => f.endsWith('.mjs'));

		missingFiles = missing.length;
	}

	if (missingFiles) {
		logger.info(`Source size: ${pc.bold(Math.floor(tSize / 10) / 100)} kB ` + pc.dim(`(missing ${pc.bold(Math.floor(missingSize / 10) / 100)} kB in ${pc.bold(missingFiles)} files)`));
		logger.info('Unlinked...\n' + missing.map(f => `- ${pc.italic(f)}`).join('\n'));
	}
	else {
		logger.info(`Source size: ${pc.bold(Math.floor(tSize / 10) / 100)} kB ` + pc.dim(`in ${pc.bold(tFiles.size)} files [including .d.ts]`));
	}
}

if (import.meta.main) {
	const logger = new Logger({ category: false });

	const isDev = process.argv[2] === '--dev';

	logger.info('Mode:', isDev ? pc.red('Development') : pc.green('Production'));

	// Unlink old MJS files
	if (fs.existsSync(CONFIG.dist)) {
		for (const entry of fs.readdirSync(CONFIG.dist, { withFileTypes: true })) {
			const fullPath = path.posix.join(CONFIG.dist, entry.name);
			if (!entry.isDirectory() && /\.mjs(\.map)?$/.test(entry.name)) {
				fs.unlinkSync(fullPath);
			}
		}
	}

	// Build
	const result = await build({ mode: isDev ? 'dev' : 'prod' });

	await printStats(result, logger);
}
