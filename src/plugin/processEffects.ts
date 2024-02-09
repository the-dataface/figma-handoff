import rgbToHex from '$plugin/utils/rgbToHex';

/**
 * @description Process Figma's Effects styles into Tailwind syntax
 * @returns {Tokens}
 */
export default (
	styles: EffectStyle[] = figma.getLocalEffectStyles()
): Tokens => {
	const tokens: Tokens = {};

	for (const style of styles) {
		const [parentKey, name] = style.name.split('/');

		// init parent token object
		if (!tokens[parentKey]) tokens[parentKey] = {};

		//  customized according to tailwind config names
		// new entries MUST match the tailwind config and should be added here
		// defaults will use the generic passthrough syntax of blur/backdropBlur
		switch (parentKey) {
			case 'boxShadow': {
				const effects = style.effects as DropShadowEffect[];
				const css = effects
					.map((effect) => {
						const {
							radius,
							color,
							offset: { x, y },
						} = effect;
						const hex = rgbToHex(color);
						return `${x}px ${y}px ${radius}px ${hex}`;
					})
					.join(', ');
				tokens[parentKey][name] = css;
				break;
			}
			case 'blur':
			case 'backdropBlur':
			default: {
				const [effect] = style.effects as BlurEffect[];
				if (!effect) continue;
				const { radius } = effect;
				tokens[parentKey][name] = `${radius}px`;
				break;
			}
		}
	}

	return tokens;
};
