<script>
	import * as Select from '$lib/components/ui/select/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import highcharts from '$lib/components/myCharts/highcharts.js';
	import { watch } from 'runed';
	import { browser } from '$app/environment';
	import config from './customConfig.js';
	import names from '../info/names.json';

	import { _chartStores as chartStores, _chartStoresMap as chartStoresMap } from '../../chartStores.svelte.js';

	import plotsDataTaxonGeneral from '../used_json/plots_general_taxon.json';
	import plotsDataTaxon from '../info/plots/plots_taxa.json';

	let type = 'plots';

	let { fromMap = false, groupedXAxis = true } = $props();

	/**
	 * Nested `xAxis.categories` for the Black Label grouped-categories plugin
	 * (registered in `$lib/components/myCharts/highcharts.js`).
	 * @param {Array<{ code: string, valley_code?: string, data: unknown[] }>} rows
	 */
	function buildGroupedPlotCategories(rows, plotsValleys) {
		const valleyToPlots = new Map();
		const valleyOrder = [];
		for (const row of rows) {
			const vc = row.valley_code ?? '—';
			if (!valleyToPlots.has(vc)) {
				valleyToPlots.set(vc, []);
				valleyOrder.push(vc);
			}
			const list = valleyToPlots.get(vc);
			if (!list.includes(row.code)) list.push(row.code);
		}
		const grouped = valleyOrder.map((vc) => {
			const label =
				plotsValleys.find((d) => d.valley_code === vc)?.valley_name ?? vc;
			return { name: label, categories: valleyToPlots.get(vc) };
		});
		const flatOrder = grouped.flatMap((g) => g.categories);
		return { grouped, flatOrder };
	}

	//let mouseoverPlot = $state(null);


	let activeStore = $derived(fromMap ? chartStoresMap : chartStores);
	let this_store = $derived.by(() => {
		void activeStore._updateKey;
		return activeStore.plotsParams;
	});
	let byBiennio = $derived(this_store.byBiennio);



	let reactiveData = $derived.by(() => {
		return byBiennio
			? plotsDataTaxon.withBiennio
			: plotsDataTaxon.withoutBiennio;
		//valleyDataTaxon : valleyDataTaxonGeneral;
	});

	$effect(() => {
		console.log('reactiveData', reactiveData);
		if (fromMap) {
			console.log(this_store, 'this_store');
		}
	});

	let taxonItems = $state(
		names.taxons.map((d, i) => ({
			value: d.value,
			label: d.label,
			selected: d.value === 'all' ? true : false,
			color: d.color,
		}))
	);
	let selectedTaxonItems = $derived.by(() => {
		return taxonItems
			.filter((d) => this_store.taxons.map((d) => d.value).includes(d.value))
			.map((d, i) => {
				return { short: d.value, label: d.label, color: d.color };
			});
	});

	let selTaxonNames = $derived.by(() => {
		return taxonItems
			.filter((d) => d.selected)
			.map((d) => {
				return { short: d.value, label: d.label, color: d.color };
			})
			.sort((a, b) => a.label.localeCompare(b.label));
	});
	$inspect(selTaxonNames);

	//let selParam='richness';
	//const taxons = ['u', 'o', 'l', 'r', 'c', 'f', 's'];

	let derivedGroups = $derived.by(() => {
		console.log('reactiveData', reactiveData);

		return reactiveData.reduce(
			(acc, item) => {
				if (!acc.codes_arr.includes(item.geocode)) {
					acc.codes_arr.push(item.geocode);
					let valley_code=names.plots_valleys.find(d=>d.plot_code===item.geocode)?.valley_code;
					console.log('valley_code', valley_code);
					acc.data.push({
						code: item.geocode,
						valley_code: valley_code,
						data: [item],
					});
				} else {
					acc.data.find((d) => d.code === item.geocode).data.push(item);
				}
				return acc;
			},
			{ codes_arr: [], data: [] }
		);
	});
	$inspect(derivedGroups);
	

	let derivedConfig = $derived.by(() => {
		if (!derivedGroups) return [];

	/* 	if (fromMap) {

			config.chart.type='bar';
		}
		else {
			config.type='column';
		} */
		let allConfigs = [];
		['richness', 'abundance', 'shannon'].forEach((p) => {
			let selParam = p;

			//extract for 'richness' and abuncance 'abundance' if taxon belongs to selectedTaxonItems ('u','l'...)

			//u_richness,u_abundance,l_richness,l_abundance,...
			//            return {value:d.value,color:d.color}
			let toSelect = selectedTaxonItems.map((d) => d.short + '_' + selParam);
			let selColors = selectedTaxonItems.map((d) => d.color);

			//  let color=taxonItems.find(d=>d.value===selectedTaxonItems[0]).color;
			//  console.log('toSelect',toSelect);

			let toSelectObj = toSelect.map((_d, i) => {
				return { name: _d, data: [], color: selColors[i] };
			});

			/*            [
    {
        "name": "o_richness",
        "data": [],
        "color": "#f0b100"
    }
] */
			let xCategories;
			let plotRowsOrdered = derivedGroups.data;
			if (groupedXAxis) {
				const { grouped, flatOrder } = buildGroupedPlotCategories(
					derivedGroups.data,
					names.plots_valleys
				);
				xCategories = grouped;
				const byCode = Object.fromEntries(
					derivedGroups.data.map((r) => [r.code, r])
				);
				plotRowsOrdered = flatOrder.map((code) => byCode[code]).filter(Boolean);
			} else {
				xCategories = derivedGroups.data.map((d) => d.code);
			}

			//each geocode — order must match xAxis leaf order (grouped or flat)
			let configData = plotRowsOrdered.reduce((acc, d) => {
				let geocode = d.code;

				//  console.log('flattened data',derivedGroups.data.flatMap(d=>d.data));

				// d.data is an array, so we need to iterate through each item in the array
				let f = d.data.flatMap((item) => {
					// Now extract the properties from each item objec.ct
					return Object.entries(item)
						.map(([key, value]) => {
							/* console.log(key,value, toSelect); */
							if (toSelect.includes(key)) {
								toSelectObj.find((d) => d.name === key).data.push(value);
								//                                toSelectObj.find(d=>d.name===key).color=color;
							}

							return null; // Return null for non-matching keys
						})
						.filter(Boolean); // Remove null values
				});

				return f;
			}, []);

			const yAxisForParam = [
				{
					title: {
						useHTML: true,
						text:
							'<span style="color:gray">' +
							selParam.toLocaleUpperCase() +
							'</span> ',
						style: {
							color: 'black',
							fontSize: '.7rem',
							fontFamily: 'Archivo',
						},
					},
					labels: {
						useHTML: true,
						id: selParam,
						style: {
							color: 'black',
							fontSize: '.8rem',
							fontFamily: 'Archivo',
						},
					},
				},
			];

			const plotOptionsForChart = fromMap
				? {
						...config.plotOptions,
						series: {
							...config.plotOptions.series,
							point: {
								events: {
									mouseOver: function () {
										console.log('mouseOversss', this);
										chartStoresMap.mouseoverPlot = this.category;
									},
									mouseOut: function () {
										console.log('series mouseout', this.series);
									},
									click: function () {
										console.log('series clicked', this.series);
									},
								},
							},
						},
					}
				: config.plotOptions;

			let _config = {
				...config,
				chart: {
					...config.chart,
					type: 'column',
					...(groupedXAxis ? { marginBottom: 120 } : {}),
				},
				plotOptions: plotOptionsForChart,
				xAxis: {
					...config.xAxis,
					categories: xCategories,
				},
				yAxis: yAxisForParam,
				series: toSelectObj,
				title: {
					text: selParam.toLocaleUpperCase(),
					style: {
						fontFamily: 'Archivo',
						fontSize: '1.1rem',
						fontWeight: 'normal',

						color: '#dcd9d9',
					},
				},
			};
			console.warn(_config, '_config in customcharts for ' + selParam);
			allConfigs.push({
				name: selParam,
				config: _config,
			});
		});
		return allConfigs;
	});

	let handleTaxonItemsChange = (value) => {
		taxonItems.forEach((d) => {
			if (value.includes(d.value)) {
				d.selected = true;
			} else {
				d.selected = false;
			}
		});
		console.warn(selTaxonNames, 'selTaxonNames in handleTaxonItemsChange');
	};

	let handleShowStatsClick = (d) => {
		console.log('handleShowStatsClick', d);
		if (activeStore.showStatsArray.includes(d)) {
			activeStore.showStatsArray = activeStore.showStatsArray.filter((d2) => d2 !== d);
		} else {
			activeStore.showStatsArray.push(d);
		}
	};
</script>

<div class="grid grid-cols-1 gap-1">
	<div class="text-sm p-3 ml-0 rounded-md bg-gray-300 m-2 w-fit text-center">


		{#if selectedTaxonItems && selectedTaxonItems.length > 0}
			{@html selectedTaxonItems
				.map((d) => {
					return `<span style="border-radius: 4px;background-color:${d.color};color:white;padding:7px">${d.label}</span>`;
				})
				.join(' ')}
		{:else}
			No taxons selected
		{/if}


	</div>
</div>
{#if fromMap}
<div class="flex flex-row gap-2">

{#each ['richness','abundance','shannon'] as d	}
{@const name=d}
	{@const selClass=activeStore.showStatsArray.includes(d)}
		<Button onclick={()=>handleShowStatsClick(d)} class="cursor-pointer {selClass ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white opacity-50'}">{name}</Button>
	{/each}
</div>


{/if}
<!-- allConfigs.push({
                name:selParam,
                config:_config
            }); -->
<div class="{fromMap ? 'flex flex-col gap-1 bg-red-500' : 'grid gap-2'}">
	{#if derivedConfig && derivedConfig.length > 0 && selectedTaxonItems.length > 0}


		<div
			class="{fromMap
				? 'flex w-full flex-row gap-2'
				: 'grid gap-2'}"
		>
		{#if fromMap}
			{#each derivedConfig as item,index}


			{@const inShowStatsArray=activeStore.showStatsArray.includes(item.name.toLowerCase())}
			<!-- {#if (fromMap && inShowStatsArray)} -->
				<div
					class="text-center min-w-0 bg-gray-100 rounded-md p-1 outline-1 outline-gray-300 {fromMap
						? 'flex-1 basis-0 m-1'
						: 'm-3'}"
				>
				{inShowStatsArray} {item.name}
					<div
						use:highcharts={item.config}
						class="chart-container rounded-md"
						style="width: 100%; height: {type == 'plots' ? '150px' : '250px'}"
					></div>
				</div>
			<!-- {/if} -->
			{/each}
			{:else}
			{#each derivedConfig as item,index}
			{#if index === 0}
				 {JSON.stringify(item)}
			{/if}
			<div
				class="text-center min-w-0 bg-gray-100 rounded-md p-1 outline-1 outline-gray-300"
			>
				<div
					use:highcharts={item.config}
					class="chart-container rounded-md"
					style="width: 100%; height: {type == 'plots' ? '150px' : '250px'}"
				></div>
			</div>
			{/each}
			{/if}
		</div>

	{:else}
		<div class="text-sm p-5 bg-gray-100 rounded-md">No taxons selected</div>
	{/if}
</div>
