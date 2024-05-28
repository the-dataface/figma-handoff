import rgbToHex from '$plugin/utils/rgbToHex';

import pxtorem from './utils/pxtorem';

/**
 * @description Processes Figma's Variable Collections into a nested object of tokens.
 * @returns {Tokens} nested object of tokens
 */
export default async (
	/** variable collections in array format, traditional figma variables */
	variableCollections: VariableCollection[] = [],
	/** accepted variable types */
	acceptedTypes: Set<VariableResolvedDataType> = new Set([
		'FLOAT',
		'COLOR',
		'BOOLEAN',
		'STRING',
	])
): Promise<Tokens> => {
	// dump everything in bins according to the type.
	// type -> mode -> variable names nested -> value
	// e.g. { COLOR: { 'dark mode': { 'bg': '#000' } } }
	const tokens: Tokens = {};

	// these modes will be presented without a mode name in the path
	const defaultModes = new Set(['light mode', 'mode 1']);

	for (const collection of variableCollections) {
		for (const mode of collection.modes) {
			for (const variableId of collection.variableIds) {
				const variable = await figma.variables.getVariableByIdAsync(variableId);
				if (!variable) continue;

				let value = variable.valuesByMode[mode.modeId];

				const isAlias =
					typeof value === 'object' &&
					'type' in value &&
					value.type === 'VARIABLE_ALIAS';

				// check that this is a real and desired value
				if (
					value === undefined ||
					!acceptedTypes.has(variable.resolvedType) ||
					isAlias
				) {
					console.warn('skipping', variable);
					continue;
				}

				let obj: any = tokens;

				const actualMode = defaultModes.has(mode?.name?.toLowerCase())
					? ''
					: mode.name;

				const splitName = variable.name.split('/');

				// top-level is tailwind-specific name
				const parentKey = splitName[0];

				// rejoin keys without the parent key so we can do special formatting on non-tailwind config keys
				let keys = splitName?.slice(1)?.join('/')?.toLowerCase();

				// if nested keys, we should do some specific formatting
				if (keys.length) {
					switch (parentKey) {
						case 'borderRadius':
						case 'screens': {
							keys = keys;
							value = `${value}px`;
							break;
						}
						case 'spacing': {
							keys = keys.replaceAll('-', '.');
							value = pxtorem(value as number);
							break;
						}
						default: {
							keys = keys.replaceAll('-', '.');
							break;
						}
					}
				}

				const groups = [actualMode, parentKey, keys]
					.filter(Boolean) // filter out empty strings
					.join('/') // join all keys
					.split('/'); // then split them back to account for nested keys in variable name

				groups.forEach((group, i) => {
					const isKey = i < groups.length - 1;

					// if its the key, we want to create an entry
					if (isKey) {
						obj[group] = obj[group] || {};
						obj = obj[group];
						return;
					}

					if (variable.resolvedType === 'COLOR') {
						value = rgbToHex(value as RGBA);
					}

					obj[group] = value;
				});
			}
		}
	}

	return tokens;
};
