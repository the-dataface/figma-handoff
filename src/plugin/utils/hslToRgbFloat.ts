export default function hslToRgbFloat(h: number, s: number, l: number) {
	const hue2rgb = (p: number, q: number, t: number) => {
		if (t < 0) t += 1;
		if (t > 1) t -= 1;
		if (t < 1 / 6) return p + (q - p) * 6 * t;
		if (t < 1 / 2) return q;
		if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
		return p;
	};

	if (s === 0) return { r: l, g: l, b: l };

	const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
	const p = 2 * l - q;
	const r = hue2rgb(p, q, (h + 1 / 3) % 1);
	const g = hue2rgb(p, q, h % 1);
	const b = hue2rgb(p, q, (h - 1 / 3) % 1);

	return { r, g, b };
}
