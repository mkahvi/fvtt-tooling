/**
 * Text oriented utility functions
 */

/**
 * Get Compressed size
 *
 * @param {string | Blob | Uint8Array} raw - Readable stream compatible data (e.g. string or blob)
 * @returns {number} - Size in bytes
 */
export async function compressedSize(raw, encoding = 'brotli') {
	if (typeof raw === 'string') raw = new Blob([raw], { type: 'text/plain' });
	else if (raw instanceof Uint8Array) raw = new Blob([raw]);
	else if (Array.isArray(raw)) raw = new Blob(raw);
	const stream = raw.stream().pipeThrough(new CompressionStream(encoding));
	const buffer = await new Response(stream).arrayBuffer();
	return buffer.byteLength;
}
