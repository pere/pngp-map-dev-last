<script>
    // @ts-ignore
    //@ts-nocheck

    import * as Sidebar from "$lib/components/ui/sidebar/index.js";
    // @ts-ignore
    import * as Collapsible from "$lib/components/ui/collapsible/index.js";
  // @ts-ignore
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  // @ts-ignore
  import SquareTerminalIcon from "@lucide/svelte/icons/square-terminal";
	import Input from "../ui/input/input.svelte";
    import Label from "../ui/label/label.svelte";
	import MyCollapsible from "../customizedUI/MyCollapsible.svelte";
  import {getLayersNew,getSources} from "$lib/stores/mapLayers.svelte.js";
  import {mapStore} from "$lib/stores/mapLayers.svelte.js";
  import { ScrollArea } from "bits-ui";

  import * as RadioGroup from "$lib/components/ui/radio-group/index.js";
	import { base } from "$app/paths";

const proxyPath = `${base}/proxy`;


  let sourcesArray = $derived(getSources());
  /* import MyCollapsible from "$lib/components/customizedUI/MyCollapsible.svelte"; */
  let activeIndex = $state(0);
  let activeItem = $state('');
  let layers_new = $derived(getLayersNew());
  console.log('sourcesArray',sourcesArray);
  function handleMenuButtonClick(item, i) {
    activeIndex=i;
    console.log('handleMenuButtonClickppppp',item, i,activeIndex);
		//activeItemStore.set(item);
		items = items.map((itm, index) => ({
			...itm,
			isActive: index === activeIndex ? !itm.isActive : itm.isActive
		}));
		activeItem = item;

        console.log('zzz',activeItem,items);
		//activeIndex = i;

	}
  let map;
  	// Helper function to check if map is fully loaded
	function isMapReady(mapInstance) {
		if (!mapInstance) return false;

		// Check for essential MapLibre methods
		const requiredMethods = [
			'getLayer',
			'getSource',
			'setLayoutProperty',
			'setPaintProperty',
			'getStyle'
		];

		return requiredMethods.every(method =>
			typeof mapInstance[method] === 'function'
		) && mapInstance.loaded && mapInstance.loaded();
	}
  let isReady = $derived(isMapReady(mapStore.mapStored))
	$effect(() => {
		const _map = mapStore.mapStored;
		if (_map )
		map=_map
		if (isMapReady(map)) {

		} else {
			console.log('map not ready yet');
		}

		/* if (map)
		map.setPaintProperty('pngp_grid_1km_topo', 'fill-opacity', 1) */
	});



  function handleLayerClick(item, i) {

    /* if (!isReady) {
			alert('⚠️ Map not ready for handleLayerClick interaction');
			return;
		} */

    console.log('handleLayerClick',item, layers_new);
    item.isActive=!item.isActive;
    let l=layers_new.find(d=>d.id===item.id);
    let labels=layers_new.find(d=>d.id===item.layer+'_labels');
    debugger;
    if (item.isActive){
      if (!map.getLayer(l.id)){
        console.log('adding layer',l);
        if (!map.getSource(l.id+'_source')){
          map.addSource(l.id+'_source', sourcesArray.find(d=>d.id===l.id+'_source'));
        }
        console.log(map.getStyle().layers,'layers before')
        let firstPngpId=map.getStyle().layers.findIndex(d=>d.id.indexOf('pngp')!==-1);
        let firstPngpLayer=map.getStyle().layers[firstPngpId];
        console.log('firstPngpLayer',firstPngpLayer.id);

        map.addLayer(l,firstPngpLayer.id);

      }

      map.setLayoutProperty(l.id, 'visibility', 'visible');
      if (labels){

        map.moveLayer(l.id,labels.id);
        map.setLayoutProperty(labels.id, 'visibility', 'visible');
      }
    }
    else{

      //map.removeLayer(l.id);
      map.setLayoutProperty(l.id, 'visibility', 'none');
      if (labels){
        map.setLayoutProperty(labels.id, 'visibility', 'none');
      }
    }
    console.warn('layers after handleLayerClick',map.getStyle().layers)
  }
//
  let items=$state([
    {
        title: "Main",
        url: "#",
        isActive: true,

        items: [
          {
            title: "PNG Area Survey",
            multiple:false,
            subItems: [
              {
                title: "PNG Area Survey",
                layer: "pngp_areas_survey",
                isActive: false,
                disabled: false,
                color: false
              }
            ]

          },   {
            title: "PNG Valleys",
            multiple:false,
            subItems: [
              {
                title: "PNG Valleys",
                layer: "pngp_areas_valley",
                isActive: false,
                disabled: false,
                color: '#ffb83d'
              }
            ]

          }
        ]
    },
      {
        title: "Parco",
        url: "#",

        isActive: true,
        items: [
          {
            multiple:false,
            title: "Zone a diverso grado di protezione (Titolo II-art.8 e 9 NTA)",
            id:'pngp_zonification_wms',
            url: "#",

           /*  subItems: [
              {
                title: "Zona A1",
                layer: "ft_tm_zone_PP_2020_a_899913d3_0bcd_45c3_2021071216034278724645",
                isActive: false,
                disabled: true
              },
              {
                title: "Zona A2",
                layer: "ft_tm_zone_PP_2020_a_899913d3_0bcd_45c3_2021071216034278724645",
                isActive: false,
                disabled: true
              },
              {
                title: "Zona A3",
                layer: "ft_tm_zone_PP_2020_a_899913d3_0bcd_45c3_2021071216034278724645",
                isActive: false,
                disabled: true
              },
            ] */
          },
          {
                title: "Rivers",
                multiple:false,
                id: "pngp_fiumi",
                isActive: false,
              },
              {
                title: "Lakes",
                multiple:false,
                id: "pngp_laghi",
                isActive: false,
                disabled: false
              },
      /*     {
            title: "Nature",
            url: "#",
            multiple:true,
            subItems: [
              {
                title: "Rivers",
                layer: "pngp_fiumi",
                isActive: false,
              },
              {
                title: "Lakes",
                layer: "pngp_laghi",
                isActive: false,
                disabled: true
              },
            ]
          }, */

        ],
      },
      {
        title: "Base Layers",
        url: "#",
        isActive: false,
        baseLayers:true,

        items: [
          {
            title: "Base",
            subItems: [
              {
                id:"topo",
                title:"Topo",
                style: "https://api.maptiler.com/maps/topo-v2/style.json?key=PfeqCqeOXLcGceolGsUb",
                isActive: false,
              },
              {
                id:"satellite",
                title: "Satellite",
                style: "https://api.maptiler.com/maps/satellite/style.json?key=PfeqCqeOXLcGceolGsUb",

                isActive: false,
              },
              /* {
                id:"satellite-hybrid",
                title: "Satellite Hybrid",
                style: "https://api.maptiler.com/maps/satellite-hybrid/style.json?key=PfeqCqeOXLcGceolGsUb",
                isActive: false,
              }, */
        /*       {
                id:"satellite-streets",
                title: "Satellite Streets",
                style: "https://api.maptiler.com/maps/satellite-streets/style.json?key=PfeqCqeOXLcGceolGsUb",
                isActive: false,
              }, */
              {
                id:"streets",
                title:"Streets",
                style: "https://api.maptiler.com/maps/streets/style.json?key=PfeqCqeOXLcGceolGsUb",
                isActive: false,
              },
          /*     {
                id:"streets-hybrid",
                title:"Streets Hybrid",
                style: "https://api.maptiler.com/maps/streets-hybrid/style.json?key=PfeqCqeOXLcGceolGsUb",
                isActive: false,
              }, */
              {
                id:"landscape",
                title:"Landscape",
                style: "https://api.maptiler.com/maps/landscape/style.json?key=PfeqCqeOXLcGceolGsUb",
                isActive: false,
              },
              {
                id:"backdrop",
                title:"Backdrop",
                style: "https://api.maptiler.com/maps/backdrop/style.json?key=PfeqCqeOXLcGceolGsUb",
                isActive: false,
              },

              {
                id:"voyager",
                title:"Voyager",
                style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
                isActive: true,
              },



            ]
          },
        /*   {
            title: "Google Maps",
            subItems: [
              {
                title: "Google Maps",
                layer: "google_maps",
                isActive: false,
              }
            ]
          },
          {
            title: "Google Satellite",
            subItems: [
              {
                title: "Google Satellite",
                layer: "google_satellite",
                isActive: false,
              }
            ]
          }, */
        ],
      }])

      let initial='voyager';
      let baseLayerChecked=$state('voyager');
      let findBaseLayer=(id)=>{
        if (!mapStore.mapStored){
          return null;
        }

        // Find the base layers section
        let baseLayersSection = items.find(d=>d.baseLayers);
        console.log('baseLayersSection:', baseLayersSection);

        if (!baseLayersSection || !baseLayersSection.items || !baseLayersSection.items[0]) {
          console.log('No base layers section found');
          return null;
        }

        let baseItems = baseLayersSection.items[0].subItems;
        console.log('baseItems:', baseItems);
        console.log('Looking for id:', id);

        let foundLayer = baseItems.find(d=>d.id == id);
        console.log('Found layer:', foundLayer);

        return foundLayer;
      }

      // Save current custom layer definitions
      function saveCustomLayers(map) {
        const style = map.getStyle();
        let sources=style.sources;
        let ls= style.layers.filter(l => l.id.indexOf("pngp")!==-1 );
        return ls.map(l=>{
          return {
            layerObj:l,
            visibility:l.layout.visibility=='visible'?'visible':'none'
          }
        })
      }

      let handleRadioLayerClick=(item, i)=>{


        console.log('handleRadioLayerClick', item, i,baseLayerChecked);
        console.log('Setting baseLayerChecked to:', item.id);


        if (map){
          console.log('Map is available, searching for layer...');
          let sel = findBaseLayer(baseLayerChecked);
          console.log('Selected layer:', sel);

          if (sel) {
            console.log('✅ Found base layer:', sel);
            console.log('Layer style URL:', sel.style);

            // Here you can change the map style
            if (map){
              console.log('Changing map style to:', sel.style);
              const style = map.getStyle();
              let sources=style.sources;

              let savedLayers = saveCustomLayers(map);
              console.info(savedLayers,'savedLayers')
              mapStore.mapStored.setStyle(sel.style);
              console.info(map.getStyle().layers)

              setTimeout(()=>{

                savedLayers.forEach(layer => {

                  console.log(layer.layerObj,'layer')
                  let l=layer.layerObj;

                      if (!map.getLayer(l.id)) {
                        if (!map.getSource(l.source)) {
                          map.addSource(l.source, sources[l.source]);
                        }
                          map.addLayer(l);
                        map.setLayoutProperty(l.id  , 'visibility', layer.visibility);
                      }
                  });

                console.info(map.getStyle().layers,'layers after')
              },1000)
            }
          } else {
            console.log('❌ Base layer not found for id:', baseLayerChecked);
          }
        } else {
          console.log('❌ Map not available yet');
        }
      }
      // Effect to watch map store and base layer changes


      let pickedColor=$state('#ffb83d');
      function handleColorChange(item, i,e){
        console.log('handleColorChange',item,e);
        console.warn(item.layer)
        map.setPaintProperty(item.layer, 'line-color', pickedColor);

      }
</script>



<!-- Debug Information -->
<!-- <div class="p-2 mb-2 bg-gray-100 rounded text-xs">
  <div><strong>Debug Info:</strong></div>
  <div>Base Layer Checked: <span class="font-mono">{baseLayerChecked}</span></div>
  <div>Map Available: <span class="font-mono">{!!mapStore.mapStored}</span></div>
  <div>Current Selection: <span class="font-mono">{JSON.stringify(findBaseLayer(baseLayerChecked)?.title || 'None')}</span></div>
</div> -->

<Sidebar.Group class="p-0 m-0">

    <Sidebar.Menu>
    <!--     <MyCollapsible buttonText="Open Collapsible"
        >Here is my collapsible content.</MyCollapsible
      > -->
    {#each items as item,i (item.title)}
    <!-- open={activeIndex === i}
        isActive={activeIndex === i} -->
    <Collapsible.Root
     open={item.isActive}
     class="group/collapsible">

     {#snippet child({ items })}

     <Collapsible.Trigger>

       {#snippet child({ items })}
         <button onclick={() => handleMenuButtonClick(item, i)} class="w-full">
           <Sidebar.MenuButton>
               <span class="text-lg font-bold text-cyan-900 text-left">{item.title}</span>
             <ChevronRightIcon
               class="text-xs ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
             />
           </Sidebar.MenuButton>
         </button>
       {/snippet}
     </Collapsible.Trigger>
        <Collapsible.Content>
          <Sidebar.MenuSub>
            {#if !item.baseLayers}
            {#each item.items ?? [] as subItem (subItem.title)}
              <Sidebar.MenuSubItem>
                <Sidebar.MenuSubButton>

                  {#snippet child({ items })}

                  {#if !subItem.multiple}

                  <div class="flex flex-row  gap-2 w-full">
                    <input type="checkbox"
                    disabled  ={subItem.disabled}
                    bind:checked={subItem.isActive}
                    onclick={()=>handleLayerClick(subItem, i)}
                    />
                    <div class="border-2">
                      <div class="text-xs text-left justify-center">{subItem.title} xx</div>
                  </div>
                  </div>

                  {:else}
                      <div class="text-sm  mb-2 text-left items-left">{subItem.title} multiple</div>
                      {/if}
                      {#if subItem.subItems && !subItem.baseLayers}
                          <div class="flex flex-col gap-2 w-full ml-2 mt-2">
                          {#each subItem.subItems as subSubItem (subSubItem.title)  }

                              <div class="flex flex-row  gap-2 items-left">
                                <input type="checkbox"
                                disabled={subSubItem.disabled}
                                bind:checked={subSubItem.isActive}
                                onclick={()=>handleLayerClick(subSubItem, i)}
                                />
                                <Label class="text-xs items-left">{subSubItem.title} oo</Label>
                                </div>
                                {#if subSubItem.color}
                                <div class="flex flex-row   border-gray-200 border-1 items-left">
                                  <input type="color"
                                  bind:value={pickedColor}
                                  oninput={(e)=>handleColorChange(subSubItem, i,e)}
                                  onchange={(e)=>handleColorChange(subSubItem, i,e)}
                                  class="h-5 w-7 block  cursor-pointer disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700" id="hs-color-input"
                                  title="Choose your color">

                                <label for="hs-color-input" class=" text-xs font-medium mb-0 ml-2 dark:text-white">Change color</label>

                                <!-- <div class="w-2 h-2 bg-red-500">
                                  <input type="color"  class="h-12 w-12 cursor-pointer rounded-full border-2 border-gray-400 shadow-md" bind:value={subSubItem.color}/>
                                </div> -->
                              </div>
                              {/if}

                            {/each}
                        </div>





                      {/if}


                  {/snippet}
                </Sidebar.MenuSubButton>
              </Sidebar.MenuSubItem>
            {/each}

            {:else}
            {#each item.items ?? [] as subItem (subItem.title)}

              <Sidebar.MenuSubItem>
                <ScrollArea.Root
                class="p-0 mt-2 border-dark-10 bg-background-alt shadow-card relative overflow-hidden
                rounded-[2px] border px-0 py-0"
              >
                <ScrollArea.Viewport class="h-full max-h-[200px] w-full">
                  <RadioGroup.Root class="flex flex-col gap-2 w-full ml-2 mt-2"
                  bind:value={baseLayerChecked} onValueChange={()=>handleRadioLayerClick(subItem, i)}>
                  <!-- onValueChange={()=>handleRadioLayerClick(subItem, i)} -->
                  {#snippet child({ items })}


                      {#if subItem.subItems && !subItem.baseLayers}


                          {#each subItem.subItems as subSubItem (subSubItem.title)  }
                          <div class="flex items-left w-full space-x-2 mb-2">
                           <RadioGroup.Item value={subSubItem.id}/>
                            <Label class="text-xs">{subSubItem.title}</Label>
                            </div>
                            {/each}

                      {/if}


                  {/snippet}
                </RadioGroup.Root>
                </ScrollArea.Viewport>
                <ScrollArea.Scrollbar
                orientation="vertical"
                class="bg-muted hover:bg-dark-10 data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out-0 data-[state=visible]:fade-in-0 flex w-2.5 touch-none select-none rounded-full border-l border-l-transparent p-px transition-all duration-200 hover:w-3"
              >
                <ScrollArea.Thumb class="bg-muted-foreground flex-1 rounded-full" />
              </ScrollArea.Scrollbar>
                </ScrollArea.Root>
              </Sidebar.MenuSubItem>
            {/each}
            {/if}
          </Sidebar.MenuSub>
        </Collapsible.Content>

    {/snippet}
</Collapsible.Root>
    {/each}
</Sidebar.Menu>
</Sidebar.Group>