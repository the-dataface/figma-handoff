export default (obj: Record<string, any>, tabs = 1): string => {
	const indent = '\t'.repeat(tabs);

	return Object.entries(obj)
		.filter(([_, value]) => value !== undefined)
		.map(([key, value]) => `\n${indent}${key}: ${value};`)
		.join('');
};
