import hslToRgbFloat from '$plugin/utils/hslToRgbFloat';

export default function parseColor(color: string) {
	color = color.trim();
	const rgbRegex = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;
	const rgbaRegex =
		/^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([\d.]+)\s*\)$/;
	const hslRegex = /^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/;
	const hslaRegex =
		/^hsla\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*([\d.]+)\s*\)$/;
	const hexRegex = /^#([A-Fa-f0-9]{3}){1,2}$/;
	const floatRgbRegex =
		/^\{\s*r:\s*[\d\.]+,\s*g:\s*[\d\.]+,\s*b:\s*[\d\.]+(,\s*opacity:\s*[\d\.]+)?\s*\}$/;

	if (rgbRegex.test(color)) {
		const match = color.match(rgbRegex);
		if (match) {
			const [, r, g, b] = match;
			return {
				r: parseInt(r) / 255,
				g: parseInt(g) / 255,
				b: parseInt(b) / 255,
			};
		}
	} else if (rgbaRegex.test(color)) {
		const match = color.match(rgbaRegex);
		if (match) {
			const [, r, g, b, a] = match;
			return {
				r: parseInt(r) / 255,
				g: parseInt(g) / 255,
				b: parseInt(b) / 255,
				a: parseFloat(a),
			};
		}
	} else if (hslRegex.test(color)) {
		const match = color.match(hslRegex);
		if (match) {
			const [, h, s, l] = match;
			return hslToRgbFloat(parseInt(h), parseInt(s) / 100, parseInt(l) / 100);
		}
	} else if (hslaRegex.test(color)) {
		const match = color.match(hslaRegex);
		if (match) {
			const [, h, s, l, a] = match;
			return Object.assign(
				hslToRgbFloat(parseInt(h), parseInt(s) / 100, parseInt(l) / 100),
				{ a: parseFloat(a) }
			);
		}
	} else if (hexRegex.test(color)) {
		const hexValue = color.substring(1);
		const expandedHex =
			hexValue.length === 3
				? hexValue
						.split('')
						.map((char) => char + char)
						.join('')
				: hexValue;
		return {
			r: parseInt(expandedHex.slice(0, 2), 16) / 255,
			g: parseInt(expandedHex.slice(2, 4), 16) / 255,
			b: parseInt(expandedHex.slice(4, 6), 16) / 255,
		};
	} else if (floatRgbRegex.test(color)) {
		return JSON.parse(color);
	} else {
		throw new Error('Invalid color format');
	}
}
