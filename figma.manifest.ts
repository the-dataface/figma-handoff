// GENERATE A NEW PLUGIN MANIFEST FOR EVERY NEW PLUGIN
// https://www.figma.com/plugin-docs/plugin-quickstart-guide/
export default {
	name: 'Handoff',
	id: '1335332559518815758',
	api: '1.0.0',
	main: 'plugin.js',
	ui: 'index.html',
	enableProposedApi: false,
	editorType: ['figma', 'figjam'],
	documentAccess: 'dynamic-page',
	networkAccess: { allowedDomains: ['none'] },
};
