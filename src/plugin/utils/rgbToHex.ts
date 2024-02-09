type RGBA = { r: number; g: number; b: number; a: number };
export default function rgbToHex({ r, g, b, a }: RGBA) {
	if (a !== 1) {
		return `rgba(${[r, g, b].map((n) => Math.round(n * 255)).join(', ')}, ${
			a?.toFixed(3) || 1
		})`;
	}
	const toHex = (value: number) => {
		const hex = Math.round(value * 255).toString(16);
		return hex.length === 1 ? '0' + hex : hex;
	};

	const hex = [toHex(r), toHex(g), toHex(b)].join('');
	return `#${hex}`;
}
