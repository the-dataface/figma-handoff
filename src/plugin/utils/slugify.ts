export default function slugify(str: string) {
	return str
		.toLowerCase()
		.replace(/[\s/]/g, '-')
		.replace(/[^a-z0-9-]/g, '');
}
