<script>
	//THIS JUST PLOTS LEFT LATERAL SIDENAV

	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	//@ts-nocheck

	let { SidenavIconsData, activeItem } = $props();


	import TaxSearchSpeciesTest from './TaxSearchComponentsTest/TaxSearchSpeciesTest.svelte';

	import SidebarTableFilteredInfo from './SidebarTableFilteredInfo.svelte';

	import LegendTest from './GeoAnalysis/GeoAnalysisLegend/Legend.svelte';
	console.log(SidenavIconsData);
	console.log('activeItem from groupcontents', activeItem);

	import { runeStore } from '$lib/stores/svelte5_stores/RunesStore.svelte.js';
import {watch,resource} from 'runed';



	let visitedComponents = runeStore.visitedComponents;

	$effect(() => {
		if (activeItem && activeItem.id) {
			visitedComponents.add(activeItem.id);
			console.log(
				`Added ${activeItem.id} to visitedComponents: ${[...visitedComponents]}`
			);
		}
	});

	$effect(() => {
		// This creates a reactive dependency on the Set's size but in fact does not work
		//neither does the derivved
		const currentSize = runeStore.visitedComponents.size;
		console.log(
			'runeStore.visitedComponents',
			runeStore.visitedComponents,
			currentSize
		);

		if (currentSize > 0) {
			console.log(
				'visitedComponents from runeStore in sidebarlateralgroupcontents',
				runeStore.visitedComponents
			);
		}
	});

	let derivedIconsData = $derived(SidenavIconsData.navMain);
</script>


	{#each derivedIconsData as item, i (item.title)}
		<div
			class="flex min-h-0 w-full flex-1 flex-col"
			class:hidden={activeItem.id !== item.id}
		>
			{#if activeItem?.id === item.id || visitedComponents.has(item.id)}
				<div class="flex min-h-0 flex-1 flex-col" class:sel={activeItem?.id == item.id}>
					{#if item.id == 'table'}
						<div class="SidebarTableFilteredInfo_container">

							<SidebarTableFilteredInfo type="list" {visitedComponents} />
						</div>
					{/if}

					{#if item.id == 'search-species-test'}
						<TaxSearchSpeciesTest />
					{/if}

					{#if item.id == 'legend_test'}
						<LegendTest />
					{/if}
				</div>
			{/if}
		</div>
	{/each}

