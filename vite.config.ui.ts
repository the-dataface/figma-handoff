import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import path from 'path';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

import writeFigmaManifest from './scripts/write-figma-manifest';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
	const dev = mode === 'development';
	return {
		plugins: [
			svelte({ preprocess: [vitePreprocess()] }),
			viteSingleFile(),
			writeFigmaManifest(),
		],
		root: path.resolve(__dirname, './src/ui'),
		build: {
			minify: !dev,
			sourcemap: dev,
			outDir: path.resolve(__dirname, './dist'),
			rollupOptions: {
				input: {
					ui: path.relative(__dirname, './src/ui/index.html'),
				},
				output: {
					entryFileNames: '[name].js',
				},
			},
		},
		css: {},
		resolve: {
			alias: {
				$common: path.resolve(__dirname, './src/common'),
				$ui: path.resolve(__dirname, './src/ui'),
				$plugin: path.resolve(__dirname, './src/plugin'),
			},
		},
	};
});
