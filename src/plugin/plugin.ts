import pxtorem from '$plugin/utils/pxtorem';
/**
 * @fileoverview This is the entry point for your plugin.
 * @see {@link https://www.figma.com/plugin-docs/|Figma Plugin Docs}
 */
import rgbToHex from '$plugin/utils/rgbToHex';
import slugify from '$plugin/utils/slugify';

import cleanObject from './utils/cleanObject';
import obj2cls from './utils/obj2cls';

const figmaPostMessage = (message: MessageDataFromPlugin) => {
	figma.ui.postMessage(message);
	return;
};

/**
 * RECOMMENDED: ignore invisible nodes. speeds up document traversal
 * @see {@link https://www.figma.com/plugin-docs/api/properties/figma-skipinvisibleinstancechildren/|figma.skipInvisibleInstanceChildren}
 */
figma.skipInvisibleInstanceChildren = true;

/**
 * Enables you to render UI to interact with the user, or simply to access browser APIs. This function creates a modal dialog with an <iframe> containing the HTML markup in the html argument.
 * @see {@link https://www.figma.com/plugin-docs/api/properties/figma-showui/|figma.showUI}
 */
figma.showUI(__html__, { width: 560, height: 500, themeColors: true });

// plugin initialized
figmaPostMessage({
	type: 'init',
	options: {
		Libraries: figma.variables
			.getLocalVariableCollections()
			.map((c) => ({ label: c.name, value: c.id })),
		Types: [
			{ label: 'Boolean', value: 'BOOLEAN' },
			{ label: 'Color', value: 'COLOR' },
			{ label: 'Number', value: 'FLOAT' },
			{ label: 'String', value: 'STRING' },
		],
	},
});

// message handler
figma.ui.onmessage = (message: MessageDataFromUI) => {
	if (!message.type) return;

	switch (message.type) {
		// use figma's built-in notification system
		// https://www.figma.com/plugin-docs/api/properties/figma-notify/
		case 'notify': {
			const { type, notification, options } = message;
			return figma.notify(notification as string, options);
		}

		case 'resize-window': {
			const { width = 560, height = 500 } = message.size;
			return figma.ui.resize(width, height);
		}

		case 'handoff-start': {
			const { options } = message;

			// get all the variable collections selected in the UI in Option form.
			const variableCollections = options.Libraries.map((d: Option) =>
				figma.variables.getVariableCollectionById(d.value)
			).filter(Boolean) as VariableCollection[];

			const types = new Set<VariableResolvedDataType>(
				options.Types.map((d: Option) => d.value)
			);

			const tokens = processVariables(variableCollections, types);
			const css = processTextStyles(figma.getLocalTextStyles());

			figma.ui.postMessage({
				type: 'handoff-end',
				tokens,
				css,
			});
		}
	}
};

const processTextStyles = (styles = figma.getLocalTextStyles()) => {
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

	styles.sort((a, b) => {
		const [, breakpointA] = a.name.split('/');
		const [, breakpointB] = b.name.split('/');
		return breakpoints.indexOf(breakpointA) - breakpoints.indexOf(breakpointB);
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

		const breakpoint = slugify(isBase ? 'base' : _breakpoint);

		const properties = cleanObject({
			'font-family': fontName.family,
			'font-size': pxtorem(fontSize),
			'font-variant': textCase.startsWith('SMALL_CAPS')
				? 'small-caps'
				: undefined,
			'font-weight':
				fontName.style === 'Italic'
					? undefined
					: fontWeights?.[fontName.style.split(' ')?.[0]] || undefined,
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
					? `${lineHeight.value}px`
					: `${lineHeight.value}%`,
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

			cls += `\n\t@screen ${breakpoint} {${obj2cls(properties, 2)}\n\t}\n`;
		}

		cls += '\n}';

		output.push(cls);
	}

	const css = output.join('\n\n');

	return css;
};

const variableTypes = new Set(['BOOLEAN', 'COLOR', 'FLOAT', 'STRING']);

const processVariables = (
	variableCollections: VariableCollection[],
	acceptedTypes: Set<VariableResolvedDataType>
) => {
	// dump everything in bins according to the type.
	// type -> mode -> variable names nested -> value
	// e.g. { COLOR: { 'dark mode': { 'bg': '#000' } } }
	const tokens: Tokens = {};

	// initialize selected data types
	for (const type of acceptedTypes) tokens[type] = {};

	// these modes will be presented without a mode name in the path
	const defaultModes = new Set(['light mode', 'mode 1']);

	for (const collection of variableCollections) {
		for (const mode of collection.modes) {
			for (const variableId of collection.variableIds) {
				const variable = figma.variables.getVariableById(variableId);
				if (!variable) return;

				// check that we actually want this variable type
				if (!acceptedTypes.has(variable.resolvedType)) continue;

				let value = variable.valuesByMode[mode.modeId];

				// we only want actual values
				if (value === undefined || !variableTypes.has(variable.resolvedType)) {
					console.warn('skipping', variable);
					continue;
				}

				let obj: any = tokens[variable.resolvedType];

				const groups = [
					collection.name,
					defaultModes.has(mode.name.toLowerCase()) ? '' : mode.name,
					variable.name,
				]
					.filter(Boolean) // filter out empty strings
					.join('/') // join all keys
					.split('/') // then split them back to account for nested keys in variable name
					.map(slugify); // then turn into some slugs

				groups.forEach((group, i) => {
					const isKey = i < groups.length - 1;

					// if its the key, we want to create an entry
					if (isKey) {
						obj[group] = obj[group] || {};
						obj = obj[group];
						return;
					}

					if (
						typeof value === 'object' &&
						'type' in value &&
						value.type === 'VARIABLE_ALIAS'
					) {
						// aliases point to variables but not modes, so we can't point to a specific value here: https:forum.figma.com/t/how-to-access-variable-alias-value-from-another-collection/53203/2
						value = ``;
					} else if (variable.resolvedType === 'COLOR') {
						value = rgbToHex(value as RGBA);
					}

					obj[group] = value;
				});
			}
		}
	}

	return tokens;
};
