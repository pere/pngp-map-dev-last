<script>
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	/* import { _chartStores as chartStores, _chartStoresMap as chartStoresMap } from '../../chartStores.svelte.js'; */
	import { _chartStoresMapWithoutBiennio as _chartStoresMapWithoutBiennio, _chartStoresMapWithBiennio as _chartStoresMapWithBiennio,_chartStores as chartStores } from '../../chartStores.svelte.js';
	import PlotsChart from './PlotsChart.svelte';
	import TableData from '../Table/TableData.svelte';
import { watch } from 'runed';
	import CustomPlotsCharts from '../Charts/CustomPlotsCharts.svelte';
	//let activeStore=$derived(chartStores.plotsParams);
	let { fromMap, byBiennio } = $props();

	/** `byBiennio` is a boolean from `<PlotsContainer byBiennio={true} />` — do not compare to the string `'true'`. */
	let activeStore = $derived(
		fromMap ? (byBiennio ? _chartStoresMapWithBiennio : _chartStoresMapWithoutBiennio) : chartStores
	);

	/** Subscribe to `setPlotsParams` / `_updateKey` on the store this instance uses (no `_updateKey` prop needed). */
	let activeStoreParams = $derived.by(() => {
		if (!fromMap) {
			void chartStores._updateKey;
			return chartStores.plotsParams;
		}
		if (byBiennio) {
			void _chartStoresMapWithBiennio._updateKey;
			return _chartStoresMapWithBiennio.plotsParams;
		}
		void _chartStoresMapWithoutBiennio._updateKey;
		return _chartStoresMapWithoutBiennio.plotsParams;
	});

	// Watch a *value* that changes (e.g. `plots`), not `activeStore` — the object reference is stable.
	watch(
		() => activeStoreParams.plots,
		(curr, prev) => {
			console.log('plots params changed', { prev, curr });
		},
	);

	let activeChartsTab = $derived(activeStoreParams.activeChartsTab);

		// Create a reactive key that changes only when visualization parameters change
		// This will force chart re-render ONLY when these specific params change
		let chartKey = $derived.by(() => {
			const p = activeStoreParams;
			if (!fromMap) {
				return JSON.stringify({
					taxons: p.taxons,
					plots: p.plots,
					parameters: p.parameters,
					byBiennio: p.byBiennio,
				});
			}
			const mapStore = byBiennio ? _chartStoresMapWithBiennio : _chartStoresMapWithoutBiennio;
			return JSON.stringify({
				taxons: p.taxons,
				plots: p.plots,
				parameters: p.parameters,
				byBiennio: p.byBiennio,
				showStatsArray: mapStore.showStatsArray,
			});
		});


		let showTables = $state(false);

		let selectedTaxonItems = $state(['all']);
		let selectedParametersItems = $state(['richness']);
		let selGeoElemCodes = $state(['all']);

		let necessaryParams = $derived.by(() => {
			return activeStoreParams.taxons.length > 0 && activeStoreParams.plots.length > 0 && activeStoreParams.parameters.length > 0
		});
	</script>
		{#if !necessaryParams && !fromMap}
	<div class="z-10 w-full h-screen bg-black/80 rounded-md">
		<div class="w-full h-full flex items-center justify-center p-2">
			<div class="text-center w-90">
				<h1 class="text-3xl text-white font-bold">No charts to display. Some necessary filters are missing</h1>
			</div>
		</div>
	</div>
	{/if}



	{#if !fromMap}
	<div class="mt-2 p-2">

		<div class="flex flex-col gap-6">
			<Tabs.Root
				value={activeChartsTab}
				onValueChange={(value) => {
					console.log('Charts sub-tab changed to:', value);
					activeStore.setPlotsParams({ activeChartsTab: value });
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
	{:else}
	<div class="mt-2">

		{#key chartKey}


		<CustomPlotsCharts fromMap=true byBiennio={byBiennio}/>
				{/key}
	</div>
	{/if}
