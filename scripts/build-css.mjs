import pc from 'picocolors';
import process from "node:process";
import path from 'node:path';
import * as lcss from 'lightningcss';
import fs from 'node:fs';
import { Logger } from './lib/logger.mjs';
import { dirSize } from './lib/fs-lib.mjs';
import { compressedSize } from './lib/text-lib.mjs';
import { asKilo, asPercent } from './lib/utils.mjs';

import pkg from "../../package.json" with { type: "json" };

const CONFIG = pkg.build;

const FILE = CONFIG.css.path;
const INPUT = path.join("..", CONFIG.css.path);
const OUTPUT = path.join("..", CONFIG.dist, path.basename(FILE));

// Data needed to link the CSS
// const LINK_CSS = `\n/*# sourceMappingURL=${path.basename(FILE)}.map */`;

function bundle() {
	// FIXME: bundleAsync() randomly crashes
	const { code, map } = lcss.bundle({
		filename: INPUT,
		minify: true,
		sourceMap: true,
		analyzeDependencies: false,
		// Without targets LCSS produces outdated CSS
		targets: {
			chrome: 132, // Equivalent of Electron (v34.4) for v13.351
			// Chrome v142 for Foundry v14
		},
	});

	// const css = new TextDecoder().decode(code);
	// css += LINK_CSS; // BUG: https://github.com/parcel-bundler/lightningcss/issues/1167

	return { css: code, map, output: OUTPUT, file: FILE };
}

export async function build(logger = console.log) {
	const t0 = performance.now();

	const { css, map, output, file } = bundle();

	const t1 = performance.now();

	await Promise.all([
		fs.promises.writeFile(output, css),
		fs.promises.writeFile(`${output}.map`, map),
	]);

	const t2 = performance.now();

	return {
		file: {
			main: path.basename(output),
			sourcemap: `${path.basename(output)}.map`,
		},
		time: {
			bundle: Math.floor((t1 - t0) * 10) / 10,
			write: Math.floor((t2 - t1) * 10) / 10,
			total: Math.floor((t2 - t0) * 10) / 10,
		},
		size: {
			bundle: css.length,
			map: map.length,
		},
		content: {
			bundle: css,
			map,
		},
	};
}

export async function printStats(result, logger) {
	logger.info(`Bundled ${pc.bold(result.file.main)} ` + pc.dim(`(${result.time.total} ms; bundle: ${result.time.bundle} ms; write ${result.time.write} ms)`));

	const { size: tSize, files: tFiles } = dirSize(path.dirname(INPUT), ['.css']);

	// gzip size (server to client transfer size)
	const cs = await compressedSize(result.content.bundle);
	const bs = result.content.bundle.length;

	logger.info('Bundle size:', pc.bold(asKilo(result.size.bundle)), 'kB', pc.dim(`(compressed ${pc.bold(asKilo(cs))} kB; ${pc.bold(asPercent(cs / bs))}% original)`));
	logger.info('Map size:   ', pc.bold(asKilo(result.size.map)), 'kB');
	logger.info('Source size:', pc.bold(asKilo(tSize)), 'kB', pc.dim(`(in ${pc.bold(tFiles.size)} files)`));
}

if (import.meta.main) {
	const logger = new Logger({ category: false });
	const result = await build(logger);
	await printStats(result, logger);
}
