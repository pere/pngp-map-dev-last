<script>
import * as Tabs from '$lib/components/ui/tabs/index.js';
import { _chartStores as chartStores } from '../../chartStores.svelte.js';
import ValleysChart from './ValleysChart.svelte';
import CustomValleyCharts from '../Charts/CustomValleyCharts.svelte';
import names from '../info/names.json';
import { watch } from 'runed';
let this_store=$derived.by(()=>chartStores.valleysParams);

    let activeChartsTab = $derived(this_store.activeChartsTab);


	// Create a reactive key that changes only when visualization parameters change
	// This will force chart re-render ONLY when these specific params change
	let chartKey = $derived.by(() => {
		return JSON.stringify({
			taxons: this_store.taxons,
			valleys: this_store.valleys,
			parameters: this_store.parameters,
			byBiennio: this_store.byBiennio,
		});
	});
	let necessaryParams = $derived.by(() => {
		return this_store.taxons.length > 0 && this_store.valleys.length > 0
	});

    let byBiennio = $state(true);
    let showTables = $state(false);

    let selectedTaxonItems = $state(['all']);
    let selectedParametersItems = $state(this_store.parameters);

	    watch(()=>selectedParametersItems,()=>{
       chartStores.valleysParams={...chartStores.valleysParams, parameters:selectedParametersItems};
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
    let selGeoElemCodes = $derived(this_store.valleys);
/* 	watch(()=>selectedParametersItems,(curr,prev)=>{

		chartStores.valleysParams={...chartStores.valleysParams, parameters:selectedParametersItems};
	}); */
</script>


		{#if !necessaryParams}
<div class="z-10 w-full h-screen bg-black/80 rounded-md">

	<div class="w-full h-full flex items-center justify-center p-2">
		<div class="text-center w-90">
			<h1 class="text-3xl text-white font-bold">

				No charts to display. Some necessary filters are missing</h1>
		</div>
	</div>
</div>
{/if}
<div class="mt-2">


	<div class="flex flex-col gap-6">
		<Tabs.Root
			value={activeChartsTab}
			onValueChange={(value) => {
				console.log('Charts sub-tab changed to:', value);
				activeChartsTab = value;
				chartStores.setValleysParams({activeChartsTab:value});
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
			<div class="max-w-[350px] rounded-md border p-2">
				<div class="params-selection flex flex-wrap gap-1 p-1 text-xs">

					{#each derivedParameters as v}
					{@const selected = v.selected}
						<button style="background-color: {v.color}" class="hover:cursor-pointer flex border rounded-md p-2 items-center justify-center {selected ? 'active':''}" onclick={()=>{
							if (v.selected) {

								selectedParametersItems = selectedParametersItems.filter((d) => d !== v.value);
							} else {

								selectedParametersItems = [...selectedParametersItems, v.value];
							}
						}}>
						{v.label}</button>
					{/each}
				</div>
			</div>

			{#key chartKey}
				<ValleysChart />
			{/key}


		</Tabs.Content>
		<Tabs.Content value="charts_geo">

			<CustomValleyCharts  />
		</Tabs.Content>
		<Tabs.Content value="table">

			<!--{#key key}
				<TableData {type} {data} />
			{/key}-->
		</Tabs.Content>
		</Tabs.Root>
	</div>

</div>
<style>
	.params-selection button
	{
		color:white;
		opacity: .4;
	}
	.params-selection button.active {

		color: #fff;
		opacity: 1;
	}
	.params-selection button:hover {
		background-color: #a31010;
		color: #fff;
	}
</style>