import { ascending } from 'd3';
import pxtorem from '$plugin/utils/pxtorem';
import cleanObject from './utils/cleanObject';
import obj2cls from './utils/obj2cls';
import slugify from './utils/slugify';

/**
 * @description Processes Figma's Text Styles into POSTCSS syntax utilizing tailwind's `screens` feature. Screens are fed in from the `tokens` object and are optional.
 * @returns {string} string in .postcss file syntax
 */
export default (
	styles = figma.getLocalTextStyles(),
	tokens: Tokens = {}
): string => {
	if (!tokens?.['fontSize']) tokens['fontSize'] = {};

	/** our classes container */
	const classes: { [key: string]: any } = {};

	const textCases: { [key: string]: string } = {
		UPPER: 'uppercase',
		LOWER: 'lowercase',
		TITLE: 'capitalize',
		SMALL_CAPS: 'small-caps',
		SMALL_CAPS_FORCED: 'small-caps',
	};

	const fontWeights: { [key: string]: number } = {
		Black: 900,
		Heavy: 800,
		Bold: 700,
		Semibold: 600,
		Medium: 500,
		Regular: 400,
		Light: 300,
		Thin: 200,
	};

	// usual tailwind breakpoints
	const breakpoints = ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'];

	// sort so we go smallest to largest in classing
	styles = styles.sort((a, b) => {
		const [breakpointA] = a.name.split('/').reverse();
		const [breakpointB] = b.name.split('/').reverse();

		const aIdx = breakpoints.indexOf(breakpointA.replace('v-', ''));
		const bIdx = breakpoints.indexOf(breakpointB.replace('v-', ''));

		return ascending(aIdx, bIdx);
	});

	for (const style of styles) {
		const {
			fontSize,
			fontName,
			letterSpacing,
			lineHeight,
			textCase,
			textDecoration,
		} = style;

		const [_breakpoint, ...name] = style.name.split('/').reverse();

		const className = slugify(name.reverse().join('/'));

		let isBase = false;

		// initialize class if it doesn't exist
		if (!classes[className]) {
			classes[className] = {};

			// first appearance indicates base since we've sorted
			isBase = true;
		}

		const breakpoint = slugify(isBase ? 'base' : _breakpoint.replace('v-', ''));

		const fontWeight = fontWeights?.[fontName.style.split(' ')?.[0]] || 400;

		const fontRemSize = pxtorem(fontSize);

		tokens['fontSize'][fontSize] = fontRemSize;

		const properties = cleanObject({
			'font-family': fontName.family,
			'font-size': fontRemSize,
			'font-variant': textCase.startsWith('SMALL_CAPS')
				? 'small-caps'
				: undefined,
			// delivered as BOLD ITALIC, so need to extract. don't ship default 400
			'font-weight':
				fontName.style === 'Italic'
					? undefined
					: !fontWeight || fontWeight === 400
					? undefined
					: fontWeight,
			'font-style': fontName.style.toLowerCase().includes('italic')
				? 'italic'
				: undefined,
			'letter-spacing':
				letterSpacing.value === 0
					? undefined
					: letterSpacing.unit === 'PIXELS'
					? `${letterSpacing.value}px`
					: letterSpacing.value,
			'line-height':
				lineHeight.unit === 'AUTO'
					? undefined
					: lineHeight.unit === 'PIXELS'
					? `${Math.round(lineHeight.value)}px`
					: `${Math.round(lineHeight.value)}%`,
			'text-transform': textCases?.[textCase] || undefined,
			'text-decoration':
				textDecoration.toLowerCase() === 'none'
					? undefined
					: textDecoration.toLowerCase(),
		});

		// stop it early since base gets everything
		if (isBase) {
			classes[className]['base'] = properties;
			continue;
		}

		const baseClass = classes[className]['base'];

		const filteredProperties = Object.fromEntries(
			Object.entries(properties).filter(
				([key, value]) => !(key in baseClass && baseClass[key] === value)
			)
		);

		// if there's nothing left after filtering, its a 1:1 match with base
		if (Object.keys(filteredProperties).length === 0) continue;

		classes[className][breakpoint] = filteredProperties;
	}

	// now iterate through and convert to PostCSS + tailwind syntax
	const output = [];

	for (const className of Object.keys(classes)) {
		const classVariants = classes[className];

		const base = classVariants['base'];

		// all classes MUST have a base
		if (!base) continue;

		// add closing bracket after this all
		let cls = `.${className} {${obj2cls(base)}\n`;

		// uses tailwind syntax for breakpoints
		for (const breakpoint of Object.keys(classVariants)) {
			const properties = classVariants[breakpoint];

			// quit if no properties or is the base
			if (!properties || breakpoint === 'base') continue;

			// https://tailwindcss.com/docs/functions-and-directives#screen
			cls += `\n\t@media screen(${breakpoint}) {${obj2cls(
				properties,
				2
			)}\n\t}\n`;
		}

		cls += '\n}';

		output.push(cls);
	}

	const css = output.join('\n\n');

	return css;
};
