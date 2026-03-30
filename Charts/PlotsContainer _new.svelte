<script>
import * as Tabs from '$lib/components/ui/tabs/index.js';
import { _chartStores as chartStores } from '../../chartStores.svelte.js';
import { _chartStoresMap as chartStoresMap } from '../../chartStores.svelte.js';
import PlotsChart from './PlotsChart.svelte';
import TableData from '../Table/TableData.svelte';
let {fromMap} = $props();


import CustomPlotsCharts from '../Charts/CustomPlotsCharts.svelte';
let this_store=$derived(fromMap ? chartStoresMap : chartStores);
let params=$derived(this_store.plotsParams);
let activeChartsTab = $derived(params.activeChartsTab);

    let byBiennio = $state(params.byBiennio);
    let showTables = $state(params.showTables);

    let selectedTaxonItems = $state(params.taxons);
    let selectedParametersItems = $state(params.parameters);
    let selGeoElemCodes = $state(params.plots);

    let necessaryParams = $derived.by(() => {
        return params.taxons.length > 0 && params.plots.length > 0 && params.parameters.length > 0
    });

    // Create a reactive key that changes only when visualization parameters change
	// This will force chart re-render ONLY when these specific params change
	let chartKey = $derived.by(() => {
		return JSON.stringify({
			taxons: this_store.taxons,
			plots: this_store.plots,
			parameters: this_store.parameters,
			byBiennio: this_store.byBiennio,
		});
	});
</script>
<!-- 	{#if !necessaryParams}
<div class="z-10 w-full h-screen bg-black/80 rounded-md">
	<div class="w-full h-full flex items-center justify-center p-2">
		<div class="text-center w-90">
			<h1 class="text-3xl text-white font-bold">No charts to display. Some necessary filters are missing</h1>
		</div>
	</div>
</div>
{/if} -->
{JSON.stringify(params)}
<div class="mt-2">
	<div class="flex flex-col gap-6">
		<Tabs.Root
			value={activeChartsTab}
			onValueChange={(value) => {
				console.log('Charts sub-tab changed to:', value);
				activeChartsTab = value;
				this_store.setPlotsParams({activeChartsTab:value});
			}}
		>
			<Tabs.List>
				<Tabs.Trigger value="charts_taxon"
					>Grouped by taxon</Tabs.Trigger
				>
				<Tabs.Trigger value="charts_geo"
					>Grouped by geodata</Tabs.Trigger
				>
				<Tabs.Trigger value="table">Table</Tabs.Trigger>
			</Tabs.List>
		<Tabs.Content value="charts_taxon">
			{#key chartKey}
				<PlotsChart/>
			{/key}

		</Tabs.Content>
		<Tabs.Content value="charts_geo">
			<CustomPlotsCharts  />
		</Tabs.Content>
		<Tabs.Content value="table">
			Charts table
			{#key chartKey}
				<TableData type="plots"/>
			{/key}
		</Tabs.Content>
		</Tabs.Root>
	</div>
</div>