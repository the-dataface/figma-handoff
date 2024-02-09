/**
 * @fileoverview This is the entry point for your plugin.
 * @see {@link https://www.figma.com/plugin-docs/|Figma Plugin Docs}
 */

import processEffects from './processEffects';
import processTextStyles from './processTextStyles';
import processVariables from './processVariables';

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
figma.ui.postMessage({
	type: 'init',
	options: {
		Libraries: figma.variables
			.getLocalVariableCollections()
			.map((c) => ({ label: c.name, value: c.id })),
	},
});

// message handler
figma.ui.onmessage = (message: MessageDataFromUI) => {
	if (!message?.type) return;

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
			const variableTokens = processVariables(variableCollections);

			const effectsStyles = figma.getLocalEffectStyles();
			const effectsTokens = processEffects(effectsStyles);

			const textStyles = figma.getLocalTextStyles();
			const { css, tokens: textStyleTokens } = processTextStyles(textStyles);

			const tokens = Object.assign(
				variableTokens,
				effectsTokens,
				textStyleTokens
			);

			figma.ui.postMessage({
				type: 'handoff-end',
				tokens,
				css,
			});
		}
	}
};
