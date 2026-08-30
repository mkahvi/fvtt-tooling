import pc from 'picocolors';
import { getTime } from './utils.mjs';

export class Logger {
	static DEBUG = false;

	#category = true;

	constructor({ category = true } = {}) {
		this.#category = category;
	}

	info(...args) {
		const template = this.#category ? '%s [%s] [%s]' : '%s [%s]';
		if (this.#category) {
			if (typeof this.#category === 'string') args.unshift(this.#category);
			args[0] = pc.yellow(args[0]);
		}
		console.log(template, pc.dim(getTime()), pc.dim('INFO'), ...args);
	}

	debug(...args) {
		if (this.constructor.DEBUG) {
			const template = this.#category ? '%s [%s] [%s]' : '%s [%s]';
			if (typeof this.#category === 'string') args.unshift(this.#category);
			console.log(pc.dim(template), getTime(), 'DEBUG', ...args.map(m => pc.dim(m)));
		}
	}

	error(...args) {
		const template = this.#category ? '%s [%s] [%s]' : '%s [%s]';
		if (this.#category) {
			if (typeof this.#category === 'string') args.unshift(this.#category);
			args[0] = pc.yellow(args[0]);
		}
		console.log(template, pc.yellow(getTime()), pc.red('ERROR'), ...args);
	}

	warn(...args) {
		const template = this.#category ? '%s [%s] [%s]' : '%s [%s]';
		if (this.#category) {
			if (typeof this.#category === 'string') args.unshift(this.#category);
			args[0] = pc.yellow(args[0]);
		}
		console.log(template, pc.yellow(getTime()), pc.yellow('WARN'), ...args);
	}

	static info(category, ...message) {
		console.log('%s [%s] [%s]', pc.dim(getTime()), pc.dim('INFO'), pc.yellow(category), ...message);
	}

	static debug(category, ...message) {
		if (!this.DEBUG) return;
		console.log(pc.dim('%s [%s] [%s]'), getTime(), 'DEBUG', category, ...message.map(m => pc.dim(m)));
	}

	static error(category, ...message) {
		console.log('%s [%s] [%s]', pc.yellow(getTime()), pc.red('ERROR'), pc.yellow(category), ...message);
	}

	static warn(category, ...message) {
		console.log('%s [%s] [%s]', pc.yellow(getTime()), pc.yellow('WARN'), pc.yellow(category), ...message);
	}
}
