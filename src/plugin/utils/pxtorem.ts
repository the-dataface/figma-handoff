export default (px: number, baseFontSize: number = 16): string => {
	if (px === 0) return '0';
	else if (px === 1) return '1px';

	const rem = px / baseFontSize;
	return `${rem}rem`;
};
