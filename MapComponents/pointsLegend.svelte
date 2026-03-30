<script>
	//@ts-nocheck
	//@ts-ignore
	/* eslint-disable svelte/a11y-aria-attributes */
	import { base } from '$app/paths';
	import { get } from 'svelte/store';
	import {
		filteredTaxInputStore,
		selGrid,
	} from '$lib/stores/new_sidebar_stores.js';
	import { runeStore } from '$lib/stores/svelte5_stores/RunesStore.svelte.js';
	/* import MapFilters from './mapFilters.svelte'; */
	import MapFilters4 from './MapFilters4.svelte';

	import {
		runeStoreTaxCards,
		loadingMap,
	} from '$lib/stores/svelte5_stores/RuneStoreTaxCards.svelte.js';
	let {
		symbolColor: symbolColorProp,
		map,
		showPolygons = $bindable(),
		showInatSpecies = $bindable(false)
	} = $props();
	import InatDataContainer from './InatDataContainer.svelte';
	import ChartBarIcon from '@lucide/svelte/icons/chart-bar';
	import GripIcon from '@lucide/svelte/icons/grip';
	import FilterIcon from '@lucide/svelte/icons/filter';
	import AnimalIcon from '@lucide/svelte/icons/paw-print';
	import WrenchIcon from '@lucide/svelte/icons/wrench';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import EyeOffIcon from '@lucide/svelte/icons/eye-off';
	import PaletteIcon from '@lucide/svelte/icons/palette';
	import { PanelRightCloseIcon } from 'lucide-svelte';
	import * as Menubar from '$lib/components/ui/menubar/index.js';
	import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import PointsLegendTabs from './pointsLegendTabs.svelte';
	/* import PointsLegendContent from './pointsLegendContent.svelte'; */
	import PointsLegendContentTest from './pointsLegendContentTest.svelte';
	import { draggable } from '@neodrag/svelte';
	import { browser } from '$app/environment';

	let sp_tax_counts_dbase = $state([]);

	import { parse } from 'svelte/compiler';
	import { Command } from 'bits-ui';
	import { getLayers } from '$lib/stores/mapLayers.svelte';
	import { watch } from 'runed';
	let layers = $derived(getLayers());
	import {
		reduceByClass,
		reduceByOrder,
		reduceByFamily,
		finalizeClassStats,
		reduceByTaxonomyHierarchy,
	} from '$lib/utils/taxonomyReducer.js';

	function debounce(fn, delay = 300) {
		let timeout;
		return (...args) => {
			clearTimeout(timeout);
			timeout = setTimeout(() => fn(...args), delay);
		};
	}

	let viewCardsAs = $state('simple');
	let selectedToggleGroupItem = $state('species_list');
	let showStats = $state(false);
	let showFilters = $state(false);
	let showSpeciesOptions = $state(true);
	let showSpContainer = $state(true);
	console.log('symbolColorProp', symbolColorProp);

	let palette = symbolColorProp.palette;
	let showSpeciesDOMElement = $state(true);
	/* let toMapObj = $derived(symbolColorProp.objects.map(d=>({...d,active:true}))); */
	let toMapObj = $derived.by(() => {
		if (
			!runeStoreTaxCards.spAddedToList ||
			runeStoreTaxCards.spAddedToList.length == 0
		)
			return [];
		if (symbolColorProp.objects?.length > 0)
			return symbolColorProp.objects.map((d) => ({ ...d, active: true }));
		else return [];
	});



	$effect(() => {
		console.log('toMapObj changed', toMapObj.length);
	});
	let pointsObj = $derived.by(() => runeStoreTaxCards.spAddedToList);
	let inatData = $state([]);

	let showInatData = $state(false);
	let showInatDataContainer = $state(false);
	//create a derived based on symbolColor.legend

	/*    $effect(()=>{
        if (symbolColor?.legend?.length>0)
        console.log('symbolColorName in pointsLegend',symbolColorName);
    }) */

	let showSpecies = $state(true);

	let derivedShowSpecies = $derived(showSpecies);
	let selGridLayer = 'pngp_grid_1km_topo';

	/* return toMapObj.reduce((acc, d) => {
			console.log('d in objGrouped',d);
			acc[d.pngp_data?.class_n] = acc[d.pngp_data?.class_n] || [];
			acc[d.pngp_data?.class_n].push(d);
			return acc;
		}, {}); */
	$effect(() => {
		console.log('showPolygons in pointsLegend', showPolygons);

							// get(selGrid);
							console.log('selGridLayer', selGridLayer);
							if (showPolygons) {
								if (map) {
									console.log('showPolygons is true');
									if (
										map.getStyle().layers.find((d) => d.id === selGridLayer)
									) {
										map.setLayoutProperty(
											selGridLayer,
											'visibility',
											'visible'
										);
										map.setLayoutProperty(
											'pngp_grid_1km_topo_outline',
											'visibility',
											'visible'
										);
										// map.moveLayer(selGridLayer);
									}
								}
							} else {
								console.log('showPolygons is false');

								if (map.getStyle().layers.find((d) => d.id === selGridLayer)) {
									map.setLayoutProperty(selGridLayer, 'visibility', 'none');
									map.setLayoutProperty(
										'pngp_grid_1km_topo_outline',
										'visibility',
										'none'
									);
								}
							}
	});

	watch(
		() => runeStoreTaxCards.paramsFilter.interface,
		(newInterface, prevInterface) => {
			console.log('🔄 paramsFilter.interface changed:', newInterface);
			console.log('🎯 About to hit debugger - paramsFilter.interface changed!');
		}
	);

	// Watch for data changes when showSpecies is false
	watch(
		() => toMapObj?.length,
		(newLength, prevLength) => {
			if (newLength==prevLength) return;

			let joinedTaxIds = toMapObj.map(d => d.tax_id).join(',');
			console.log('🔄 Data changed while joinedTaxIds is:', joinedTaxIds);
			console.log('🎯 About to hit debugger - data changed!');

			// Always update visibility based on current showSpecies state
			if (!map) {
				console.log('❌ Map not available, skipping visibility change');
				return;
			}

			if (showPolygons === true) {
				console.log('✅ showPolygons is true - showing showPolygons');
				if (map.getStyle().layers.find((d) => d.id === 'pngp_grid_1km_topo')) {
					map.setLayoutProperty('pngp_grid_1km_topo', 'visibility', 'visible');
					map.setLayoutProperty(
						'pngp_grid_1km_topo_outline',
						'visibility',
						'visible'
					);

					//map.moveLayer('pngp_grid_1km_topo');
				}
			} else {
				console.log('❌ showPolygons is false - hiding species');
				if (map.getStyle().layers.find((d) => d.id === 'pngp_grid_1km_topo')) {
					map.setLayoutProperty('pngp_grid_1km_topo', 'visibility', 'none');
					map.setLayoutProperty(
						'pngp_grid_1km_topo_outline',
						'visibility',
						'none'
					);
				}
			}

		// Fetch iNat data once if either showInatData or showInatSpecies is true
			const shouldFetchInat = (showInatData === true || showInatSpecies === true) && joinedTaxIds;

			if (showInatSpecies === true) {
				console.log('✅ showInatSpecies is true - showing iNaturalist species');
				if (map.getStyle().layers.find((d) => d.id === 'pngp_inat')) {
					map.setLayoutProperty('pngp_inat', 'visibility', 'visible');
					map.moveLayer('pngp_inat');
				}
			} else {
				console.log('❌ showInatSpecies is false - hiding iNaturalist species');
				if (map.getStyle().layers.find((d) => d.id === 'pngp_inat')) {
					map.setLayoutProperty('pngp_inat', 'visibility', 'none');
				}
			}

			if (showSpecies === true) {
				console.log('✅ showSpecies is true - showing species');
				if (map.getStyle().layers.find((d) => d.id === 'pngp_obs_simple')) {
					map.setLayoutProperty('pngp_obs_simple', 'visibility', 'visible');
					map.moveLayer('pngp_obs_simple');
				}
			} else {
				console.log('❌ showSpecies is false - hiding species');
				if (map.getStyle().layers.find((d) => d.id === 'pngp_obs_simple')) {
					map.setLayoutProperty('pngp_obs_simple', 'visibility', 'none');
				}
			}

			// Single fetch for iNat data
			if (shouldFetchInat) {
				fetch('https://pere.gis-ninja.eu/pngp_phps_new/get_inat_data.php?pngp_tax_id=' + joinedTaxIds)
					.then(response => response.json())
					.then(data => {
						console.log('inat data', data);
						inatData = data;

						showStats = false;
						showSpContainer = false;
						showFilters = false;
						showInatData = true;
						selectedToggleGroupItem='inat';
					})
					.catch(error => console.error('Error:', error));
			}
		}
	);



	function customCommandFilter(commandValue, search, commandKeywords) {
		return commandValue.includes(search) ? 1 : 0;
	}
</script>

{#if toMapObj && toMapObj.length > 0 && browser}
	<!-- Collapsed mini view -->
	<div
		class="legend-container bg-sidebar p-1 {showSpeciesDOMElement
			? 'hidden'
			: ''}"
	>
		<button
			type="button"
			class="flex flex-row items-center cursor-pointer w-full"
			onclick={() => {
				console.log('showSpeciesDOMElement', showSpeciesDOMElement);
				showSpeciesDOMElement = !showSpeciesDOMElement;
			}}
		>
			<h1>Species legend</h1>
			<div class="flex-[5%] cursor-pointer">
				<PanelRightCloseIcon size={15} class="ml-2 text-gray-600 justify-end" />
			</div>
		</button>
	</div>

	<!-- Expanded full view -->
	<div
		class="legend-container bg-sidebar  p-1 min-w-[350px]  {showSpeciesDOMElement
			? ''
			: 'hidden'}"
		use:draggable={{
			handle: '.drag-handle',
			bounds: 'parent',
			axis: 'both',

			events: {
				onDrag: (data) => {
					console.log('drag data', data);
				},
			},
		}}
	>
		<!-- Show species: {showSpecies} -->
		<!-- <h1>Legend with {symbolColorName.length} species</h1> -->
		<div
			class="legend-container-header flex  w-full justify-end gap-1 mb-1"
		>
			<button class="flex-[85%] cursor-move drag-handle p-1 text-end">
				<div class="w-full flex justify-end">
					<Tooltip.Root>
						<Tooltip.Trigger>
							<GripIcon size={15} class="text-gray-600 cursor-move" />
						</Tooltip.Trigger>
						<Tooltip.Content>
							<p>Hold and drag to move legend</p>
						</Tooltip.Content>
					</Tooltip.Root>
				</div>
			</button>

			<!-- <button
				class="map-tools-item flex-[5%] cursor-pointer p-1 justify-center {showSpeciesOptions
					? 'active'
					: ''}"
				onclick={() => {
					console.log('showSpeciesoptions', showSpeciesOptions);
					showSpeciesOptions = !showSpeciesOptions;
				}}
			>
				<Tooltip.Root>
					<Tooltip.Trigger>
						<AnimalIcon
							size={15}
							class="cursor-pointer mt-1 text-gray-600 align-center"
						></AnimalIcon>
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p>Show hide species options</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</button> -->

			<button
				class="cursor-pointer flex-[5%] justify-center"
				onclick={() => {
					console.log('showSpeciesDOMElement', showSpeciesDOMElement);
					showSpeciesDOMElement = !showSpeciesDOMElement;
				}}
			>
				<Tooltip.Root>
					<Tooltip.Trigger>
						<PanelRightCloseIcon
							size={15}
							class="cursor-pointer mt-1 text-gray-600 align-center"
						/>
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p>Show/hide</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</button>
		</div>
		{#if showSpeciesOptions}
			<div class="showSpeciesOptionsDiv flex flex-row gap-0.5 mb-2">
				<button
					class="species-option-item {showSpecies
						? 'species-option-item-selected'
						: ''}"
				>
					<input
						type="checkbox"
						onclick={() => {
							showSpecies = !showSpecies;
							if (showSpecies) {
								if (map) {
									console.log('showSpecies is true');
									if (
										map
											.getStyle()
											.layers.find((d) => d.id === 'pngp_obs_simple')
									) {
										map.setLayoutProperty(
											'pngp_obs_simple',
											'visibility',
											'visible'
										);
										map.moveLayer('pngp_obs_simple');
									}
								}
							} else {
								console.log('showSpecies is false');
								if (
									map.getStyle().layers.find((d) => d.id === 'pngp_obs_simple')
								) {
									map.setLayoutProperty(
										'pngp_obs_simple',
										'visibility',
										'none'
									);
								}
							}
						}}
						bind:checked={showSpecies}
					/>
					<label for="showSpecies">Points</label>
				</button>

				<button
					class="species-option-item {showInatSpecies
						? 'species-option-item-selected'
						: ''}"
				>
					<input
						type="checkbox"
						onclick={() => {
							showInatSpecies = !showInatSpecies;
							if (showInatSpecies) {
								if (map) {
									console.log('showSpecies is true');
									if (map.getStyle().layers.find((d) => d.id === 'pngp_inat')) {
										map.setLayoutProperty('pngp_inat', 'visibility', 'visible');
										map.moveLayer('pngp_inat');
									}
									//do an ajax call to the server to get the iNaturalist species
									if (toMapObj.length > 0) {
									fetch('https://pere.gis-ninja.eu/pngp_phps_new/get_inat_data.php?pngp_tax_id=' + toMapObj.map(d => d.tax_id).join(','))
										.then(response => response.json())
										.then(data => {

											console.log('inat data', data);
											inatData = data;

											showStats = false;
											showSpContainer = false;
											showFilters = false;
											showInatData = true;

											showInatDataContainer = true;
											selectedToggleGroupItem='inat';
										})
										.catch(error => console.error('Error:', error));
}
								}
							} else {
								console.log('showInatSpecies is false');
								if (map.getStyle().layers.find((d) => d.id === 'pngp_inat')) {
									map.setLayoutProperty('pngp_inat', 'visibility', 'none');



								}

								showInatSpecies = false;
									showInatData = false;
									showInatDataContainer = false;
									selectedToggleGroupItem='species_list';
									showStats = false;
									showSpContainer = true;
									showFilters = false;
							}
						}}
						bind:checked={showInatSpecies}
					/>
					<label for="showSpecies">iNaturalist records</label>
				</button>

				<button
					class="species-option-item {showPolygons
						? 'species-option-item-selected'
						: ''}"
				>
					<input
						type="checkbox"
						onclick={() => {
							showPolygons = !showPolygons;

						}}
						bind:checked={showPolygons}
					/>
					<label for="showPolygons">Abundance grid</label>
				</button>
			</div>
		{/if}
		<div>
			<div class="{showSpecies ? '' : 'hidden_sp'} sp_container">
				<!-- {#if derivedByTax} -->

				<Command.Root
					class="divide-border border-muted flex h-full w-full flex-col divide-y self-start overflow-hidden  border"
					filtersss={customCommandFilter}
				>
					<!-- <Command.Input
						class="mb-1 focus-override border-1  h-input placeholder:text-foreground-alt/50  focus:outline-hidden inline-flex truncate px-4 text-sm transition-colors focus:ring-0"
						placeholder="Filter..."
					/>
					<div class="text-xs w-full">Hover species to change style</div> -->
					<Command.List class="overflow-y-auto overflow-x-hidden px-0 pb-1">
						<Command.Viewport>
							<!-- 	<Command.Empty
								class="text-muted-foreground flex w-full items-center justify-center pb-6 pt-8 text-sm"
							>
								No results found.
							</Command.Empty> -->
							<div class="w-full ">
								<div class="w-full flex flex-row items-center ">
									<ToggleGroup.Root
										variant=""

										type="single"
										class=" text-start text-xs  cursor-pointer m-0.5 bg-gray-300 border-1 border-gray-400"
										bind:value={selectedToggleGroupItem}
									>
										<!-- <ToggleGroup.Item class="cursor-pointer" value="species_list" onclick={() => {
											showSpContainer = !showSpContainer;
											showStats = false;

											showFilters = false;
										}}><ChartBarIcon class="size-3" />Species list
										</ToggleGroup.Item> -->

										<ToggleGroup.Item
											class="border-r-1 border-gray-400 cursor-pointer {selectedToggleGroupItem ===
											'species_list'
												? 'toggle-group-item-selected'
												: ''}"
											value="species_list"
											onclick={() => {
												showStats = false;
												showSpContainer = true;
												showInatDataContainer = false;
												showFilters = false;
												showInatDataContainer
											}}
										>
											<AnimalIcon class="size-3 align-left" />
											<span class="align-left">Species</span>
										</ToggleGroup.Item>

										<ToggleGroup.Item
											class="cursor-pointer border-r-1 border-gray-400 {selectedToggleGroupItem === 'stats'
												? 'toggle-group-item-selected'
												: ''}"
											value="stats"
											onclick={() => {
												showStats = !showStats;
												showSpContainer = false;
												showFilters = false;

												showInatDataContainer = false;
											}}
										>
											<ChartBarIcon class="size-3 align-left" />
											<span class="align-left">Stats</span>
										</ToggleGroup.Item>
										<ToggleGroup.Item
											class="cursor-pointer border-r-1 border-gray-400 {selectedToggleGroupItem ===
											'filters'
												? 'toggle-group-item-selected'
												: ''}"
											value="filters"
											onclick={() => {
												showFilters = !showFilters;
												showStats = false;
												showSpContainer = false;
												showInatDataContainer = false;
											}}
											><FilterIcon class="size-3 align-left" />
											<span class="align-left">Filters</span>
										</ToggleGroup.Item>
										<ToggleGroup.Item
											class="{showInatData ? '' : 'hidden'} cursor-pointer  px-5 {selectedToggleGroupItem ===
											'inat'
												? 'toggle-group-item-selected'
												: ''}"
											value="inat"
											onclick={() => {
												showInatDataContainer = true;
												showStats = false;
												showSpContainer = false;
												showFilters = false;
											}}
											><FilterIcon class="size-3 align-left" />
											<span class="align-left whitespace-nowrap">iNaturalist</span>
										</ToggleGroup.Item>
									</ToggleGroup.Root>
								</div>

								<div class={showSpContainer ? '' : 'hidden'}>
									<PointsLegendContentTest {map} {toMapObj} />
								</div>
							</div></Command.Viewport
						>
					</Command.List>
				</Command.Root>
				<!-- {/if} -->

				<!-- Commented out until paramsFilter is properly imported -->
				<!--
				{#if $paramsFilter.yArrSel.length > 0}
					Data filtered by year {$paramsFilter.yArrSel.join(', ')}
				{:else}
					<div>No filter by year</div>
				{/if}
				{#if $paramsFilter.vArrSel.length > 0}
					Data filtered by valley {$paramsFilter.vArrSel.join(', ')}
				{:else}
					<div>No filter by valley</div>
				{/if}
				-->
			</div>
		</div>

		<!-- 		<div class={showSpContainer ? '' : 'hidden'}>
				<div class="flex flex-row items-center"></div>
			</div> -->
		<div class={showStats ? '' : 'hidden'}>
			<PointsLegendTabs />
		</div>
		<div class="{showFilters ? '' : 'hidden'} bg-gray-200">
			<MapFilters4 />
		</div>
		<div class="{showInatDataContainer ? '' : 'hidden'} bg-gray-200">
			<!-- {JSON.stringify(inatData)} -->
			 <InatDataContainer {map} {toMapObj} {inatData} />
			<!-- {#each inatData as d}
				<div>{d.sp_name}</div>
				<div>{d.data.length} records</div>
				 <div>
					{#each d.data as d}
						<div>{d.image_url}</div>
					{/each}
				</div>
			{/each} -->
		</div>
		<!-- {#if showSpContainer} -->

		<!-- {/if} -->
	</div>

	<!-- 	<aside class="absolute bottom-30 bg-white p-2 rounded-md shadow-md text-xs mt-20 left-0 z-50">

	 {#each runeStoreTaxCards.spAddedToList as d}
	<div>{d.tax_id} - {d.species_name}</div>
	<div>{JSON.stringify(d.active)}</div>
	{/each}


</aside> -->
{/if}

<style>
	.legend-container {
		position: absolute;
		max-height: 80vh;
		overflow-y: auto;
		/* background-color: var(--color-background); */
		top: 16vh;
		right: 10px;
		max-width: 300px;

		padding: 3px;
		border-radius: 2px;
		box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
		display: flex;
		flex-direction: column;
	}
	/* 	.legend-item {
		display: flex;
		align-items: center;
		gap: 10px;
	} */
	.hidden {
		display: none !important;
	}
	.hidden_sp {
		opacity: 0.2;
		cursor: not-allowed;
		pointer-events: none;
	}
	.toggle-group-item-selected {
		background-color: #000;
		color: #fff;
	}
	.legend-container-header > button {
		outline: 1px solid var(--color-border);
	}
	.legend-container-header > button.active {
		background-color: var(--pngp);
		color: white;
	}
	.legend-container-header > button:hover {
		background-color: var(--pngp);
		color: var(--color-background);

		/* align-items: center; */
		transition-property: color, background-color;
		transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
		transition-duration: 150ms;
	}
	.species-option-item {
		display: flex;
		font-size: 0.65rem;
		background-color: var(--pngp-muted);

		color: var(--color-background);
		border: 1px solid var(--color-border);
		margin: 3px;
		/* align-items: center; */
		gap: 0.1rem; /* gap-2 */
		padding: 0.25rem 0.5rem; /* py-1 px-2 */
		border-radius: 0.375rem; /* rounded-md */
		transition-property:
			color, background-color, border-color, text-decoration-color, fill, stroke;
		transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
		transition-duration: 150ms;
	}

	.species-option-item:hover {
		background-color: var(--pngp-muted); /* hover:bg-gray-100 */
	}

	.species-option-item input,
	.species-option-item label {
		padding-left: 0.25rem;
		cursor: pointer;
	}

	.species-option-item-selected {
		background-color: var(--pngp);

		color: var(--color-background);
	}

	.species-option-item label {
		/* text-xs */
		line-height: 1rem;
	}
</style>
