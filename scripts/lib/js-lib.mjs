/**
 * Javascript-handling helper functions
 */

import fs from 'node:fs';
import path from 'node:path';
import { normalize } from './fs-lib.mjs';

let transpiler;
if (globalThis.Bun) {
	transpiler = new Bun.Transpiler(/* { loader: 'ts' }*/);
}

/**
 * Determine codebase size based on graph.
 *
 * @returns {{size:number,files:Set<string>}}
 */
export function graphSize(file, _seen = new Set()) {
	if (!transpiler) return { size: null, files: _seen, error: true };

	const abs = normalize(path.resolve(file));
	if (_seen.has(abs)) return { size: 0, files: _seen };
	_seen.add(abs);

	const code = fs.readFileSync(abs, 'utf8');
	const { imports } = transpiler.scan(code);

	let size = fs.statSync(abs).size;

	for (const entry of imports) {
		// BUG: Does not handle unusual imports
		const ipath = path.resolve(abs, '..', entry.path);
		const rs = graphSize(ipath, _seen);
		size += rs.size;
	}

	return { size, files: _seen };
}
