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

const init = async () => {
	const collections = await figma.variables.getLocalVariableCollectionsAsync();

	// plugin initialized
	figma.ui.postMessage({
		type: 'init',
		options: {
			Libraries: collections.map((c) => ({ label: c.name, value: c.id })),
		},
	});

	return;
};

// message handler
figma.ui.onmessage = async (message: MessageDataFromUI) => {
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

			const variableCollections = (await (
				await Promise.all(
					options.Libraries.map((d: Option) =>
						figma.variables.getVariableCollectionByIdAsync(d.value)
					)
				)
			).filter(Boolean)) as VariableCollection[];
			const variableTokens = await processVariables(variableCollections);

			const effectsStyles = await figma.getLocalEffectStylesAsync();
			const effectsTokens = processEffects(effectsStyles);

			const textStyles = await figma.getLocalTextStylesAsync();
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

init();
