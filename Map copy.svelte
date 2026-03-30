<script>
	//@ts-nocheck
	import * as turf from '@turf/turf';
	import { onMount, onDestroy, untrack, mount, unmount } from 'svelte';
	import * as d3 from 'd3';
	import RangeSlider from 'svelte-5-range-slider/RangeSlider.svelte';
	import PlotPopup from './PlotPopup.svelte';

	import BadgeCheckIcon from '@lucide/svelte/icons/badge-check';
	import FilterIcon from '@lucide/svelte/icons/funnel-plus';
	import MarkerCard from './MarkerCard.svelte';
	import MarkerCardTitle from './MarkerCardTitle.svelte';
	import { mapMarkerCardShared as markShared } from './mapMarkerCardShared.svelte.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import pkg from 'maplibre-gl';
	const { Popup, LngLat, Marker } = pkg;
	import WrenchIcon from '@lucide/svelte/icons/wrench';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { watch } from 'runed';
	import * as Command from '$lib/components/ui/command/index.js';
	import { _plotStore } from './plotStore.svelte';
	import PlotsContainer from './Charts/PlotsContainer.svelte';
	import { _chartStoresMapWithoutBiennio as _chartStoresMapWithoutBiennio } from '../chartStores.svelte.js';
	import { pUtils,getNames } from './leftPanels/utils.svelte.js';
	import MapTables from './MapTables.svelte';

import {
	MapLibre,
	NavigationControl,
	ScaleControl,
	GlobeControl,
} from 'svelte-maplibre-gl';
import * as Select from '$lib/components/ui/select/index.js';
import { base } from '$app/paths';



// Debug component lifecycle

//geo-data per plot
/* import geoPlots from './info/map/geodata/geoPlots.json'; */
import geoPlots from './info/map/geodata/geoPlots.json';
//import names from './info/names.json';

//geo-data per biennio
/* import geoPlotsBiennio from './info/map/geodata/geoPlotsBiennio.json'; */
import geoPlotsBiennio from './info/map/geodata/geoPlotsBiennio_vertical.json';

import GroupedPopup from './GroupedPopup.svelte';

/* import cleanData from './dataNew2/cleanDataNew.json'; */

/* NEWWWWWWw */

//stats per taxon, no plot code no biennio

//	import allParam_stats from './dataNew2/allParam_stats.json';

/* both with biennio and without biennio */

import taxon_statsAll from './info/stats/taxon_stats_new_ok.json';

import plots_taxa from './info/plots/plots_taxa.json';
	let {_interface}=$props();
	console.log('_interface', _interface);
	let names = $derived(getNames());
	let plots=names.plots_valleys.map((p)=>p.plot_code);


	let mapContainer = $state(null);
let showStats = $state(false);



	let visitedMapsKeys = $state([]);
	const proxyPath = `${base}/proxy`;




	let rastersVisible = $state(false);
	$effect(() => {
		console.log('rastersVisible changed to', rastersVisible);
	});

	let visibleLatestORCO = $state(false);
	let visibleOldestORCO = $state(false);

	let settingsVisible = $state(false);
	let showAllParameters = $state(false);
	let tableInfo = $state('selTaxonOnly');
	let reducedPlotsData = plots_taxa;

	/* [plots_taxa].map((d) => {
	let withoutBiennio=d.withoutBiennio.map((s) => {


		let found=plots_allParam.withoutBiennio.find((s2) => s2.plot_code === s.plot_code);
		return {
			plot_code:s.plot_code,
			all_shannon:found.shannon,
			all_richness:found.richness,
			all_abundance:found.abundance,
			...s
		};
	});
	let withBiennio=d.withBiennio.map((s) => {
		let found=plots_allParam.withBiennio.find((s2) => s2.plot_code === s.plot_code);
		return {
			plot_code:s.plot_code,
			all_shannon:found.shannon,
			all_richness:found.richness,
			all_abundance:found.abundance,
			...s
		};
	});
	return {
		withoutBiennio:withoutBiennio,
		withBiennio:withBiennio
	};
})[0]; */
	console.log('reducedPlotsData', reducedPlotsData);

	//stats (min, max, avg) for each plot. NO distinction by taxon or biennio
	//replaced by plots_general_stats and summarized_plots_general_stats
	//import plotsStats from './dataNew2/plots_stats.json';

	//allParam_stats.json
	/* let all_taxon_stats=
		{
			"taxon": "all",
			"avg_shannon": 2.50458064516129,
			"max_shannon": 3.721,
			"min_shannon": 0.63,
			"avg_richness": 134.225806451613,
			"max_richness": 215,
			"min_richness": 59,
			"avg_abundance": 5422.83870967742,
			"max_abundance": 20326,
			"min_abundance": 397
		}; */

	/* 	import allParam_biennio_stats from './dataNew2/allParam_biennio_stats.json';

	let allParamStats={
		withBiennio:allParam_biennio_stats,
		withoutBiennio:allParam_stats
	} */

	let map;

	/** Only the MapLibre map root — avoids matching `.marker-card-button` outside this map instance. */
	function markerDomRoot() {
		return map?.getContainer?.() ?? null;
	}

	let loaded = $state(false);
	let mapReady = $derived(
		(d) => map && map.getStyle && loaded && map.getLayer('plotGeodata')
	);

	let markerVisible = $state(false);
	let markerTitleVisible = $state(true);
	// `map` is not $state — depend on `loaded` so we re-query markers after the map exists
	watch(() => [markerVisible, selTaxonShort, loaded], ([markerVisible, selTaxonShort], prev) => {


		console.log('markerVisible changed',  markerVisible,selTaxonShort);

		const markerButtons =
			markerDomRoot()?.querySelectorAll('.marker-card-button') ?? [];

		if (markerVisible) {
			console.log('markerVisible being', markerVisible);
			console.warn(markerDomRoot()?.querySelectorAll('.marker-card-button'));


			markerButtons.forEach((d) => {
				console.log('visible d from marker card', d);
				d.classList.add('block');
				d.classList.remove('hidden');

					// Use requestAnimationFrame to ensure DOM is ready and batch DOM updates
					requestAnimationFrame(() => {


						if (markerButtons.length > 0) {
							console.log(`🎯 Updating ${markerButtons.length} marker buttons`);

							markerButtons.forEach((d) => {
								// Handle visibility
								d.classList.toggle('hidden', !markerVisible);

								// Handle highlighting (only if marker is visible)
								if (markerVisible && selTaxonShort) {
									let selT = selTaxon.slice(0, 1);

									// Remove all highlighted classes
									d.querySelectorAll('.highlighted').forEach((el) => {
										el.classList.remove('highlighted');
									});

									console.log('selT', selT);
									const targetElement = d.querySelector(`.${selT}`);
									if (targetElement) {
										targetElement.classList.add('highlighted');
									}
								}
							});
						}
					});
			});
		} else {

			console.log('markerVisible being', markerVisible);
			console.warn(markerDomRoot()?.querySelectorAll('.marker-card-button'));
			requestAnimationFrame(() => {
			markerButtons.forEach((d) => {
					console.log('hidden d from marker card', d);
					d.classList.remove('block');
					d.classList.add('hidden');
				});
			});
		}


	});
	let showTables = $state(false);
	let tableToShow = $state('plots');
	let selTaxon = $state('all');

	let selTaxonShort = $derived.by(() => {
		//'uccelli' -> 'u'
		if (selTaxon === 'all') return 'all';
		return selTaxon.slice(0, 1);
	});

		//default tab is richness
	let generalMapPlotsTabsType = $state('richness');
	let type = $derived.by(() => {
		return generalMapPlotsTabsType;
	});

	watch(()=>generalMapPlotsTabsType,(curr,prev)=>{
		console.log('generalMapPlotsTabsType changed', curr, prev);
		if (!prev || prev === curr) return;
		markerVisible = false;
		setTimeout(()=>{
			markerVisible = true;
		},1100);
	});

	if (!visitedMapsKeys.includes(generalMapPlotsTabsType)) {
		//visitedMapsKeys.push(generalMapPlotsTabsType);
	}

	watch(()=>_chartStoresMapWithoutBiennio.mouseoverPlot,(curr,prev)=>{
		if (!prev || prev === curr) return;
		console.log('_chartStoresMapWithoutBiennio.mouseoverPlot changed', curr, prev);

	});
	watch(()=>selTaxonShort,(curr,prev)=>{
		if (!prev || !curr) return;
		console.log('selTaxonShort changed',  prev,curr);
		_chartStoresMapWithoutBiennio.setPlotsParams({taxons:[names.taxons.find((d)=>d.value===curr)]});
	});

	/** Keep programmatic `mount(MarkerCard)` in sync — props from `map.on('load')` are not reactive. */
	$effect(() => {
		markShared._interface = _interface;
		markShared.tabType = generalMapPlotsTabsType;
		markShared.selTaxonShort = selTaxonShort;
		markShared.markerVisible = markerVisible;
	});

	_chartStoresMapWithoutBiennio.setPlotsParams({activeChartsTab:'charts_geo'});
	_chartStoresMapWithoutBiennio.setPlotsParams({plots:plots});
	_chartStoresMapWithoutBiennio.setPlotsParams({taxons:[names.taxons.find((d)=>d.value===selTaxon)]});
	_chartStoresMapWithoutBiennio.setPlotsParams({byBiennio:markShared._interface==='withBiennio'?true:false});


	let derivedInterfaceData = $derived.by(() => {
		if (!reducedPlotsData) return null;
		//if (_interface === 'withoutBiennio') {
		return {
			geoPlots: (() => {
				if (_interface === 'withoutBiennio') return geoPlots;
				else if (_interface === 'withBiennio') return geoPlotsBiennio;
			})(),

			paramStatsData: (() => {
				return taxon_statsAll['withoutBiennio'];
				//return taxon_statsAll[_interface];
			})(),
			//plots_general_stats:(()=>{
			plots_data: (() => {
				let d;
				if (_interface === 'withoutBiennio')
					d = reducedPlotsData.withoutBiennio;
				else if (_interface === 'withBiennio') d = reducedPlotsData.withBiennio;
				return d;
			})(),
		};
	});

	let mouseovered_code = $state(null);



	let scaledName = $derived.by(() => {
		if (selTaxon === 'all') return 'all_' + type + '_scaled';
		return selTaxon.slice(0, 1) + '_' + type + '_scaled';
	});

	let colorName = $derived.by(() => {
		if (selTaxon === 'all') return 'all_' + type + '_color';
		return selTaxon.slice(0, 1) + '_' + type + '_color';
	});

	let paramStats = $derived.by(() => {
		if (!derivedInterfaceData) return null;
		console.log('derivedInterfaceData in paramStats', derivedInterfaceData);
		console.log(`[${type}] Computing paramStats for taxon:`, selTaxon);
		/*
					{
				"taxon": "carabidi",
				"avg_shannon": 1.30845,
				"max_shannon": 2.422,
				"min_shannon": 0.122,
				"avg_richness": 11.3,
				"max_richness": 27,
				"min_richness": 2,
				"avg_abundance": 307.933333333333,
				"max_abundance": 1681,
				"min_abundance": 10
			}, */
		let d = derivedInterfaceData.paramStatsData.find(
			(s) => s.taxon === selTaxon
		);

		//for all taxa per plot
		/* 					  {
			"shannon": 2.672,
			"richness": 215,
			"abundance": 6088,
			"plot_code": "gpa"
		}, */

		//.find((s) => s.plot_code === selTaxon);

		const minKey = 'min_' + generalMapPlotsTabsType;
		const maxKey = 'max_' + generalMapPlotsTabsType;
		const avgKey = 'avg_' + generalMapPlotsTabsType;

		const min = d[minKey];
		const max = d[maxKey];
		const avg = d[avgKey];

		console.log(
			`[${type}] Stats extracted - min: ${min}, max: ${max}, avg: ${avg} for ${selTaxon} ${generalMapPlotsTabsType}`
		);

		// Validate that we have valid numbers
		if (
			min === undefined ||
			max === undefined ||
			min === null ||
			max === null ||
			isNaN(min) ||
			isNaN(max)
		) {
			console.warn(
				`[${generalMapPlotsTabsType}] Invalid stats for ${selTaxon} ${generalMapPlotsTabsType} - min:`,
				min,
				'max:',
				max
			);
			return null;
		}

		return {
			type: generalMapPlotsTabsType,
			taxon: selTaxon,
			min: min,
			max: max,
			avg: avg,
		};
	});

	function updatePointPositions() {
		const zoom = map.getZoom();

		// Calculate offset in degrees based on zoom
		// Adjust the multiplier to control the offset amount
		//zoom<12
		let latOffset;
		if (zoom <= 12) {
			latOffset = 0.007 / Math.pow(2, (zoom - 8) / 2);
		} else {
			latOffset = 0.004 / Math.pow(2, (zoom - 8) / 2);
		}

		const updatedFeatures = derivedGroupedPlots.map((feature) => {
			const [lng, lat] = feature.geometry.coordinates;

			return {
				...feature,
				geometry: {
					type: 'Point',
					coordinates:
						feature.properties.biennio === 1
							? [lng, lat + latOffset]
							: [lng, lat - latOffset], // Simply add to latitude
				},
			};
		});

		map.getSource('plotGeodata_source').setData({
			type: 'FeatureCollection',
			features: updatedFeatures,
		});
	}

	let zoom = $state(5);
	let animationFrame = null;

	watch(
		() => zoom,
		(curr, prev) => {
			if (!derivedGroupedPlots) return;
			if (_interface !== 'withBiennio') return;

			if (animationFrame) {
				cancelAnimationFrame(animationFrame);
			}
			animationFrame = requestAnimationFrame(updatePointPositions);
		}
	);
	let min_max_derived = [5, 15];

	let toUseRadiusScale = $derived.by(() => {
		if (type === 'richness') {
			return richnessRadiusScale();
		} else if (type === 'abundance') {
			return abundanceRadiusScale();
		} else if (type === 'shannon') {
			return shannonRadiusScale();
		}
	});

	// Single effect for all marker DOM manipulation - runs when selTaxon or markerVisible changes
	$effect(() => {

	});

	// Create reactive scales that update when zoom changes
	let richnessRadiusScale = $derived(() => {
		//    if (!loaded || !paramStats) return d3.scaleSqrt().domain([1, 10]).range([1, 10]);

		/* {
		"taxon": "carabidi",
		"avg_shannon": 1.30845,
		"max_shannon": 2.422,
		"min_shannon": 0.122,
		"avg_richness": 11.3, */
		return d3
			.scaleSqrt()
			.domain([paramStats.min, paramStats.max])
			.range(min_max_derived);
	});

	let abundanceRadiusScale = $derived(() => {
		/*     if (!zoom || !paramStats) {
      return d3.scaleSqrt().domain([1, 100]).range([1, 30]);
    } else { */
		if (selTaxon === 'formiche') console.log('paramStats', paramStats);

		return d3
			.scaleSqrt()
			.domain([paramStats.min, paramStats.max])
			.range(min_max_derived);
		//}
	});

	let shannonRadiusScale = $derived(() => {
		//  if (!loaded || !paramStats) return d3.scaleSqrt().domain([0, 1]).range([1, 10]);

		return d3
			.scaleSqrt()
			.domain([paramStats.min, paramStats.max])
			.range(min_max_derived);
	});

	// Color scales for each parameter
	let richnessColorScale = $derived(() => {
		return d3
			.scaleSequential(d3.interpolateYlGn)
			.domain([paramStats.min, paramStats.max]);
	});

	let abundanceColorScale = $derived(() => {
		return d3
			.scaleSequential(d3.interpolateYlOrRd)
			.domain([paramStats.min, paramStats.max]);
	});

	let shannonColorScale = $derived(() => {
		return d3
			.scaleSequential(d3.interpolatePuBu)
			.domain([paramStats.min, paramStats.max]);
	});

	// Combined color scale selector
	let toUseColorScale = $derived.by(() => {
		if (type === 'richness') {
			return richnessColorScale();
		} else if (type === 'abundance') {
			return abundanceColorScale();
		} else if (type === 'shannon') {
			return shannonColorScale();
		}
	});

	let taxonsShort = names.taxons.map((d) => d.value);
	//['u', 'o', 'l', 'r', 'c', 'f', 's'];

	let data = $derived.by(() => {
		if (!type || !derivedInterfaceData) {
			console.warn('Type not defined yet');
			return [];
		}

		//return derivedInterfaceData.plots_general_stats;
		return derivedInterfaceData.plots_data;
	});

	let geoPlotsByValley = $derived.by(() => {
		if (!derivedInterfaceData.plots_data || !derivedInterfaceData.geoPlots)
			return [];
		console.log(
			'derivedInterfaceData.plots_data',
			derivedInterfaceData.plots_data,
			_interface
		);
		console.warn(derivedInterfaceData, _interface);

		let reduced = derivedInterfaceData.geoPlots.features.reduce((acc, f) => {
			let found = acc.find((d) => d.valley_code === f.properties.valley_code);
			if (!found) {
				acc.push({ valley_code: f.properties.valley_code, features: [f] });
			} else {
				found.features.push(f);
			}

			return acc;
		}, []);
		console.log('geoPlotsByValley', reduced);
		let bboxes = [];
		let _bboxPolygons = [];
		let toprights = $state([]);

		reduced.forEach((d, index) => {
			let valley_code = d.valley_code;
			let f = {
				type: 'FeatureCollection',
				features: d.features,
			};
			console.log('f', f);

			const bbox = turf.bbox(f);
			bboxes.push(bbox);
			// Convert bbox to a polygon feature
			const bboxPolygon = turf.bboxPolygon(bbox);
			bboxPolygon.properties = { valley_code: valley_code };
			let scaled = turf.transformScale(bboxPolygon, 1.5);
			console.warn('scaled', scaled.geometry.coordinates[0]);

			let right = scaled.geometry.coordinates[0][1][0];
			let top = scaled.geometry.coordinates[0][2][1];

			toprights.push({
				id: index,
				lnglat: {
					lng: right,
					lat: top,
				},
				properties: {
					valley_code: valley_code,
					id: index,
				},
			});
			_bboxPolygons.push(scaled);
		});
		return {
			geoPlotsByValley: reduced,

			//incorrect!
			plotsData: derivedInterfaceData.plots_data,
			bboxes: bboxes,
			_bboxPolygons: _bboxPolygons,
			toprights: toprights,
		};
	});

	//let derivedToPlot= $derived.by(() => {

	let derivedGroupedPlots = $derived.by(() => {
		if (!toUseRadiusScale || !geoPlotsByValley?.plotsData) return [];
		// Guard: ensure data is available before processing
		if (
			!geoPlotsByValley?.plotsData ||
			geoPlotsByValley?.plotsData.length === 0
		) {
			console.warn(
				'Data not ready yet, data length:',
				geoPlotsByValley?.data?.length
			);
			return [];
		}

		console.log('features with', geoPlotsByValley?.plotsData, 'data objects');

		let features = geoPlotsByValley.geoPlotsByValley.reduce((acc, d) => {
			acc.push(...d.features);
			return acc;
		}, []);

		let filteredFeatures;

		if (_interface === 'withBiennio') {
			filteredFeatures = features.filter(
				(f) =>
					typeof f.properties === 'object' &&
					f.properties?.plot_code &&
					f.properties?.biennio &&
					f.properties.plot_code !== 'sf'
			);
		} else if (_interface === 'withoutBiennio') {
			console.log('features', features);

			filteredFeatures = features.filter(
				(f) =>
					typeof f.properties === 'object' &&
					f.properties?.plot_code &&
					f.properties.plot_code !== 'sf'
			);
		}

		console.log('filteredFeatures', filteredFeatures);
		console.log('geoPlotsByValley.plotsData', _interface, geoPlotsByValley);

		// We take the geojson (splitted geom by biennio) and we add the properties of the data by biennio&parameter
		return filteredFeatures.map((f, index) => {
			let dataObj;
			// Find matching data object
			if (_interface === 'withBiennio') {
				dataObj = geoPlotsByValley.plotsData.find((d) => {
					const match =
						d.geocode === f.properties.plot_code &&
						d.biennio === f.properties.biennio;

					return match;
				});
			} else if (_interface === 'withoutBiennio') {
				console.log('geoPlotsByValley', geoPlotsByValley);

				dataObj = geoPlotsByValley.plotsData.find((d) => {
					const match = d.geocode === f.properties.plot_code;

					return match;
				});
			}

			if (!dataObj) {
				console.log('dataObj not found', dataObj, f.properties.plot_code);

				/* 	console.log(
					'dataObj not found for',
					f.properties.plot_code,
					//_interface === 'withBiennio' ? f.properties.biennio : null
				); */
			} else {
				console.log('dataObj found', dataObj);
			}
			// Add scaled radius and color for each taxon
			taxonsShort.forEach((d, i) => {
				let param = d + '_' + type;

				/* if (d === 'all') param = 'all_' + type;
				else  param = d + '_' + type; */

				let scaledRadiusName = param + '_scaled';
				let scaledColorName = param + '_color';

				if (!dataObj?.[param]) {
					/* console.log('datassObj not found', dataObj, param); */
					dataObj[scaledRadiusName] = 0;
					dataObj[scaledColorName] = '#cccccc'; // Gray for null/missing values
				} else {
					// Scale radius
					/* 	if (
						d == 'all' &&
						type == 'richness' &&
						toUseRadiusScale(dataObj[param]) > 4
					) {
						console.log(
							'dataObj[param]',
							dataObj,
							param,
							dataObj[param],
							toUseRadiusScale(dataObj[param])
						);
					} */
					dataObj[scaledRadiusName] = toUseRadiusScale(dataObj[param])
						? toUseRadiusScale(dataObj[param])
						: 0;
					// Scale color - scaleSequential already returns a hex string
					dataObj[scaledColorName] = toUseColorScale(dataObj[param])
						? toUseColorScale(dataObj[param])
						: '#cccccc';
				}
			});

			if (selTaxon == 'formiche' && type == 'abundance') {
				if (dataObj.f_abundance_scaled > 4) {
					console.log(
						'dataObj formiche abundance',
						dataObj.f_abundance,
						dataObj.f_abundance_scaled
					);
				}
			}

			if (index < 2) {
				console.log('dataObj test', dataObj, type);
			}

			// IMPORTANT: Return a NEW feature object to avoid mutation
			return {
				type: 'Feature',
				geometry: f.geometry,
				properties: dataObj,
			};
		});
	});

	/* let scaledPlotsParam= $derived.by(()=>{
    if (!derivedGroupedPlots)
        return [];

    return derivedGroupedPlots.map((f,index)=>{
        let props=f.properties;


        return {
            ...props,
            scaled_param: 't'
        }
    })

}) */

	let symbolizePlots = function () {
		console.log('symbolizePlots', type, selTaxon, derivedGroupedPlots);

		const markerButtons =
			markerDomRoot()?.querySelectorAll(`.${type}.marker-card-button`) ?? [];

		if (markerButtons.length > 0) {
			console.log(`🎯 Updating ${markerButtons.length} marker buttons`);

			markerButtons.forEach((d) => {
				// Handle visibility
				d.classList.toggle('hidden', !markerVisible);

				// Handle highlighting (only if marker is visible)
				if (markerVisible && selTaxon) {
					let selT = selTaxon.slice(0, 1);

					// Remove all highlighted classes
					d.querySelectorAll('.highlighted').forEach((el) => {
						el.classList.remove('highlighted');
					});

					// Add highlighted class to current taxon
					const targetElement = d.querySelector(`.${selT}`);
					if (targetElement) {
						targetElement.classList.add('highlighted');
					}
				}
			});
		}

		//	map.getSource('plotGeodata_source').setData(null);
		setTimeout(() => {
			console.log(
				'Applying styles - scaledName:',
				scaledName,
				'colorName:',
				colorName
			);
			/*    console.log('Sample data:', map.getSource('plotGeodata_source').getData().features[0]?.properties); */
			if (_interface === 'withBiennio') {
				animationFrame = requestAnimationFrame(updatePointPositions);
			} else {
				if (animationFrame) {
					cancelAnimationFrame(animationFrame);
				}
			}
			map.getSource('plotGeodata_source').setData({
				type: 'FeatureCollection',
				features: derivedGroupedPlots,
			});
			/* map.getSource('plotGeodata_source').setData({
				type: 'FeatureCollection',
				features: derivedGroupedPlots,
			}); */
			// Set circle radius based on scaled value
			map.setPaintProperty('plotGeodata', 'circle-radius', ['get', scaledName]);

			//map.setPaintProperty('plotGeodata', 'circle-radius', ['interpolate', ['linear'], ['zoom'], 9, 6, 11, 8, 15, 11]);

			if (_interface === 'withBiennio') {
				//ANCHOR - map.moveLayer('plotGeodata_border');
				map.setPaintProperty('plotGeodata', 'circle-stroke-width', 0);
				map.setLayoutProperty('plotGeodata_border', 'visibility', 'visible');
				map.setPaintProperty('plotGeodata_border', 'circle-radius', [
					'get',
					scaledName,
				]);
			} else {
				map.setPaintProperty('plotGeodata', 'circle-stroke-width', 0.4);
				map.setLayoutProperty('plotGeodata_border', 'visibility', 'none');
			}
			// Set circle color based on color scale
			map.setPaintProperty('plotGeodata', 'circle-color', ['get', colorName]);
			console.log(map.getStyle().layers);
		}, 300);
	};

	$effect(() => {
		if (
			derivedGroupedPlots &&
			mapReady &&
			map.getSource('plotGeodata_source')
		) {

			symbolizePlots();
		}
	});

	$effect(() => {
		/*   if (map) {
           map.on('zoom',()=>{
            zoom=map.getZoom();
            console.log('zoom',map.getBounds());

        })
    } */

		if (map && derivedGroupedPlots) {
			if (_interface === 'withBiennio') {
				if (animationFrame) {
					cancelAnimationFrame(animationFrame);
				}
				animationFrame = requestAnimationFrame(updatePointPositions);
				console.log('starting with biennio');
			} else {
				if (animationFrame) {
					cancelAnimationFrame(animationFrame);
				}
			}
			/*    map.on('load', () => {
            loaded=true;
        }) */
			/*    map.on('styledata', () => {
            loaded=true;
        }) */

			map.on('idle', () => {
				loaded = true;
			});
			map.on('zoom', () => {
				zoom = map.getZoom();
				//  console.log('zoom',map.getCenter());
				/*    console.log('min_max_derived',min_max_derived);
            console.log('richnessScale',richnessScale());
            console.log('abundanceScale',abundanceScale());
            console.log('shannonScale',shannonScale());
            algger; */
			});
			map.on('load', () => {
				// Store markers for later access

				const markers = [];
				const markersTitle = [];
				const mountedComponents = [];
				console.warn('loading geoPlotsByValley from ', _interface);

				geoPlotsByValley.toprights.forEach((d, index) => {
					const el = document.createElement('div');
					el.className = 'custom-marker ml-2';
					el.id = `marker-${d.id}-${type}`;

					let MarkerLngLat = new LngLat(d.lnglat.lng+0.025, d.lnglat.lat);
					const marker = new Marker({ element: el })
						.setLngLat(MarkerLngLat)
						.addTo(map);


					const elTitle = document.createElement('div');
					elTitle.className = 'marker-title ml-0';
					elTitle.id = `marker-title-${d.id}`;

					console.warn(d.id);
					console.warn('d.lnglat', d.lnglat);


					let titleLngLat = new LngLat(d.lnglat.lng-0.015, d.lnglat.lat + 0.015);
					const markerTitle = new Marker({ element: elTitle })
						.setLngLat(titleLngLat)
						.addTo(map);

					console.log(`✅ Marker ${d.id} added:`, markerTitle);
					markersTitle.push({ markerTitle, element: elTitle, data: d });

					console.log(`✅ Marker ${d.id} added:`, marker);
					markers.push({ marker, element: el, data: d });
					requestAnimationFrame(() => {
						const markerTitleInDom = mapContainer?.querySelector(
							`#marker-title-${d.id}`
						);

						//let parkStats = mapContainer?.querySelector('.park-stats');
						if (markerTitleInDom) {


						console.log(`🎯 Marker title ${d.id} is now in DOM:`, markerTitleInDom);
							// Mount the MarkerCardTitle Svelte component


							const TitlecardComponent = mount(MarkerCardTitle, {
								target: markerTitleInDom,
								props: {

									valleyCode: d.properties.valley_code,
									markerTitleVisible: markerTitleVisible,
									onclick: () => {
										console.log('Marker title clicked:', d.properties.valley_code);
										// TODO: Add filter logic here
										// alert(`Filter by valley: ${d.properties.valley_code}`);
									},
								},
							});
							mountedComponents.push(TitlecardComponent);
						}
					})

					// Mount the MarkerCard component after marker is added to DOM
					requestAnimationFrame(() => {
						const markerInDom = document.getElementById(
							`marker-${d.id}-${type}`
						);

						if (markerInDom) {
							console.log(`🎯 Marker ${d.id} is now in DOM:`, markerInDom);

							// Mount the MarkerCard Svelte component
							const cardComponent = mount(MarkerCard, {
								target: markerInDom,
								props: {
									valleyCode: d.properties.valley_code,
									cardShared: markShared,
									onclick: (e) => {
										console.log('Marker clicked:', d.properties.valley_code, e,e.target);
										if (e.target.classList.contains('statsParkVisibleBtn') || e.target.parentNode.classList.contains('statsParkVisibleBtn')){
											console.log('statsParkVisibleBtn clicked');
											return;
										}
										// TODO: Add filter logic here
										// alert(`Filter by valley: ${d.properties.valley_code}`);
									},
								},
							});
							mountedComponents.push(cardComponent);




						} else {
							console.warn(`⚠️ Marker ${d.id} element not found in DOM`);
						}

					});
				});

				console.log(`📍 Created ${markers.length} markers total for ${type}`);

				// Store markers and components for cleanup on component destroy (component-specific)
				window[componentId] = { markers, mountedComponents };
				console.log(`💾 Stored markers in window.${componentId}`);
				console.log('map', map);
				console.log('markers', markers);
				console.log('mountedComponents', mountedComponents);

				map.addSource('pngp_areas_valley_source', {
					type: 'vector',
					tiles: [
						'https://pere.gis-ninja.eu/geoserver/gwc/service/wmts?layer=pngp:pngp_areas_valley_4326&tilematrixset=EPSG:900913&Service=WMTS&Request=GetTile&Version=1.0.0&Format=application/x-protobuf;type=mapbox-vector&TileMatrix=EPSG:900913:{z}&TileCol={x}&TileRow={y}',
					],
				});
				map.addLayer({
					id: 'pngp_areas_valley_4326',
					type: 'fill',
					source: 'pngp_areas_valley_source',
					'source-layer': 'pngp_areas_valley_4326',

					paint: {
						'fill-color': '#ffb83d',
						'fill-opacity': 0.1,
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
						'line-opacity': 0.8,
						'line-width': 2,
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
						'text-halo-width': 5,
					},
					layout: {
						visibility: 'visible',
						'text-field': '{valley_name}',
						'text-variable-anchor': ['center'],
						'text-transform': 'uppercase',
						'text-font': ['Open Sans Regular'],
						'text-offset': [5, 5],
						'text-size': 12,
					},
				});

				const baseUrl =
					'https://mwgeo.igg.cnr.it/geoserver/gwc/service/wmts?layer=PNGP%3A20240806%20ORCO%20GPC_result&style=raster&tilematrixset=EPSG%3A900913&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix=EPSG%3A900913%3A{z}&TileCol={x}&TileRow={y}';

				//const latestBaseUrlWMS = 'https://mwgeo.igg.cnr.it/geoserver/gwc/service/wmts?layer=PNGP2024_result_orco_group&style=raster&tilematrixset=EPSG%3A900913&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix=EPSG%3A900913%3A{z}&TileCol={x}&TileRow={y}';

				let latestBaseUrlWMS =
					'https://mwgeo.igg.cnr.it/geoserver/PNGP/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image%2Fpng&TRANSPARENT=true&LAYERS=PNGP2024_result_orco_group&STYLES=&CRS=EPSG%3A3857&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}';

				map.addSource('drone_orco_latest_source', {

					type: 'raster',
/* tiles:[
	`${latestBaseUrlWMS}&z={z}&x={x}&y={y}`
],/*  */
					tiles: [
						`${proxyPath}?debug=true&url=${encodeURIComponent(latestBaseUrlWMS)}&z={z}&x={x}&y={y}`,
					],
					tileSize: 256,
					scheme: 'xyz',
				});

				map.addLayer({
					id: 'drone_orco_latest_layer',
					type: 'raster',
					layout: {
						visibility: 'none',
					},
					source: 'drone_orco_latest_source',
				});
				const oldestBaseUrlWMS_no =
					'https://mwgeo.igg.cnr.it/geoserver/gwc/service/wmts?layer=PNGP:2015_07_06_bbf_noasca_plot_3_transparent_mosaic_group1&style=raster&tilematrixset=EPSG%3A900913&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix=EPSG%3A900913%3A{z}&TileCol={x}&TileRow={y}';

				let oldestBaseUrlWMS =
					'https://mwgeo.igg.cnr.it/geoserver/PNGP/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image%2Fpng&TRANSPARENT=true&LAYERS=2015_07_06_bbf_noasca_plot_3_transparent_mosaic_group1&STYLES=&CRS=EPSG%3A3857&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}';

				map.addSource('drone_orco_oldest_source', {
					type: 'raster',

					tiles: [
						`${proxyPath}?url=${encodeURIComponent(oldestBaseUrlWMS)}&z={z}&x={x}&y={y}`,
					],
					tileSize: 256,
					scheme: 'xyz',
				});

				map.addLayer({
					id: 'drone_orco_oldest_layer',
					type: 'raster',
					layout: {
						visibility: 'none',
					},
					source: 'drone_orco_oldest_source',
				});

				let point_baseUrlWMS =
					'https://mwgeo.igg.cnr.it/geoserver/PNGP/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image%2Fpng&TRANSPARENT=true&LAYERS=20240806%20ORCO%20GPA_SCATTI_ORCO&STYLES=&CRS=EPSG%3A3857&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}';

				map.addSource('orco_point_wms_source', {
					type: 'raster',

					tiles: [
						`${proxyPath}?url=${encodeURIComponent(point_baseUrlWMS)}&z={z}&x={x}&y={y}`,
					],
					tileSize: 256,
				});

				map.addLayer({
					id: 'orco_point_wms_layer',
					type: 'raster',
					source: 'orco_point_wms_source',
					layout: {
						visibility: rastersVisible ? 'visible' : 'none',
					},
					paint: {
						'raster-opacity': 1,
					},
				});

				let circle_baseUrlWMS =
					'https://mwgeo.igg.cnr.it/geoserver/PNGP/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image%2Fpng&TRANSPARENT=true&LAYERS=PNGP%3ASHP%20SITI_orco&STYLES=&CRS=EPSG%3A3857&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}';

				map.addSource('orco_circle_wms_source', {
					type: 'raster',

					tiles: [
						`${proxyPath}?url=${encodeURIComponent(circle_baseUrlWMS)}&z={z}&x={x}&y={y}`,
					],
					tileSize: 256,
				});

				map.addLayer({
					id: 'orco_circle_wms_layer',
					type: 'raster',
					source: 'orco_circle_wms_source',
					layout: {
						visibility: rastersVisible ? 'visible' : 'none',
					},
					paint: {
						'raster-opacity': 1,
					},
				});
				// Proxy fills BBOX with EPSG:3857 from z/x/y — CRS must match (not EPSG:32632).
				// If GetCapabilities has no 3857 for this layer, extend proxy to reproject 3857→32632.
				let zonification_baseUrlWMS =
					'https://sit.parco.gran-paradiso.g3wsuite.it/ows/11/qdjango/49/?REQUEST=GetMap&SERVICE=WMS&VERSION=1.3.0&FORMAT=image%2Fpng%3B%20mode%3D8bit&STYLES=predefinito&TRANSPARENT=true&DPI=96&LAYERS=ft_tm_zone_PP_2020_a_899913d3_0bcd_45c3_2021071216034278724645&SLD_VERSION=1.1.0&WIDTH=256&HEIGHT=256&CRS=EPSG%3A3857&BBOX={bbox-epsg-3857}&LEGEND_OFF=ft_tm_zone_PP_2020_a_899913d3_0bcd_45c3_2021071216034278724645:0,1,4';

				map.addSource('zonification_wms_source', {
					type: 'raster',
					tiles: [
						`${proxyPath}?url=${encodeURIComponent(zonification_baseUrlWMS)}&z={z}&x={x}&y={y}`,
					],
					tileSize: 256,
					scheme: 'xyz',
				});
				map.addLayer({
					id: 'zonification_wms_layer',
					type: 'raster',
					source: 'zonification_wms_source',
					layout: {
						visibility: 'visible',
					},
					paint: {
						'raster-opacity': 0.85,
						'raster-fade-duration': 0,
					},
				});
				if (!map.getSource('plots_geojson_source_grouped')) {
					console.log('derivedGroupedPlots', type, derivedGroupedPlots);

					/*  map.addSource('plots_geojson_source', {
            type: 'geojson',
            data: derivedGroupedPlots, // Use the full FeatureCollection, not just features
            }); */

					//data with simple point per plot
					let geoPlots_data = derivedInterfaceData.geoPlots.features.map(
						(f) => {
							f.properties.centroid = f.geometry.coordinates;
							return f;
						}
					);
					console.log('geoPlots_data', geoPlots_data);

					map.addSource('plots_geojson_source_grouped', {
						type: 'geojson',
						data: {
							type: 'FeatureCollection',
							features: geoPlots_data,
						},
					});

					if (!map.getSource('plotGeodata_source')) {
						map.addSource('plotGeodata_source', {
							type: 'geojson',
							data: geoPlots_data, //?? why not use geoPlots_data_biennio?
						});

						symbolizePlots();
					}

					/* map.addSource('plotGeodata_source', {
				type: 'geojson',
				data: {
                    "type": "FeatureCollection",
                    "features": derivedGroupedPlots
                }
			}); */

					console.log(map.getStyle().layers);

					/*      map.getSource('plots_geojson_source').setData({
        type: 'FeatureCollection',
        features: newModifData,
      }); */

					/* map.addLayer({
						id: 'plotGeodata',
						type: 'circle',
						source: 'plotGeodata_source',
						layout: { visibility: 'visible' },
						paint: {
							//	'circle-radius': ['interpolate', ['linear'], ['zoom'], 9, 2, 11, 4, 15, 6],
							'circle-opacity': 1,

							//blue ??
							'circle-color': '#0f95e2',
							'circle-stroke-width': 0.5,

							'circle-stroke-opacity': 1,
						},
					}); */

					map.addLayer({
						id: 'plotGeodata_border',
						type: 'circle',
						source: 'plotGeodata_source',
						layout: {
							visibility: 'none',
						},
						paint: {
							'circle-stroke-color': [
								'match',
								['get', 'biennio'],
								//orange
								1,
								'#f3910e',
								//gray
								2,
								'#949191',
								//fallback
								'#000000',
							],
							'circle-opacity': 0.0001,
							'circle-stroke-width': 2.5,

							'circle-stroke-opacity': 1,
						},
					});




					/* At latitude 45.56647°, here are the circle-radius values for 100 meters at different zoom levels:
                        paint: {
            'circle-radius': [
                'interpolate',
                ['exponential', 2],
                ['zoom'],
                10, 0.4,
                12, 1.5,
                14, 6,
                16, 25,
                18, 100
            ]
            } */

					map.addLayer({
						id: 'plotGeodata',
						type: 'circle',
						source: 'plotGeodata_source',
						allowOverlap: false,

						paint: {
							//					'circle-radius': 25,
							'circle-radius': [
								'interpolate',
								['exponential', 1.5],
								['zoom'],
								//10, 0.4,
								10,
								8,
								/* 12, 1.5, */
								14,
								12,
								16,
								25,
								18,
								100,
							],
							'circle-opacity': 1,
							//orange
							'circle-color': '#eba32f',
							'circle-stroke-width': 0.4,
						},
					});

					// Symbol `text-offset` is in **ems** (× `text-size`), not pixels. [1,1] ≈ one “line” right/down.
					map.addLayer({
						id: 'plots_geojson_text',
						type: 'symbol',
						source: 'plots_geojson_source_grouped',
						layout: {
							'text-field': ['get', 'plot_code'],
							'text-anchor': 'center',
							// Slight right + down from point; tweak e.g. [0, 0.9] for “below”, [-0.6, 0] for left
							/* Mostly below the point	[0, 0.85]
							Just above the point	[0, 0.95]
							Just below the point	[0, 0.75]
							Just left of the point	[-0.6, 0]
							Just right of the point	[0.6, 0]
							Just above and left of the point	[-0.6, 0.95]
							Just above and right of the point	[0.6, 0.95]
							Just below and left of the point	[-0.6, 0.75]
							Just below and right of the point	[0.6, 0.75] */
							'text-offset': [0.45, 1.15],
							//text-variable-anchor — several corners/edges so MapLibre can avoid collisions while keeping a similar offset.
							'text-variable-anchor': [
								'top',
								'bottom',
								'left',
								'right',
								'top-left',
								'top-right',
								'bottom-left',
								'bottom-right',
							],
							'text-transform': 'uppercase',
							'text-font': ['Open Sans Regular'],
							'text-size': 12,
						},
						paint: {
							'text-color': '#000000',
							'text-halo-color': '#ffffff',
							'text-halo-width': 2,
						},
					});

					map.addSource('bbox-source', {
						type: 'geojson',
						data: {
							type: 'FeatureCollection',
							features: geoPlotsByValley._bboxPolygons,
						},
					});

					let derivedMarkers = $derived.by(() => {
						return geoPlotsByValley.toprights.map((d) => {
							return {
								lng: d[0],
								lat: d[1],
							};
						});
					});

					// Add outline layer
					map.addLayer({
						id: 'bbox-outline',
						type: 'line',
						source: 'bbox-source',
						paint: {
							'line-color': '#ee0856',
							'line-width': 2,
							'line-dasharray': [2, 2],
						},
					});

					/*       map.addLayer({
                id: 'bbox-outline-label',
                type:'symbol',
                        source:'bbox-source',


            paint:{
                //pinkie
                'text-color':'#cc1674',


                    'text-halo-color': '#088',
                    'text-halo-width': 5,


            },
            layout:{
                'visibility':'visible',
                'text-field':'{valley_code}',
                'text-variable-anchor':['left'],
                'text-transform':'uppercase',
                'text-font':['Open Sans Regular'],
                'text-offset':[5,5],
                'text-size':12
            },
        }) */

					map?.on('mouseover', 'plots_geojson', (e) => {
						//console.log('mouseover', e);
					});
					map?.on('mouseout', 'plots_geojson', (e) => {
						mouseovered_code = null;
						//map.setLayoutProperty('plots_geojson_border', 'visibility', 'none');
						//console.log('mouseout', e);
					});

					map.on('click', (e) => {
						console.log('click', e);

						let features = map.queryRenderedFeatures(e.point, {
							layers: ['plotGeodata'],
						});

						if (features && features.length > 0) {
							let feature = features[0];

							let properties = feature.properties;

							const container = document.createElement('div');

							// Create Svelte component instance using Svelte 5 mount function
							const component = mount(PlotPopup, {
								target: container,
								props: {
									properties: properties,
									param: type,
									selTaxon: selTaxon,
									_interface,
									/* withBiennio: _interface === 'withBiennio', */
									derivedInterfaceData,
									paramStats,
								},
							});

							// Attach to MapLibre popup
							let popup = new Popup({
								anchor: 'top',
								closeButton: true,
								closeOnClick: false,
								offset: 0,
								className: 'plot-popup',
							})
								.setLngLat(e.lngLat)
								.setDOMContent(container) // Uses DOM node, not HTML string
								.addTo(map);

							// Clean up component when popup closes
							/*   popup.on('close', () => {
                if (component) {
                    unmount(component);
                }
                }); */
						}
					});
				}

				map.on('load', () => {
					if (map.isStyleLoaded()) {
						// Safely add layers
					} else {
						map.once('styledata', () => {
							// Add layers after style loads
						});
					}
				});

				// Fires when style data changes or loads
				map?.on('styledata', () => {
					if (map.isStyleLoaded()) {
						// Style is fully loaded
						console.warn('loaded style');
					}
				});

				// Keep WMS above basemap / hillshade so it is visible (order was wrong when layer was added in setTimeout)
				if (map.getLayer('zonification_wms_layer')) {
					map.moveLayer('zonification_wms_layer');
				}
			});
		}
	});

	$effect(() => {
		/*    if (map && parentClickedElem && type==='plots')
    {
    if (map.getLayer('plots_geojson_border')) {
        map.on('styledata', () => {

                console.log('parentClickedElem from smallMap', parentClickedElem);



        })
    }
    } */
	});

	let mapInitialized = $state(false);

	let handleMapLoad = (event) => {
		//j0t working
		console.log('Map loaded event:', event);
		alert('Map loaded event:');
		mapInitialized = true;
	};
	let style =
		'https://api.maptiler.com/maps/topo-v2/style.json?key=PfeqCqeOXLcGceolGsUb';
	let maxBounds = [
		new LngLat(6.8664788526199345, 45.27142104025339),
		new LngLat(7.862639291375302, 45.717987498807474),
	];

	let keyComponent = $state([type + '_' + selTaxon]);
	let lnglat = $state({ lng: 7.37, lat: 45.51 });

	// Track component ID for cleanup - type is already unique
	let componentId = `markers_${type}`;

	// Cleanup mounted components on destroy (component-specific)
	onDestroy(() => {

		const componentData = window[componentId];
		console.log('componentData', componentData);
		if (componentData) {
			if (componentData.mountedComponents) {
				console.log(
					`🗑️ Unmounting ${componentData.mountedComponents.length} components`
				);
				componentData.mountedComponents.forEach((component) => {
					unmount(component);
				});
			}
			if (componentData.markers) {
				console.log(`🗑️ Removing ${componentData.markers.length} markers`);
				componentData.markers.forEach(({ marker }) => {
					marker.remove();
				});
			}
			// Clean up the component-specific data
			console.log('cleaning up componentId', componentId);
			delete window[componentId];
		}
	});

	function handleButtonClick(event) {
		console.log('handleButtonClick', event);
		console.warn(event.target.value);

		let value = event.target.value;
		generalMapPlotsTabsType = value;
	}

</script>

<!-- {#if !derivedInterfaceData?.plots_data?.length > 0} -->
{#if geoPlotsByValley?.toprights?.length > 0}



	<div class="w-full h-full relative">

		<div class="absolute top-2 left-10 z-11">
		<!-- <h3 class="text-sm font-semibold mb-2 capitalize">Mouseover plot: {derivedMouseoverPlot}</h3> -->
			<ButtonGroup.Root
				class="bgroup-1 gap-1 hover:cursor-pointer"
				value={generalMapPlotsTabsType}
				onclick={handleButtonClick}
			>
				<Button
					class={generalMapPlotsTabsType === 'richness' ? 'selected' : ''}
					value="richness">Richness </Button
				>
				<Button
					class={generalMapPlotsTabsType === 'abundance' ? 'selected' : ''}
					value="abundance">Abundance</Button
				>
				<Button
					class={generalMapPlotsTabsType === 'shannon' ? 'selected' : ''}
					value="shannon">Shannon</Button
				>
			</ButtonGroup.Root>
		</div>
		<div class="absolute top-0 left-0 w-full h-full overflow-none"
		bind:this={mapContainer}
		>
			<MapLibre
				bind:map
				zoom={9.8}
				center={[7.37, 45.51]}
				class="map_container {_interface}"
				{style}
				{maxBounds}
			>
				<NavigationControl />
			</MapLibre>
			<!-- 	<div class="absolute top-4 right-4 z-10">
			<button
				class="bg-blue-500 text-white px-3 py-2 rounded-md"
				onclick={() => {
					markerVisible = !markerVisible;
				}}
			>
				{markerVisible === true ? 'Hide valley stats' : 'Show valley stats'}
			</button>
		</div> -->

			<div class="absolute top-4 right-4 z-10 w-auto">
				<button
					class="cursor-pointer mb-1 flex items-center gap-2 bg-background text-foreground px-3 py-2 rounded-md"
					onclick={() => {
						rastersVisible = !rastersVisible;
						if (rastersVisible) {
						/* 	map.setLayoutProperty(
								'orco_point_wms_layer',
								'visibility',
								'visible'
							); */
							map.setLayoutProperty(
								'orco_circle_wms_layer',
								'visibility',
								'visible'
							);
						} else {
							/* map.setLayoutProperty(
								'orco_point_wms_layer',
								'visibility',
								'none'
							); */
							map.setLayoutProperty(
								'orco_circle_wms_layer',
								'visibility',
								'none'
							);
						}
					}}
				>
					<span class="text-sm">Rasters</span>
					<WrenchIcon class="w-3 h-3" />
					<!-- <ChevronDownIcon /> -->
				</button>

				{#if rastersVisible}
					<div class="flex items-center gap-2 bg-gray-200 rounded-md p-1">
						<button
							class=" {visibleLatestORCO
								? 'bg-blue-500 text-white'
								: 'bg-background text-foreground'} cursor-pointer mb-1 flex items-center gap-2 bg-background text-foreground px-3 py-2 rounded-md"
							onclick={() => {
								visibleLatestORCO = !visibleLatestORCO;
								visibleOldestORCO = false;
								if (visibleLatestORCO) {
									map.setLayoutProperty(
										'drone_orco_latest_layer',
										'visibility',
										'visible'
									);
									map.setLayoutProperty(
										'drone_orco_oldest_layer',
										'visibility',
										'none'
									);
								} else {
									map.setLayoutProperty(
										'drone_orco_latest_layer',
										'visibility',
										'none'
									);
								}
							}}
						>
							<span class="text-sm">2025 ORCO</span>
						</button>
						<button
							class=" {visibleOldestORCO
								? 'bg-blue-500 text-white'
								: 'bg-background text-foreground'} cursor-pointer mb-1 flex items-center gap-2 bg-background text-foreground px-3 py-2 rounded-md"
							onclick={() => {
								visibleOldestORCO = !visibleOldestORCO;
								visibleLatestORCO = false;
								if (visibleOldestORCO) {
									map.setLayoutProperty(
										'drone_orco_oldest_layer',
										'visibility',
										'visible'
									);
									map.setLayoutProperty(
										'drone_orco_latest_layer',
										'visibility',
										'none'
									);
								} else {
									map.setLayoutProperty(
										'drone_orco_oldest_layer',
										'visibility',
										'none'
									);
								}
							}}
						>
							<span class="text-sm">2015 GPC ORCO</span>
						</button>
					</div>
				{/if}
				<button
					class="cursor-pointer mb-1 flex items-center gap-2 bg-background text-foreground px-3 py-2 rounded-md"
					onclick={() => {
						settingsVisible = !settingsVisible;
						_plotStore.data = {
							clickedPlot: 'gpa',

							activeTab: 'plots',
						};
					}}
				>
					<span class="text-sm">Settings</span>
					<WrenchIcon class="w-3 h-3" />
					<!-- <ChevronDownIcon /> -->
				</button>

					<Command.Root
						class=" {settingsVisible ? 'block' : 'hidden'} bg-background text-foreground z-11 rounded-sm border shadow-sm py-3 m-1"
					>
						<Command.List class="text-xs">
							<Command.Group>
								<Command.Item
									class=""
									onclick={() => {
										//_interface = 'withoutBiennio'?'withBiennio':'withoutBiennio';
										if (_interface === 'withoutBiennio')
											_interface = 'withBiennio';
										else _interface = 'withoutBiennio';
									}}
								>
									<input
										type="checkbox"
										checked={_interface === 'withBiennio'}
									/>
									<label for="showMapOfChanges">Map of changes</label>
								</Command.Item>
								<Command.Item
									class=""
									onclick={() => {

										markerVisible = !markerVisible;
										console.warn('markerVisible', markerVisible);
									}}
								>
									<input type="checkbox" bind:checked={markerVisible} />
									<label for="markerVisible">Valley stats</label>
									<!-- 	{markerVisible === true ? 'Hide valley stats' : 'Show valley stats'} -->
								</Command.Item>
							</Command.Group>
							<Command.Group>
								<Command.Item
									class=""
									onclick={() => {
										showTables = !showTables;
										tableToShow = 'plots';
									}}
								>
									<input type="checkbox" bind:checked={showTables} />
									<label for="showTables">Taxa tables</label>
									<!-- {showTables === true ? 'Hide tables' : 'Show tables'} -->
								</Command.Item>

								{#if showTables}
									<div class="pl-2 bg-gray-200 rounded-sm p-1">
										<Command.Item
											class=""
											onclick={() => {
												showAllParameters = !showAllParameters;
											}}
										>
											<input type="checkbox" bind:checked={showAllParameters} />
											<label for="showAllParameters">Show all parameters</label>
										</Command.Item>

										<Command.Item
											class=""
											onclick={() => {
												tableInfo =
													tableInfo === 'selTaxonOnly' ? 'all' : 'selTaxonOnly';
											}}
										>
											<input
												type="checkbox"
												checked={tableInfo !== 'selTaxonOnly'}
											/>
											<label for="selTaxonOnly">Show all taxons</label>
										</Command.Item>
									</div>

									<!-- let =$state('selTaxonOnly'); -->
								{/if}

								<Command.Item
									class=""
									onclick={() => {
										showTables = !showTables;
										tableToShow = 'park';
									}}
								>
									<input type="checkbox" bind:checked={showTables} />
									<label for="showTables">Park tables</label>
									<!-- {showTables === true ? 'Hide tables' : 'Show tables'} -->
								</Command.Item>
							</Command.Group>
						</Command.List>
					</Command.Root>


				<!--  -->
			</div>

			{#if showTables}
				<div class="absolute top-15 left-4 z-10">
					<MapTables
						{map}
						{showAllParameters}
						{tableToShow}
						{tableInfo}
						param={type}
						{selTaxon}
						{_interface}
						{derivedInterfaceData}
						{paramStats}
					/>
				</div>
			{/if}
			<div
				class="taxaManager w-[15vw] absolute {showStats ? 'bottom-120' : 'bottom-8'} right-4 bg-background p-1 rounded-lg shadow-lg z-10"
			>
				<h4 class="text-sm font-semibold mb-2 capitalize">
					{type} - {selTaxon}
				</h4>

				<Select.Root
					type="single"
					bind:value={selTaxon}
					onValueChange={(value) => {
						_chartStoresMapWithoutBiennio.plotsParams={..._chartStoresMapWithoutBiennio.plotsParams, taxons: [value]};
						// keyComponent.push(type+'_'+value);
					}}
				>
					<Select.Trigger data-tid="p-1 labels.choose_taxon">
						Choose Taxon: {selTaxon}
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							<Select.Item value="all" data-tid="taxonomy.all"
								>All taxa</Select.Item
							>
							<Select.Item value="uccelli" data-tid="taxonomy.uccelli"
								>Uccelli</Select.Item
							>
							<Select.Item value="formiche" data-tid="taxonomy.formiche"
								>Formiche</Select.Item
							>
							<Select.Item value="ortotteri" data-tid="taxonomy.ortotteri"
								>Ortotteri</Select.Item
							>
							<Select.Item value="ragni" data-tid="taxonomy.ragni"
								>Ragni</Select.Item
							>
							<Select.Item value="lepidotteri" data-tid="taxonomy.lepidotteri"
								>Lepidotteri</Select.Item
							>
							<Select.Item value="carabidi" data-tid="taxonomy.carabidi"
								>Carabidi</Select.Item
							>
							<Select.Item value="stafilinidi" data-tid="taxonomy.stafilinidi"
								>Stafilinidi
							</Select.Item>
						</Select.Group>
					</Select.Content>
				</Select.Root>

				<!-- Gradient bar -->
				<div class="relative overflow-hidden mt-2">
					<div
						class="w-full h-3"
						style="background: linear-gradient(to right,
                     {toUseColorScale(paramStats.min)},
                     {toUseColorScale((paramStats.min + paramStats.max) / 2)},
                     {toUseColorScale(paramStats.max)})"
					></div>

					<!-- Labels -->
					<div class="flex justify-between text-xs mt-1 text-gray-600">
						<span>{paramStats.min?.toFixed(1)}</span>
						<span>{((paramStats.min + paramStats.max) / 2)?.toFixed(1)}</span>
						<span>{paramStats.max?.toFixed(1)}</span>
					</div>
				</div>

				<!-- Size legend -->
				<div class="mt-2">
					<div class="flex items-end gap-2 ml-1">
						<div class="flex flex-col items-center">
							<div
								class="rounded-full border-2 border-gray-400"
								style="width: {min_max_derived[0] *
									2}px; height: {min_max_derived[0] *
									2}px; background-color: {toUseColorScale(paramStats.min)}"
							></div>
							<span class="text-xs mt-1" data-tid="labels.min">Min</span>
						</div>
						<div class="flex flex-col justify-center items-center">
							<div
								class="rounded-full border-gray-400 mr-3"
								style="width: {((min_max_derived[0] + min_max_derived[1]) / 2) *
									2}px; height: {((min_max_derived[0] + min_max_derived[1]) /
									2) *
									2}px; background-color: {toUseColorScale(
									(paramStats.min + paramStats.max) / 2
								)}"
							></div>
							<span class="text-xs mt-1 mr-3" data-tid="labels.mid">Mid</span>
						</div>
						<div class="flex flex-col items-center">
							<div
								class="rounded-full border-gray-400"
								style="width: {min_max_derived[1] *
									2}px; height: {min_max_derived[1] *
									2}px; background-color: {toUseColorScale(paramStats.max)}"
							></div>
							<span class="text-xs mt-1" data-tid="labels.max">Max</span>
						</div>
					</div>
					<Button class="mt-2 cursor-pointer" onclick={() => {
						showStats = !showStats;
					}}>{showStats ? 'Hide' : 'Show'} stats</Button>
				</div>

				{#if _interface === 'withBiennio'}
					<div class="mt-2 border-t pl-1">
						<p class="text-xs text-gray-600 mb-2" data-tid="labels.biennio">
							Biennio:
						</p>
						<div class="flex gap-3 text-xs">
							<div class="flex items-center gap-1">
								<div
									class="w-4 h-4 rounded-full border-2"
									style="border-color: #f3910e"
								></div>
								<span>1</span>
							</div>
							<div class="flex items-center gap-1">
								<div
									class="w-4 h-4 rounded-full border-2"
									style="border-color: #949191"
								></div>
								<span>2</span>
							</div>
						</div>
					</div>
				{/if}
			</div>

		</div>

	</div>

	<!-- using w-30vw crashes charts! -->
	 {#if showStats}
	<div class="{showStats ? 'block' : 'hidden'} absolute bottom-4 right-4 z-10 w-[95vw]">

			<PlotsContainer fromMap=true />
		</div>
	{/if}

{:else}{/if}

<style>
:global(.highcharts-tooltip-container) {
  z-index: 999999 !important;
}
	:global(.bgroup-1 .selected) {
		border-color: #fff;

		border-width: 2px;
		color: #000;
		opacity: 1;
	}
	:global(.bgroup-1 div) {
		border-width: 1px;
		opacity: 0.8;
	}
	:global(.maplibregl-popup) {
		max-width: unset !important;
	}
	:global(.plot-popup .maplibregl-popup-content) {
		border: unset !important;
		box-shadow: none !important;
		font-family: Lato !important;
		padding: 2px !important;
		margin: 2px !important;
	}
	:global(.plot-popup .maplibregl-popup-content div) {
		border: 0px !important;
		box-shadow: none !important;
		font-family: Lato !important;
	}

	:global(.plot-popup .plot-popup-card) {
		border: 0px !important;
	}
	:global(.maplibregl-ctrl-attrib) {
		display: none;
	}
	:global(.map_container) {
		height: 100% !important;

		/* width: 100% !important; */
	}
</style>
