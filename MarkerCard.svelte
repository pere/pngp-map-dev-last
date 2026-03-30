<script>
	import * as Card from '$lib/components/ui/card/index.js';
	import FilterIcon from '@lucide/svelte/icons/funnel-plus';
	import ArrowRightLeftIcon from '@lucide/svelte/icons/arrow-right-left';
	import * as Table from '$lib/components/ui/table/index.js';
	import parkInfoWithoutBiennio from './info/park_no_biennio.json';
	import parkInfoBiennio from './info/parkBiennio.json';
	import valley_general_taxon from './info/valley/valley_general_taxon.json';
	import valley_taxon_biennio from './used_json/valley_taxon_biennio.json';
	import names from './info/names.json';
	import { watch } from 'runed';
	/* import { mapMarkerCardShared } from './mapMarkerCardShared.svelte.js'; */

	/**
	 * Per-valley only — tab/taxon/visibility come from shared state (see Map / MapBiennio `mount`).
	 * Pass `cardShared` from MapBiennio so it does not read the general-map store.
	 */
	let {
		valleyCode,
		onclick = () => {},
		cardShared
	} = $props();

	let type = $derived(cardShared.tabType);
	let selTaxonShort = $derived(cardShared.selTaxonShort);
	let markerVisible = $derived(cardShared.markerVisible);
	let withBiennio = $derived(cardShared._interface==='withBiennio'?true:false);

	let parkInfo = $derived(withBiennio?parkInfoBiennio:parkInfoWithoutBiennio);

	let rootEl = $state(null);
	let statsParkVisible = $state(false);

	let parkData = parkInfo.map((d) => {
		return {
			...d,
		shortName:(()=>{
			console.log('d', d);

			if (d.taxon!=='all'){
				return d.taxon.charAt(0);
			} else {
				return 'all';
			}
		})()}
	});
	console.log('parkData', parkData);

	watch(()=>statsParkVisible,(curr,prev)=>{

		let parkStats = rootEl?.querySelector('.park-stats');
		console.log('rootEl', rootEl,curr,prev);
		if (curr){

			//find only park-stats elements in current element
			//query only inside this component
			//const parkStats = document.querySelectorAll('.park-stats');

			console.log('parkStats with current', parkStats);
			if (parkStats){
				parkStats.classList.remove('hidden');
			}
			console.log('statsParkVisible changed to', curr,!statsParkVisible);
		} else {
			console.log('parkStats no current', parkStats);
			if (parkStats){
				parkStats.classList.add('hidden');
			}
		}
	});
	let data=$derived.by(() => {

		if (withBiennio) {
			return valley_taxon_biennio.filter((d) => d.geocode === valleyCode);
		} else {
			return valley_general_taxon.find((d) => d.geocode === valleyCode);
}
	})



	//remove first element
	//reduced_data_biennio.shift();
	console.log('dsssata', data, valleyCode,withBiennio);


	let taxonShorts = names.taxons.map((d) => d.value);

	let paramName = names.parameters.find((d) => d.value === type)?.label;
</script>

<button
	{onclick}
	class="{type} {markerVisible ? 'block' : 'hidden'} marker-card-button"
	bind:this={rootEl}
>
	<Card.Root
		class="bg-zinc-800 text-gray-100 shadow-lg hover:shadow-xl transition-all pb-2 duration-200 hover:-translate-y-1"
	>
		<Card.Header class="pb-1"

		>
			<Card.Title class="flex items-center font-light text-sm">

				<!-- <FilterIcon class="hover:stroke-fuchsia-400 stroke-2 w-4 h-4 transition-colors" /> -->
			<div class="flex w-2/3">	{names.valleys.find((d) => d.value === valleyCode)?.label} {type}</div>
			<button  class="p-2 bg-fuchsia-300 w-1/3 ml-auto cursor-pointer hover:text-fuchsia-400 statsParkVisibleBtn"
			onclick={()=>{
				statsParkVisible = !statsParkVisible;
			}}
			><ArrowRightLeftIcon

			class="w-4 h-4" /></button>
			</Card.Title>
		</Card.Header>
		<Card.Content class="pb-0 font-light">
		{#if !withBiennio}
			<Table.Root class="text-xs p-1 ml-0">
				<Table.Header>
					<Table.Row class="">
						<Table.Head class="mt-1 pt-1 text-white text-center"></Table.Head>
						<Table.Head class="mt-1 pt-1 text-white text-center">Valley</Table.Head>
						<Table.Head class="mt-1 pt-1 text-white text-center {statsParkVisible ? '' : 'hidden'}">Park</Table.Head>

					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each taxonShorts as taxonShort}
						{@const param =
							taxonShort === 'all' ? 'all_' + type : taxonShort + '_' + type}
						{@const taxName = names.taxons.find(
							(t) => t.value === taxonShort
						)?.label}
						{@const ParkParam = type}

						{@const ParkValue = parkData.find((d) => d.shortName === taxonShort)?.[ParkParam] ?? 0}
						<Table.Row class="text-center">
							<Table.Cell class="{taxonShort} mt-1 pt-1 {selTaxonShort ===
					taxonShort
						? 'highlighted'
						: ''}">{taxName}</Table.Cell>
							<Table.Cell class="mt-1 pt-1 ">{data[param]}</Table.Cell>

						<!-- {#if statsParkVisible} -->

							<Table.Cell class="mt-1 pt-1 {statsParkVisible ? '' : 'hidden'}">{ParkValue?ParkValue:'empty?'}</Table.Cell>
						</Table.Row>
						<!-- {/if} -->
					{/each}
				</Table.Body>
			</Table.Root>
			{/if}
			{#if withBiennio}
			<Table.Root class="text-xs p-1 ml-0">
				<Table.Header>
					<Table.Row class="">
						<Table.Head class="mt-1 pt-1 text-white text-center"></Table.Head>
						<Table.Head class="mt-1 pt-1 text-white text-center">Biennio</Table.Head>
						<Table.Head class="mt-1 pt-1 text-white text-center">Valley</Table.Head>
						<Table.Head class="mt-1 pt-1 text-white text-center {statsParkVisible ? '' : 'hidden'}">Park</Table.Head>

					</Table.Row>
				</Table.Header>
				<Table.Body>

					{#each taxonShorts as taxonShort, index (taxonShort)}
						{@const firstTaxonShort = index === 0}

						{@const param =
							taxonShort === 'all' ? 'all_' + type : taxonShort + '_' + type}
						{@const taxName = names.taxons.find(
							(t) => t.value === taxonShort
						)?.label}



						{@const ParkValue = parkData.filter((d) => d.shortName === taxonShort) ?? []}



						{#each data as valleyObj (valleyObj.u_biennio)}
							{@const biennio = valleyObj.u_biennio}
							{@const ParkObj = ParkValue.find((d) => d.biennio === biennio)}

							<Table.Row class="pointer-events-none text-center {biennio===1?'border-0':'border-b-1'}">

								{#if biennio===1}
									<Table.Cell rowspan="2" class=" {taxonShort} mt-0 pt-0 {selTaxonShort ===taxonShort? 'highlighted': ''}">
										{ biennio===1?taxName:''}
									</Table.Cell>
								{/if}
								<Table.Cell class="mt-0 pt-0 ">{biennio} </Table.Cell>
								<Table.Cell class="mt-0 pt-0 ">{valleyObj[param]}</Table.Cell>

								{#if statsParkVisible}
									<Table.Cell class="mt-0 pt-0 ">{ParkObj?ParkObj[type]:'N/A'}</Table.Cell>

								{/if}

							</Table.Row>

						{/each}

						<!-- {#each ParkValue as ParkObj (ParkObj.biennio)}

						<Table.Row class="text-center">
							<Table.Cell class="{taxonShort} mt-1 pt-1 {selTaxonShort ===taxonShort? 'highlighted': ''}">{taxName}</Table.Cell>
							<Table.Cell class="mt-1 pt-1 ">{ParkObj.biennio}</Table.Cell>
							<Table.Cell class="mt-1 pt-1 ">{ParkObj[type]}</Table.Cell>



							<Table.Cell class="mt-1 pt-1 {statsParkVisible ? '' : 'hidden'}">{ParkValue?ParkValue:'empty?'}</Table.Cell>
						</Table.Row>
						{/each} -->
						<!-- {/if} -->
					{/each}
				</Table.Body>
			</Table.Root>
			{/if}
		</Card.Content>
		<!--         <Card.Footer class="pt-2 pb-3 text-xs text-gray-500 flex items-center gap-1">
            <span>Click to filter</span>
        </Card.Footer> -->
	</Card.Root>
</button>

<style>
	.marker-card-button {
		all: unset;
		cursor: pointer;
		display: block;
	}

	:global(.marker-card-button table td) {
		padding:0.1rem!important
	}
	:global(.marker-card-button table th) {
		font-weight: thin!important;
	}
	.hidden {
		display: none;
	}
	.highlighted {
		background-color: #7bc815;
		color: white;
	}
</style>
