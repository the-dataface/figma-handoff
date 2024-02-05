<script lang="ts">
	import { cubicOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';
	import {
		ArrowRightIcon,
		ChevronDownIcon,
		DownloadIcon,
		FigmaIcon,
		GithubIcon,
	} from 'svelte-feather-icons';
	import JSZip from 'jszip';
	import Message, { postMessage } from '$ui/lib/components/Message.svelte';
	import Footer from './furniture/Footer.svelte';
	import slugify from '$plugin/utils/slugify';

	const files = {
		tokens: {
			value: '',
			filename: 'tokens.json',
			href: (t: string) =>
				`data:text/json;charset=utf-8,${encodeURIComponent(t)}`,
			preview: (t: string) => JSON.stringify(t, null, 2),
		},
		css: {
			value: '',
			filename: 'tokens.postcss',
			href: (t: string) =>
				`data:text/plain;charset=utf-8,${encodeURIComponent(t)}`,
			preview: (t: string) => t,
		},
	};

	let options: Options = {
		Libraries: [],
		Types: [],
	};

	let selected: Options = {
		Libraries: [],
		Types: [],
	};
</script>

<!-- example message. hook into the Message component to capture events + data -->
<Message
	on:init={(e) => {
		options = { ...e.detail.options };

		// initialize with all turned on
		selected = { ...e.detail.options };
	}}
	on:handoff-end={(e) => {
		files.tokens.value = e.detail.tokens;
		files.css.value = e.detail.css;
	}}
/>

<svelte:head>
	<title>Handoff</title>
</svelte:head>

<div class="w-full h-full flex flex-row flex-wrap">
	<main
		id="main"
		class="w-full min-w-[320px] flex flex-col gap-8 flex-nowrap p-4 h-full overflow-y-auto pt-0 pb-12"
	>
		<header
			class="flex flex-col gap-2 items-center justify-center max-w-sm mx-auto text-center pt-12"
		>
			<div class="flex flex-row flex-nowrap gap-2">
				<FigmaIcon class="stroke-figma-color-text-brand" size="24" />
				<ArrowRightIcon class="stroke-figma-color-text-brand" size="24" />
				<GithubIcon class="stroke-figma-color-text-brand" size="24" />
			</div>

			<h1 class="text-figma-color-text font-bold text-6xl leading-none">
				Handoff
			</h1>

			<p class="text-figma-color-text font-normal text-base">
				Export Figma design tokens to a dev-friendly format.
			</p>
		</header>

		<section class="w-full flex flex-row flex-wrap gap-2 justify-center">
			<button
				class="bg-figma-color-bg-brand text-figma-color-text border rounded border-figma-color-border-selected-strong transition-all duration-150 ease-out px-4 py-2 uppercase tracking-widest grid place-content-center hover:bg-figma-color-bg-brand-hover focus:bg-figma-color-bg-brand-hover active:bg-figma-color-bg-brand-pressed disabled:bg-figma-color-bg disabled:border-figma-color-bg-danger disabled:cursor-not-allowed font-bold min-h-[44px] min-w-[44px] group"
				on:click={() => {
					// reset files
					files.tokens.value = '';
					files.css.value = '';

					postMessage({ type: 'handoff-start', options: selected });
				}}
			>
				<span>Generate handoff files</span>
			</button>
		</section>

		<section
			class:hidden={options === undefined}
			class="border border-figma-color-border flex flex-col gap-4 rounded max-w-md w-full mx-auto"
		>
			<details class="group">
				<summary
					class="flex flex-row flex-wrap gap-4 justify-between items-center p-4 select-none group-open:border-b group-open:border-figma-color-border group-open:bg-figma-color-bg-secondary rounded group-open:rounded-b-none"
				>
					<div
						class="flex flex-col flex-wrap items-start justify-start leading-none gap-x-4 gap-y-0.5"
					>
						<h2 class="font-bold text-base">Options</h2>
						<p class="text-xs text-figma-color-text-secondary translate-y-px">
							Choose the libraries and variable types to export
						</p>
					</div>
					<ChevronDownIcon
						class="stroke-figma-color-text-secondary transition-all duration-75 ease-out group-open:-rotate-180"
					/>
				</summary>

				<div class="flex flex-col gap-6 px-4 py-6">
					{#each Object.entries(options) as [key, values]}
						{#if values}
							<fieldset class="flex flex-col gap-2">
								<button
									class="block w-fit font-semibold text-sm leading-none tracking-wide text-figma-color-text uppercase hover:text-figma-color-text-secondary transition-all ease-out duration-150 cursor-pointer"
									on:click={() => {
										if (selected[key].length === values.length) {
											selected[key] = [];
										} else {
											selected[key] = values;
										}
									}}
								>
									<legend>
										{key}
									</legend>
								</button>

								<div class="flex flex-row flex-wrap gap-2">
									{#each values as d}
										{@const id = `${slugify(key)}-${slugify(d.value)}`}
										<div
											class="flex flex-row gap-1 items-center justify-center"
										>
											<input
												{id}
												name={id}
												class="peer sr-only"
												type="checkbox"
												checked={selected[key].find((e) => e.value)}
												value={d}
												bind:group={selected[key]}
											/>
											<label
												for={id}
												class="bg-figma-color-bg-tertiary px-2 py-1 rounded-sm border border-figma-color-bg-tertiary text-figma-color-text-tertiary text-xs font-semibold cursor-pointer transition-all ease-out duration-150 peer-checked:text-figma-color-text-onselected-strong
												peer-checked:bg-figma-color-bg-selected peer-checked:border-figma-color-border-selected"
											>
												{d.label}
											</label>
										</div>
									{/each}
								</div>
							</fieldset>
						{/if}
					{/each}
				</div>
			</details>
		</section>

		{#if files.tokens.value !== '' && files.css.value !== ''}
			<section
				id="files"
				class="flex flex-col gap-2 max-w-md w-full mx-auto"
				in:fly={{ y: 300, easing: cubicOut }}
			>
				<header class="flex flex-row justify-between items-end gap-4">
					<h2 class="font-semibold text-figma-color-text-secondary">
						<button
							class="py-2 px-3 bg-figma-color-bg-secondary rounded border flex flex-row flex-nowrap items-center justify-center gap-2 border-figma-color-border-secondary text-figma-color-text hover:bg-figma-color-bg-selected-secondary hover:border-figma-color-border-selected active:bg-figma-color-bg-selected-pressed transition-all duration-150 ease-out"
							on:click={() => {
								const zip = new JSZip();

								Object.entries(files).forEach(
									([key, { filename, value, preview }]) => {
										zip.file(filename, preview(value));
									}
								);

								zip.generateAsync({ type: 'blob' }).then((content) => {
									const url = URL.createObjectURL(content);
									const a = document.createElement('a');
									a.href = url;
									a.download = 'handoff.zip';
									a.click();

									URL.revokeObjectURL(url);
									a.remove();
								});
							}}
						>
							<span>Download all files</span>
							<DownloadIcon strokeWidth={2} size="18" />
						</button>
					</h2>
				</header>
				<div class="flex flex-col gap-2">
					{#each Object.entries(files) as [key, { filename, value, href, preview }]}
						{#if value !== undefined}
							<section
								id={key}
								class="flex-1 flex flex-col gap-0.5 rounded-lg bg-figma-color-bg-secondary"
							>
								<details class="group/details">
									<summary
										class="flex flex-row flex-wrap gap-4 justify-between items-center p-4 select-none group-open/details:border-b group-open/details:border-figma-color-border group-open/details:bg-figma-color-bg-secondary hover:border-figma-color-border-brand rounded group-open/details:rounded-b-none sticky top-0"
									>
										<a
											class="border border-figma-color-text-tertiary rounded-md p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-base hover:bg-figma-color-bg-selected-secondary hover:border-figma-color-border-selected active:bg-figma-color-bg-selected-pressed transition-all duration-150 ease-out group/download"
											href={href(value)}
											download={filename}
										>
											<DownloadIcon
												class="stroke-figma-color-text-secondary"
												strokeWidth={2}
												size="18"
											/>
											<span class="sr-only">Download</span>
										</a>

										<span>{filename}</span>

										<ChevronDownIcon
											class="ml-auto stroke-figma-color-text-secondary transition-all duration-75 ease-out group-open/details:-rotate-180"
										/>
									</summary>

									<div class="p-4 bg-figma-color-bg-secondary">
										<pre class="whitespace-break-spaces">{@html preview(
												value
											)}</pre>
									</div>
								</details>
							</section>
						{/if}
					{/each}
				</div>
			</section>
		{/if}

		<Footer />
	</main>
</div>
