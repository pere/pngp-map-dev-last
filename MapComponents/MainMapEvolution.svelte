<script>

//@ts-nocheck
import { browser } from '$app/environment';
	import { dev } from '$app/environment';
  import { watch,Previous } from 'runed';
	// Dynamic import for svelte-inspect-value (client-only)

	if (browser && dev) {
		import('svelte-inspect-value').then(mod => {
			Inspect = mod.default;
		});
	}
import { Spinner } from "$lib/components/ui/spinner/index.js";
import { LoaderCircle } from 'lucide-svelte';
import { onMount, onDestroy, untrack, mount, unmount} from 'svelte';
import { get } from 'svelte/store';
import { feature as featureTopojson } from "topojson-client";
 /* import { navigating } from '$app/stores'; */
import { Jumper } from 'svelte-loading-spinners';
import * as ss from 'simple-statistics';
import * as d3 from 'd3';
/* import CountsLegendGeo from './NOTUSEDcountsLegendGeo.svelte'; */
import CountsGeoLegend from './countsGeoLegend.svelte';
/* import FiltersLegend from './filtersLegend.svelte'; */
/* import { Popup } from 'maplibre-gl'; */
import chroma from 'chroma-js';
/* import PointsLegend from './pointsLegend.svelte'; */
import * as pkg from 'maplibre-gl';
import { getTaxData,findTaxById } from '$lib/stores/test.svelte.js';
import TestPopupTax from '$lib/components/TaxSearchComponentsTest/TestPopupTax.svelte';
import PolygonPopupInfo from './PolygonPopupInfo.svelte';
import {mapStore,fetchOverlaysFunction2, overlayLoadingState, getLayersNew, isMapReady, getMap} from '$lib/stores/mapLayers.svelte.js';
import { Separator } from '$lib/components/ui/separator/index.js';
import { runeStore } from '$lib/stores/svelte5_stores/RunesStore.svelte.js';
import GeoEvolution from '$lib/components/GeoAnalysis/GeoEvolution.svelte';
import {
		_polygonStore,getParamsChanged

	} from '$lib/stores/svelte5_stores/PolygonStoreNew.svelte.js';
  import {
        MapLibre,
        NavigationControl,
        ScaleControl,
        GlobeControl,
        Marker
    } from 'svelte-maplibre-gl';
    import { remoteDataStore,filteredTaxInputStore,selGrid } from '../../stores/new_sidebar_stores.js';
    import { mapInitialized,navigating } from '../../stores/new_sidebar_stores.js';
    import { Label } from '$lib/components/ui/label/index.js';
  import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
  import { Switch } from '$lib/components/ui/switch/index.js';


  import { Button } from '$lib/components/ui/button/index.js';
const {Popup,LngLat} = pkg;
let Inspect = $state(null);

let layers_new = $derived(getLayersNew());

let showMapLabels=$derived.by(()=>_polygonStore.showMapLabels);

    // Use derived states from the store
    let mapNew = $derived(getMap()); // Reactive map from store
    let mapReady = $derived(isMapReady()); // Reactive boolean for map availability

/** `$state` so `watch(() => map, …)` / `bind:map` participate in reactivity (plain `let map` is not tracked). */
	let map = $state(null);

  let geojson_1km;



	    let loadingMap= $derived.by(() =>{
  return _polygonStore.loadingMap;
});

// Svelte 5 reactive state for popup data
let popupQueryData = $state(null);
let derivedDataPolygons = $derived(runeStore.resultsFetched.polygons);

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

  let jetBreaksData = $state();


  let colorScale;

  let prevPointsIds=$state([]);

  const previousPointsIds = new Previous(() =>runeStore.spAddedToMap.map(d => d.tax_id));


  let symbolColor=$state({legend:[],
    colorScale:[],
    ids:[]
  });
  let loadedPoints=false;
  let clickingPol=true;

  // Derived state for overlay loading status
  let isLoadingOverlays = $derived(overlayLoadingState.isLoading);
  let overlayError = $derived(overlayLoadingState.error);
  let loadedOverlayCount = $derived(Object.keys(overlayLoadingState.loadedOverlays).length);


  let previousGeoYearsArray = $state([]);
// This effect runs multiple times because:
// 1. It depends on map, $paramsFilter, $filteredTaxInputStore, and runeStore.spAddedToMap
// 2. Any changes to those dependencies will trigger a re-run
// 3. The effect modifies state (colorScale, legend) which can cause cascading updates
$effect(() => {

console.log('previousPointsIds',previousPointsIds.current)
if (!runeStore.spAddedToMap || runeStore.spAddedToMap.length == 0) return;

let spAddedToMapIds= untrack(() => runeStore.spAddedToMap.map(d => d.tax_id)  );
console.log('spAddedToMapIds',spAddedToMapIds)

  if (Array.from(prevPointsIds) == spAddedToMapIds) return;
  console.log('spAddedToMap from mainmap',spAddedToMapIds,Array.from(prevPointsIds))



  // Only update if ids have actually changed
  // Compare array contents, not references
  const currentIds = Array.from(spAddedToMapIds);
  const prevIds = Array.from(prevPointsIds);

  // Check if arrays have different lengths or different values
  if (currentIds.length !== prevIds.length ||
      !currentIds.every((id, index) => id === prevIds[index]))

      {

    console.log('ids for legend',spAddedToMapIds,prevPointsIds)

    colorScale = spAddedToMapIds.length
      ? chroma.scale(['#ff69e0', '#5aef47', '#b02c44', '#4b65ff']).mode('lch').colors(spAddedToMapIds.length)
      : [];

   // if (map.getLayer('pngp_obs_simple') && map.setLayoutProperty('pngp_obs_simple', 'visibility', 'visible')) {
      let legend = [
        'match',
        ['get', 'tax_id'],
        //change accordinglly follwing this schema 'B', '#00ff00',
        ...colorScale.flatMap((color, index) => [spAddedToMapIds[index], color])


      ];

      let inatLegend=[
        'match',
        ['get', 'pngp_tax_id'],
        ...colorScale.flatMap((color, index) => [spAddedToMapIds[index], color])
      ];
      legend.push('#000000');
      inatLegend.push('#000000');

      let t={
        legend:legend,
        colorScale:colorScale,
        ids:spAddedToMapIds,
        inatLegend:inatLegend

      };


      // Good (new reference)
      symbolColor = { ...t};
      //convert to array
      prevPointsIds = spAddedToMapIds;
      loadedPoints=false;



  //  }
  }
});


    $effect(()=>{
    console.log('mapInitialized from effect: ' + $mapInitialized);
    console.warn('navigating ',$navigating)
});

// Effect to react when map becomes available
$effect(() => {
    console.log('Map state changed:', mapNew);

    if (mapNew) {
        console.log('🗺️ mapNew is now available!', map);

        // Do something when map becomes available
        handleMapReady();
    } else {
        console.log('❌ mapNew is null/undefined');
    }
});

// Svelte 5 effect to react to overlay loading completion
// Track if overlays have been loaded to prevent re-processing on language changes
let overlaysLoaded = $state(false);

$effect(() => {
    console.log('Overlay loading state changed:', overlayLoadingState);

    // React when loading is complete and there's no error
    let overlays=Object.keys(overlayLoadingState.loadedOverlays);
    console.log('overlays in effect',overlays)
    if (!overlayLoadingState.isLoading && !overlayLoadingState.error) {


    if (overlays.length===layers_new.filter(d=>d.main).length && !overlaysLoaded)
    {

      console.warn('overlays',overlays)
    /*   console.log(map.getStyle().sources)
      console.warn(map.getStyle().layers) */

        /* const loadedOverlays = Object.keys(overlayLoadingState.loadedOverlays);

        if (loadedOverlays.length > 1) {
         */


            // Do something when fetching is done
            handleOverlayLoadComplete();
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

    //already loaded in the mapLayers.svelte.js....


    // Add your custom logic here for when fetching is done:
    // - Add overlay layers to the map
    // - Update UI state
    // - Trigger other map operations
    // - Show success notifications

    // Example: Add loaded overlays to the map
    Object.entries(overlayLoadingState.loadedOverlays).forEach(([id, overlay]) => {
       // console.log(`Processing loaded overlay: ${id}`, overlay.data);

        // Add the overlay as a source and layer to the map

        if (map && overlay.data) {
            try {
                // Add source if it doesn't exist
                if (!map.getSource(`${id}_source`)) {
                    map.addSource(`${id}_source`, {
                        type: 'geojson',
                        data: overlay.data
                    });
                }
                let l=layers_new.find(d=>d.id===id);



                // Add layer if it doesn't exist
                if (l && l.default) {



                  if (!map.getLayer(l.id))
                  map.addLayer(l);
                  map.setLayoutProperty(l.id, 'visibility', 'visible');
                    console.log(`Added overlay ${id} to map`);

                  }

                  let lab=id+'_labels';
                  let labels=layers_new.find(d=>d.id===lab);


                  if (labels){

                    if (!map.getLayer(labels.id))
                    map.addLayer(labels);

                    if (labels.default)
                    map.setLayoutProperty(labels.id, 'visibility', 'visible');

                  }


            } catch (error) {
                //console.error(`Failed to add overlay ${id} to map:`, error);
            }
        }

    });
}

// Function to handle overlay loading errors
function handleOverlayLoadError(error) {
    console.error('🚨 Overlay loading failed:', error);

    // Add your error handling logic here:
    // - Show error notifications
    // - Retry loading
    // - Fallback to default overlays
    // - Update UI to show error state
};

// Function to handle when map becomes ready
function handleMapReady() {
    console.log('🎉 Map is ready! Setting up map configurations...');

    // Add your custom logic here for when map becomes available:
    // - Set up event listeners
    // - Add initial layers
    // - Configure map settings
    // - Start loading overlays

    if (mapReady) {




    }
}



    let layers=[
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
    id:'pngp_grid_1km_evolution',
    type:'fill',
    source:'pngp_grid_1km_evolution_source',

    layout:{
        'visibility':'none'
    },
    paint: {
        "fill-color": "#0080ff",
        "fill-opacity": 0.5
    }
  },   {
        id: 'pngp_grid_1km_evolution_labels',
        type: 'symbol',
        source: 'pngp_grid_1km_evolution_source',

        layout: {
          visibility: 'none',
          'text-field': ['get', 'countAll'],
          //['get', 't'],

          'text-size': 12,
          'text-offset': [0, 10],
          'text-anchor': 'center',
          'text-justify': 'center',

          'text-allow-overlap': true,
          'text-ignore-placement': false
        },
        paint: {
        'text-color': '#0080ff',
      'text-halo-color': '#ffffff',
      'text-halo-width': 5
        }
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
            id:'pngp_obs_simple',
            type:'circle',
            source:'pngp_obs_simple_source',
            'source-layer':'pngp_obs_simple',
            layout:{
                'visibility':'none'
            },
            paint:{
                'circle-color':'#7dd4e3',

                //create stops by zoom
                'circle-radius':[
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    //being 9 full extent
                    9,2,
                    11,4,
                    15,6],
                'circle-stroke-width':[
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    //being 9 full extent
                    9,.4,
                    11,1,
                    15,1.5],
                'circle-stroke-color':'#f0f0f0'
                    }
    },
    {
            id:'pngp_inat',
            type:'circle',
            source:'pngp_inat_source',
            'source-layer':'pngp_inat',
            layout:{
                'visibility':'none'
            },
            paint:{
                'circle-color':'#10ebe3',

                //create stops by zoom
                'circle-radius':[
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    //being 9 full extent
                    9,5,
                    11,7,
                    15,11],
                'circle-stroke-width':[
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    //being 9 full extent
                    9,2,
                    11,2.5,
                    15,3.5],
                'circle-stroke-color':'#10a2eb',
                'circle-stroke-opacity':1,

                    }
    }




    ];
    let sources=[

       /*  {
            id:'pngp_grid_140m_source',
            type:'vector',
            tiles:
                 ["https://pere.gis-ninja.eu/geoserver/gwc/service/wmts?layer=pngp:pngp_grid_140m&tilematrixset=EPSG:900913&Service=WMTS&Request=GetTile&Version=1.0.0&Format=application/x-protobuf;type=mapbox-vector&TileMatrix=EPSG:900913:{z}&TileCol={x}&TileRow={y}"]

        }, */
        {
            id:'pngp_obs_simple_source',
            type:'vector',
            tiles:
                 ["https://pere.gis-ninja.eu/geoserver/gwc/service/wmts?layer=pngp:pngp_obs_simple&tilematrixset=EPSG:900913&Service=WMTS&Request=GetTile&Version=1.0.0&Format=application/x-protobuf;type=mapbox-vector&TileMatrix=EPSG:900913:{z}&TileCol={x}&TileRow={y}"]
        },
        {
                id:'pngp_inat_source',
                type:'vector',
                tiles:
                     ["https://pere.gis-ninja.eu/geoserver/gwc/service/wmts?layer=pngp:pngp_inat&tilematrixset=EPSG:900913&Service=WMTS&Request=GetTile&Version=1.0.0&Format=application/x-protobuf;type=mapbox-vector&TileMatrix=EPSG:900913:{z}&TileCol={x}&TileRow={y}"]
            }
    ];
    function updatePointsLayers(pol_ids, _paramsFilter)
        {
          console.trace();
            if (!map)
            return;


            /* let spToMapIds=_paramsFilter.toMapIds; */

            if (map.getLayer('pngp_inat'))
            map.setLayoutProperty('pngp_inat', 'visibility', 'none');
            if (map.getLayer('pngp_obs_simple'))
            map.setLayoutProperty('pngp_obs_simple', 'visibility', 'none');

            /* if ($selGrid=='pngp_grid_140m_topo')
            {
              console.log('pngp_grid_140m_topo');
              map.setLayoutProperty('pngp_grid_1km_evolution', 'visibility', 'none');
              map.setLayoutProperty('pngp_grid_1km_evolution_outline', 'visibility', 'none');

              map.moveLayer('pngp_grid_140m_topo','pngp_grid_140m_topo_outline');

              map.setLayoutProperty('pngp_grid_140m_topo', 'visibility', 'visible');
              map.setLayoutProperty('pngp_grid_140m_topo_outline', 'visibility', 'visible');
            } */
            if ($selGrid=='pngp_grid_1km_evolution')
            {
              console.log('pngp_grid_1km_evolution');

              map.moveLayer('pngp_grid_1km_evolution','pngp_grid_1km_evolution_outline');
              map.setLayoutProperty('pngp_grid_1km_evolution', 'visibility', 'visible');
              map.setLayoutProperty('pngp_grid_1km_evolution_outline', 'visibility', 'visible');
            }


          if (!map.getLayer('pngp_obs_simple'))
          map.addLayer(layers.find(d=>d.id=='pngp_obs_simple'));



            if (map.getLayer('pngp_obs_simple')){
              //map.moveLayer('pngp_obs_simple');

              map.setLayoutProperty('pngp_obs_simple', 'visibility', 'none');


              let filteredLiteral=_paramsFilter.toMapIds;
          /*     let filteredLiteral;
                      if (!_paramsFilter.updateMapOnSelection)
              {

                filteredLiteral=_paramsFilter.manuallyFilteredItemsSpecies.map((item)=>item.tax_id);
              }
              else
              {

                filteredLiteral=[...$filteredTaxInputStore.map((d)=>d.tax_id)]
              } */
              console.log('filteredLiteral',filteredLiteral)
              /* [
                  {pol_id: 1, count: 1}
              */
              //map.setFilter('pngp_obs_simple',['in', ['get', 'tax_id'], ['literal', pol_ids]]);

              let inatFilter=['in', ['get', 'pngp_tax_id'], ['literal', filteredLiteral]];

              if (!map.getLayer('pngp_inat'))
              map.addLayer(layers.find(d=>d.id=='pngp_inat'));

              map.setFilter('pngp_inat',inatFilter)
              /* map.moveLayer('pngp_inat'); */


            var baseFilter=['all', ['has', 'pol_id'],

              ['in', ['get', 'pol_id'],

            ['literal', [...pol_ids]]],
              ['in', ['get', 'tax_id'],


            ['literal',filteredLiteral]
              ]]
            let yearFilter=[];

                      if (_paramsFilter.yearsArray.length>0 && _paramsFilter.filtersActive)
              {
                  console.log('paramsFilter.yearsArray',_paramsFilter.yearsArray);
                  yearFilter=['in',['get','year'],['literal',[..._paramsFilter.yearsArray]]];
                  baseFilter.push(yearFilter);
              }

              if (_paramsFilter.valleysArray.length>0 && _paramsFilter.filtersActive)
              {
                  console.log('paramsFilter.valleysArray',_paramsFilter.valleysArray);
                  valleyFilter=['in',['get','valley'],['literal',[..._paramsFilter.valleysArray]]];
                  baseFilter.push(valleyFilter);


              }
              console.log('baseFilter',baseFilter);

              map.setFilter('pngp_obs_simple',baseFilter)
              map.moveLayer('pngp_obs_simple');


                      map.setLayoutProperty('pngp_obs_simple', 'visibility', 'visible');

                      console.warn('layers after setting datasssss',map.getStyle().layers)



            }
            //if (map.getLayer('grid')){




      //  navigating.set(false);
}


let selGridLayer = $derived.by((d) => {
     console.log('selGrid in derived in updatePointsLayers', $selGrid,layers);

     return layers.find((layer) => layer.id === $selGrid);
   });
let selGridLayerId = $derived.by((d) => {


     return layers.find((layer) => layer.id === $selGrid).id;
   });


function updateMapLabels() {
	console.log('updateMapLabels showMapLabels', showMapLabels);
	// Must mutate store — `showMapLabels` is $derived (read-only); assigning to it does nothing.
	_polygonStore.showMapLabels = !_polygonStore.showMapLabels;

}
//watch(()=>_polygonStore.showMapLabels,(curr,prev)=>{
/* watch(()=>showMapLabels,(curr,prev)=>{
  console.log('showMapLabels in watchwww', curr,prev);
}) */

// Watch [labels, map]: single-source watch + `if (curr === prev) return` skipped updates when
// `showMapLabels` stayed false but `map` became ready (both false). Tuple form tracks both.
watch(
	[
		() => showMapLabels,
		() => map,
	],
	([labels, mapInst], [prevLabels, prevMap]) => {
		console.log('showMapLabels watch', { labels, mapReady: !!mapInst?.getStyle, prevLabels, prevMap });
		if (!mapInst?.getStyle) return;
		if (!mapInst.getLayer('pngp_grid_1km_evolution_labels')) {
			const def = layers.find((d) => d.id == 'pngp_grid_1km_evolution_labels');
			if (def && labels) mapInst.addLayer(def);
		}
		if (!mapInst.getLayer('pngp_grid_1km_evolution_labels')) return;
		mapInst.setLayoutProperty(
			'pngp_grid_1km_evolution_labels',
			'visibility',
			labels ? 'visible' : 'none'
		);
	}
);

function updatePolygonsLayers(jetBreaksData)
{
  alert('updatePolygonsLayers')
  console.log('jetBreaksData in updatePolygonsLayers',jetBreaksData)
  let basePaint=[

      'step',
      ["get", "count"],
     // jetBreaksData.colors[0]
     '#000000'
    ]

    //jetBreaksData.breaks remove first item
    let breaks=jetBreaksData.breaks.slice(1);
    breaks.forEach((d,i)=>{
//console.log('jetBreaksData.colors[i]',jetBreaksData.colors[i],d);
      basePaint.push(d,jetBreaksData.colors[i]);
    })

    console.warn('basePaint in breaks',basePaint);


    map.setPaintProperty('pngp_grid_1km_evolution', 'fill-opacity', 0.8);
    map.setPaintProperty('pngp_grid_1km_evolution', 'fill-color', basePaint);
    debugger
    map.setLayoutProperty('pngp_grid_1km_evolution', 'visibility', 'visible');
    map.moveLayer('pngp_grid_1km_evolution');

    if (!map.getLayer('pngp_grid_1km_evolution_labels') && showMapLabels)
            map.addLayer(layers.find(d=>d.id=='pngp_grid_1km_evolution_labels'));
          map.setLayoutProperty('pngp_grid_1km_evolution_labels', 'visibility', 'visible');
           console.warn(map.getStyle.layers)

}

 $effect(()=>{
  return
  if (!jetBreaksData ||  jetBreaksData.length==0 || derivedDataPolygons.length==0)
  return;
else


  console.log('jetBreaksData',jetBreaksData);

console.log('jetBreaksData in effect',jetBreaksData)
  let selGridValue=get(selGrid);

  //create a color scale for the topo grid
 // let colorScale=d3.scaleSequential(d3.interpolate('red', 'blue')).domain([0, 2]);
 //create a color scale of 10 colors


let basePaint=[

      'step',
      ["get", "count"],
      jetBreaksData.colors[0]
    ]

    //jetBreaksData.breaks remove first item
    let breaks=jetBreaksData.breaks.slice(1);
    breaks.forEach((d,i)=>{
//console.log('jetBreaksData.colors[i]',jetBreaksData.colors[i],d);
      basePaint.push(d,jetBreaksData.colors[i]);
    })

    console.warn('basePaint in breaks',basePaint);


    map.setPaintProperty('pngp_grid_1km_evolution', 'fill-opacity', 0.8);
    map.setPaintProperty('pngp_grid_1km_evolution', 'fill-color', basePaint);
    map.setLayoutProperty('pngp_grid_1km_evolution', 'visibility', 'visible');
    map.moveLayer('pngp_grid_1km_evolution');


 })


let lastProcessedDataLength = 0;

$effect(()=>{

  if (!map)
  return;

    if (derivedDataPolygons.length==0 || jetBreaksData.length==0)
    {

   /*    console.log('no derivedPolygons or jetBreaksData')
      if (map.getLayer('pngp_grid_1km_evolution'))
      map.setLayoutProperty('pngp_grid_1km_evolution', 'visibility', 'none');
      return; */
    }
    else
    {
      console.log('derivedPolygons and jetBreaksData',derivedDataPolygons,jetBreaksData)

    }

    lastProcessedDataLength = derivedDataPolygons.length;

    // Use get() to avoid tracking these as reactive dependencies
    const selGridValue = runeStore.selGrid;
    /* const paramsFilterValue = get(paramsFilter);
    console.log('selGridValue (non-reactive):', selGridValue);
    console.log('paramsFilter (non-reactive):', paramsFilterValue); */

          //let pol_ids=remoteData.map((d)=>d.pol_id);
          console.warn(_paramsFilter)


      let counts=derivedDataPolygons.map((d)=>d.count);


    console.log('🧪 CHECKING GRID CONDITION: selGridValue =', selGridValue);


      console.log('sss',selGridValue);

      const source = map.getSource('pngp_grid_1km_evolution_source');
      const oriData=geojson_1km;


      let sortedData=derivedDataPolygons.sort((a,b)=>a.pol_id-b.pol_id); // Use slice() to avoid mutating original
      let pol_ids=sortedData.map(d=>d.pol_id);
      console.log('sortedData',sortedData,pol_ids);
     // console.warn('filtered currentData',oriData.features.filter(d=>pol_ids.includes(d.properties.pol_id)))



      if (!oriData || !oriData.features) {
        console.warn('❌ geojson data not available');
        return;
      }
      let tt=oriData.features.filter(d=>pol_ids.includes(d.properties.pol_id));
      console.log('tt',tt)

      // Modify features: add 'test' from array
      let t=oriData.features.filter(d=>pol_ids.includes(d.properties.pol_id))
      .sort((a,b)=>a.properties.pol_id-b.properties.pol_id)
      .map((feature, i) => {
      //  console.log('info',i,feature.properties.pol_id,sortedData[i]?.pol_id,sortedData[i]?.count);


        return {
          ...feature,
          properties: {
            ...feature.properties,
            count: sortedData[i]?.count || 0
          }
        };
      });
      console.log('oriData new',t);

      // Update source data to trigger re-render
      source.setData({
          "type": "FeatureCollection",
          "features":t
        } );




    updatePolygonsLayers(jetBreaksData)

    updatePointsLayers(pol_ids, _paramsFilter);
    let _showMapLabels=untrack(()=>showMapLabels);

    if (!map.getLayer('pngp_grid_1km_evolution_labels') && _showMapLabels)
    {
    map.addLayer(layers.find(d=>d.id=='pngp_grid_1km_evolution_labels'));

  map.setLayoutProperty('pngp_grid_1km_evolution_labels', 'visibility', 'visible');
  alert('updated labels')
  console.warn(map.getStyle.layers)
    }
    else
    {
      map.setLayoutProperty('pngp_grid_1km_evolution_labels', 'visibility', 'none');
    }

})

    onMount(() => {
            // Wait for the Svelte component to be available
            // Only initialize if not already done
            console.warn('mapInitialized: ' + $mapInitialized);
         /*    if (map?.getLayers().length > 0)
            {
                console.log('map.getLayers().length > 0');
                $mapInitialized=true;
            } */
        if (map) {




console.log('map onmount',map);


  fetch("/data/pngp_grid_1km_topo.json")
  .then(res => res.json())
  .then(topoData => {
    // Convert a named object (e.g., 'regions') to GeoJSON
    geojson_1km  = featureTopojson(topoData, 'pngp_grid_1km');
    console.log('geojson_1km',geojson_1km);




  });

  let mouseovered_grid;
  let polygonPopup=null;
  let popup=null;

map.on('data',function (e) {
  //if (e.isSourceLoaded) {
  if (e.dataType === "source") {
    if (e.sourceId === 'pngp_obs_simple_source' && e.isSourceLoaded) {

    /*   let spAddedToMapIds= untrack(() => runeStore.spAddedToMap.map(d => d.tax_id)  );
      const currentIds = Array.from(spAddedToMapIds);
      const prevIds = Array.from(prevPointsIds);

  if (currentIds.length !== prevIds.length ||
      !currentIds.every((id, index) => id === prevIds[index]))
      loadedPoints=false;
      else
      loadedPoints=true;

      */

      if (!loadedPoints && symbolColor?.legend?.length>0)
    {

      if (map.getLayer('pngp_obs_simple')) {

        if (symbolColor?.legend?.length>0)
        {
          console.log('symbolColor',symbolColor);
          map.setPaintProperty('pngp_obs_simple', 'circle-color', symbolColor.legend);
          console.warn(map.getStyle().layers.find((d)=>d.id=='pngp_obs_simple'))

          map.setLayoutProperty('pngp_obs_simple', 'visibility', 'visible');


        }
      }



      if (map.getLayer('pngp_inat')) {

        if (symbolColor?.legend?.length>0)
        {
          console.log('symbolColor',symbolColor);
          map.moveLayer('pngp_inat');
          map.setPaintProperty('pngp_inat', 'circle-color', symbolColor.inatLegend);
          map.setLayoutProperty('pngp_inat', 'visibility', 'visible');

        }

      }

      loadedPoints=true;
    }
  }
  }

})


  map.on('mouseleave','pngp_grid_1km_evolution',
    function(e){
   /*    if (polygonPopup)
    {

      polygonPopup.remove();
      polygonPopup=null;
    } */
  })
  let htmlContent;

function captureHTML(node) {
  htmlContent = node.innerHTML;
  return {
    update() {
      htmlContent = node.innerHTML;
    }
  };
}
  map.on('click','pngp_obs_simple',
  function(e){
    /* clickingPol=false; */
    console.log('clicked on pngp_obs_simple',e)
    let features = map.queryRenderedFeatures(e.point);
    console.log('features',features);
    if (features.length > 0) {
      let feature = features[0];
   /*    if (polygonPopup)
    {

       polygonPopup.remove();
      polygonPopup=null;
    } */
      console.log('feature',feature);
      let properties=feature.properties;
      console.log('properties',properties);
      let [...fields] = Object.keys(properties);
      let tax_id=properties.tax_id;
      let tax_data=findTaxById(tax_id);


      console.log('tax_data from popup',tax_data);
      console.log('fields',fields);
      let values=fields.map((field)=>properties[field]);
      console.log('values',values);
      let html='';


      html+=`<PopupTaxCard tax={tax_data} />`;


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
      props: { inat:false,tax: tax_data , properties:properties}
    });


    // Attach to MapLibre popup
    popup = new Popup({
      anchor:'top',
        closeButton: true,
        closeOnClick: true,
        offset: 0
      })
      .setLngLat(e.lngLat)
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


    }
    else
    {
      console.log('no features found')
    }
  })
map.on('click','pngp_inat',
  function(e){
    /* clickingPol=false; */
    console.log('clicked on pngp_inat',e)
    let features = map.queryRenderedFeatures(e.point);
    console.log('features',features);
    if (features.length > 0) {

   /*    if (polygonPopup)
    {

       polygonPopup.remove();
      polygonPopup=null;
    } */
      let feature = features[0];
      console.log('feature',feature);
      let properties=feature.properties;
      console.log('properties',properties);
      let tax_id=properties.pngp_tax_id;
      let tax_data=findTaxById(tax_id);
      console.log('tax_data from popup',tax_data);

      let [...fields] = Object.keys(properties);



      console.log('tax_data from popup',tax_data);
      console.log('fields',fields);
      let values=fields.map((field)=>properties[field]);
      console.log('values',values);


    const container = document.createElement('div');

    // Create Svelte component instance using Svelte 5 mount function
    const component = mount(TestPopupTax, {
      target: container,
      props: { inat:true,tax: tax_data , properties:properties}
    });

    // Attach to MapLibre popup
    popup = new Popup({
      anchor:'top',
        closeButton: true,
        closeOnClick: true,
        offset: 5
      })
      .setLngLat(e.lngLat)
      .setDOMContent(container) // Uses DOM node, not HTML string
      .addTo(map);

      clickingPol=true;

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
  }
)

  async function getPolData(pol_id){
    console.log('getPolData',pol_id);

    // Set loading state
    popupDataLoading = true;
    popupDataError = null;

    try {

      console.log('_paramsFilter in getPolData',_paramsFilter);
      let ids=_paramsFilter.toMapIds.join(',');
      let years=_paramsFilter.valleysArray
.join(',');
      let valleys=_paramsFilter.valleysArray
.join(',');

      let selGridValue=get(selGrid);

      const response = await fetch(`https://pere.gis-ninja.eu/pngp_phps_new/getPointsPolById.php?ids=${ids}&years=${years}&valleys=${valleys}&pol_id=${pol_id}&grid=pngp_grid_1km_evolution`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

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
      data: popupQueryData
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
    console.log('currentPopupPolygonId from effect',currentPopupPolygonId)
    if (currentPopupPolygonId !== null) {
      console.log('🎯 Auto-triggering evolution data for polygon:', currentPopupPolygonId);
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
      polygonPopup.setHTML(polygonPopup.getElement().innerHTML + loadingContent);
    }
  }

  // Function to handle error state
  function handlePopupDataError(error) {
    console.error('🚨 Error loading popup data:', error);

    // Show error in popup if needed
    if (polygonPopup && polygonPopup.isOpen()) {
      const errorContent = `<div style="color: red;">Error loading data: ${error}</div>`;
      polygonPopup.setHTML(polygonPopup.getElement().innerHTML + errorContent);
    }
  }

  // Helper function to create rich popup content with data
  function createPopupContentWithData(data) {
    if (!data || !Array.isArray(data)) {
      return '<div>No data available</div>';
    }

    const recordCount = data.length;
    let dataTax=data.map((d)=>{
      let tax=findTaxById(d.tax_id);
      let raw=$state.raw(tax)
      console.log('raw',raw);

      return {
        ...d,
        ...raw
      }
    }).sort((a,b)=>b.count-a.count);
    console.log('dataTax',dataTax);

    const species = [...new Set(dataTax.map(d => d.species_n || 'Unknown name'))];


    return `
      <aside class="bg-white p-2">
        <div><span class="text-lg text-amber-500">${dataTax.reduce((acc,d)=>acc+d.count,0)}</span> records</div>
        <div class="border-b border-gray-200 pb-1"><span class="text-lg">${species.length}</span> different species</div>

        <div style="max-height: 200px; overflow-y: auto; mt-2">


          ${dataTax.map(record => `
          <div style="flex flex-row gap-2 border-b border-gray-200 pb-1">


            <div class="text-xs">${record.species_n || 'Unknown'}  (${record.pngp_data?.name_it || 'Unknown'})</div>
           <div class="text-sm"> ${record.count} records</div>



           </div>
          `).join('')}

        </div>
      </aside>
    `;
  }
  $effect(() => {
if (!runeStore.paramsFilter.interface == 'geoanalysis')
return;
    if (_polygonStore.initialFetch!==true && previousGeoYearsArray.length>0 && previousGeoYearsArray!==_polygonStore.paramsFilterPolygons.yearsArray)
    {
console.log('years array changed from mainmap',previousGeoYearsArray,'to',_polygonStore.paramsFilterPolygons.yearsArray);

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

  async function getPolEvolutionData(pol_id)
  {


    popupEvolutionDataLoading = true;
    popupEvolutionDataError = null;
    try {


    previousGeoYearsArray=_polygonStore.paramsFilterPolygons.yearsArray;
    //let years=untrack(()=>_polygonStore.paramsFilterPolygons.yearsArray);
    let years=_polygonStore.paramsFilterPolygons.yearsArray;
    console.log('years',years,previousGeoYearsArray);
    if (years.length==0)
    popupEvolutionQueryData=null;

    const response = await fetch(`https://pere.gis-ninja.eu/pngp_phps_new/get_counts_year_evolution2.php?years=${years}&pol_id=${pol_id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let result = await response.json();



      console.log('🔥 Raw API response:', result);
      console.log('🔥 Result type:', typeof result);
      console.log('🔥 Is result array?', Array.isArray(result));

      let obj={

        years:years.length>0 ? years : null,
        pol_id:pol_id,
        data:result
      }

      popupEvolutionQueryData = obj;

      console.log('✅ getPolEvolutionData completed successfully:',obj);

      if (obj.data.length==0)
      {
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

  let triggerGetPolEvolutionData=function(pol_id){


      setTimeout(async ()=>{
          try {
         //   console.log('Starting getPolData for pol_id:', f.properties.pol_id);
            await getPolEvolutionData(pol_id);
            // The $effect will automatically handle the result when popupQueryData changes
            console.log('getPolData completed, data will be processed by $effect');

          } catch (error) {
            console.error('Failed to get polygon data:', error);
          }
        }, 100);
  }
  //map.on('click','pngp_obs_simple',
  /* function(e){
    console.log('clicked on pngp_obs_simple',e)
    let features = map.queryRenderedFeatures(e.point);
    console.log('features',features);
    if (features.length > 0) { */
  map.on('click',
  // selGridLayerId,
    function(e){
      if (!clickingPol)
      return;

      let features = map.queryRenderedFeatures(e.point);
      console.log('features',features);

      if (runeStore.paramsFilter.interface == 'geoanalysis')
    {

      let dates=untrack(()=>_polygonStore.paramsFilterPolygons.yearsArray);
      let datesText='';
      if (dates.length>0)
      {
        datesText='DATES: '+dates.join(',');
      }
      else
      {
        datesText='Not filtered by dates';
      }

      let p=features.find(d=>d.layer.id=='pngp_grid_1km_evolution')
      if (p) {
        // Create container for Svelte component
        const container = document.createElement('div');

        // Create Svelte component with the data and click handler
        const popupComponent = mount(PolygonPopupInfo, {
          target: container,
          props: {
            datesArr:dates,
            datesText,
            properties: p.properties,
         //   onMoreInfoClick: (pol_id) => triggerGetPolEvolutionData(pol_id),
            get isLoadingEvolution() { return popupEvolutionDataLoading; }
          }
        });

            mountedPopupGeoComponents.push(popupComponent);
    console.log('mountedPopupGeoComponents',mountedPopupGeoComponents);



        polygonPopup = new Popup({
          anchor:'bottom',
          closeButton: true,
          closeOnClick: true,
          className:'polygon-popup',
          offset: 25
        })
        .setLngLat(e.lngLat)
        .setDOMContent(container);

        polygonPopup.addTo(map);

        // Set current polygon ID to trigger automatic data fetch
        currentPopupPolygonId = p.properties.pol_id;


        // Clean up component when popup closes
        polygonPopup.on('close', () => {
          if (popupComponent) {
            unmount(popupComponent);

            // Remove component from tracking array
            const index = mountedPopupGeoComponents.indexOf(popupComponent);
            if (index > -1) {
              mountedPopupGeoComponents.splice(index, 1);
            }
          }

          // Clear evolution data and polygon ID when popup closes
          /*  popupEvolutionQueryData = null;
          currentPopupPolygonId = null; */
        });
      return;
    }
  }

  })

                // This is the MapLibre GL JS map instance
                console.log('Map component mounted:', map);

                console.log('MapLibre GL JS instance:', map);
          map.on('load', async () => {
                    console.log('Map loaded');


                    //this way we can access the map from the store !!??

                    mapStore.mapStored=map;


                    console.log('Style:', map.getStyle());



                    map.addSource('pngp_grid_1km_evolution_source',{
                            type:'geojson',
                            data:geojson_1km
                          })

                    sources.forEach((source,index) => {

                        map.addSource(source.id, source);
                    })
                    /* if (runeStore.paramsFilter.interface == 'taxsearch')
                    { */
                    map.addLayer(layers.find(d=>d.id=='pngp_obs_simple'));



                    map.addLayer(layers.find(d=>d.id=='pngp_inat'));

                    //}



                  if (geojson_1km)
                  {


                  map.addLayer({
                      id:'pngp_grid_1km_evolution',
                      type:'fill',
                      source:'pngp_grid_1km_evolution_source',

                      layout:{
                          'visibility':'none'
                      },
                      paint: {
                          "fill-color": "#0080ff",
                          "fill-opacity": 0.5
                      }
                  })

                  map.addLayer({
                      id:'pngp_grid_1km_evolution_outline',
                      type:'line',
                      source:'pngp_grid_1km_evolution_source',

                      layout:{
                          'visibility':'none'
                      },
                      paint: {
                          "line-color": "#adabaa",
                          "line-opacity": 1,
                          "line-width": 1
                      }
                  })



if (!map.getSource('pngp_areas_valley_source')) {
	map.addSource('pngp_areas_valley_source', {
					type: 'vector',
					tiles: [
						'https://pere.gis-ninja.eu/geoserver/gwc/service/wmts?layer=pngp:pngp_areas_valley_4326&tilematrixset=EPSG:900913&Service=WMTS&Request=GetTile&Version=1.0.0&Format=application/x-protobuf;type=mapbox-vector&TileMatrix=EPSG:900913:{z}&TileCol={x}&TileRow={y}',
					],
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
						'text-size': 15,
						'text-max-width': 10, // Max width before wrapping (in ems)
					},
				});

        map.addLayer({
  id: 'pngp_grid_1km_evolution_labels',
  type: 'symbol',
  source: 'pngp_grid_1km_evolution_source',

  layout: {
    visibility: showMapLabels ? 'visible' : 'none',
    'text-field':
    //'t',
    ['get', 'countAll'],
    //['get', 't'],

    'text-size': ['interpolate', ['linear'], ['zoom'], 9, 7, 11, 10, 15, 15],
    'text-offset': [0, 0],
    'text-anchor': 'center',
    'text-justify': 'center',
    'text-allow-overlap': true,
    'text-ignore-placement': false
  },
  paint: {
/*    'text-color': 'white',
'text-halo-color': '#3c3838', */
'text-color': '#3c3838',
'text-halo-color': '#fff',
'text-halo-width': 0.8
  }
})
			}

                mapStore.mapStored=map;

             /*     try {

                   await fetchOverlaysFunction2('pngp_areas_survey');
                    console.log('Overlay loaded successfully');
                } catch (error) {
                    console.error('Failed to load overlay:', error);
                }

                try {
                 await fetchOverlaysFunction2('pngp_areas_valley');

                  console.log('Overlay loaded successfully2');
                  console.warn(map.getStyle().layers)

                } catch (error) {
                    console.error('Failed to load overlay:', error);
                } */


}

                    //$mapInitialized=true;

                    // Add your custom map logic here
                });

                map.on('zoom', () => {
                    let zoom=map.getZoom();
                    console.log('zoom',zoom);

                    if (map?.getZoom() > 5.2) {
                        let canvas = map.getCanvas();
                        let bbox = [
                            [0, 0], // top-left
                            [canvas.width, canvas.height] // bottom-right
                        ];
                        /* console.log('Bounding box:', bbox);
                        console.log(map.getZoom()); */

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
        console.log('Cleaning up mounted popup components:', mountedPopupGeoComponents.length);
        mountedPopupGeoComponents.forEach(component => {
            try {
                unmount(component);
            } catch (error) {
                console.warn('Error unmounting component:', error);
            }
        });
        mountedPopupGeoComponents = [];
    });

    watch(()=>_polygonStore._updateKey,(curr,prev)=>{
      if (prev === undefined) return;  // Only skip on first run (undefined), not 0
      if (curr !== prev) {
        console.log('updateKey changed',curr,prev);
        console.warn(map?.getStyle()?.layers.filter(d=>d.id=='pngp_grid_1km_evolution'))

      }
    });

      // Base styles
  const STYLES = [
    {name:'Landscape', style:'https://api.maptiler.com/maps/landscape/style.json?key=PfeqCqeOXLcGceolGsUb'},
    {name:'Backdrop', style:'https://api.maptiler.com/maps/backdrop/style.json?key=PfeqCqeOXLcGceolGsUb'},
    {name:'Topo',style:'https://api.maptiler.com/maps/topo-v2/style.json?key=PfeqCqeOXLcGceolGsUb'},
    {name:'Satellite',style:'https://api.maptiler.com/maps/satellite/style.json?key=PfeqCqeOXLcGceolGsUb'},
    {name:'Satellite Hybrid',style:'https://api.maptiler.com/maps/satellite-hybrid/style.json?key=PfeqCqeOXLcGceolGsUb'},
    {name:'Satellite Streets',style:'https://api.maptiler.com/maps/satellite-streets/style.json?key=PfeqCqeOXLcGceolGsUb'},
    {name:'Streets',style:'https://api.maptiler.com/maps/streets/style.json?key=PfeqCqeOXLcGceolGsUb'},
    {name:'Streets Hybrid',style:'https://api.maptiler.com/maps/streets-hybrid/style.json?key=PfeqCqeOXLcGceolGsUb'},
    {name:'Streets Hybrid',style:'https://api.maptiler.com/maps/streets-hybrid/style.json?key=PfeqCqeOXLcGceolGsUb'},
    {name:'Voyager', style:'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'},
    {name:'Positron', style:'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'},
    {name:'Dark Matter', style:'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'},
    {name:'Demo Tiles', style:'https://demotiles.maplibre.org/style.json'}
  ];
  let name = $state('Topo');
  let style = $derived(STYLES.find(d=>d.name===name)?.style);
let handleMapLoad=(event)=>{
  console.log('Map loaded event:', event);
  mapStore.mapStored  = event.detail.map;
  console.log('Map stored in mapStore:', mapStore.mapStored);
}


let maxBounds=[
          new LngLat(6.8664788526199345, 45.27142104025339),
          new LngLat(7.862639291375302, 45.717987498807474)]
         /*  let maxBounds=[
  [7.017167307336564, 45.31421340780824],  // southwest
  [7.6981804608430195, 45.70323798220039]  // northeast
]; */
    </script>
  {#if loadingMap }

                     <div class="flex items-center justify-center min-h-screen gap-2 bg-gray-600 w-full">

    <LoaderCircle class="h-12 w-12 animate-spin text-primary" />
    <span class="text-sm text-muted-foreground">Loading... </span>
</div>
{/if}
<!-- {#if $navigating}
<h3>Map is loading...</h3>

{:else}
<div class="h-[90vh]">
    <h3>Map is not loading...</h3>
</div>
{/if} -->
<!-- Overlay Loading Indicator -->
<!-- {#if isLoadingOverlays}
<div class="absolute top-4 left-4 z-10 bg-blue-500 text-white px-3 py-2 rounded-md shadow-lg">
    <div class="flex items-center gap-2">
        <Jumper size="20" color="#ffffff" unit="px" duration="1s" />
        Loading overlays...
    </div>
</div>
{/if}

{#if overlayError}
<div class="absolute top-4 left-4 z-10 bg-red-500 text-white px-3 py-2 rounded-md shadow-lg">
    ❌ Failed to load overlays: {overlayError}
</div>
{/if}

{#if loadedOverlayCount > 0 && !isLoadingOverlays}
<div class="absolute top-4 left-4 z-10 bg-green-500 text-white px-3 py-2 rounded-md shadow-lg opacity-90">
    ✅ {loadedOverlayCount} overlay(s) loaded
</div>
  {/if} -->

<!-- Map Status Indicator -->
{#if mapReady}
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
 <div class="h-full w-full relative">

  {#if mapInitialized && _polygonStore?.resultsFetched?.byDatePolygons?.length>0}

  <div class="absolute top-4 left-4 z-10 flex flex-row justify-left gap-2 m-1 p-1">
    <Button
      onclick={() => updateMapLabels()}
      variant="outline"
      size="xs"
      class="text-xs bg-zinc-200 border-zinc-600 p-1 cursor-pointer outline-1 border-1 {showMapLabels ? 'bg-green-200' : 'bg-red-200'}"
    >
      {showMapLabels ? 'Hide labels' : 'Show labels'} {_polygonStore.showMapLabels} {showMapLabels}
    </Button>
  </div>
  {/if}
 <!--  {#if dev && Inspect}
  {#key _polygonStore._updateKey}
  <Inspect value={_polygonStore._updateKey} name="_polygonStore._updateKey" />
  <Inspect value={map?.getStyle()?.layers.filter(d=>d.id=='pngp_grid_1km_evolution')} name="map.getStyle().layers" />
  {/key}
{/if} -->






  <MapLibre
        on:load={()=>{
          handleMapLoad();
        }}
        bind:map
        zoom={9.8}
        center={[7.37, 45.51]}
        class="map_container absolute inset-0 h-full w-full"
        style={style}
          maxBounds= {maxBounds}
    >
        <!-- <Marker lnglat={[141.692222, 42.775]} /> -->
        <!-- <MapPopup {map} active={popupActive} /> -->
     	<NavigationControl />
        <ScaleControl />
        <!-- <GlobeControl /> -->
        <!-- <LatLngPos {map} /> -->
    </MapLibre>

     <!-- <div class="absolute inset-0 h-full w-full bg-red-500">TEST</div> -->



</div>
 <!--     <aside class="absolute top-2 right-1 z-10 bg-gray-50 border-1 border-gray-200 font-light text-xs p-2 rounded-md shadow-lg max-w-100">
      <div class="flex flex-row items-center gap-2"></div>
        <span class="text-lg text-primary">Temporal evolution</span>
        <div>
          You are currently viewing the temporal evolution of the observations.
          <p>You can change the dates to view the evolution of the different observations.</p>
          We provide 2 maps:
          <ul>
            <li>Total observations per selected year(s) </li>
            <li>Number of different species per selected year(s)</li>

      </div>
     </aside> -->

<!-- Legend Component -->
 <!-- popup when we are on geoanalysis! -->
<!--  {#if runeStore.paramsFilter.interface == 'taxsearch'}
<CountsLegend bind:jetBreaksExport={jetBreaksData} />
<PointsLegend {symbolColor} {map}/>
{/if} -->


{#if mapInitialized && runeStore.paramsFilter.interface == 'geoanalysis' && popupEvolutionQueryData
&& popupEvolutionQueryData.data.length>0}


 <GeoEvolution {map} {popupEvolutionQueryData} />

{/if}

<style>
  :global(.polygon-popup .maplibregl-popup-content){
    /* background:transparent!important; */
    /* top:15px!important; */
    border:unset!important;
    box-shadow: none!important;
    font-family: Lato!important;
    padding: 3px!important;
  /* font-size: 14px;
  line-height: 1.5; */
  /* color: var(--font-grey); */
  }
 :global(.maplibregl-ctrl-attrib){
            display: none;
        }
</style>