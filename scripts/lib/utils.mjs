export function getTime() {
	const d = new Date();
	const h = d.getHours();
	const m = d.getMinutes();
	const s = d.getSeconds();
	return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function sumArray(n) {
	let sum = 0;
	for (const v of n) {
		sum += v;
	}
	return sum;
}

/**
 * Thousands with 1 decimal precision
 */
export function asKilo(n) {
	return Math.round(n / 100) / 10;
}

/**
 * Millions with 1-2 decimal precision
 */
export function asMega(n) {
	if (n > 200_000) return Math.round(n / 100_000) / 10;
	return Math.round(n / 10_000) / 100;
}

export function asPercent(n) {
	return Math.round(n * 1_000) / 10;
}

const timers = new Set();

export function debounce(fn, delay = 100) {
	let timer;
	return () => {
		clearTimeout(timer);
		timers.delete(timer);
		timer = setTimeout(() => {
			timers.delete(timer);
			timer = null;
			fn();
		}, delay);
		return timer;
	};
}

export function dispose() {
	for (const t of timers) clearTimeout(t);
}
