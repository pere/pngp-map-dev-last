<script>
	//@ts-nocheck
	import { useSidebar } from '$lib/components/ui/sidebar/context.svelte.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { toast } from 'svelte-sonner';
	import CustomToast from '$lib/components/ui/sonner/CustomToast.svelte';
	import { onMount, onDestroy, untrack, mount, unmount } from 'svelte';
	import { get } from 'svelte/store';
	import { feature as featureTopojson } from 'topojson-client';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import AnimalIcon from '@lucide/svelte/icons/paw-print';
	import { LoaderCircle } from 'lucide-svelte';
	import { XIcon } from 'lucide-svelte';
	import maplibregl from 'maplibre-gl';
	import {
		runeStoreTaxCards,
		fetchRemoteDataRunes,
		spAddedToListIds,
	} from '$lib/stores/svelte5_stores/RuneStoreTaxCards.svelte.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { fade } from 'svelte/transition';

	import { Jumper } from 'svelte-loading-spinners';
	import * as ss from 'simple-statistics';
	import * as d3 from 'd3';
	import CountsGeoLegend from './countsGeoLegend.svelte';
	/* import FiltersLegend from './filtersLegend.svelte'; */
	/* import { Popup } from 'maplibre-gl'; */
	import chroma from 'chroma-js';
	import PointsLegend from './pointsLegend.svelte';
	import * as pkg from 'maplibre-gl';
	import { getTaxData, findTaxById } from '$lib/stores/test.svelte.js';
	import TestPopupTax from '$lib/components/TaxSearchComponentsTest/TestPopupTax.svelte';
	import PolygonPopupInfo from './PolygonPopupInfo.svelte';
	import {
		mapStore,
		fetchOverlaysFunction2,
		overlayLoadingState,
		getLayersNew,
		isMapReady,
		getMap,
	} from '$lib/stores/mapLayers.svelte.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { runeStore } from '$lib/stores/svelte5_stores/RunesStore.svelte.js';
	/* import GeoEvolution from '$lib/components/GeoAnalysis/GeoEvolution.svelte'; */
	import {
		_polygonStore,
		getParamsChanged,
	} from '$lib/stores/svelte5_stores/PolygonStoreNew.svelte.js';
	import { browser } from '$app/environment';
	import { useDebounce, watch, Previous } from 'runed';
	import SpeciesCardTest from '../TaxSearchComponentsTest/SpeciesCardTest.svelte';

	const { Popup, LngLat, Marker } = pkg;
	let layers_new = $derived(getLayersNew());
	import {
		MapLibre,
		NavigationControl,
		ScaleControl,
		GlobeControl,
		Marker as MapMarker,
		Popup as MapPopup,
	} from 'svelte-maplibre-gl';
	import SpeciesGrid from '$lib/components/TaxSearchComponentsTest/SpeciesGrid.svelte';

	import { Label } from '$lib/components/ui/label/index.js';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { dev } from '$app/environment';
	/* import { Button } from 'bits-ui'; */
	import { Button } from '$lib/components/ui/button/index.js';
	import * as ButtonGroup from '$lib/components/ui/button-group/index.js';

	const sidebar = useSidebar();
	let newviewAsGallery = $state(false);
	let galleryMountKey = $state(0); // Key to force remount ONLY when taxGroup changes
	let lastTaxGroup = $state(null);

	let viewAsGallery = $derived(runeStoreTaxCards.viewAsGallery);

	// Watch only for taxGroup changes to trigger remount
	watch(
		() => viewAsGallery?.taxGroup,
		(currTaxGroup, prevTaxGroup) => {
			console.log('taxGroup changed:', prevTaxGroup, '->', currTaxGroup);

			// Only remount when taxGroup actually changes (not null -> value, that's first mount)
			if (prevTaxGroup && currTaxGroup && prevTaxGroup !== currTaxGroup) {
				console.log('Remounting SpeciesGrid because taxGroup changed');
				galleryMountKey++;
				newviewAsGallery = true;
			}
			// First time opening (no previous taxGroup)
			else if (!prevTaxGroup && currTaxGroup) {
				console.log('First mount of SpeciesGrid');
				galleryMountKey++;
				newviewAsGallery = true;
			}

			// Store for next comparison
			lastTaxGroup = currTaxGroup;
		}
	);

	// Watch for active state changes (show/hide only, no remount)
	watch(
		() => viewAsGallery?.active,
		(isActive, wasActive) => {
			console.log('active changed:', wasActive, '->', isActive);

			if (isActive === true) {
				sidebar.setOpen(false);
				// Don't set newviewAsGallery here - that's handled by taxGroup watch
			} else if (isActive === false) {
				sidebar.setOpen(true);
				// Keep component mounted but hidden
			}
		}
	);

	/* let nItems = $state(30)
  let indices = $derived([...Array(nItems).keys()]) */
	let tooltipOpen = $state(true);
	let initialMaxBounds = $state(false);

	// PNGP Park boundaries - constant
	const PNGP_BOUNDS = [
		[6.8664788526199345, 45.27142104025339], // Southwest coordinates
		[7.862639291375302, 45.717987498807474], // Northeast coordinates
	];

	$effect(() => {
		return false;
		console.log('🗺️ Bounds effect check:', {
			hasMap: !!map,
			spCount: runeStoreTaxCards.spAddedToList.length,
			initialMaxBounds,
		});

		// Run ONCE when first species is added - animate to park bounds
		if (
			map &&
			runeStoreTaxCards.spAddedToList.length > 0 &&
			!initialMaxBounds
		) {
			console.log('✅ Setting maxBounds and starting animation');

			// Set maxBounds immediately
			map.setMaxBounds(PNGP_BOUNDS);

			// Animate to bounds
			map.fitBounds(PNGP_BOUNDS, {
				padding: 10,
				duration: 2000,
			});

			// Re-enforce maxBounds after animation AND on every moveend event
			const enforceMaxBounds = () => {
				if (!map.getMaxBounds()) {
					console.log('🔒 Re-enforcing maxBounds...');
					map.setMaxBounds(PNGP_BOUNDS);
				}
			};

			// Re-set after animation
			setTimeout(() => {
				enforceMaxBounds();
				// Add event listener to continuously enforce bounds
				map.on('moveend', function () {
					console.warn('enforceMaxBounds');
					enforceMaxBounds();
				});
				console.log('✅ maxBounds enforcement active');
				initialMaxBounds = true;
				map.scrollZoom.enable();
			}, 500);
		}
	});
	function handleCloseTooltip() {
		tooltipOpen = false;
	}

	let loadingMap2 = $derived.by(() => {
		console.log('initialMaxBounds', initialMaxBounds);
		if (!initialMaxBounds) return false;
		return runeStoreTaxCards.loadingMap; // || _polygonStore.loadingMap;
	});
	let showPolygons = $state(true);
	let showInatSpecies = $state(false);
	$effect(() => {
		console.log('showInatSpecies', showInatSpecies);
	});
	let lnglat = $state({ lng: 7.37, lat: 45.51 });
	let popupOpen = $state(true);

	// Use derived states from the store
	let mapNew = $derived(getMap()); // Reactive map from store
	let mapReady = $derived(isMapReady()); // Reactive boolean for map availability

	let map;
	let this_interface = $derived(runeStoreTaxCards.paramsFilter.interface);
	$effect(() => {
		console.log('this_interface', this_interface);
	});
	let symbolColor = $state({ legend: [], colorScale: [], ids: [] });
	let loadedPoints = $state(false);
	let loadedPointsIds = $derived.by(() => {
		if (
			runeStoreTaxCards.spAddedToListIds &&
			runeStoreTaxCards.spAddedToListIds.size > 0
		)
			return Array.from(runeStoreTaxCards.spAddedToListIds);
		else return [];
	});

	let selTaxObjs = $derived(
		runeStoreTaxCards.spAddedToList.filter((d) => d.symbology.visible)
	);
	let clickingPol = true;
	let jenksData = $state();
	// $inspect(jenksData).with(console.trace); // 🔥 DISABLED: Causes severe performance issues
	let fetchedPolygons = $derived.by(() => {
		return runeStoreTaxCards.resultsFetched.polygons;
	});
	//   watch(()=>[runeStoreTaxCards.resultsFetched.polygons,jenksData],([polCurr,jetCurr],[jetCurr,jetPrev])

	watch(
		() => jenksData,
		(prev, curr) => {
			console.log('jenksData changed', prev, curr);
			console.log('selTaxObjs', selTaxObjs);
			if (!curr)
			showPolygons = false;
			else if (prev && curr && prev.length === 0) {
				showPolygons = false;
			}
			else if (prev && curr && prev.length > 0) {
				showPolygons = true;
			}
		}
	);

	let selView = $state('2d');
	let pitchValue = $state(52);
	let exaggeration_3d = $state(2);
	function handleExaggerationChange(e) {
		exaggeration_3d = +e.target.value;
		console.log('exaggeration_3d changed to', exaggeration_3d);
		if (selView === '3d' && map) {
			map.setTerrain({
				source: 'terrain-data-dem',
				exaggeration: exaggeration_3d, // e.g. 1.0 = real scale; >1 exaggerates height
			});
		}
	}
	function handlePitchChange(e) {
		pitchValue = +e.target.value;
		console.log('pitchValue changed to', pitchValue);
		if (selView === '3d' && map) {
			map.setPitch(pitchValue);
		}
	}
	function handleView(value) {
		selView = value;
	}
	watch(
		() => selView,
		(curr, prev) => {
			/* if (!map || !mapReady) return; */
			if (curr === prev || !prev) return;
			console.log('selView in watch changed to', selView);
			if (curr === '2d') {
				if (map.getLayer('terrain-data')) {
					map.setTerrain({
						source: 'terrain-data-dem',
						exaggeration: 0, // e.g. 1.0 = real scale; >1 exaggerates height
					});
					map.setPitch(0);
					//	map.removeLayer('terrain-data');
				}
			} else if (curr === '3d') {
				if (!map.getLayer('terrain-data')) {
					map.addLayer({
						id: 'terrain-data',
						type: 'color-relief',
						source: 'terrain-data-dem',
						layout: {
							visibility: 'visible',
						},
					});
				}

				map.setTerrain({
					source: 'terrain-data-dem',
					exaggeration: exaggeration_3d, // e.g. 1.0 = real scale; >1 exaggerates height
				});
				map.setPitch(pitchValue);
			}
		}
	);
	/* $effect(() => {
		console.log('selView changed to', selView);
		if (!map || !mapReady) return;


	}); */

	function applyTerrain() {
		map.setTerrain({
			source: 'terrain-data-dem',
			exaggeration: exaggeration_3d,
		});
		map.setPitch(pitchValue);
	}

	/* let prevTaxa = new Previous(() =>runeStoreTaxCards.spAddedToList);
if (prevTaxa.current) {

  prevTaxa.current.forEach(d=>{
    removePopups(d.tax_id);
  });
}
watch(()=>prevTaxa,()=>{
  console.log('prevTaxa changed',prevTaxa);
  if (!prevTaxa.current) return;
  console.log('prevTaxa changed',prevTaxa);
  prevTaxa.current.forEach(d=>{
    removePopups(d.tax_id);
  });
}); */

	let loadedNewPols = $state([]);
	let prevPointsIds = new Previous(() => loadedNewPols);
	/* let nodataPolygons=$state(false);
watch(()=>nodataPolygons,()=>{
  console.log('nodataPolygons changed',nodataPolygons);

}); */

	//let prevPointsIds=$state([]);

	watch(
		[() => fetchedPolygons, () => jenksData],
		([polCurr, jetCurr], [polPrev, jetPrev]) => {
			console.log('🔄 Watch triggered with:', {
				polCurr: polCurr?.length,
				polPrev: polPrev?.length,
				jetCurr: jetCurr?.legend?.length,
				prevPointsIds: prevPointsIds.current,
				jetPrev: jetPrev?.legend?.length /*
    loadedPointsIdsCurr: loadedPointsIdsCurr?.length,
    loadedPointsIdsPrev: loadedPointsIdsPrev?.length */,
			});

			if (polCurr === polPrev && jetCurr === jetPrev) {
				console.log('No changes detected, exiting watch.');
				return;
			}
			//everytime one of these changes, this will trigger
			/*   if (!polPrev || polPrev.length==0)
    return false; */

			/* if (!polCurr)

				return; */

			if (polPrev && polCurr.length == 0) {
				console.warn('no polygons data222', polCurr);

				if (prevPointsIds.current && map.getLayer('pngp_grid_1km_topo')) {
					map.setLayoutProperty('pngp_grid_1km_topo', 'visibility', 'none');
					map.setLayoutProperty(
						'pngp_grid_1km_topo_outline',
						'visibility',
						'none'
					);
					map.setLayoutProperty('pngp_obs_simple', 'visibility', 'none');

					map.setFilter('pngp_obs_simple', null);
					map.setLayoutProperty('pngp_inat', 'visibility', 'none');
					map.setFilter('pngp_inat', null);
				}
				loadedNewPols = [];
				symbolColor = {
					legend: null,
					colorScale: [],
					ids: [],
				};
				return;
			}

			if (polCurr.length == 0) {
				console.warn('no polygons data', polCurr);
				loadedNewPols = [];
				symbolColor = {
					legend: null,
					colorScale: [],
					ids: [],
				};
				return;
			}
			/*
      if (loadedPointsIdsCurr.length !== loadedPointsIdsPrev.length ||
          !loadedPointsIdsCurr.every((id, index) => id === loadedPointsIdsPrev[index]))
      {
        console.log('loadedPointsIds changed',loadedPointsIdsCurr);
        //loadedPoints=false;
      }
      else
      {
        console.log('loadedPointsIdsCurr',loadedPointsIdsCurr);
        console.log('same loadedPointsIdsPrev???')
        return;
      } */

			//	console.log('watching runeStoreTaxCards.resultsFetched.polygons', runeStoreTaxCards.resultsFetched.polygons);
			if (jetCurr?.legend.length > 0) {
				console.log('curr', polPrev.length, polCurr.length);
				console.log('jetCurr', jetCurr);
				console.warn('jetPrev', jetPrev);
				console.log('present polygons and legend, lets map it!!');

				const source = map.getSource('pngp_grid_1km_topo_source');
				const oriData = geojson_1km;

				let sortedData = polCurr.sort((a, b) => a.pol_id - b.pol_id); // Use slice() to avoid mutating original

				let pol_ids = sortedData.map((d) => d.pol_id);
				loadedNewPols = pol_ids;
				/* console.log('sortedData',sortedData,pol_ids); */
				// console.warn('filtered currentData',oriData.features.filter(d=>pol_ids.includes(d.properties.pol_id)))

				if (!geojson_1km || !geojson_1km.features) {
					console.warn('❌ geojson data not available');
					return;
				}

				let t = geojson_1km.features
					.filter((d) => pol_ids.includes(d.properties.pol_id))
					.sort((a, b) => a.properties.pol_id - b.properties.pol_id)
					.map((feature, i) => {
						//  console.log('info',i,feature.properties.pol_id,sortedData[i]?.pol_id,sortedData[i]?.count);

						return {
							...feature,
							properties: {
								...feature.properties,
								count: sortedData[i]?.count || 0,
							},
						};
					});
				console.log('geojson_1km new', t);

				// Update source data to trigger re-render
				source.setData({
					type: 'FeatureCollection',
					features: t,
				});

				updatePolygonsLayers(jenksData);
			} else {
				console.warn('no polygons data', jetCurr);
				loadedNewPols = [];
			}

			//get last one of spAddedToList
		/* 	let addedTaxa = runeStoreTaxCards.spAddedToList[runeStoreTaxCards.spAddedToList.length - 1];
			console.warn(addedTaxa);
			debugger;

			let text = `${addedTaxa.species_n} is being added to the map`;

			toast('Tax added', {
				titleClass: 'text-lg',
				// description: tax.species_n+' is being added to the map...',
				description: text,
				class: 'bg-amber-50 border border-amber-300 text-amber-950',
				descriptionClass: 'text-amber-800',
			}); */
		}
	);

	watch(
		[() => runeStoreTaxCards.spAddedToList, () => loadedNewPols],
		([currTaxa, currLoadedPols], [prevTaxa, prevLoadedPols]) => {
			console.log('currTaxa---', currTaxa, prevTaxa);

			// Show toast when taxa list changes
			let text = '';
			const prevLen = prevTaxa?.length ?? 0;
			const currLen = currTaxa?.length ?? 0;

			if (currLen > prevLen) {
				// Item added
				if (prevLen === 0) {
					text = `${currTaxa[0].species_n} has been added to the map`;
				} else {
					const prevIds = prevTaxa.map((d) => d.tax_id);
					const currIds = currTaxa.map((d) => d.tax_id);
					const addedId = currIds.find((d) => !prevIds.includes(d));
					const added = currTaxa.find((d) => d.tax_id === addedId);
					if (added) {
						text = `${added.species_n} has been added to the map`;
					}
				}
			} else if (currLen < prevLen && prevTaxa) {
				// Item removed
				const prevIds = prevTaxa.map((d) => d.tax_id);
				const currIds = currTaxa.map((d) => d.tax_id);
				const removedId = prevIds.find((d) => !currIds.includes(d));
				const removed = prevTaxa.find((d) => d.tax_id === removedId);
				if (removed) {
					text = `${removed.species_n} has been removed from the map`;
				}
			}

			console.log('text', text, text.length);
			if (text && text.length > 0) {
				toast.success(text, {
					unstyled: false,
					class: "bg-purple-700 text-white",
					descriptionClass: "text-sm font-medium",
					style: "padding: 12px; border-radius: .75rem;"
				});

				/* toast.custom(CustomToast, {
					componentProps: { message: text }
				}); */
			}
			if (prevTaxa && prevTaxa.length > 0) {
				let prevTaxaIds = prevTaxa.map((d) => d.tax_id);
				let currTaxaIds = currTaxa.map((d) => d.tax_id);
				let removedTaxaIds = prevTaxaIds.filter(
					(d) => !currTaxaIds.includes(d)
				);
				console.log('removing popups for previous taxa', prevTaxa);

				removedTaxaIds.forEach((d) => {
					console.log('removing popup for', d);

					// Query all popups with this class using querySelectorAll
					let popups = document.querySelectorAll('.popup-tax-' + d);
					console.log('popups found for tax_id', d, ':', popups.length);

					// Remove each popup
					popups.forEach((popup, index) => {
						console.log('removing popup', index, 'for tax_id', d, popup);
						popup.remove();
					});
				});
			} else {
				console.log('no previous taxa to remove popups');
			}

			if (currLoadedPols.length == 0) {
				console.log('waiting for new polygons to be loaded', currLoadedPols);
				return;
				console.log('not loadedNewPols', prevLoadedPols);
			}

			if (currTaxa.length > 0) {
				console.log('taxa selected', JSON.stringify(currTaxa));
			} else {
				// console.log('no taxa selected',currTaxa);
				return;
			}
			//prevTaxa.length>0 &&
			if (currTaxa.length > 0) {
				console.warn('currTaxa', JSON.stringify(currTaxa));
				console.info(runeStoreTaxCards.spAddedToList);
				console.info(runeStoreTaxCards.spAll);

				let legend = [
					'match',
					['get', 'tax_id'],
					//change accordinglly follwing this schema 'B', '#00ff00',
					//...colorScale.flatMap((color, index) => [toMapObj[index], color][1])
					//currTaxa.(x => x.tax_id, x.color),
					/* ...newToMapObj.flatMap(x => [x.tax_id, x.colorObj.color]), */
				];
				currTaxa.forEach((x) => {
					legend.push(x.tax_id, x.color);
				});

				console.info('legend for species in mainmapspecies', legend);

				let inatLegend = [
					'match',
					['get', 'pngp_tax_id'],
					//  currTaxa.flatMap(x => [x.tax_id, x.color]),
				];
				currTaxa.forEach((x) => {
					inatLegend.push(x.tax_id, x.color);
				});
				legend.push('#000000');
				inatLegend.push('#000000');
				// if (map.getLayer('pngp_obs_simple') && map.setLayoutProperty('pngp_obs_simple', 'visibility', 'visible')) {

				let t = {
					legend: legend,
					inatLegend: inatLegend,
					objects: currTaxa,

					/*  legend:legend,
                colorScale:colorScale,
                ids:toMapObj.map(d=>d.tax_id),
                inatLegend:inatLegend,
                pointsLegendData:tempPointsLegendData */
				};

				// Good (new reference)
				symbolColor = { ...t };


				updatePointsLayers(
					currTaxa.map((d) => d.tax_id),
					loadedNewPols
				);
			} else {
				if (currTaxa.length == 0) {
					console.log('not points data', currTaxa);
					map.setLayoutProperty('pngp_obs_simple', 'visibility', 'none');
					map.setFilter('pngp_obs_simple', null);
					map.setLayoutProperty('pngp_inat', 'visibility', 'none');
					map.setFilter('pngp_inat', null);
					map.setLayoutProperty('pngp_grid_1km_topo', 'visibility', 'none');
					map.setLayoutProperty(
						'pngp_grid_1km_topo_outline',
						'visibility',
						'none'
					);
					symbolColor = {
						legend: [],
						inatLegend: [],
						objects: [],
					};
				}
			}
		}
	);
	// Use watch with lazy: true to prevent double execution
	/* watch([() => fetchedPolygons, () => jenksData, () => loadedPointsIds],
        ([polCurr, jetCurr, loadedPointsIdsCurr], [polPrev, jetPrev, loadedPointsIdsPrev]) => { */
	// Only run after the first change to prevent double execution
	let geojson_1km;
	// Svelte 5 reactive state for popup data
	let popupQueryData = $state(null);
	/* let fetchedPolygons = $derived.by(() => {
  console.log('fetchedPolygons recalculating',runeStore.resultsFetched.polygons)
  if (runeStore.resultsFetched.polygons)
return runeStore.resultsFetched.polygons.sort((a,b)=>a.pol_id-b.pol_id)
return []
}); */
	let _paramsFilter = $derived(runeStore.paramsFilterRunes);
	let popupDataLoading = $state(false);
	let popupDataError = $state(null);
	/* let mountedPopupTaxComponents = $state([]); */
	let mountedPopupGeoComponents = $state([]);

	// State for polygon evolution data
	let popupEvolutionQueryData = $state(null);
	let popupEvolutionDataLoading = $state(false);
	let popupEvolutionDataError = $state(null);
	let currentPopupPolygonId = $state(null);

	let colorScale;

	// Derived state for overlay loading status
	let isLoadingOverlays = $derived(overlayLoadingState.isLoading);
	let overlayError = $derived(overlayLoadingState.error);
	let loadedOverlayCount = $derived(
		Object.keys(overlayLoadingState.loadedOverlays).length
	);

	let previousGeoYearsArray = $state([]);



	// Svelte 5 effect to react to overlay loading completion
	// Track if overlays have been loaded to prevent re-processing on language changes
	let overlaysLoaded = $state(false);

	$effect(() => {
		console.log('Overlay loading state changed:', overlayLoadingState);

		// React when loading is complete and there's no error
		let overlays = Object.keys(overlayLoadingState.loadedOverlays);
		console.log('overlays in effect', overlays);
		if (!overlayLoadingState.isLoading && !overlayLoadingState.error) {
			if (
				overlays.length === layers_new.filter((d) => d.main).length &&
				!overlaysLoaded
			) {
				console.warn('overlays', overlays);
				/*   console.log(map.getStyle().sources)
      console.warn(map.getStyle().layers) */

				/* const loadedOverlays = Object.keys(overlayLoadingState.loadedOverlays);

        if (loadedOverlays.length > 1) {
         */

				// Do something when fetching is done
				/* handleOverlayLoadComplete();
				console.warn(map.getStyle().layers);
				debugger; */
				overlaysLoaded = true; // Mark as loaded to prevent re-processing
				//}
			}
		}

		// React to loading errors
		if (overlayLoadingState.error) {
			console.error('Overlay loading failed:', overlayLoadingState.error);
			handleOverlayLoadError(overlayLoadingState.error);
		}
	});

	// Function to handle when overlay loading is complete
	function handleOverlayLoadComplete() {
		console.log('🎉 All overlays loaded! Performing post-load actions...');
		console.log('🎉 All overlays loaded! Performing post-load actions...');

		// Add your custom logic here for when fetching is done:
		// - Add overlay layers to the map
		// - Update UI state
		// - Trigger other map operations
		// - Show success notifications

		// Example: Add loaded overlays to the map
		Object.entries(overlayLoadingState.loadedOverlays).forEach(
			([id, overlay]) => {
				// console.log(`Processing loaded overlay: ${id}`, overlay.data);

				// Add the overlay as a source and layer to the map

				if (map && overlay.data) {
					try {
						console.warn('Adding source', id, overlay);

						// Add source if it doesn't exist
						if (!map.getSource(`${id}_source`)) {
							map.addSource(`${id}_source`, {
								type: 'geojson',
								data: overlay.data,
							});
						}
						let l = layers_new.find((d) => d.id === id);

						// Add layer if it doesn't exist
						if (l && l.default) {
							if (!map.getLayer(l.id)) map.addLayer(l);

							map.setLayoutProperty(l.id, 'visibility', 'visible');
							console.log(`Added overlay ${id} to map`);
						}

						let lab = id + '_labels';
						let labels = layers_new.find((d) => d.id === lab);

						if (labels) {
							if (!map.getLayer(labels.id)) map.addLayer(labels);

							if (labels.default)
								map.setLayoutProperty(labels.id, 'visibility', 'visible');
						}
					} catch (error) {
						console.error(`Failed to add overlay ${id} to map:`, error);
						debugger;
					}
				}
			}
		);
	}

	// Function to handle overlay loading errors
	function handleOverlayLoadError(error) {
		console.error('🚨 Overlay loading failed:', error);

		// Add your error handling logic here:
		// - Show error notifications
		// - Retry loading
		// - Fallback to default overlays
		// - Update UI to show error state
	}

	function exportMapAsImage() {
		// Wait for map to be idle (all tiles loaded)
		map.once('idle', () => {
			const canvas = map.getCanvas();
			const dataURL = canvas.toDataURL('image/png');

			// Download image
			const link = document.createElement('a');
			link.download = 'map.png';
			link.href = dataURL;
			link.click();
		});

		// Trigger render
		map.triggerRepaint();
	}

	function printMapImage() {
		map.once('idle', () => {
			const canvas = map.getCanvas();
			const dataURL = canvas.toDataURL('image/png');

			// Open in new window and print
			const printWindow = window.open('', '_blank');
			printWindow.document.write(`
        <html>
          <head>
            <title>Print Map</title>
            <style>
              body { margin: 0; }
              img { width: 100%; height: auto; }
              @media print {
                img { max-width: 100%; page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <img src="${dataURL}" onload="window.print(); window.close();" />
          </body>
        </html>
      `);
			printWindow.document.close();
		});

		map.triggerRepaint();
	}


	let layers = [
		{
			id: 'world_background',
			type: 'raster',
			source: 'world_background_source',
			layout: {
				visibility: 'visible',
			},

			"paint": {


            'raster-opacity-transition': {
                duration: 2500

            },
            "raster-opacity": 0,
            /*  "fill-color": "black",
             "fill-outline-color": "#0a670a" */
        }
		},
		/*     {
    id:'pngp_grid_140m_topo',
    type:'fill',
    source:'pngp_grid_140m_topo_source',
    'source-layer':'pngp_grid_140m',
    layout:{
        'visibility':'none'
    },
    paint: {
        "fill-color": "#0080ff",
        "fill-opacity": 0.1
    }
}, */
		{
			id: 'pngp_grid_1km_topo',
			type: 'fill',
			source: 'pngp_grid_1km_topo_source',

			layout: {
				visibility: 'none',
			},
			paint: {
				'fill-color': '#0080ff',
				'fill-opacity': 0.5,
			},
		},
		/*   {
            id:'pngp_grid_140m_topo_outline',
            category:'outline',
            type:'line',
            source:'pngp_grid_140m_topo_source',

            layout:{
                'visibility':'none'
            },
            paint:{
                'line-color':'#fde68a',
                'line-width':.3
            }

        }, */

		{
			id: 'pngp_obs_simple',
			type: 'circle',
			source: 'pngp_obs_simple_source',
			'source-layer': 'pngp_obs_simple',
			layout: {
				visibility: 'none',
			},
			paint: {
				'circle-color': '#7dd4e3',

				//create stops by zoom
				'circle-radius': [
					'interpolate',
					['linear'],
					['zoom'],
					//being 9 full extent
					9,
					2,
					11,
					3,
					15,
					4,
				],
				'circle-stroke-width': [
					'interpolate',
					['linear'],
					['zoom'],
					//being 9 full extent
					9,
					0,
					11,
					0.4,
					15,
					1,
				],
				'circle-stroke-color': '#474545',
			},
		},
		{
			id: 'pngp_inat',
			type: 'circle',
			source: 'pngp_inat_source',
			'source-layer': 'pngp_inat',
			layout: {
				visibility: 'none',
			},
			paint: {
				'circle-color': '#10ebe3',

				//create stops by zoom
				'circle-radius': [
					'interpolate',
					['linear'],
					['zoom'],
					//being 9 full extent
					9,
					5,
					11,
					7,
					15,
					11,
				],
				'circle-stroke-width': [
					'interpolate',
					['linear'],
					['zoom'],
					//being 9 full extent
					9,
					2,
					11,
					2.5,
					15,
					3.5,
				],
				'circle-stroke-color': '#10a2eb',
				'circle-stroke-opacity': 1,
			},
		},
	];
	let sources = [
		{
			id: 'world_background_source',
			type: 'raster',
			tiles: [
				'https://pere.gis-ninja.eu/geoserver/wms?service=WMS&version=1.1.0&request=GetMap&format=image%2Fpng&transparent=true&layers=hsm:world_background&&bbox={bbox-epsg-3857}&width=512&height=512&srs=EPSG:3857&format=image/png',
			],
		},

		/*  {
            id:'pngp_grid_140m_source',
            type:'vector',
            tiles:
                 ["https://pere.gis-ninja.eu/geoserver/gwc/service/wmts?layer=pngp:pngp_grid_140m&tilematrixset=EPSG:900913&Service=WMTS&Request=GetTile&Version=1.0.0&Format=application/x-protobuf;type=mapbox-vector&TileMatrix=EPSG:900913:{z}&TileCol={x}&TileRow={y}"]

        }, */
		{
			id: 'pngp_obs_simple_source',
			type: 'vector',
			tiles: [
				/* 'https://pere.gis-ninja.eu/geoserver/gwc/service/wmts?layer=pngp:pngp_obs_simple&tilematrixset=EPSG:900913&Service=WMTS&Request=GetTile&Version=1.0.0&Format=application/x-protobuf;type=mapbox-vector&TileMatrix=EPSG:900913:{z}&TileCol={x}&TileRow={y}', */
				'https://martin.studiogis.eu/pngp_obs_simple/{z}/{x}/{y}',
			],
		},
		{
			id: 'pngp_inat_source',
			type: 'vector',
			tiles: [
				'https://pere.gis-ninja.eu/geoserver/gwc/service/wmts?layer=pngp:pngp_inat&tilematrixset=EPSG:900913&Service=WMTS&Request=GetTile&Version=1.0.0&Format=application/x-protobuf;type=mapbox-vector&TileMatrix=EPSG:900913:{z}&TileCol={x}&TileRow={y}',
			],
		},
	];
let prevShowInatSpecies = new Previous(() => showInatSpecies);

$effect(() => {
	const newVal = showInatSpecies;
	const prevVal = prevShowInatSpecies.current;

	// Skip if no change or initial run
	if (newVal === prevVal) return;
	if (!map) return;



	let	currTaxa = runeStoreTaxCards.spAddedToList;


	console.log('showInatSpecies changed to', newVal,currTaxa);

	if (newVal === true) {
		if (!map.getLayer('pngp_inat'))
			map.addLayer(layers.find((d) => d.id == 'pngp_inat'));

		let filteredLiteral = currTaxa.map((d) => d.tax_id);

		let inatFilter = [
			'in',
			['get', 'pngp_tax_id'],
			['literal', filteredLiteral],
		];

		console.log('setting inat filter');
		map.setFilter('pngp_inat', inatFilter);

		console.log('resetting possible changes in the radius expression');
		map.setPaintProperty('pngp_inat', 'circle-radius', [
			'interpolate',
			['linear'],
			['zoom'],
			9, 5,
			11, 7,
			15, 11,
		]);
		map.setPaintProperty('pngp_inat', 'circle-stroke-color', '#10a2eb');
		map.setLayoutProperty('pngp_inat', 'visibility', 'visible');
	} else {
		if (map.getLayer('pngp_inat')) {
			map.setLayoutProperty('pngp_inat', 'visibility', 'none');
		}
	}
});
	function generateRadiusExpression2() {
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

		let taxaActive = runeStoreTaxCards.spAddedToList;

		if (taxaActive.length == 0) return baseCircleRadiusExpression;

		const [, , , ...zoomStops] = baseCircleRadiusExpression; // Extract zoom stops
		const expression = ['interpolate', ['linear'], ['zoom']];

		console.warn(taxaActive, 'taxaActive');

		for (let i = 0; i < zoomStops.length; i += 2) {
			expression.push(zoomStops[i]); // zoom level
			let ori_r = zoomStops[i + 1];
			let _this_expression = ['case'];

			taxaActive.forEach((item, i) => {
				let arr = ['==', ['get', 'tax_id'], item.tax_id];
				_this_expression.push(arr);
				_this_expression.push(ori_r * (item.symbology?.radius?.r ?? 1));
			});

			// default radius if no tax_id matches
			_this_expression.push(ori_r);

			expression.push(_this_expression);
		}

		console.log('Final expression:sssss', expression);
		return expression;
	}
	function updatePointsLayers(pointIds, loadedNewPols) {
		//  let _paramsFilter=runeStoreTaxCards.paramsFilterRunes;
		console.trace();
		if (!map) return;

		console.warn('fetchedPolygons in updatePointsLayers', fetchedPolygons);

		let pol_ids = loadedNewPols;
		//let pol_ids=loadedNewPols.sort((a,b)=>a.pol_id-b.pol_id).map(d=>d.pol_id);
		//fetchedPolygons.sort((a,b)=>a.pol_id-b.pol_id).map(d=>d.pol_id);

		/* let spToMapIds=_paramsFilter.toMapIds; */
		if (!map.getLayer('pngp_obs_simple')) {
			debugger;
			map.addLayer(layers.find((d) => d.id == 'pngp_obs_simple'));
			map.setLayoutProperty('pngp_obs_simple', 'visibility', 'none');
		}


		if (map.getLayer('pngp_obs_simple'))
			map.setLayoutProperty('pngp_obs_simple', 'visibility', 'none');

		map.moveLayer('pngp_grid_1km_topo', 'pngp_grid_1km_topo_outline');
		//map.setLayoutProperty('pngp_grid_1km_topo', 'visibility', 'visible');
		map.setLayoutProperty(
			'pngp_grid_1km_topo_outline',
			'visibility',
			'visible'
		);

		/* if (map.getLayer('pngp_obs_simple')){ */
		//map.moveLayer('pngp_obs_simple');



		let filteredLiteral = pointIds;

		//Array.from(runeStoreTaxCards.spAddedToListIds);

		console.log('filteredLiteral', filteredLiteral,showInatSpecies);




		/* map.moveLayer('pngp_inat'); */

		/*  var baseFilter=['all', ['has', 'pol_id'],

                ['in', ['get', 'pol_id'],

              ['literal', [...pol_ids]]],
                ['in', ['get', 'tax_id'],


              ['literal',filteredLiteral]
                ]] */
		var baseFilter = [
			'all',
			['in', ['get', 'tax_id'], ['literal', filteredLiteral]],
		];
		let yearFilter = [];

		console.log('baseFilter', baseFilter);

		//map.setFilter('pngp_obs_simple', baseFilter);

		if (map.getLayer('pngp_obs_simple')) {
			if (symbolColor?.legend?.length > 0) {
				console.log('symbolColor', symbolColor);
				map.setPaintProperty(
					'pngp_obs_simple',
					'circle-color',
					symbolColor.legend
				);

				let RadiusExpression = generateRadiusExpression2();

				map.setPaintProperty(
					'pngp_obs_simple',
					'circle-radius',
					RadiusExpression
				);
				console.log(
					map.getStyle().layers.find((d) => d.id == 'pngp_obs_simple')
				);

				/* map.setPaintProperty(
				'pngp_obs_simple',
				'circle-radius',
				baseCircleRadiusExpression
			); */

				//it willb e visible when runeStoreTaxCards.mapFilters is set!!
				//map.setLayoutProperty('pngp_obs_simple', 'visibility', 'visible');
			}
			map.setLayoutProperty('pngp_obs_simple', 'visibility', 'visible');
		}

		if (map.getLayer('pngp_inat')) {
			if (symbolColor?.legend?.length > 0) {
				console.log('symbolColor', symbolColor);

				map.setPaintProperty(
					'pngp_inat',
					'circle-color',
					symbolColor.inatLegend
				);
				/* map.setLayoutProperty('pngp_inat', 'visibility', 'visible'); */
			}
		}

	   //world_background


	   if (!map.getLayer('world_background')) {
    if (!map.getSource('world_background_source'))
{
    map.addSource('world_background_source', {
        type: 'raster',
        tiles: [
            'https://pere.gis-ninja.eu/geoserver/wms?service=WMS&version=1.1.0&request=GetMap&format=image%2Fpng&transparent=true&layers=hsm:world_background&&bbox={bbox-epsg-3857}&width=512&height=512&srs=EPSG:3857&format=image/png',
        ],
    });
}
        //	debugger;
            map.addLayer(layers.find((d) => d.id == 'world_background'));

        }
        else
        {

        }

        //starting with opacity 1

        map.setPaintProperty('world_background', 'raster-opacity', .85);

setTimeout(() => {



/* 	map.moveLayer('pngp_inat');
    map.moveLayer('pngp_obs_simple');
    map.moveLayer('pngp_areas_valley_4326_line');
    map.moveLayer('pngp_areas_valley_4326_label'); */





        setTimeout(() => {

            map.setPaintProperty('world_background', 'raster-opacity', 0);
            }, 2000);

    //loadedNewPols=false;
}, 500);
	}

	//$inspect($remoteDataStore).with(console.trace);

	function updatePolygonsLayers(jenksData) {
		console.log('jenksData in updatePolygonsLayers', jenksData);
		let basePaint = ['step', ['get', 'count'], jenksData.colors[0]];

		//jenksData.breaks remove first item
		let breaks = jenksData.breaks.slice(1);
		breaks.forEach((d, i) => {
			//console.log('jenksData.colors[i]',jenksData.colors[i],d);
			basePaint.push(d, jenksData.colors[i]);
		});

		console.warn('basePaint in breaks', basePaint);

		if (!map.getLayer('pngp_grid_1km_topo'))
			map.addLayer(layers.find((d) => d.id == 'pngp_grid_1km_topo'));

		map.setPaintProperty('pngp_grid_1km_topo', 'fill-opacity', 0.8);
		map.setPaintProperty('pngp_grid_1km_topo', 'fill-color', basePaint);
		if (showPolygons === true) {
			map.setLayoutProperty('pngp_grid_1km_topo', 'visibility', 'visible');
			map.setLayoutProperty('pngp_grid_1km_topo_outline', 'visibility', 'visible');
		} else {
			map.setLayoutProperty('pngp_grid_1km_topo', 'visibility', 'none');
			map.setLayoutProperty('pngp_grid_1km_topo_outline', 'visibility', 'none');
		}
		map.moveLayer('pngp_grid_1km_topo');


		console.log('layers' ,map.getStyle().layers);

		//loadedNewPols=true;
	}

	let breaksSymbol = $derived.by((d) => {
		return {
			paint: {
				'fill-color': ['step', ['get', 'value']],
				'fill-opacity': 0.8,
			},
		};
	});

	let lastProcessedDataLength = 0;
	let mapContainer;
	onMount(() => {

		// Wait for the Svelte component to be available
		// Only initialize if not already done


		let style ='https://api.maptiler.com/maps/topo-v2/style.json?key=PfeqCqeOXLcGceolGsUb'
//	'https://api.maptiler.com/maps/topo-v2/style.json?key=PfeqCqeOXLcGceolGsUb';
let maxBounds=[
	  new LngLat(7.8664788526199345, 45.27142104025339),
	  new LngLat(7.862639291375302, 45.717987498807474)]
// Initialize map
map = new maplibregl.Map({
  container: mapContainer,
  style: style,
  /* maxBounds: maxBounds, */
  center: [7.37, 45.52],
  zoom: 9.8,

});

		if (map) {
			console.log('map onmount', map);


			fetch('/data/pngp_grid_1km_topo_valley.json')
				.then((res) => res.json())
				.then((topoData) => {
					// Convert a named object (e.g., 'regions') to GeoJSON
					geojson_1km = featureTopojson(topoData, 'pngp_grid_1km_topo_valley');
					console.log('geojson_1km', geojson_1km);
				});

			let mouseovered_grid;
			let polygonPopup = null;
			let popup = null;

			/* 			map.on('idle', () => {
  if (map.isSourceLoaded('pngp_obs_simple_source')) {
    console.log('pngp_obs_simple_source yes fully loaded');
  }
  else
  {
	console.log('xx pngp_obs_simple_source NOT fully loaded');
  }
}); */

			let pointsTimeout = null;
			let pointsTimeoutFunction = (e) => {
				// Clear any existing timeout
				if (pointsTimeout) {
					console.warn('Clearing previous timeout:', pointsTimeout);
					clearTimeout(pointsTimeout);
					pointsTimeout = null;
				}

				// Set new timeout - only runs once per event
				pointsTimeout = setTimeout(() => {
					if (e.isSourceLoaded && pointsTimeout) {
						console.log(
							'Timeout completed for pngp_obs_simple_source after 1500ms'
						);
						pointsTimeout = null; // Clear reference after completion
						// Add any action that should happen after timeout here
					}
				}, 1500);
			};

			map.on('datax', function (e) {
				//if (e.isSourceLoaded) {
				if (e.dataType === 'source') {
					if (e.sourceId === 'pngp_obs_simple_source') {
						if (e.isSourceLoaded) {
							console.log('xx pngp_obs_simple_source YES is loaded');
							//	pointsTimeoutFunction(e);
						} else {
							console.log('xx pngp_obs_simple_source NO is loaded');
							pointsTimeoutFunction(e);
						}
					}
				}
			});

			map.on('mouseleave', 'pngp_grid_1km_topo', function (e) {
				/*    if (polygonPopup)
    {

      polygonPopup.remove();
      polygonPopup=null;
    } */
			});
			let htmlContent;

			map.on('style.load', () => {
				console.log('style.load');
				if (!map.getSource('terrain-data-dem')) {
					map.addSource('terrain-data-dem', {
						type: 'raster-dem',
						url: 'https://api.maptiler.com/tiles/terrain-rgb/tiles.json?key=PfeqCqeOXLcGceolGsUb',
						// optionally tileSize / maxzoom depending on source spec
					});
				}

				map.addLayer({
					id: 'terrain-data',
					type: 'color-relief',
					source: 'terrain-data-dem',
					layout: {
						visibility: 'visible',
					},
				});

				// 2. Apply terrain block
				map.setTerrain({
					source: 'terrain-data-dem',
					exaggeration: 0,
				});

				// 3. Reapply pitch
				map.setPitch(0);

				// 4. Reapply maxBounds after style loads (bounds get reset on style reload)
				if (initialMaxBounds) {
					map.setMaxBounds(PNGP_BOUNDS);
					alert('🔒 Reapplied maxBounds after style.load');
				}
				//console.log('selview on styledata', selView);
				//if (selView == '3d') applyTerrain();
			});

			/* map.on('zoomend', function () {
				console.log('selview zoomend styledata', selView);
				if (selView == '3d') applyTerrain();
			}); */

			function captureHTML(node) {
				htmlContent = node.innerHTML;
				return {
					update() {
						htmlContent = node.innerHTML;
					},
				};
			}
			// $inspect(loadedPointsIds); // Disabled for performance
			document
				.querySelector('.print-map')
				.addEventListener('click', function () {
					console.log('clicked on print map');
					exportMapAsImage();
				});

			map.on('click', 'pngp_obs_simple', function (e) {
				/* clickingPol=false; */
				console.log('clicked on pngp_obs_simple', e);

				let features = map.queryRenderedFeatures(e.point);


				if (features.length > 0) {
					let feature = features[0];

					// Point geometry - coordinates are already the point
					let [lng, lat] = feature.geometry.coordinates;

					let latLng=[lng, lat];

					let activeIds = selTaxObjs.map((d) => d.tax_id);
					if (!activeIds.includes(feature.properties.tax_id)) return false;

					console.log('features', features, selTaxObjs, activeIds);
					/*    if (polygonPopup)
    {

       polygonPopup.remove();
      polygonPopup=null;
    } */

					let properties = feature.properties;
					console.log('properties', properties);
					let [...fields] = Object.keys(properties);
					let tax_id = properties.tax_id;
					let tax_data = findTaxById(tax_id);


					let values = fields.map((field) => properties[field]);
					console.log('values', values);
					let html = '';

					html += `<PopupTaxCard tax={tax_data} />`;

					/* the mount function is Svelte 5’s programmatic way of instantiating and attaching a component in JavaScript without needing to include it in another .svelte file.
What mount does in Svelte 5
Takes a compiled Svelte component (PopupTaxCard in your case)
Creates a new instance of it
Renders it into a given DOM element (target)
Applies initial props to it ({ tax: tax_data } here)
Returns the component instance so you can interact with it later (e.g., update props, destroy it) */
					// Create new popup container
					const container = document.createElement('div');

					// Create Svelte component instance using Svelte 5 mount function
					const component = mount(TestPopupTax, {
						target: container,
						props: { inat: false, tax: tax_data, properties: properties },
					});

					// Attach to MapLibre popup
					popup = new Popup({
						className: 'taxa-popup popup-tax-' + properties.tax_id,
						anchor: 'top',
						closeButton: true,
						closeOnClick: false,
						offset: 2,
					})
						.setLngLat(latLng)
						.setDOMContent(container) // Uses DOM node, not HTML string
						.addTo(map);

					/* clickingPol=true; */

					// Clean up component when popup closes
					popup.on('close', () => {
						if (component) {
							unmount(component);
						}
					});
					/*  {
    "altitude": 2188.3,
    "data_qua_1": "Number of individuals is unknown",
    "data_quality": 7,
    "gid": 118906,
    "month": 4,
    "obs": 230288,
    "pol_140m_id": 9283,
    "pol_id": 753,
    "sign_code": "Avvistamento diretto",
    "tax_id": 2,
    "tax_level": "species",
    "timestamp": "2015/04/25 16:00:00.000",
    "valley": "Cogne",
    "valley_id": 1,
    "x_coord_32": 374184,
    "y_coord_32": 5046892,
    "year": 2015
} */
				} else {
					console.log('no features found');
				}
			});
			map.on('click', 'pngp_inat', function (e) {
				/* clickingPol=false; */
				console.log('clicked on pngp_inat', e);
				let features = map.queryRenderedFeatures(e.point);
				console.log('features', features);
				if (features.length > 0) {
					/*    if (polygonPopup)
    {

       polygonPopup.remove();
      polygonPopup=null;
    } */
					let feature = features[0];
					console.log('feature', feature);
					let properties = feature.properties;
					console.log('properties', properties);
					let tax_id = properties.pngp_tax_id;
					let tax_data = findTaxById(tax_id);
					console.log('tax_data from popup', tax_data);

					let [...fields] = Object.keys(properties);

					console.log('tax_data from popup', tax_data);
					console.log('fields', fields);
					let values = fields.map((field) => properties[field]);
					console.log('values', values);

					const container = document.createElement('div');

					// Create Svelte component instance using Svelte 5 mount function
					const component = mount(TestPopupTax, {
						target: container,
						props: { inat: true, tax: tax_data, properties: properties },
					});

					// Attach to MapLibre popup
					popup = new Popup({
						anchor: 'top',
						closeButton: true,
						closeOnClick: true,
						offset: 5,
					})
						.setLngLat(e.lngLat)
						.setDOMContent(container) // Uses DOM node, not HTML string
						.addTo(map);

					clickingPol = true;

					// Clean up component when popup closes
					popup.on('close', () => {
						if (component) {
							unmount(component);
						}
					});
					/*   console.log('fields',fields);
      let values=fields.map((field)=>properties[field]);
      console.log('values',values);
      let html='';
      html+=`<PopupTaxCard tax={tax_data} />`; */
				}
			});

			async function getPolData(pol_id) {
				console.log('getPolData', pol_id);

				// Set loading state
				popupDataLoading = true;
				popupDataError = null;

				try {
					console.info(
						'runeStoreTaxCards.spAddedToList',
						runeStoreTaxCards.spAddedToList
					);

					let ids = runeStoreTaxCards.spAddedToList
						.map((d) => d.tax_id)
						.join(',');
					//_paramsFilter.toMapIds.join(',');
					let years = _paramsFilter.valleysArray.join(',');
					let valleys = _paramsFilter.valleysArray.join(',');

					const response = await fetch(
						`https://pere.gis-ninja.eu/pngp_phps_new/getPointsPolById.php?ids=${ids}&years=${years}&valleys=${valleys}&pol_id=${pol_id}&grid=pngp_grid_1km_topo`,
						{
							method: 'GET',
							headers: {
								'Content-Type': 'application/json',
							},
						}
					);

					if (!response.ok) {
						throw new Error(`HTTP error! status: ${response.status}`);
					}

					let result = await response.json();
					popupQueryData = result;

					console.log('✅ getPolData completed successfully:', result);
					return result;
				} catch (error) {
					console.error('❌ Error in getPolData:', error);
					popupDataError = error.message;
					throw error;
				} finally {
					popupDataLoading = false;
				}
			}

			// Svelte 5 effect to react when popup data is loaded
			$effect(() => {
				console.log('Popup data state changed:', {
					loading: popupDataLoading,
					error: popupDataError,
					data: popupQueryData,
				});

				// Do something when data is successfully loaded
				if (!popupDataLoading && !popupDataError && popupQueryData) {
					handlePopupDataLoaded(popupQueryData);
				}

				/*    // Handle loading state
    if (popupDataLoading) {
      handlePopupDataLoading();
    }

    // Handle error state
    if (popupDataError) {
      handlePopupDataError(popupDataError);
    } */
			});

			// Auto-trigger evolution data fetch when polygon ID changes
			$effect(() => {
				console.log('currentPopupPolygonId from effect', currentPopupPolygonId);
				if (currentPopupPolygonId !== null) {
					console.log(
						'🎯 Auto-triggering evolution data for polygon:',
						currentPopupPolygonId
					);
					triggerGetPolEvolutionData(currentPopupPolygonId);
				}
			});

			// Function to handle when popup data is successfully loaded
			function handlePopupDataLoaded(data) {
				console.log('🎉 Popup data loaded successfully!', data);

				// Add your custom logic here for when the Promise is done:
				// - Update the popup content with the new data
				// - Show detailed information
				// - Create charts or visualizations
				// - Update other components

				// Example: Update popup content if it exists
				if (polygonPopup && polygonPopup.isOpen()) {
					const newContent = createPopupContentWithData(data);
					polygonPopup.setHTML(newContent);
				}
			}

			// Function to handle loading state
			function handlePopupDataLoading() {
				console.log('⏳ Loading popup data...');

				// Add loading indicator to popup if needed
				if (polygonPopup && polygonPopup.isOpen()) {
					const loadingContent = '<div>Loading detailed data...</div>';
					polygonPopup.setHTML(
						polygonPopup.getElement().innerHTML + loadingContent
					);
				}
			}

			// Function to handle error state
			function handlePopupDataError(error) {
				console.error('🚨 Error loading popup data:', error);

				// Show error in popup if needed
				if (polygonPopup && polygonPopup.isOpen()) {
					const errorContent = `<div style="color: red;">Error loading data: ${error}</div>`;
					polygonPopup.setHTML(
						polygonPopup.getElement().innerHTML + errorContent
					);
				}
			}

			// Helper function to create rich popup content with data
			function createPopupContentWithData(data) {
				if (!data || !Array.isArray(data)) {
					return '<div>No data available</div>';
				}

				const recordCount = data.length;
				let dataTax = data
					.map((d) => {
						let tax = findTaxById(d.tax_id);
						let raw = $state.raw(tax);
						console.log('raw', raw);

						return {
							...d,
							...raw,
						};
					})
					.sort((a, b) => b.count - a.count);
				console.log('dataTax', dataTax);

				const species = [
					...new Set(dataTax.map((d) => d.species_n || 'Unknown name')),
				];

				return `
      <aside class="p-0.5 bg-background">
        <div>
          <span class="text-lg text-amber-500">${dataTax.reduce((acc, d) => acc + d.count, 0)}</span> records</div>
        <div class="border-b border-gray-200 pb-1"><span class="text-lg">${species.length}</span> different species</div>

        <div style="max-height: 200px; overflow-y: auto; mt-2">


          ${dataTax
						.map(
							(record) => `
          <div style="flex flex-row gap-2 border-b border-gray-200 pb-1">


            <div class="text-xs">${record.species_n || 'Unknown'}  (${record.pngp_data?.name_it || 'Unknown'})</div>
           <div class="text-sm"> ${record.count} records</div>



           </div>
          `
						)
						.join('')}

        </div>
      </aside>
    `;
			}

			/* 	watch(
				() => runeStoreTaxCards.filterMapParams,
				(newParams, oldParams) => {
					if (!oldParams) return;
console.log('runeStoreTaxCards.filterMapParams xxx', newParams, oldParams);

					if (newParams !== oldParams) {

						debugger;
						console.log('runeStoreTaxCards.filterMapParams changedssss', newParams, oldParams);
						runeStoreTaxCards.fetchFilteredBasicStats();
					}

				}
			); */

			watch(
				() => runeStoreTaxCards.mapFilters,
				(newParams, oldParams) => {
					if (!map.getLayer('pngp_obs_simple')) return;
					map.setLayoutProperty('pngp_obs_simple', 'visibility', 'none');

					setTimeout(() => {
						if (newParams && newParams.length > 0) {
							console.log(map.getStyle().layers);

							map.setFilter('pngp_obs_simple', newParams);
							map.setLayoutProperty('pngp_obs_simple', 'visibility', 'visible');
						} else {
							return;
						}
						console.trace('runeStoreTaxCards.filterMapParams trace');
						console.log(
							'🔄 runeStoreTaxCards.filterMapParams changed to:',
							newParams
						);
					}, 1000);
					/* let b = map.getFilter('pngp_obs_simple');
					console.log('Previous filter:', b); */
					if (map.getLayer('pngp_grid_1km_topo')) {
						let data = runeStoreTaxCards.filterMapParams.valleysArray;
						let pol_ids = runeStoreTaxCards.filterMapParams.pol_ids;
						if (pol_ids && pol_ids.length > 0) {
							//meaning we have applied a filter in mapfilters
							console.log(data);

							let filter = [
								'in',
								['get', 'pol_id'],
								['literal', [...pol_ids.map((d) => d.pol_id)]],
							];

							map.setFilter('pngp_grid_1km_topo', filter);
							map.setFilter('pngp_grid_1km_topo_outline', filter);
						} else {
							map.setFilter('pngp_grid_1km_topo', null);
							map.setFilter('pngp_grid_1km_topo_outline', null);
						}
					}

					/* 	['yearsArray', 'valleysArray'].forEach((param) => {
						let data = newParams[param];
						console.log('param', param);
						if (data && data.length > 0) {
							let filter = [
								'in',
								['get', param === 'yearsArray' ? 'year' : 'valley'],
								['literal', [...data]],
							];
							//remove previous filter if exists
							b = b.filter((d) => {
								if (
									Array.isArray(d) &&
									d[1] &&
									d[1][1] == (param === 'yearsArray' ? 'year' : 'valley')
								) {
									return false;
								}
								return true;
							});
							b.push(filter);
							console.log('Added filter for', param, filter);
						}
					}); */

					/* let years = newParams.yearsArray;
          let valleys = newParams.valleysArray; */
					/* map.setFilter('pngp_obs_simple', newParams);

					map.setLayoutProperty('pngp_obs_simple', 'visibility', 'visible'); */
				}
			);

			watch(
				() => this_interface,
				(newInterface, prevInterface) => {
					console.log('🔄 paramsFilter.interface changed:', newInterface);
					console.log(
						'🎯 About to hit debugger - paramsFilter.interface changed!'
					);
				}
			);
			$effect(() => {
				if (!this_interface == 'geoanalysis') return;
				if (
					_polygonStore.initialFetch !== true &&
					previousGeoYearsArray.length > 0 &&
					previousGeoYearsArray !==
						_polygonStore.paramsFilterPolygons.yearsArray
				) {
					console.log(
						'years array changed from mainmap',
						previousGeoYearsArray,
						'to',
						_polygonStore.paramsFilterPolygons.yearsArray
					);

					//if years length php will return empty array
					triggerGetPolEvolutionData(currentPopupPolygonId);

					//popupEvolutionQueryData=null;

					/*   console.log('years array changed from mainmap',previousGeoYearsArray,'to',_polygonStore.paramsFilterPolygons.yearsArray); */
					/*  if (map.getLayer('pngp_obs_simple'))
      map.setLayoutProperty('pngp_obs_simple', 'visibility', 'none');
      if (map.getLayer('pngp_inat'))
      map.setLayoutProperty('pngp_inat', 'visibility', 'none'); */

					//  document.querySelector('.polygon-popup').remove();

					/*   mountedPopupGeoComponents.forEach(component => {
      try {
        unmount(component);
      } catch (error) {
        console.warn('Error unmounting component:', error);
      }
    }); */
					// Create new array reference to ensure reactivity
					mountedPopupGeoComponents = [];
					/* previousGeoYearsArray=_polygonStore.paramsFilterPolygons.yearsArray;
      triggerGetPolEvolutionData(currentPopupPolygonId); */
				}
				/* console.log('getParamsChanged from mainmap',getParamsChanged())
    console.log('_polygonStore.paramsFilterPolygons.yearsArray from mainmap',_polygonStore.paramsFilterPolygons.yearsArray);
    console.log('popupEvolutionQueryData',popupEvolutionQueryData); */
			});

			async function getPolEvolutionData(pol_id) {
				popupEvolutionDataLoading = true;
				popupEvolutionDataError = null;
				try {
					previousGeoYearsArray = _polygonStore.paramsFilterPolygons.yearsArray;
					//let years=untrack(()=>_polygonStore.paramsFilterPolygons.yearsArray);
					let years = _polygonStore.paramsFilterPolygons.yearsArray;
					console.log('years', years, previousGeoYearsArray);
					if (years.length == 0) popupEvolutionQueryData = null;

					const response = await fetch(
						`https://pere.gis-ninja.eu/pngp_phps_new/get_counts_year_evolution2.php?years=${years}&pol_id=${pol_id}`,
						{
							method: 'GET',
							headers: {
								'Content-Type': 'application/json',
							},
						}
					);

					if (!response.ok) {
						throw new Error(`HTTP error! status: ${response.status}`);
					}

					let result = await response.json();

					console.log('🔥 Raw API response:', result);
					console.log('🔥 Result type:', typeof result);
					console.log('🔥 Is result array?', Array.isArray(result));

					let obj = {
						years: years.length > 0 ? years : null,
						pol_id: pol_id,
						data: result,
					};

					popupEvolutionQueryData = obj;

					console.log('✅ getPolEvolutionData completed successfully:', obj);

					if (obj.data.length == 0) {
						if (map.getLayer('pngp_obs_simple'))
							map.setLayoutProperty('pngp_obs_simple', 'visibility', 'none');
					}
					return obj;
				} catch (error) {
					console.error('❌ Error in getPolEvolutionData:', error);
					popupEvolutionDataError = error.message;
					throw error;
				} finally {
					popupEvolutionDataLoading = false;
				}
			}

			let triggerGetPolEvolutionData = function (pol_id) {
				setTimeout(async () => {
					try {
						//   console.log('Starting getPolData for pol_id:', f.properties.pol_id);
						await getPolEvolutionData(pol_id);
						// The $effect will automatically handle the result when popupQueryData changes
						console.log(
							'getPolData completed, data will be processed by $effect'
						);
					} catch (error) {
						console.error('Failed to get polygon data:', error);
					}
				}, 100);
			};
			//map.on('click','pngp_obs_simple',
			/* function(e){
    console.log('clicked on pngp_obs_simple',e)
    let features = map.queryRenderedFeatures(e.point);
    console.log('features',features);
    if (features.length > 0) { */
			map.on(
				'click',

				function (e) {
					if (!clickingPol) return;

					let features = map.queryRenderedFeatures(e.point);
					console.log('features', features);

					//popup

					let f = features.find((d) => d.layer.id == 'pngp_grid_1km_topo');
					if (f) {
						/* if (f.properties.id==mouseovered_grid)
        return;




        mouseovered_grid=f.properties.id; */

						//popup
						map.getCanvas().style.cursor = 'pointer';
						//map.getCanvas().style.backgroundColor = 'red';
						//remove previous popups dont invent functions

						if (polygonPopup) {
							/* polygonPopup.remove();
      polygonPopup=null; */
						}
						//create a popup
						polygonPopup = new Popup({
							anchor: 'bottom',
							closeButton: true,
							closeOnClick: false,
							className: 'polygon-popup',
							offset: 10,
						}).setLngLat(e.lngLat);
						// .setHTML('Polygon with <h3>' + f.properties.count + '</h3> records');
						polygonPopup.addTo(map);

						//execute getPolData with proper Promise handling
						setTimeout(async () => {
							try {
								console.log(
									'Starting getPolData for pol_id:',
									f.properties.pol_id
								);
								await getPolData(f.properties.pol_id);
								// The $effect will automatically handle the result when popupQueryData changes
								console.log(
									'getPolData completed, data will be processed by $effect'
								);
							} catch (error) {
								console.error('Failed to get polygon data:', error);
							}
						}, 100);
						//do a php call
						//getPolData
					} else {
						//mouseovered_grid=null;
						map.getCanvas().style.cursor = 'default';
						//if (polygonPopup)
						// polygonPopup.remove();
					}
				}
			);

			// This is the MapLibre GL JS map instance
			console.log('Map component mounted:', map);

			console.log('MapLibre GL JS instance:', map);
			map.on('load', async () => {
				console.log('Map loaded');
				map.scrollZoom.disable();

				// Create custom HTML element for marker
				const markerElement = document.createElement('div');
				markerElement.className = 'custom-marker';
				markerElement.innerHTML = 'P.N. Gran Paradiso';

				let marker = new Marker({
					element: markerElement,
					anchor: 'center',
				})
					.setLngLat([7.37, 45.92])
					.addTo(map);

					map.addSource('pngp_area_source', {
					type: 'vector',
					tiles: [
						'https://pere.gis-ninja.eu/geoserver/gwc/service/wmts?layer=pngp:pngp_area&tilematrixset=EPSG:900913&Service=WMTS&Request=GetTile&Version=1.0.0&Format=application/x-protobuf;type=mapbox-vector&TileMatrix=EPSG:900913:{z}&TileCol={x}&TileRow={y}',
					],
				});

				map.addSource('pngp_areas_valley_source', {
					type: 'vector',
					tiles: [
						'https://pere.gis-ninja.eu/geoserver/gwc/service/wmts?layer=pngp:pngp_areas_valley_4326&tilematrixset=EPSG:900913&Service=WMTS&Request=GetTile&Version=1.0.0&Format=application/x-protobuf;type=mapbox-vector&TileMatrix=EPSG:900913:{z}&TileCol={x}&TileRow={y}',
					],
				});

				map.addLayer({
					id: 'pngp_area_line',
					type: 'line',
					source: 'pngp_area_source',
					'source-layer': 'pngp_area',

					paint: {
						'line-color': '#10913f',
						'line-opacity': 1,
						'line-width': [
							'interpolate',
							['linear'],
							['zoom'],

							9,
							2,
							11,
							0
						],
					},
					layout: {
						visibility: 'visible',
					},
				});

				map.addLayer({
					id: 'pngp_areas_valley_4326_line',
					type: 'line',
					source: 'pngp_areas_valley_source',
					'source-layer': 'pngp_areas_valley_4326',

					paint: {
						'line-color': '#10913f',
						'line-opacity': 1,
						'line-width': [
							'interpolate',
							['linear'],
							['zoom'],

							9,
							0,
							11,
							5,
							15,
							8,
						],
					},
					layout: {
						visibility: 'visible',
					},
				});

				map.addLayer({
					id: 'pngp_areas_valley_4326_label',
					type: 'symbol',
					source: 'pngp_areas_valley_source',
					'source-layer': 'pngp_areas_valley_4326',

					paint: {
						'text-color': '#10913f',
						'text-halo-color': '#f5f3ed',
						'text-halo-width': 25,
					},
					layout: {
						visibility: 'visible',
						'text-field': '{valley_name}',
						'text-justify': 'auto',

						// Collision detection settings
						'text-allow-overlap': false, // Don't allow labels to overlap
						'text-ignore-placement': false, // Respect collision detection
						'text-optional': false, // Don't show label if it collides

						// Multiple anchor positions for smart repositioning
						'text-variable-anchor': [
							'center',
							'top',
							'bottom',
							'left',
							'right',
						],
						'text-radial-offset': 0.5, // Distance from anchor when repositioning

						// Spacing and placement
						'text-padding': 40, // Minimum space around labels (pixels)
						'symbol-spacing': 850, // Minimum distance between repeated labels

						// Text styling
						'text-transform': 'uppercase',
						'text-font': ['Open Sans Regular'],
						'text-size': [
							'interpolate',
							['linear'],
							['zoom'],
							8,
							0,
							9,
							12,
							11,
							15,
							15,
							20,
						],
						'text-max-width': 10, // Max width before wrapping (in ems)
					},
				});

				//this way we can access the map from the store !!??

				mapStore.mapStored = map;

				console.log('Style:', map.getStyle());

				sources.forEach((source, index) => {
					map.addSource(source.id, source);
				});
				/* if (runeStore.paramsFilter.interface == 'taxsearch')
                    { */
				map.addLayer(layers.find((d) => d.id == 'pngp_obs_simple'));

				map.addLayer(layers.find((d) => d.id == 'pngp_inat'));

				//}

				if (geojson_1km) {
					map.addSource('pngp_grid_1km_topo_source', {
						type: 'geojson',
						data: geojson_1km,
					});

					map.addLayer({
						id: 'pngp_grid_1km_topo',
						type: 'fill',
						source: 'pngp_grid_1km_topo_source',

						layout: {
							visibility: 'none',
						},
						paint: {
							'fill-color': '#0080ff',
							'fill-opacity': 0.5,
						},
					});

					map.addLayer({
						id: 'pngp_grid_1km_topo_outline',
						type: 'line',
						source: 'pngp_grid_1km_topo_source',

						layout: {
							visibility: 'none',
						},
						paint: {
							'line-color': '#adabaa',
							'line-opacity': 1,
							'line-width': 1,
						},
					});
					runeStoreTaxCards.loadingMap = false;

					mapStore.mapStored = map;

					try {
						await fetchOverlaysFunction2('pngp_areas_survey');
						console.log('Overlay loaded successfully');
					} catch (error) {
						console.error('Failed to load overlay:', error);
					}

					try {
						await fetchOverlaysFunction2('pngp_areas_valley');

						console.log('Overlay loaded successfully2');
						console.warn(map.getStyle().layers);
						/* 	    setTimeout(()=>{
                  runeStoreTaxCards.setAddedToList(124)
                },1000) */
					} catch (error) {
						console.error('Failed to load overlay:', error);
					}
				}

				//$mapInitialized=true;

				// Add your custom map logic here
			});

			map.on('zoomNO', () => {
				let zoom = map.getZoom();

				if (map?.getZoom() > 5.2) {
					console.log('map bounds', map.getBounds());
					let canvas = map.getCanvas();
					let bbox = [
						[0, 0], // top-left
						[canvas.width, canvas.height], // bottom-right
					];
					console.log('Bounding box:', bbox);
					console.log(map.getZoom());

					if (map.getZoom() > 5) {
						//  console.log('Zoom level is greater than 5');
						// Get bounding box of the viewport
						// Query features currently rendered in viewport from visible layers
					} else {
						//     console.log('Zoom level is less than or equal to 5');
						// Handle zoom level less than or equal to 5
					}
				}
			});
			// $mapInitialized=true;
		}
	});

	onDestroy(() => {
		console.log('map destroyediing??');
		if (map) {
			console.log('map destroyed');
			/*  cachedMapState = {
                zoom: map.getZoom(),
                center: map.getCenter().toArray()
            }; */
		}

		// Clean up all mounted popup components
		console.log(
			'Cleaning up mounted popup components:',
			mountedPopupGeoComponents.length
		);
		mountedPopupGeoComponents.forEach((component) => {
			try {
				unmount(component);
			} catch (error) {
				console.warn('Error unmounting component:', error);
			}
		});
		mountedPopupGeoComponents = [];
	});

	// Base styles
	const STYLES = [
		{
			name: 'test',
			style:
				'https://api.maptiler.com/maps/6895d5d6-772c-4d2f-afb3-1ea0d5978885/style.json?key=PfeqCqeOXLcGceolGsUb',
		},

		{
			name: 'hybrid-v4',
			style:
				'https://api.maptiler.com/maps/hybrid-v4/style.json?key=PfeqCqeOXLcGceolGsUb',
		},
		{
			name: 'Landscape',
			style:
				'https://api.maptiler.com/maps/landscape/style.json?key=PfeqCqeOXLcGceolGsUb',
		},

		{
			name: 'Backdrop',
			style:
				'https://api.maptiler.com/maps/backdrop/style.json?key=PfeqCqeOXLcGceolGsUb',
		},
		{
			name: 'Topo',
			style:
				'https://api.maptiler.com/maps/topo-v2/style.json?key=PfeqCqeOXLcGceolGsUb',
		},
		{
			name: 'Satellite',
			style:
				'https://api.maptiler.com/maps/satellite/style.json?key=PfeqCqeOXLcGceolGsUb',
		},
		{
			name: 'Satellite Hybrid',
			style:
				'https://api.maptiler.com/maps/satellite-hybrid/style.json?key=PfeqCqeOXLcGceolGsUb',
		},
		{
			name: 'Satellite Streets',
			style:
				'https://api.maptiler.com/maps/satellite-streets/style.json?key=PfeqCqeOXLcGceolGsUb',
		},
		{
			name: 'Streets',
			style:
				'https://api.maptiler.com/maps/streets/style.json?key=PfeqCqeOXLcGceolGsUb',
		},
		{
			name: 'Streets Hybrid',
			style:
				'https://api.maptiler.com/maps/streets-hybrid/style.json?key=PfeqCqeOXLcGceolGsUb',
		},
		{
			name: 'Streets Hybrid',
			style:
				'https://api.maptiler.com/maps/streets-hybrid/style.json?key=PfeqCqeOXLcGceolGsUb',
		},
		{
			name: 'Voyager',
			style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
		},
		{
			name: 'Positron',
			style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
		},
		{
			name: 'Dark Matter',
			style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
		},
		{ name: 'Demo Tiles', style: 'https://demotiles.maplibre.org/style.json' },
	];
	let name = $state('Topo');
	let style = $derived(STYLES.find((d) => d.name === name)?.style);
	let handleMapLoad = (event) => {
		console.log('Map loaded event:', event);
		mapStore.mapStored = event.detail.map;
		console.log('Map stored in mapStore:', mapStore.mapStored);
	};
	/* {
    "_sw": {
        "lng": 7.0072684005718315,
        "lat": 45.259844387327405
    },
    "_ne": {
        "lng": 7.636945409641669,
        "lat": 45.729904625764505
    }
} */

	let maxBounds = [
		new LngLat(6.8664788526199345, 45.27142104025339),
		new LngLat(7.862639291375302, 45.717987498807474),
	];

	/*  let maxBounds=[
  [7.017167307336564, 45.31421340780824],  // southwest
  [7.6981804608430195, 45.70323798220039]  // northeast
]; */

	/* 	let symb=$derived(runeStoreTaxCards.spAll.filter(d=>runeStoreTaxCards.spAddedToListIds.has(d.tax_id)));
	$inspect('symb inspected', JSON.stringify(symb)); */
</script>

{#if !mapReady}
	<!-- <div class="absolute top-4 right-4 z-10 bg-green-500 text-white px-3 py-2 rounded-md shadow-lg">
    ✅ Map Ready ({typeof map})
</div>
{:else}
<div class="absolute top-4 right-4 z-10 bg-orange-500 text-white px-3 py-2 rounded-md shadow-lg">
    ⏳ Waiting for map...
</div> -->
{/if}

<!-- Popup Data Loading Indicators -->
<!-- {#if popupDataLoading}
<div class="absolute top-4 left-4 z-10 bg-blue-500 text-white px-3 py-2 rounded-md shadow-lg">
    <div class="flex items-center gap-2">
        <Jumper size="16" color="#ffffff" unit="px" duration="1s" />
        Loading popup data...
    </div>
</div>
{/if}

{#if popupDataError}
<div class="absolute top-4 left-4 z-10 bg-red-500 text-white px-3 py-2 rounded-md shadow-lg">
    ❌ Error: {popupDataError}
</div>
{/if}

{#if popupQueryData && !popupDataLoading}
<div class="absolute top-16 left-4 z-10 bg-green-500 text-white px-3 py-2 rounded-md shadow-lg opacity-90">
    ✅ Popup data loaded ({Array.isArray(popupQueryData) ? popupQueryData.length : 'N/A'} records)
</div>
{/if} -->

<!-- <CountsLegend /> -->
<!-- {#if _polygonStore.loadingMap || runeStoreTaxCards.loadingMap } -->
{#if loadingMap2}
	<div
		class="flex items-center justify-center min-h-screen gap-2 bg-gray-600 w-full"
	>
		<LoaderCircle class="h-12 w-12 animate-spin text-primary" />
		<span class="text-sm text-muted-foreground">Loading...</span>
	</div>
{/if}
{#key galleryMountKey}
	<div class:hidden={!viewAsGallery.active}>
		<SpeciesGrid {newviewAsGallery} />
	</div>
{/key}

<!-- <div class="mb-3 flex items-center justify-between">
    <RadioGroup.Root bind:value={name} class="flex flex-row gap-x-3">
            {#each STYLES as {name,style} (name)}
        <div class="flex items-center space-x-1">
          <RadioGroup.Item value={name} id={name} />
          <Label class="cursor-pointer" for={name}>{name}</Label>
        </div>
      {/each}
    </RadioGroup.Root>


  </div> -->

<!--   let f ={
    "_sw": {
        "lng": 7.017167307336564,
        "lat": 45.31421340780824
    },
    "_ne": {
        "lng": 7.6981804608430195,
        "lat": 45.70323798220039
    }
} -->
<div class="h-full w-full overflow-hidden relative">
<div class="h-full w-full relative">
	{#if runeStoreTaxCards.spAddedToList.length === 0 && tooltipOpen && !initialMaxBounds}
		<div
			in:fade
			class="absolute top-1/3 left-[20%] transform -translate-x-1/2 -translate-y-1/2 z-50"
		>
			<Tooltip.Provider>
				<Tooltip.Root>
					<Tooltip.Trigger class="cursor-default">
						<div
							class="bg-background border-2 border-pngp rounded-lg p-2 shadow-lg flex flex-row items-start"
						>
							<div class="flex items-center justify-center gap-2">
								<svg
									class="w-10 h-4 text-pngp animate-bounce-horizontal"
									viewBox="0 0 20 20"
									fill="none"
									stroke="currentColor"
									stroke-width="3.5"
								>
									<path
										d="M19 12H5M5 12l7 7M5 12l7-7"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
								<div
									class="items-center justify-center max-w-[300px] gap-0 flex flex-col"
								>
									<span class="text-xl m-2"> Welcome to the map! </span>
									<span>Start exploring species selecting from this list </span>
								</div>
							</div>
							<XIcon
								class="ml-auto size-4 hover:cursor-pointer hover:text-red-500 transition-colors "
								onclick={() => handleCloseTooltip()}
							/>
						</div>
					</Tooltip.Trigger>
				</Tooltip.Root>
			</Tooltip.Provider>
		</div>
	{/if}
</div>
	<div bind:this={mapContainer} class="absolute inset-0">


<div
	class="absolute top-15 left-[40%] h-5 items-center justify-center z-10 p-1 text-xs"
>
	<ButtonGroup.Root variant="outline" value={selView}>
		<Button
			class="hover:bg-gray-200 {selView === '2d'
				? 'sel_button'
				: 'hover:bg-gray-400'} bg-gray-400 hover:cursor-pointer w-[50%]"
			onclick={() => handleView('2d')}
			value="2d">2D</Button
		>
		<Button
			class="hover:bg-gray-200 {selView === '3d'
				? 'sel_button'
				: 'hover:bg-gray-400'} bg-gray-400 hover:cursor-pointer w-[50%]"
			onclick={() => handleView('3d')}
			value="3d">3D</Button
		>
	</ButtonGroup.Root>
	{#if selView === '3d'}
		<div
			class="relative bg-gray-300 items-center justify-right flex-col w-full mt-1 p-2 h-fit rounded-md shadow-md"
		>
			<div class="close_3d_button absolute top-0 right-0">
				<XIcon
					class="size-4 hover:cursor-pointer"
					onclick={() => handleView('2d')}
				/>
			</div>
			<div class="">
				<label for="pitch" class="mr-2">Pitch:</label>
				<span class="w-8 text-center">{pitchValue}°</span>

				<input
					type="range"
					min="0"
					max="90"
					value={pitchValue}
					class="w-full"
					oninput={(e) => handlePitchChange(e)}
				/>
			</div>

			<div class=" items-left justify-center w-full mt-2">
				<label for="exaggeration" class="mr-2">Terrain exaggeration:</label>
				<span class="w-8 text-center">{exaggeration_3d}</span>

				<input
					type="range"
					min="0"
					max="5"
					step="0.3"
					value={exaggeration_3d}
					class="w-full"
					oninput={(e) => handleExaggerationChange(e)}
				/>
			</div>
		</div>
	{/if}
</div>
<!-- Legend Component -->
<!-- {#if this_interface == 'taxsearch'}
{this_interface} -->
<!-- {#if showPolygons} -->
<div>

{#if fetchedPolygons && fetchedPolygons?.length > 0}
	<CountsGeoLegend bind:showPolygons={showPolygons} bind:jetBreaksExport={jenksData} />
{/if}
<!-- {/if} -->
</div>
{#if symbolColor?.legend?.length > 0}

	<PointsLegend {symbolColor} {map} bind:showPolygons bind:showInatSpecies />
{/if}
</div>
</div>
<style>
	:global(.sel_button) {
		background-color: #86bc43;
		color: white;
		border: 1px solid #fbfcf9;
	}
	:global(.polygon-popup .maplibregl-popup-tip) {
		top: 15px !important;

		/* border-top-color: #72a417!important;
    border:unset!important; */
		/* background:white!important; */
		border-top-color: #72a417 !important;
		shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1) !important;
	}
	:global(.taxa-popup .maplibregl-popup-content) {
		padding: 0 !important;
		max-width: 18vw !important;
	}
	:global(.taxa-popup .maplibregl-popup-content *) {
		font-family: Lato !important;
		font-size: 0.8rem !important;
		line-height: 1.4 !important;
	}
	:global(.polygon-popup .maplibregl-popup-content) {
		/* background:transparent!important; */
		/* top:15px!important; */
		border: unset !important;
		box-shadow: none !important;
		font-family: Lato !important;
		padding: 5px !important;
		padding: 0 !important;
		shadow: 0 0 10px 0 #5a840b !important;
		border-radius: 2px !important;
		border: 1px solid #5a840b !important;

		/* font-size: 14px;
  line-height: 1.5; */
		/* color: var(--font-grey); */
	}

	:global(.polygon-popup .maplibregl-popup-close-button) {
		right: 2px;
		top: -3px;
		z-index: 1000;
	}
	:global(.maplibregl-ctrl-attrib) {
		display: none;
	}

	/* Horizontal bounce animation for left-pointing arrow */
	@keyframes bounce-horizontal {
		0%,
		100% {
			transform: translateX(0);
		}
		50% {
			transform: translateX(-10px);
		}
	}

	.animate-bounce-horizontal {
		animation: bounce-horizontal 1.5s ease-in-out infinite;
	}

	/* Custom marker styling */
	:global(.custom-marker) {
		background-color: #86bc43;
		color: white;
		padding: 8px 16px;
		border-radius: 3px;

		border: 2px solid #dce1d5;
		white-space: nowrap;
	}
</style>
