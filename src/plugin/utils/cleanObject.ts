export default (obj: { [key: string]: any }) => {
	return Object.entries(obj).reduce(
		(
			acc: { [key: string]: any; value: any },
			[key, value]: [string, string | number | undefined]
		) => {
			if (value !== undefined) acc[key] = value;
			return acc;
		},
		{} as { [key: string]: any; value: any }
	);
};
