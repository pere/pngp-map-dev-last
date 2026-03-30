<script>
import { MAP_LAYERS } from "$lib/types/layers";
import { setPaintProperty, setLayoutProperty, moveLayer, removeLayer, getLayer } from "$lib/components/MapComponents/maplibre-safe";
//import ModifPaletteButtonTest from './ModifPaletteButtonTest.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Accordion } from 'bits-ui';
	import { PaletteIcon } from 'lucide-svelte';
	import { watch, useDebounce } from 'runed';
	import { getCurrentLocale } from '$lib/stores/wuchaleLocale.svelte.js';
	import {
		reduceByClass,
		reduceByOrder,
		reduceByFamily,
		finalizeClassStats,
		reduceByTaxonomyHierarchy,
	} from '$lib/utils/taxonomyReducer.js';
	import * as Menubar from '$lib/components/ui/menubar/index.js';

	import WrenchIcon from '@lucide/svelte/icons/wrench';

	import EyeOffIcon from '@lucide/svelte/icons/eye-off';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import { XIcon } from 'lucide-svelte';
	import { TrashIcon } from 'lucide-svelte';
	import { ChartBarIcon } from 'lucide-svelte';
	import { runeStoreTaxCards } from '$lib/stores/svelte5_stores/RuneStoreTaxCards.svelte';
	import { runeStore } from '$lib/stores/svelte5_stores/RunesStore.svelte.js';
	import TaxStatsIndiv from './TaxStatsIndiv.svelte';
	import TaxaControls from './TaxaControls.svelte';
	let { map, toMapObj } = $props();

	let derivedByTaxParam = $state('no_classification');
	let orderByTaxParam = $state('total_obs_count');
	let viewCardsAs = $state('simple');

	// Get current locale (reactive)
	let currentLocale = $derived(getCurrentLocale());

	let _classNames = [
		{
			latin: 'Mammalia',
			italian: 'Mamiferi',
			english: 'Mammals',
		},
		{
			latin: 'Reptilia',
			italian: 'Rettili',
			english: 'Reptiles',
		},
		{
			latin: 'Aves',
			italian: 'Uccelli',
			english: 'Birds',
		},
		{
			latin: 'Insecta',
			italian: 'Insetti',
			english: 'Insects',
		},
		{
			latin: 'Gastropoda',
			italian: 'Gasteropodi',
			english: 'Gastropods',
		},
		{
			latin: 'Amphibia',
			italian: 'Anfibi',
			english: 'Amphibians',
		},
	];

	let derivedLanguageTaxList = $derived.by(() => {
		if (derivedByTaxParam === 'class') {
			if (currentLocale === 'it') {
				return _classNames.map(c => ({
					...c,
					name: c.italian,
				}));
			} else {
				if (currentLocale==='en') {
					return _classNames.map(c => ({
						...c,
						name: c.english,
					}));
				} else {
					return _classNames.map(c => ({
						...c,
						name: c.latin,
					}));
				}
			}
		} else {
			return [];
		}
		/*  else if (derivedByTaxParam==='order')
		{
		 return _classNames.find(c=>c.latin===	_data.order_n)?.italian
		}
		else if (derivedByTaxParam==='family')
		{
		 return _classNames.find(c=>c.latin===_data.family_n)?.italian
		} */
	});
	let derivedByTax = $derived.by(() => {
		if (toMapObj && toMapObj?.length > 0) {
			if (toMapObj && toMapObj?.length > 0) {
				let d;
				switch (derivedByTaxParam) {
					case 'no_classification':
						d = toMapObj;
						break;
					case 'class':
						d = Object.entries(reduceByClass(toMapObj)).map((d) => d[1]);

						break;
					case 'order':
						d = Object.entries(reduceByOrder(toMapObj)).map((d) => d[1]);
						break;
					case 'family':
						d = Object.entries(reduceByFamily(toMapObj)).map((d) => d[1]);
						break;
					default:
						return {};
						break;
				}
				console.warn('d', d);
				return d;

				/* if (derivedByTaxParam !== 'no_classification' && orderByTaxParam === 'total_obs_count') {
					return d.sort((a, b) => b.total_obs_count - a.total_obs_count);
				}
				else if (derivedByTaxParam === 'no_classification' && orderByTaxParam === 'total_obs_count') {
					return d.sort((a, b) => b.pngp_data.obs_count - a.pngp_data.obs_count);
				} */
			}
		}
		return {};
	});

	$inspect('spAddedToList inspected', runeStoreTaxCards.spAddedToList.map((d) => d.symbology));

	let showedAllSpeciesVisibility = $derived(runeStoreTaxCards.spAddedToList.every(d=>d.symbology.visible));
	let removedAllSpeciesParam = $derived(runeStoreTaxCards.spAddedToList.length === 0);
	function removeAllSpecies() {


	runeStoreTaxCards.spAddedToListIds=new Set();
	}
	function toggleAllSpeciesVisibility() {
	showedAllSpeciesVisibility	 = !showedAllSpeciesVisibility;
	if (showedAllSpeciesVisibility) {
		if (map) {
			runeStoreTaxCards.spAddedToList.map(d=>d.symbology.visible=true);
	/* 		map.setPaintProperty('pngp_obs_simple', 'circle-opacity', 1);
			map.setPaintProperty('pngp_obs_simple', 'circle-stroke-opacity', 1);
			console.log('showedAllSpeciesVisibility is true'); */
		}
	} else {
		runeStoreTaxCards.spAddedToList.map(d=>d.symbology.visible=false);
/* 		map.setPaintProperty('pngp_obs_simple', 'circle-opacity', 0);
		map.setPaintProperty('pngp_obs_simple', 'circle-stroke-opacity', 0);
		console.log('showedAllSpeciesVisibility is false'); */
	}
}

	let derivedByTaxAdded = $derived.by(() => {
		return runeStoreTaxCards.spAddedToList.map((d) => {
			return {
				...d,
				visibleStats: false,
			};
		});
	});
	let derivedByTaxSpecies = $derived.by(() => {
		if (derivedByTaxParam === 'no_classification') {
			return derivedByTax;
		} else {
			return derivedByTax.map((d) => d.species).flat();
		}
	});

	let modifTaxaPalette = $state([]);
	let changingStyleParam = $state('visibility');
	let parentModifTaxaPalette = $state([]);

	let legendTaxa = $derived(runeStoreTaxCards.spAddedToListIds);
	let modifTaxa = $state({
		taxa: null,
		e: null,
	});

	function modifyTaxaMask(taxa, e) {
		let _taxa = modifTaxa.taxa;
		console.warn(_taxa, '_taxa');
		let _e = modifTaxa.e;

		_taxa.symbology.mask = !_taxa.symbology.mask;
		changingStyleParam = 'mask';
	}

	function modifyTaxaRadius(taxa, e) {
		let _taxa = modifTaxa.taxa;
		console.warn(_taxa, '_taxa');
		let _e = modifTaxa.e;

		_taxa.symbology.radius.inputVal = parseFloat(_e.target.value);
		_taxa.symbology.radius.r = Math.exp(parseFloat(_e.target.value));
		changingStyleParam = 'radiusSizeInput';

		if (symbolRadius && symbolRadius.length > 0) {
			let expression = generateRadiusExpression2(
				baseCircleRadiusExpression,
				symbolRadius
			);
			console.warn(expression, 'exssssspression');
			map.setPaintProperty('pngp_obs_simple', 'circle-radius', expression);
		} else {
			console.warn('no symbolRadius', symbolRadius);
			map.setPaintProperty(
				'pngp_obs_simple',
				'circle-radius',
				baseCircleRadiusExpression
			);
		}
	}

	let debouncedModifyTaxaRadius = useDebounce(modifyTaxaRadius, 300);
	let debouncedModifyTaxaColor = useDebounce(handleColorChange, 300);
	$effect(() => {
		console.warn(legendTaxa, 'legendTaxa');
		console.warn('derivedByTax inspected', derivedByTax);
	});

	let baseCircleRadiusExpression = [
		'interpolate',
		['linear'],
		['zoom'],
		9,
		2,
		11,
		4,
		15,
		6,
	];

	function generateRadiusExpression2(f, activeArr) {
		if (activeArr.length == 0) return baseCircleRadiusExpression;

		const [, , , ...zoomStops] = baseCircleRadiusExpression; // Extract zoom stops
		const expression = ['interpolate', ['linear'], ['zoom']];

		console.warn(activeArr, 'activeArr');

		for (let i = 0; i < zoomStops.length; i += 2) {
			expression.push(zoomStops[i]); // zoom level
			let ori_r = zoomStops[i + 1];
			let _this_expression = ['case'];

			activeArr.forEach((item, i) => {
				let arr = ['==', ['get', 'tax_id'], item.tax_id];
				_this_expression.push(arr);
				_this_expression.push(ori_r * item.symbology?.radius?.r);
			});

			// default radius if no tax_id matches
			_this_expression.push(ori_r);
			expression.push(_this_expression);
		}

		console.log('Final expression:sssss', expression);
		return expression;
	}

	let baseSize = 12;

	let maskedTaxa = $derived.by(() => {
		return runeStoreTaxCards.spAddedToList.filter((d) => d.symbology.visible && d.symbology.mask && d.symbology.mask>0);
	});

	let symbolRadiusHighlighted = $derived.by(() => {
		if (changingStyleParam == 'radiusSizeInput') {
			return maskedTaxa.filter(
				(d) => d.symbology.visible && d.symbology.radius.visibleInput && d.symbology.radius.r!=null && d.symbology.mask && d.symbology.mask>0
			);
		}
	});
	let symbolRadius = $derived.by(() => {
		if (changingStyleParam == 'radiusSizeInput') {
			return derivedByTaxSpecies.filter(
				(d) => d.symbology.visible && d.symbology.radius.visibleInput && d.symbology.radius.r!=null
			);
		} else {
			return null;
		}
	});

	let symbolVisibility = $derived.by(() => {

		if (changingStyleParam == 'visibility') {

			let visTaxa = derivedByTaxSpecies.filter((d) => d.symbology.visible===true);
			console.log('visTaxa in symbolVisibility', visTaxa);
			console.log(derivedByTaxSpecies, 'derivedByTaxSpecies');
			debugger;
			if (visTaxa.length > 0) {
				let expression = [
					'case',
					['in', ['get', 'tax_id'], ['literal', visTaxa.map((d) => d.tax_id)]],
					1,
					0,
				];
				console.log('visTaxa in symbolVisibility', visTaxa);
				console.log('expression in symbolVisibility', expression);
				return expression;
			} else {
				return null;
			}
		}
	});

	$effect(() => {
		if (changingStyleParam == 'radiusSizeInput') {
			// Handle radius size input changes
		}
		console.log('changingStyleParam in effect', changingStyleParam);
		if (changingStyleParam == 'visibility') {

		}
	});
	let spSymbology= $derived.by(() => runeStoreTaxCards.spAddedToList.map((d) =>
	{
		return {
			tax_id: d.tax_id,
			...d.symbology,

		}
	}

	));

	watch(
		/* () => $state.snapshot(derivedByTaxSpecies), */
		() => $state.snapshot(spSymbology),
		(newVal, oldVal) => {
			if (newVal === oldVal || !oldVal) return;

			console.log(newVal,oldVal,changingStyleParam,'newVal,oldVal spSymbology');


            if (changingStyleParam == 'radiusSizeInput') {
				console.warn(maskedTaxa, 'maskedTaxa in watch',maskedTaxa);

              if (maskedTaxa?.length > 0 && map.getLayer('pngp_obs_simple_highlighted')) {
				console.warn(maskedTaxa, 'maskedTaxa in watch',maskedTaxa);


				let maskedRadiusExpression = generateRadiusExpression2(baseCircleRadiusExpression,maskedTaxa);
				console.warn(maskedRadiusExpression, 'maskedRadiusExpression in watch');
				map.setPaintProperty('pngp_obs_simple_highlighted', 'circle-radius', maskedRadiusExpression);
				map.moveLayer('pngp_obs_simple_highlighted');

              }
            }
			if (changingStyleParam == 'mask' || changingStyleParam == 'visibility') {

				//executed each time we add a new species...
				if (newVal.length !== oldVal.length) {

					console.log('we are adding new species...spSymbology changes but no need to execute the rest of the code');
					return;

				}

				console.warn(newVal,'newVal mask in watch');
				let maskedTaxa = newVal.filter((d) => d.visible && d.mask && d.mask>0);
				let prevMaskedTaxa = oldVal?.filter((d) => d.visible && d.mask && d.mask>0);
				if (maskedTaxa.length > 0) {

					let maskedIds = maskedTaxa.map((d) => d.tax_id);
					let currentFilter = map.getFilter('pngp_obs_simple');
					if (currentFilter) {
						console.warn(currentFilter, 'currentFilter');
						let mappedFilter = currentFilter.map(d => {
							// Skip non-array elements like "all"
							if (!Array.isArray(d)) return d;

							// Check if this is an "in" expression for tax_id
							if (d[0] === "in" && d[1]?.[1] === "tax_id") {
								return ["in", ["get", "tax_id"], ["literal", maskedIds]];
							}
							return d;
							});

						map.setFilter('pngp_obs_simple_highlighted', mappedFilter);
						map.moveLayer('pngp_obs_simple_highlighted');
					}
					else
					{
						console.info('no currentFilter in watch');
					}

					/* let currentFilter = map.getFilter('pngp_obs_simple');
					if (currentFilter) {
						console.warn(currentFilter, 'currentFilter');
						debugger;
					} */

					//get taxonomy color for each masked taxa - build match expression
					let colorMatchExpression = ['match', ['get', 'tax_id']];
					maskedTaxa.forEach((d) => {
						let tax = derivedByTaxSpecies.find((t) => t.tax_id === d.tax_id);
						colorMatchExpression.push(d.tax_id);
						colorMatchExpression.push(tax?.symbology?.color || '#000000');
					});
					colorMatchExpression.push('#000000'); // default fallback color
					console.warn(colorMatchExpression, 'colorMatchExpression');
					map.setPaintProperty('pngp_obs_simple_highlighted', 'circle-color', colorMatchExpression);




					map.moveLayer('pngp_obs_simple_highlighted');
					map.setLayoutProperty('pngp_obs_simple_highlighted', 'visibility', 'visible');

					if (maskedTaxa.length > prevMaskedTaxa?.length) {
						console.log('only background layer is added when new taxa are added');
					if (!map.getLayer('world_background')) {
					//	map.addLayer(layers.find((d) => d.id == 'world_background'));
						addLayer(map, 'world_background');
					}

					moveLayer(map, 'world_background','pngp_obs_simple_highlighted');
					//map.moveLayer('world_background','pngp_obs_simple_highlighted');
					map.setPaintProperty('world_background', 'raster-opacity', .85);
					setTimeout(()=>{
						//map.setPaintProperty('world_background', 'raster-opacity', 0);
						setPaintProperty(map, 'world_background', 'raster-opacity', 0);
					},4000);
				}

				}
				else {
					console.log('mask is false in watch');
					map.setLayoutProperty('pngp_obs_simple_highlighted', 'visibility', 'none');
					map.setPaintProperty('pngp_obs_simple', 'circle-opacity', 1);
					map.setPaintProperty('pngp_obs_simple', 'circle-stroke-opacity', 1);
					map.setPaintProperty('world_background', 'raster-opacity', 0);
				}


			}


			if (changingStyleParam == 'visibility') {
				debugger;
				//set mask to false for all taxa if visible is false
				console.warn(newVal,'newVal visibility in watch');
				newVal.forEach((d) => {
					if (!d.visible && d.mask && d.mask>0) {
						d.mask = null;
					}
				});


				let visTaxa = newVal.filter((d) => d.visible);
			console.log('visTaxa in symbolVisibility', visTaxa);


			if (visTaxa.length > 0) {
				let expression = [
					'case',
					['in', ['get', 'tax_id'], ['literal', visTaxa.map((d) => d.tax_id)]],
					1,
					0,
				];
				console.log('visTaxa in symbolVisibility', visTaxa);
				console.log('expression in symbolVisibility', expression);
				map.setPaintProperty('pngp_obs_simple', 'circle-opacity', expression);
				map.setPaintProperty('pngp_obs_simple', 'circle-stroke-opacity', expression);

			} else {
				map.setPaintProperty('pngp_obs_simple', 'circle-opacity', 0);
				map.setPaintProperty('pngp_obs_simple', 'circle-stroke-opacity', 0);
			}


			} else {
				console.warn('no changes in  derivedByTaxSpecies in watch');
				/* map.setPaintProperty('pngp_obs_simple', 'circle-opacity', 0); */
			}
		}
	);



	function handleColorChange(taxa, e) {
		console.warn('handleColorChange', taxa, e);
		let choosenColor = e.target.value;
		let originalColor = taxa.symbology.originalColor;
		taxa.symbology.color = choosenColor;
		/* 	runeStoreTaxCards.spAll=runeStoreTaxCards.spAll.map(d=>d.tax_id === taxa.tax_id ? {...d,symbology:{...d.symbology,color:choosenColor}} : d); */
		let expression = ['match', ['get', 'tax_id']];

		derivedByTaxSpecies.forEach((d) => {
			if (d.tax_id === taxa.tax_id) {
				d.symbology.color = choosenColor;
			}
			expression.push(d.tax_id, d.symbology.color);
		});
		expression.push('#000000');
		console.warn('derivedByTaxSpecies', derivedByTaxSpecies);


		map.setPaintProperty('pngp_obs_simple', 'circle-color', expression);
		console.log(
			'new color expression',
			map.getStyle().layers.find((d) => d.id == 'pngp_obs_simple')
		);

		runeStoreTaxCards.spAll = runeStoreTaxCards.spAll.map((d) => {
			if (d.tax_id === taxa.tax_id) {
				console.warn('d', d, taxa);

				return {
					...d,
					color: choosenColor,
					symbology: {
						...d.symbology,
						color: choosenColor,
						//originalColor: originalColor,
					},
				};
			}
			return d;
		});
	}

</script>
<div class="flex flex-row items-center">
	<!-- <div class="block w-full overflow-y-auto max-h-[300px]">
	{JSON.stringify(symb)}
</div> -->
<button class="w-fit text-start justify-center items-center">

	<Menubar.Root class="h-auto m-0 p-0">
		<Menubar.Menu>
			<Menubar.Trigger
				class="text-xs p-1 m-0 bg-gray-300 text-gray-700 cursor-pointer hover:bg-lime-800 hover:text-white gap-0 pl-1"
			>


				<div class="showSpeciesOptionsDiv flex flex-row gap-0.5">
					Configuration

				<!-- <WrenchIcon class="ml-auto size-3" /> -->
			</div>


			</Menubar.Trigger>
			<Menubar.Content class="text-xs p-0 border-accent bg-gray-100">
				<Menubar.Item class="text-xs p-0.5 pl-1 pointer-events-none bg-accent border-b border-gray-300 text-white">Classifications</Menubar.Item>
				<!-- <Menubar.Separator /> -->

				<Menubar.Group class="text-xs">
					<Menubar.RadioGroup
						bind:value={derivedByTaxParam}
						class="text-xs text-gray-600 cursor-pointer points_radioGroup"
					>
						<Menubar.RadioItem
							class="items-left text-xs m-0.2 p-0.5"
							value="no_classification"
						>
							<div>No classification</div>
						</Menubar.RadioItem>
						<Menubar.RadioItem class="items-left text-xs m-0.2 p-0.5" value="class">
							<div>Class</div>
						</Menubar.RadioItem>
						<Menubar.RadioItem class="items-left text-xs m-0.2 p-0.5" value="order">
							<div>Order</div>
						</Menubar.RadioItem>
						<Menubar.RadioItem class="items-left text-xs m-0.2 p-0.5" value="family">
							<div>Family</div>
						</Menubar.RadioItem>
					</Menubar.RadioGroup>
				</Menubar.Group>
				<Menubar.Separator />

				<Menubar.Item class="text-xs p-0.5 pl-1 pointer-events-none bg-accent border-b border-gray-300 text-white">View info as</Menubar.Item>

				<!-- <Menubar.Separator /> -->
				<Menubar.Group class="text-xs">
					<Menubar.RadioGroup
						bind:value={viewCardsAs}
						class="text-xs text-gray-600 cursor-pointer points_radioGroup"
					>
						<Menubar.RadioItem class="items-left text-xs m-0.2 p-0.5" value="simple">
							<span>Simple</span>
						</Menubar.RadioItem>
						<Menubar.RadioItem
							class="items-left text-xs m-0.2 p-0.5"
							value="detailed"
						>
							<span>Detailed</span>
						</Menubar.RadioItem>
					</Menubar.RadioGroup>
				</Menubar.Group>
			</Menubar.Content>
		</Menubar.Menu>
	</Menubar.Root>
</button>
<button
onclick={()=>{
	toggleAllSpeciesVisibility();
}}
					class="species-option-item {showedAllSpeciesVisibility
						? 'species-option-item-selected cursor-pointer'
						: ''}"
				>
				<!-- 	<input
						type="checkbox"
						onclick={toggleAllSpeciesVisibility}
						bind:checked={showedAllSpeciesVisibility}
					/> -->
					<span>{showedAllSpeciesVisibility ? 'Hide all species' : 'Visualize all species'}</span>
				</button>

				<button
onclick={()=>{
	removeAllSpecies();
}}
					class="species-option-item {removedAllSpeciesParam
						? 'display-none'
						: 'display-block cursor-pointer'}"
				>

					<span>Remove all species</span>
				</button>
				</div>
{#if derivedByTaxParam === 'no_classification'}
	{#each derivedByTax as taxa, i (taxa.tax_id)}
		{@const visPalette = taxa?.symbology?.radius?.visibleInput}
		{@const visibleStats = taxa.symbology.visibleStats}
		{@const visActive = taxa.symbology.visible}
		{@const currentRadius = taxa?.symbology?.radius?.inputVal}
		{@const scaleFactor = currentRadius
			? 1 + parseFloat(currentRadius) * 0.5
			: 1}
		{@const circleSize = taxa?.symbology?.radius?.r
			? Math.max(10, Math.min(24, baseSize * taxa.symbology.radius.r))
			: 10}

		<div class="w-full mb-1 rounded-md bg-gray-200 border border-t-0 border-gray-300 {visActive && visPalette ? 'bg-gray-300 ' : ''}">
			<div
				class="palette-button-entry pt-1 pb-1 border w-full flex flex-row {visActive ? '' : 'opaque'} {visActive && visPalette ? 'border-b-0' : ''}"
			>
				{#if viewCardsAs === 'simple'}
					<div class="flex  w-2/3 items-left align-middle mt-auto mb-auto"

					>
						<div
							class="min-w-6 min-h-6 mt-auto mb-auto align-middle flex items-center"
						>
							<div
								class="outline-1 legend-color m-1 rounded-full border border-white align-middle items-center justify-center"
								style="background-color: {taxa.symbology
									.color}; width: {circleSize}px; height: {circleSize}px;"
							></div>
						</div>
						<div class="legend-text align-middle mt-auto mb-auto text-xs">
							{taxa.species_n}
							<!-- {visActive} - {JSON.stringify(taxa.symbology.visible)} -->
							<!-- {JSON.stringify(taxa.symbology)} -->
						</div>
					</div>

					<TaxaControls {taxa} bind:changingStyleParam />
				{/if}

				{#if viewCardsAs === 'detailed'}
					{#if taxa.inat_photo}
						<div class="md:shrink-0">
							<img
								class="h-15 w-full object-cover md:h-full md:w-15"
								src={'./data/new_sources/inat_photos/' + taxa.inat_photo}
								alt={taxa.species_n}
								loading="lazy"
							/>
						</div>
					{:else}
						<div class="md:shrink-0">
							<img
								class="h-15 w-full object-cover md:h-full md:w-15"
								src="https://blocks.astratic.com/img/general-img-square.png"
								alt=""
							/>
						</div>
					{/if}
					<div class="p-0.5 w-full text-xs">
						<div class="flex items-left">
							<div class="flex w-2/3 justify-start">
								<div
									class="align-middle inline-block legend-color mr-1 rounded-full"
									style="margin-top:3px;background-color: {taxa.symbology
										.color}; width: {circleSize}px; height: {circleSize}px;"
								></div>

								<div class="legend-text">
									<span class="block leading-tight font-light">
										{taxa.species_n}
									</span>
									<span class="block mt-1 leading-tight font-light">
										{taxa.pngp_data?.name_it} / {taxa.pngp_data?.name_eng ||
											taxa.preferred_common_name}
									</span>
								</div>
							</div>
							<TaxaControls {taxa} bind:changingStyleParam />
						</div>
						<div class="block pl-1">
							{#if taxa.pngp_data?.obs_count}
								<p class="mt-2 text-xs text-gray-700">
									<Badge variant="numTaxRecords"
										>{taxa.pngp_data?.obs_count.toLocaleString()}</Badge
									> records
								</p>
							{/if}
							{#if taxa.pngp_data && taxa.pngp_data.family_n}
								<div class=" text-xs">
									{#each ['class_n', 'order_n', 'family_n'] as item, i}
										<span class="mt-2 font-light text-xs"
											>{taxa.pngp_data?.[item]}
											{#if i < 2}
												/
											{/if}
										</span>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>

			{#if (visPalette && visActive) || (taxa.symbology.visibleStats && visActive)}
				<div class="w-full ">
					{#if visPalette && visActive}
						<div class="p-1 w-full">
							<div class="flex flex-row items-left items-center">
								<input
									type="color"
									bind:value={taxa.symbology.color}
								onchange={(e) => {
debouncedModifyTaxaColor(taxa, e).then(() => {
										console.warn('debouncedModifyTaxaRadius');
									})
								}}
									oninput={(e) => {

debouncedModifyTaxaColor(taxa, e).then(() => {
										console.warn('debouncedModifyTaxaRadius');
									})
								}}

									class="h-5 w-7 block cursor-pointer disabled:opacity-50 disabled:pointer-events-none border-white border-1 rounded-md"
									id="hs-color-input"
									title="Choose your color"
								/>

								<label
									for="hs-color-input"
									class=" text-xs font-medium mb-0 ml-2"
									>Change color</label
								>
							</div>

							<label class="text-sm font-medium text-gray-700">
								Radius {taxa.symbology.radius?.inputVal > 0 ? '+' : ''}{taxa
									.symbology.radius?.inputVal}%
							</label>
							<input
								oninput={(e) => {
									modifTaxa = { taxa: taxa, e: e };

									debouncedModifyTaxaRadius().then(() => {
										console.warn('debouncedModifyTaxaRadius');
									});
								}}
								type="range"
								min="-2"
								max="2"
								step="0.2"
								value={taxa.symbology.radius?.inputVal || 0}
								class="w-full mt-1"
							/>
						</div>
					{/if}

					{#if taxa.symbology.visibleStats && visActive}
						<div class="p-2 w-full">
							<TaxStatsIndiv {taxa} />
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{/each}
{:else}
	<Accordion.Root type="single" collapsible>
		{#each derivedByTax as _data}
			{@const nameCode = derivedByTaxParam + '_n'}
			{@const taxes = _data.species.sort(
				(a, b) => b.pngp_data.obs_count - a.pngp_data.obs_count
			)}
			{@const languageName = derivedLanguageTaxList?.find(
				(c) => c.latin === _data.class_n
			)?.name}
			<Accordion.Item value={_data.class_n}>
				<Accordion.Header class="w-full cursor-pointer">
					<Accordion.Trigger
						class="bg-background outline-hidden flex w-full select-none items-left"
					>
						<button
							class="border p-1 mb-1 rounded w-full text-left cursor-pointer hover:bg-gray-300"
						>
						<div class="flex flex-row items-center">
							{#if languageName}
								<div class="font-bold text-lg">{languageName} /</div>
							{/if}
							<div class="font-bold {languageName?'ml-1':''} text-sm ">
								  {_data[nameCode]}
							</div>
							</div>
							<p>
								<span class="text-sm">Species: {taxes.length}<span></span></span
								>
							</p>
							<p></p>
							<p>
								<span class="text-sm">
									Observations: {_data.total_obs_count.toLocaleString()}
								</span>
							</p>
						</button>
					</Accordion.Trigger>
				</Accordion.Header>
				<Accordion.Content class="max-h-[600px] p-1.5 overflow-y-auto">
					{#each taxes as taxa, i (taxa.tax_id)}
						{@const visPalette = taxa?.symbology?.radius?.visibleInput}
						{@const visibleStats = taxa.symbology.visibleStats}
						{@const visActive = taxa.symbology.visible}
						{@const currentRadius = taxa?.symbology?.radius?.inputVal}
						{@const scaleFactor = currentRadius
							? 1 + parseFloat(currentRadius) * 0.5
							: 1}
						{@const circleSize = taxa?.symbology?.radius?.r
							? Math.max(10, Math.min(24, baseSize * taxa.symbology.radius.r))
							: 10}
						<div class="w-full">

							<div
								class="p-2 border rounded-md w-full flex flex-row {visActive
									? 'block'
									: 'opaque'}"
							>

								{#if viewCardsAs === 'simple'}

									<div class="flex w-2/3 items-left align-middle text-xs">
										<div
											class="legend-color m-1 rounded-full border border-white align-middle mt-auto mb-auto"
											style="background-color: {taxa.symbology
												.color}; width: {circleSize}px; height: {circleSize}px;"
										></div>
										<div class="legend-text align-middle">{taxa.species_n}




										</div>
									</div>

									<TaxaControls {taxa} bind:changingStyleParam />
								{/if}

								{#if viewCardsAs === 'detailed'}
									{#if taxa.inat_photo}
										<div class="md:shrink-0">
											<img
												class="h-15 w-full object-cover md:h-full md:w-15"
												src={'./data/new_sources/inat_photos/' +
													taxa.inat_photo}
												alt={taxa.species_n}
												loading="lazy"
											/>
										</div>
									{:else}
										<div class="md:shrink-0">
											<img
												class="h-15 w-full object-cover md:h-full md:w-15"
												src="https://blocks.astratic.com/img/general-img-square.png"
												alt=""
											/>
										</div>
									{/if}
									<div class="p-1 w-full text-xs">
										<div class="flex items-left">
											<div class="flex w-2/3 justify-start">
												<div
													class="legend-color m-1 rounded-full border border-white align-middle mt-auto mb-auto"
													style="margin-top:3px;background-color: {taxa
														.symbology
														.color}; width: {circleSize}px; height: {circleSize}px;"
												></div>

												<div class="legend-text">
													<span class="block leading-tight font-light">
														{taxa.species_n}
													</span>
													<span
														class="block mt-1 text-xs leading-tight font-light"
													>
														{taxa.pngp_data?.name_it} / {taxa.pngp_data
															?.name_eng || taxa.preferred_common_name}
													</span>
												</div>
											</div>
											<TaxaControls {taxa} bind:changingStyleParam />
										</div>
										<div class="block pl-1">
											{#if taxa.pngp_data?.obs_count}
												<p class="mt-2 text-xs text-gray-700">
													<Badge variant="numTaxRecords"
														>{taxa.pngp_data?.obs_count.toLocaleString()}</Badge
													> records
												</p>
											{/if}
											{#if taxa.pngp_data && taxa.pngp_data.family_n}
												<div class=" text-xs">
													{#each ['class_n', 'order_n', 'family_n'] as item, i}
														<span class="mt-2 font-light text-xs"
															>{taxa.pngp_data?.[item]}
															{#if i < 2}
																/
															{/if}
														</span>
													{/each}
												</div>
											{/if}
										</div>
									</div>
								{/if}
							</div>
							{#if (visPalette && visActive) || (taxa.symbology.visibleStats && visActive)}
								<div class="w-full pl-1 pr-1 border border-t-0 border-gray-300">
									{#if visPalette && visActive}
										<div class="p-1 w-full">
											<div class="flex flex-row items-left items-center">
												<input
													type="color"
													bind:value={taxa.symbology.color}
													oninput={(e) => handleColorChange(taxa, e)}
													onchange={(e) => handleColorChange(taxa, e)}
													class="h-5 w-7 block cursor-pointer disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700"
													id="hs-color-input"
													title="Choose your color"
												/>

												<label
													for="hs-color-input"
													class=" text-xs font-medium mb-0 ml-2 dark:text-white"
													>Change color</label
												>
											</div>

											<label class="text-sm font-medium text-gray-700">
												Radius {taxa.symbology.radius?.inputVal > 0
													? '+'
													: ''}{taxa.symbology.radius?.inputVal}%
											</label>
											<input
												oninput={(e) => {
													modifTaxa = { taxa: taxa, e: e };

													debouncedModifyTaxaRadius().then(() => {
														console.warn('debouncedModifyTaxaRadius');
													});
												}}
												type="range"
												min="-2"
												max="2"
												step="0.2"
												value={taxa.symbology.radius?.inputVal || 0}
												class="w-full mt-1"
											/>
										</div>
									{/if}

									{#if taxa.symbology.visibleStats && visActive}
										<div class="p-2 w-full">
											<TaxStatsIndiv {taxa} />
										</div>
									{/if}
								</div>
							{/if}
						</div>
					{/each}
				</Accordion.Content>
			</Accordion.Item>
		{/each}
	</Accordion.Root>
{/if}


<style>
	:global(.opaque) {
		opacity: 0.3;

	}

	:global(.visibility-button) {
		pointer-events: auto !important;
		opacity: 1 !important;
	}

	:global(.active) {
		color: #19a952;
		transition: all 0.2s ease-in-out;
	}

	:global(.active:hover) {
		color: #bc8009fe;
	}

:global(.action_container >div:hover) {
	cursor: pointer;
	background-color: #bc8009fe;
	transition: all 0.2s ease-in-out;
}

	:global(.action_container button) {
		cursor: pointer;

		border: none;
		padding: 0;
		margin: 0;
		font-size: 1rem;
		font-weight: normal;

		transition: all 0.2s ease-in-out;
	}

	:global(.species-option-item) {
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

	:global(.species-option-item:hover) {
		background-color: var(--pngp-muted); /* hover:bg-gray-100 */
	}

	:global(.species-option-item input,
	.species-option-item label) {
		padding-left: 0.25rem;
		cursor: pointer;
	}

	:global(.species-option-item-selected) {
		background-color: var(--pngp);

		color: var(--color-background);
	}

	:global(.species-option-item label) {
		/* text-xs */
		line-height: 1rem;
	}

	:global(.points_radioGroup .menubar-radio-item-inside:focus)
	{
		background-color: var(--pngp);
		color: var(--color-background);
	}
	.palette-button-entry {
		position: relative;
	}

	.palette-button-entry::before {
		content: '';
		position: absolute;
		inset: 0;
		color:white;
		background-color: #226a3c;
		border-radius: 0.375rem; /* rounded-md */
		animation: fadeGreenOverlay 2.5s ease-out forwards;
		pointer-events: none;
	}
		@keyframes fadeGreenOverlay {
		0% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}
</style>
