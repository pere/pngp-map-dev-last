<script>
	import * as Accordion from "$lib/components/ui/accordion/index.js";
import { SvelteSet, SvelteMap } from 'svelte/reactivity';
import * as Select from '$lib/components/ui/select/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import highcharts from '$lib/components/myCharts/highcharts.js';
	import { watch } from 'runed';
	import { browser } from '$app/environment';
	import config from './customConfig.js';
	import names from '../info/names.json';

	import { _chartStores, _chartStoresMapWithoutBiennio as _chartStoresMapWithoutBiennio,_chartStoresMapWithBiennio as _chartStoresMapWithBiennio } from '../../chartStores.svelte.js';

	import plotsDataTaxonGeneral from '../used_json/plots_general_taxon.json';
	import plotsDataTaxon from '../info/plots/plots_taxa.json';

	let type = 'plots';

	let { fromMap ,byBiennio } = $props();

	/* let { fromMap = false, activeStore } = $props(); */



	//let mouseoverPlot = $state(null);


	//let activeStore = $derived(fromMap ? chartStoresMap : chartStores);


	//let byBiennio = $derived.by(() => (fromMap) ? false : this_store.byBiennio);


	let activeStore = $derived(
		fromMap ? (byBiennio ? _chartStoresMapWithBiennio : _chartStoresMapWithoutBiennio) : _chartStores
	);

	/** Same as PlotsContainer: subscribe to `setPlotsParams` / `_updateKey` on the store this instance uses. */
	let activeStoreParams = $derived.by(() => {
		if (!fromMap) {
			void _chartStores._updateKey;
			return _chartStores.plotsParams;
		}
		if (byBiennio) {
			void _chartStoresMapWithBiennio._updateKey;
			return _chartStoresMapWithBiennio.plotsParams;
		}
		void _chartStoresMapWithoutBiennio._updateKey;
		return _chartStoresMapWithoutBiennio.plotsParams;
	});

	let reactiveData = $derived.by(() => {
		return byBiennio
			? plotsDataTaxon.withBiennio.map(d=>({...d,valley_code:names.valleys.find(v=>v.plots.includes(d.geocode))?.value}))
			//.filter(d=>selValleys.includes(d.geocode))
			: plotsDataTaxon.withoutBiennio.map(d=>({...d,valley_code:names.valleys.find(v=>v.plots.includes(d.geocode))?.value}))
		//valleyDataTaxon : valleyDataTaxonGeneral;
	})

	$effect(() => {
		console.log('reactiveData', reactiveData);
		if (fromMap) {
			console.log(activeStoreParams, 'activeStoreParams');
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
			.filter((d) => activeStoreParams.taxons.map((d) => d.value).includes(d.value))
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

	/**
	 *
	 * const { grouped, flatOrder } = buildGroupedPlotCategories(
					derivedGroups.data,
					names.plots_valleys
				);
	 * Nested `xAxis.categories` for the Black Label grouped-categories plugin
	 * (registered in `$lib/components/myCharts/highcharts.js`).
	 * @param {Array<{ code: string, valley_code?: string, data: unknown[] }>} rows
	 */
	 function buildGroupedPlotCategories(rows, plotsValleys) {
		console.log('buildGroupedPlotCategories', rows, plotsValleys);
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
		console.log('valleyToPlots', valleyToPlots);
		console.log('valleyOrder', valleyOrder);
		const grouped = valleyOrder.map((vc) => {
			const label =
				plotsValleys.find((d) => d.valley_code === vc)?.valley_name ?? vc;
			return { name: label, categories: valleyToPlots.get(vc) };
		});
		const flatOrder = grouped.flatMap((g) => g.categories);
		console.log('grouped', grouped);
		console.log('flatOrder', flatOrder);
		return { grouped, flatOrder };
	}

		/** Selected valley codes — Bits UI `type="multiple"` binds `string[]`, not full objects. */
		let valleySelectValue = $state(names.valleys.map((d) => d.value));
		console.log(names.plots_valleys.filter(d=>d.valley_code==='gran_piano').map(d=>d.plot_code))


/** Mirrors selection for templates / logic: `selected` stays in sync with `valleySelectValue`. */
let initValleys = $derived(
	names.valleys.map((d) => ({
	...d,
		selected: valleySelectValue.includes(d.value),

}))
);

let selValleys=$derived.by(()=>initValleys.filter(d=>d.selected));
let selPlots=$derived.by(()=>selValleys.flatMap(d=>d.plots));
	//let selParam='richness';
	//const taxons = ['u', 'o', 'l', 'r', 'c', 'f', 's'];

	let derivedGroups = $derived.by(() => {
		console.log('reactiveData', reactiveData,selValleys);

		return reactiveData.
		filter(d=>selValleys.map(v=>v.value).includes(d.valley_code)).
		reduce(
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
		config.chart.type='column';
		config.chart.backgroundColor='#bdc1c6';

		let allConfigs = [];
		['richness','abundance','shannon'].forEach((p) => {
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


			let xCategories_test;
			let plotRowsOrdered = derivedGroups.data;
			const { grouped, flatOrder } = buildGroupedPlotCategories(
					derivedGroups.data,
					names.plots_valleys
				);

				xCategories_test = grouped;
				const byCode = Object.fromEntries(
					derivedGroups.data.map((r) => [r.code, r])
				);


				let total_length=xCategories_test.reduce((acc,d)=>acc+d.categories.length,0);
				let flatXCategories=xCategories_test.flatMap(d=>d.categories);

				config.xAxis.plotBands=xCategories_test.map((d,i)=>{
					let firstEl=d.categories[0];
					let lastEl=d.categories[d.categories.length-1];
					return {
						color: (i===0 || i%2===0) ? '#00c00040' : '#e0e0e040',
						from: i===0 ? -1 : flatXCategories.findIndex(d=>d===firstEl)-0.5,
						to: flatXCategories.findIndex(d=>d===lastEl)+0.3,
						label: {
							text: d.name.toUpperCase(),

							align: "center",
							verticalAlign: "bottom",
							y: 30, // pushes label below the month labels
							style: {  color: "#555", fontSize: ".8rem" },
						},
					}
				});

				plotRowsOrdered = flatOrder.map((code) => byCode[code]).filter(Boolean);

			let xCategories = derivedGroups.data.map((d) => d.code);
			//each geocode
			let configData = derivedGroups.data.reduce((acc, d) => {
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

			if (fromMap) {
               config.plotOptions.series={...config.plotOptions.series,point:{
				events:{
					mouseOver:function(){

						console.log('mouseOversss',this);
						activeStore.mouseoverPlot=this.category;
					},
					mouseOut:function(){
						console.log('series mouseout', this.series);
					},
					click:function(){
						console.log('series clicked', this.series);
					}
				}
			}};

			}
			config.xAxis.groupedOptions= [
{

            style: {
				fontSize: '10px',

                color: 'blue', // set red font for labels in 1st-Level
				align: 'right',
				rotation: -45,

            }
        }, {
            rotation: -45, // rotate labels for a 2nd-level
            align: 'right'
        }

				]

			config.xAxis.labels=   {

        rotation: 0 ,

				text:null,
				style: {

							color: 'white',

							fontSize: '.6rem',
							fontFamily: 'Lato',
							textTransform: 'uppercase',
						},
						y:15




				};

			config.xAxis.categories = xCategories_test.map(d=>{
				return {
					name: '',
					categories: d.categories,
				}
			});
			console.log('xaxis with plotBands', config.xAxis);
			config.yAxis = [
				{
					title: {
						useHTML: true,
						text:
							'<span style="color:gray; background-color:#38d99d;padding:5px;border-radius:5px;translate:-10px;">' +
							selParam.toLocaleUpperCase() +
							'</span> ',
						style: {
						/* 	color: 'black', */
							fontSize: '.9rem',
							fontFamily: 'Lato',
						},
					},
					labels: {
						useHTML: true,
						id: selParam,
						style: {
							color: 'black',
							fontSize: '.7rem',
							fontFamily: 'Lato',
						},
					},
				},
			];

			//[0].title.text='<span style="color:#1e946f">'+selParam+'</span> ';
			/* config.yAxis[1].title.text='<span style="color:#f0b100">Abundance</span> '; */

			let _config = {
				...config,
				series: toSelectObj,
				title: {
					text:null,
					// selParam.toLocaleUpperCase(),
					style: {
						fontFamily: 'Lato',
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
		const cur = activeStore.showStatsArray;
		if (cur.includes(d)) {
			activeStore.showStatsArray = cur.filter((d2) => d2 !== d);
		} else {
			activeStore.showStatsArray.push(d);
		}
	};




</script>





<div class="grid grid-cols-1 gap-1">



		{#if !fromMap}
		<div class="text-sm p-3 ml-0 rounded-md bg-gray-300 m-2 w-fit text-center">
			{#if selectedTaxonItems && selectedTaxonItems.length > 0}
				{@html selectedTaxonItems
					.map((d) => {
						return `<span style="border-radius: 4px;background-color:${d.color};color:white;padding:7px">${d.label}</span>`;
					})
					.join(' ')}
			{/if}


		</div>
		{:else}
		<div class="text-xs cursor-pointer p-1 ml-1 rounded-sm bg-gray-300 m-1 w-fit text-center  border border-gray-500   hover:border-gray-700">
		<Accordion.Root type="single" onclick={(e) => e.stopPropagation()}>
			<Accordion.Item value="item-1">
			  <Accordion.Trigger class=" m-1 p-0.5 hover:cursor-pointer">Filter chart</Accordion.Trigger>
			  <Accordion.Content>
			  <div class="flex flex-row gap-1 justify-baseline items-baseline">
			  <div>
				<Select.Root type="multiple" bind:value={valleySelectValue}>
					<Select.Trigger class="w-32">
						<span>Select a valley</span>
					</Select.Trigger>
					<Select.Content>
						{#each initValleys as valley (valley.value)}
							<Select.Item value={valley.value}>
								{valley.label}
								<!-- <span class="text-muted-foreground text-xs">
									({valley.selected ? 'selected' : 'not selected'})
								</span> -->
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
			<div>
				<div class="ml-3  p-1 border border-gray-300 rounded-sm flex flex-row gap-2">

					{#each ['richness','abundance','shannon'] as d	}
					{@const name=d}
						{@const selClass=activeStore.showStatsArray.includes(d)}
							<Button onclick={()=>handleShowStatsClick(d)} class="p-1 text-xs cursor-pointer {selClass ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white opacity-50'}">{name}</Button>
						{/each}
					</div>
			</div>
				</div>
			  </Accordion.Content>
			</Accordion.Item>
		  </Accordion.Root>


		</div>
	{/if}


</div>


<!-- allConfigs.push({
                name:selParam,
                config:_config
            }); -->

<div class="bg-white {fromMap ? 'flex flex-col gap-1 ' : 'grid gap-2'}">


	{#if derivedConfig && derivedConfig.length > 0 && selectedTaxonItems.length > 0}


		<div
			class="{fromMap
				? 'flex w-full flex-row gap-2'
				: 'grid gap-2'}"
		>
		{#if fromMap}
			{#each derivedConfig as item,index}


			{@const inShowStatsArray=activeStore.showStatsArray.includes(item.name.toLowerCase())}
			 {#if fromMap && inShowStatsArray}
				<div
					class="text-center min-w-0 bg-gray-300 rounded-md p-1 outline-1 outline-gray-300 {fromMap
						? 'flex-1 basis-0 m-1'
						: 'm-3'}"
				>

					<div
						use:highcharts={item.config}
						class="chart-container rounded-md"
						style="width: 100%; height: {type == 'plots' ? '150px' : '250px'}"
					></div>
				</div>
			{/if}
			{/each}
			{:else}
			{#each derivedConfig as item,index}

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
<style>
	:global(.highcharts-axis.highcharts-xaxis) {
  display: none !important;
}
:global(.highcharts-xaxis-labels path) {
  display: none;
  /* or: stroke: none; */
}

:global(.highcharts-axis-title) {
	color: white!important;
	translate:-5px 0px!important;
}
</style>
