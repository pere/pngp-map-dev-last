<script>
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import highcharts from '$lib/components/myCharts/highcharts.js';
	import plotsDataTaxon from '../info/plots/plots_taxa.json';
	import { browser } from '$app/environment';
	import config from './chartConfig.js';
	import { _chartStores as chartStores } from '../../chartStores.svelte.js';
	import { watch, Previous, resource } from 'runed';
	import names from '../info/names.json';
	import { pUtils } from '../leftPanels/utils.svelte.js';
	import { json } from '@sveltejs/kit';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import TaxonSummaryTableNew from '../Table/TaxonSummaryTableNew.svelte';
	import SmallMapNew from '../SmallMapNew.svelte';
	let this_store = $derived(chartStores.plotsParams);
	let this_viz_store = $derived(chartStores.plotsVizParams);
	//"taxon":{"value":"u","label":"Uccelli","img":"/data/img/uccelli.jpeg"},"parameter":"richness",
	// "valleys":["gran_piano"],
	// "byBiennio":false}

	let this_derivedConfigData = $state([]);
	let showTables = $derived(this_viz_store.showTables);

	let byBiennio = $derived(
		this_store.byBiennio ? 'withBiennio' : 'withoutBiennio'
	);
	let selectedParametersItems = $state(this_store.parameters);

	watch(()=>selectedParametersItems,()=>{
       chartStores.plotsParams={...chartStores.plotsParams, parameters:selectedParametersItems};
    });

	// Initialize from store on mount
    $effect(() => {
        // Only update if different to avoid triggering watch unnecessarily
        const storeParams = this_store.parameters;
        if (JSON.stringify(storeParams) !== JSON.stringify(selectedParametersItems)) {
            selectedParametersItems = storeParams;
        }
    });

	let derivedParameters = $derived.by(() => {
		return names.parameters.map((v) => ({
			...v,
			selected: this_store.parameters.includes(v.value),
		}));
	});

	let checkedByBiennio = $state(false);
	let diffColumns = $state(false);
	let columns = $state(1);
	let dynamicColumns = $derived(() => {
		if (!diffColumns) {
			const chartCount = this_derivedConfigData?.length || 0;

			if (chartCount <= 1) return 1;
			if (chartCount <= 2) return 2;
			if (chartCount <= 4) return 2;
			if (chartCount <= 6) return 4;
			return 4; // Max 3 columns to prevent overflow
		} else {
			return columns;
		}
	});
	watch(
		() => diffColumns,
		(curr, prev) => {
			console.log('diffColumns changed', curr, prev);
		}
	);
	// Sync checkbox state from store
	$effect(() => {
		// Only update if different to avoid triggering watch unnecessarily
        const storeParams = this_store.parameters;
        if (JSON.stringify(storeParams) !== JSON.stringify(selectedParametersItems)) {
            selectedParametersItems = storeParams;
		}
		checkedByBiennio =
			this_store.byBiennio === true || this_store.byBiennio === 'withBiennio';


	});

	// Sync checkbox changes back to store
	watch(
		() => checkedByBiennio,
		(curr, prev) => {
			if (prev === undefined) return; // Skip initial run
			console.log('checkedByBiennio changed', curr, prev);
			chartStores.setPlotsParams({ byBiennio: curr });
		}
	);

	let selParams = $derived(this_store.parameters);

	/* parameters:['richness'], */
	let selTaxons = $derived(this_store.taxons);
	let reactiveData = $derived.by(() => {
		return plotsDataTaxon[byBiennio].filter((d) => {
			return this_store.plots.includes(d.geocode);
		});
	});

	let derivedGroups = $derived.by(() => {
		console.log(reactiveData, 'reactiveData');
		console.log(this_store, 'this_store');

		return reactiveData.reduce(
			(acc, item) => {
				if (!acc.codes_arr.includes(item['geocode'])) {
					acc.codes_arr.push(item['geocode']);
					acc.data.push({
						code: item['geocode'],
						data: [item],
					});
				} else {
					acc.data.find((d) => d.code === item['geocode']).data.push(item);
				}
				return acc;
			},
			{ codes_arr: [], data: [] }
		).data;
	});

	$inspect(derivedGroups);

	const colors = {
		//green
		richness: {
			color: names.parameters.find((d) => d.value === 'richness')?.color,
			lighter_color: names.parameters.find((d) => d.value === 'richness')
				?.lighter_color,
		},
		//orange
		abundance: {
			color: names.parameters.find((d) => d.value === 'abundance')?.color,
			lighter_color: names.parameters.find((d) => d.value === 'abundance')
				?.lighter_color,
		},
		//blue
		shannon: {
			color: names.parameters.find((d) => d.value === 'shannon')?.color,
			lighter_color: names.parameters.find((d) => d.value === 'shannon')
				?.lighter_color,
		},
	};

	let derivedConfigData = [];

	watch(
		() => this_store,
		(curr, prev) => {
			derivedConfigData = [];

			console.log(curr, 'curr');
			console.log(prev, 'prev');

			// $derived.by(() => {

			// Group data by valley_code

			//createChart(valleyGroups, 'gran_piano', `chart-0`);
			//valleyGroups.sort((a, b) => a.data[0].biennio - b.data[0].biennio);

			if (!derivedGroups || derivedGroups.length === 0) return [];

			/* debugger
             return []; */
			/* 	let _data = derivedGroups.data.filter((d) =>
			selGeoElemCodes.includes(d.code)
		);
		let derivedConfigData = []; */

			console.log(derivedGroups, 'derivedGroups');

			derivedGroups.forEach((data) => {
				const categories = selTaxons.map((d) => d.label);
				//const categories = selectedTaxonItems.map(d=>names.taxons.find(d=>d.value === d)?.label)
				//const categories = names.taxons.filter(d=>selectedTaxonItems.includes(d.value)).map(d=>d.label)

				//.map(t => t.toUpperCase());

				const title_text = names.plots_valleys.find(
					(d) => d.plot_code === data.code
				)?.plot_code;

				const series = [];
				// Create series for each parameter ('richness','abundance','shannon') and biennio combination
				selParams.forEach((param) => {
					/*     	"parameters": [
		{
			"char": "r",
			"value": "richness",
			"label": "Richness",


            	{
			"value": "u",

			 */
					console.log(data.data, 'data.data', data.data.length);

					data.data.forEach((_data) => {
						console.info(selTaxons, 'selTaxons');

						//passed 'u,o,l,r,c,f,s'...
						/* taxons:[{value:'all',label:'All taxa',img:'/data/img/all.jpg'}], */
						const t_data = selTaxons.map((taxon) => {
							console.warn(taxon, 'taxon', _data[`${taxon.value}_${param}`]);
							const value = _data[`${taxon.value}_${param}`];
							return value !== null ? value : 0;
						});

						console.log(t_data, 't_data');

						const baseColor = colors[param];
						let seriesName, biennio, seriesColor;

						if (byBiennio === 'withBiennio') {
							biennio = _data.biennio;

							seriesName = `${param.charAt(0).toUpperCase() + param.slice(1)} - Biennio ${biennio}`;
							// Darker for biennio 2
							seriesColor =
								biennio === 1 ? baseColor.color : baseColor.lighter_color;
						} else {
							seriesColor = baseColor.color;
							seriesName = `${param.charAt(0).toUpperCase() + param.slice(1)}`;
						}

						series.push({
							name: seriesName,
							data: t_data,
							color: seriesColor,
							yAxis: param === 'abundance' ? 1 : 0,
						});
					});
				});
				config.xAxis.categories = categories;

				console.info(config, 'config');
				if (this_store.parameters.length > 0) {
					if (
						this_store.parameters.includes('richness') &&
						this_store.parameters.includes('shannon')
					) {
						config.yAxis[0].title.text =
							'<span style="color:#1e946f">Richness</span> - <span style="color:#3b81bf">Shannon Index</span> ';
					} else {
						if (this_store.parameters.includes('richness'))
							config.yAxis[0].title.text =
								'<span style="color:#1e946f">Richness</span> ';
						if (this_store.parameters.includes('shannon'))
							config.yAxis[0].title.text =
								'<span style="color:#3b81bf">Shannon Index</span> ';
					}
					if (!this_store.parameters.includes('abundance')) {
						config.yAxis[1].title.text = '';
					} else {
						config.yAxis[1].title.text =
							'<span style="color:#d14edb">Abundance</span> ';
					}
					/*
                else if (this_store.parameters.includes('shannon'))
            }
                    config.yAxis[0].title.text='<span style="color:#00a6f4">Shannon Index</span> '; */
				}

				let _config = {
					...config,
					title: {
						text: title_text,
						style: {
							fontFamily: 'Lato',
							fontSize: '1.1rem',
							fontWeight: 'normal',
							textTransform: 'uppercase',
							color: 'white',
						},
					},
				};

				derivedConfigData.push({
					code: data.code,
					..._config,
					series: series,

					categories: categories,
				});
			});

			this_derivedConfigData = derivedConfigData;
		}
	);

	// Dynamic columns calculation based on number of charts

	/**
	 * Break items into rows of max `columns` length
	 */
	let chunk = function (arr, size) {
		const res = [];
		for (let i = 0; i < arr.length; i += size) {
			res.push(arr.slice(i, i + size));
		}
		//console.log('Chunk result:', res);
		return res;
	};

	// Track active tab for each chart
	let activeTabsByChart = $state({});
	// Track which tabs have been visited to prevent re-mounting
	let visitedTabsByChart = $state({});
	let visitedMapsByChart = $state({});
	let handleMapChange = (code, value) => {
		//console.log('Map changed for chart', code, 'to', value);
		visitedMapsByChart[code] = value;
	};

	let handleTabChange = (code, value) => {
		//console.log('Tab changed for chart', code, 'to', value);
		activeTabsByChart[code] = value;

		// Mark this tab as visited
		if (!visitedTabsByChart[code]) {
			visitedTabsByChart[code] = new Set();
		}
		visitedTabsByChart[code].add(value);
	};
</script>

 {JSON.stringify(derivedParameters)}

<!-- {#key key} -->
{#if this_derivedConfigData && this_derivedConfigData.length > 0}
<div class="max-w-[350px] rounded-md border p-2">
	<div class="params-selection flex flex-wrap gap-1 p-1 text-xs">


		{#each derivedParameters as v}
		{@const selected = v.selected}
			<button style="background-color: {v.color}" class="hover:cursor-pointer flex border rounded-md p-2 items-center justify-center {selected ? 'active':''}" onclick={()=>{
				if (selectedParametersItems.length === 1 && selected) {

					return;
				}
				if (v.selected) {

					selectedParametersItems = selectedParametersItems.filter((d) => d !== v.value);
				} else {

					selectedParametersItems = [...selectedParametersItems, v.value];
				}
			}}>
			{v.label}</button>
		{/each}
		{#if selectedParametersItems.length === 1}
			<button class="bg-red-500 text-white flex border rounded-md p-2 items-center justify-center active">At least one parameter is required</button>
		{/if}


	</div>
</div>
	<div class="flex flex-row gap-2">

		<div
			class="flex items-center gap-2 m-2 ml-0 border-1 border-gray-300 rounded-md p-2 w-fit"
		>
			<Checkbox
				class="border-gray-400"
				id="byBiennio"
				bind:checked={checkedByBiennio}
			/>
			<Label for="byBiennio">Data splitted by biennio</Label>
		</div>

		<div
			class="flex gap-2 items-center m-2 ml-0 border border-gray-300 rounded-md p-2 w-fit"
		>
			<Checkbox
				class="border-gray-400"
				id="showTables"
				bind:checked={this_viz_store.showTables}
				onCheckedChange={(value) => {
					this_viz_store.showTables = value;
				}}
			/>
			<Label for="showTables">Show tables</Label>
		</div>

		<div
			class="flex items-center gap-2 m-2 ml-0 border-1 border-gray-300 rounded-md p-2 w-fit"
		>
			<Checkbox
				class="border-gray-400"
				id="diffColumns"
				bind:checked={diffColumns}
			/>
			<Label for="diffColumns">Different columns</Label>
			{#if diffColumns}
				<input
					type="number"
					bind:value={columns}
					min="1"
					max="6"
					class="w-10 bg-gray-400 rounded-md text-white text-center"
				/>
			{/if}
		</div>
	</div>
	{#each chunk(this_derivedConfigData, dynamicColumns()) as row, rowIndex}
		<!-- <div class="text-sm text-gray-500 mb-2">Row {rowIndex + 1}: {row.length} charts</div> -->
		<div
			class="grid gap-2 mb-2"
			style="grid-template-columns: repeat({row.length}, minmax(200px, 1fr));"
		>
			{#each row as config, index}

				{@const code = config.code}
				<div
					class="text-center min-w-0 bg-gray-100 rounded-md p-1 outline outline-1 outline-gray-300"
				>
					<Tabs.Root
						onValueChange={(value) => handleTabChange(code, value)}
						value="chart"
					>
						<Tabs.List>
							<Tabs.Trigger value="chart" data-tid="tabs.charts"
								>Chart</Tabs.Trigger
							>
							<Tabs.Trigger
								onValueChange={(value) => handleMapChange(code, value)}
								value="map">Map</Tabs.Trigger
							>
						</Tabs.List>
						<Tabs.Content value="chart">
							<!-- {#key key} -->
							<div
								use:highcharts={config}
								class="chart-container"
								style="width: 100%; height: 250px;"
							></div>
							<div
								class="mt-2"
								style:display={this_viz_store.showTables ? 'block' : 'none'}
							>
								<TaxonSummaryTableNew
									type="plots"
									data={reactiveData}
									byBiennio={checkedByBiennio}
									{code}
									selectedTaxonItems={this_store.taxons}
								/>
							</div>
							<!-- {/key} -->
						</Tabs.Content>
						<Tabs.Content value="map">
							<div
								style:display={activeTabsByChart[code] === 'map'
									? 'block'
									: 'none'}
							>
								{#if visitedTabsByChart[code]?.has('map')}
									<SmallMapNew
										mapVisited={activeTabsByChart[code] === 'map'}
										parentClickedElem={code}
										type="plots"
									/>
								{/if}
							</div>
						</Tabs.Content>
					</Tabs.Root>
				</div>
			{/each}
		</div>
	{/each}
{/if}

<!-- {/key} -->

<style>
	.chart-container {
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	/* Responsive grid adjustments */
	@media (max-width: 768px) {
		.chart-container {
			height: 300px !important;
		}
	}

	@media (max-width: 480px) {
		.chart-container {
			height: 250px !important;
		}
	}

	.legend {
		margin: 20px 0;
		padding: 15px;
		background-color: #f9f9f9;
		border-radius: 5px;
	}
	.legend h4 {
		margin: 0 0 10px 0;
		color: #555;
	}
	.legend-item {
		display: inline-block;
		margin: 5px 15px 5px 0;
		font-size: 14px;
	}
	.params-selection button
	{
		color:white;
		opacity: .4;
	}
	.params-selection button.active {

		color: #fff;
		opacity: 1;
	}
</style>
