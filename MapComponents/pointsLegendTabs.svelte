<script>
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { runeStoreTaxCards } from '$lib/stores/svelte5_stores/RuneStoreTaxCards.svelte.js';
	import highcharts from '$lib/components/myCharts/highcharts.js';
	import highchartsBarConfig from '$lib/components/myCharts/highchartsBarConfig.js';
	import { watch, Previous, resource } from 'runed';

	let taxIds = $derived(runeStoreTaxCards.spAddedToList.map((d) => d.tax_id));
	let selectedStats = $state('years');
	let selectedViz = $state('list');

	const searchResource = resource(
		() => taxIds,
		async (currIds, prevIds, { data, refetching, onCleanup, signal }) => {
			if (!currIds || currIds.length === 0) {
				return [];
			}
			if (
				currIds == prevIds ||
				JSON.stringify(currIds) === JSON.stringify(prevIds)
			) {
				console.log('IDs unchanged, skipping fetch.');
				return false; // Return previous data if IDs haven't changed
			}
			// data: the previous value returned from the fetcher

			// refetching: whether the fetcher is currently refetching
			// or it can be the value you passed to refetch()

			// onCleanup: A cleanup function that will be called when the source is invalidated
			// and the fetcher is about to re-run

			// signal: AbortSignal for cancelling fetch requests
			const response = await fetch(
				`https://pere.gis-ninja.eu/pngp_phps_new/get_basic_stats.php?ids=${currIds.join(',')}`,
				{ signal }
			);
			//return response.json();
			let _data = response.json();
			/* runeStoreTaxCards.filteredBasicStats = _data; */
			dataReady = true;
			return _data;
		},
		{
			debounce: 300,
			// lazy: Skip initial fetch when true
			// once: Only fetch once when true
			// initialValue: Provides an initial value for the resource
			// debounce: Debounce rapid changes
			// throttle: Throttle rapid changes
		}
	);

	let dataReady = $state(false);
	let foo = $derived(searchResource?.current ?? null);
	// $inspect(foo); // Disabled for performance

	$effect(() => {
		if (searchResource.loading || !foo || foo.length === 0) return false;
		console.log('Filtered Basic Stats updated:', foo);

		// Create a new object to trigger reactivity with a fresh reference
		runeStoreTaxCards.filteredBasicStats = {
			data: foo,
			timestamp: Date.now(), // Unique identifier for each data update
		};
	});

	/* $effect(() => {
		if (searchResource.loading || !foo || foo.length === 0) return false;
		console.log('Filtered Basic Stats updated:', foo);
		runeStoreTaxCards.filteredBasicStats = {
			yearsArray: foo[0].by_year
				? new Set(foo[0].by_year.map((d) => d.year))
				: new Set(),
			valleysArray: foo[0].by_valley
				? new Set(foo[0].by_valley.map((d) => d.valley))
				: new Set(),
		};
	}); */

	let statsList = $derived.by(() => {
		if (searchResource.loading || !foo || !foo[0]) return;
		let data, paramCount;
		if (selectedStats === 'years') {
			data = foo[0].by_year;
			paramCount = 'year';
		}
		if (selectedStats === 'valleys') {
			data = foo[0].by_valley;
			paramCount = 'valley';
		}
		if (data) {
			return [...data]
				.sort((a, b) => a[paramCount] - b[paramCount])
				.map((item) => {
					return {
						paramCountValue: item[paramCount] ? item[paramCount] : 'N/A',
						count: item.count,
					};
				});
		}
		return [];
	});

	let highchartsStatsBarConfigModified = $derived.by(() => {
		if (searchResource.loading || !foo) return highchartsBarConfig; // Return base config instead of null
		let data, paramCount;
		if (selectedStats === 'years') {
			data = foo[0].by_year;
			paramCount = 'year';
		}
		if (selectedStats === 'valleys') {
			data = foo[0].by_valley;
			paramCount = 'valley';
		}
		if (data) {
			//some data may be null
			let t = [...data]
				.sort((a, b) => a[paramCount] - b[paramCount])
				.map((item) => {
					return {
						paramCountValue: item[paramCount] ? item[paramCount] : 'N/A',
						count: item.count,
					};
				});

			highchartsBarConfig.yAxis.labels.enabled = true;
			highchartsBarConfig.yAxis.tickAmount = 4;
			highchartsBarConfig.yAxis.labels.formatter = function () {
				return this.value.toLocaleString();
			};

			highchartsBarConfig.xAxis.categories = t.map(
				(item) => item.paramCountValue
			);
			let config = {
				...highchartsBarConfig,
				series: [
					{
						animation: false,
						color: '#00c951',
						name: `${paramCount}ly stats`,
						data: t.map((item) => {
							return { y: item.count, category: item.paramCountValue };
						}),
					},
				],
				categories: t.map((item) => item.paramCountValue),
			};
			console.log('config', config);
			return config;
		}
		return highchartsBarConfig; // Return base config instead of null
	});
</script>
<!-- {JSON.stringify(statsList)} - {selectedStats} - {selectedViz} -->
{#if statsList && statsList.length > 0}
	<div class="flex flex-row gap-2 text-xs m-2">
		<div class="flex-1/2 align-left">
			<button
				class="mr-1 cursor-pointer {selectedStats === 'years'
					? 'decoration-green-500 decoration-2 underline'
					: ''}"
				onclick={() => {
					selectedStats = 'years';
				}}>Years</button
			>
			<button
				class="cursor-pointer {selectedStats === 'valleys'
					? 'decoration-green-500 underline'
					: ''}"
				onclick={() => {
					selectedStats = 'valleys';
				}}>Valleys</button
			>
		</div>
		<div class="flex-1/2 align-right text-right mr-2">
			<button
				class="mr-1 cursor-pointer {selectedViz === 'chart'
					? 'decoration-blue-500 decoration-2 underline'
					: ''}"
				onclick={() => {
					selectedViz = 'chart';
				}}>Chart</button
			>
			<button
				class="cursor-pointer {selectedViz === 'list'
					? 'decoration-blue-500 decoration-2 underline'
					: ''}"
				onclick={() => {
					selectedViz = 'list';
				}}>List</button
			>
		</div>
	</div>
	<div class="mb-2">
		{#if searchResource.loading}
			<div class="w-full h-40 flex items-center justify-center text-xs">
				Loading...
			</div>
		{:else if searchResource.error}
			<div
				class="w-full h-40 flex items-center justify-center text-xs text-red-500"
			>
				Error: {searchResource.error.message}
			</div>
		{:else if selectedViz === 'chart'}
			<div
				use:highcharts={highchartsStatsBarConfigModified}
				class="w-full h-40"
			></div>
		{:else if selectedViz === 'list'}
			<div class="w-full h-fit max-h-50 overflow-auto">
				<div
					class="grid grid-rows-auto
			{selectedStats === 'years' ? 'grid-cols-4' : 'grid-cols-2'}
			gap-1 text-xs"
				>
					{#each statsList as item, index}
						<div class="m-1 pb-0.5">
							<span class="bg-pngp text-white p-1 rounded-md mr-1"
								>{item.paramCountValue}</span
							> <span class="text-right">{item.count.toLocaleString()}</span>
						</div>
					{/each}
				</div>

				<!-- <ul class="list-none p1 m-2 max-h-40 overflow-y-auto">
				{#each statsList as item, index}
					<li class="m-1 pb-0.5">{item.paramCountValue} : {item.count}</li>
				{/each}
			</ul> -->
			</div>
		{/if}
	</div>
{/if}
