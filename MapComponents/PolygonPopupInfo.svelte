<script>
  	import {
		getTaxData,
		findTaxById,
		tax_data_joined_store,
	} from '$lib/stores/test.svelte.js';
  // Props for the popup component
  let { datesText, datesArr, properties, onMoreInfoClick, isLoadingEvolution = false } = $props();
  let taxDataObjs = getTaxData();
  console.log('taxDataObjs', taxDataObjs);
  console.log('tax_data_joined_store', tax_data_joined_store);

  let uniqueTaxIds = $state([]);
  let taxCounts = $state([]);
  let dataLoaded = $state(false); // Force reactivity flag

  let derivedTaxDataObjs = $derived(taxDataObjs.filter(d=>uniqueTaxIds.includes(d.tax_id)));

   let derivedTaxCounts = $derived.by(()=>{
     console.log('🔄 PopupInfo derivedTaxCounts recalculating, dataLoaded:', dataLoaded, 'taxCounts:', taxCounts);
     console.log('🔄 PopupInfo taxCounts length:', taxCounts.length);

     // Include dataLoaded flag to force reactivity
     if (!dataLoaded || !taxCounts || taxCounts.length === 0) {
       console.log('🔄 PopupInfo No taxCounts data or not loaded, returning empty array');
       return [];
     }

     const result = taxCounts.map(d=>{
       let f=findTaxById(d.tax_id);
       return {
         ...d,
         ...f,
       }
     }).sort((a, b) => b.sum - a.sum);

     console.log('🔄 PopupInfo derivedTaxCounts result:', result);
     return result;
   });

  // Use effect instead of onMount for better reactivity
  $effect(() => {
    if (!properties?.pol_id) return;

    async function fetchData() {
      try {
        console.warn('🚀 PopupInfo $effect: fetching data for pol_id:', properties.pol_id);
        const url = `https://pere.gis-ninja.eu/pngp_phps_new/get_evolution_pol2.php?years=${datesArr}&pol_id=${properties.pol_id}`;
        console.log('🚀 PopupInfo URL:', url);

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('🔥 PopupInfo $effect API data received:', data);

        if (!data || !Array.isArray(data)) {
          console.warn('🔥 PopupInfo $effect Invalid data format received');
          uniqueTaxIds = [];
          taxCounts = [];
          dataLoaded = false;
          return;
        }

        const newUniqueTaxIds = [...new Set(data.flatMap(item => item.taxa.map(t => t.tax_id)))];
        console.log('🔥 PopupInfo $effect New uniqueTaxIds:', newUniqueTaxIds);

        const newTaxCounts = newUniqueTaxIds.map((tax_id) => {
          const redArr = data.flatMap(item => item.taxa.filter(t => t.tax_id === tax_id).reduce((acc, t) => acc + t.count, 0));
          return {
            tax_id,
            countArray: redArr,
            sum: redArr.reduce((acc, t) => acc + t, 0),
          }
        });

        console.log('🔥 PopupInfo $effect New taxCounts calculated:', newTaxCounts);

        // Force reactivity by creating new arrays and setting flag
        uniqueTaxIds = [...newUniqueTaxIds];
        taxCounts = [...newTaxCounts];
        dataLoaded = true; // Force derived to recalculate

        console.log('🔥 PopupInfo $effect State updated - uniqueTaxIds:', uniqueTaxIds);
        console.log('🔥 PopupInfo $effect State updated - taxCounts:', taxCounts);
        console.log('🔥 PopupInfo $effect dataLoaded set to:', dataLoaded);

      } catch (err) {
        console.error('🚨 PopupInfo $effect API Error:', err);
        uniqueTaxIds = [];
        taxCounts = [];
        dataLoaded = false;
      }
    }

    fetchData();
  });
   $effect(() => {
     console.log('📊 PopupInfo derivedTaxCounts:', derivedTaxCounts);
     console.log('📊 PopupInfo derivedTaxCounts length:', derivedTaxCounts?.length);
   });

   // Add effect to track state changes
   $effect(() => {
     console.log('🎯 PopupInfo uniqueTaxIds changed:', uniqueTaxIds);
     console.log('🎯 PopupInfo taxCounts changed:', taxCounts);
   });
</script>

<div class="polygon-popup-content">
  <!-- {JSON.stringify(datesArr)} -->
  <!-- <div class="dates-info flex flex-row flex-wrap gap-1">{@html datesArr.map(d=>`  <span class="font-extralight">${d}</span>`).join('')}</div> -->

  <div class="stats-info">

    <div class="w-full block mt-1 text-left">
    <span class="bg-pngp text-white p-1 rounded-md mr-1">{properties.countAll.toLocaleString()} </span>records
    </div>
    <div class="w-full block mt-1 text-left">
      <span class="bg-pngp text-white p-1 rounded-md mr-1">{properties.countSp} </span> species
      </div>


  </div>

  {#if isLoadingEvolution}
    <div class="text-blue-500">Loading evolution data...</div>
  {:else}
    <!-- <button
      class="text-blue-500 hover:text-blue-700 underline cursor-pointer bg-transparent border-none p-0"
      onclick={() => onMoreInfoClick(properties.pol_id)}
    >
      Refresh evolution data
    </button>  -->
  {/if}


</div>

<style>
  .polygon-popup-content {
    /* font-family: Arial, sans-serif;
    font-size: 14px;
    line-height: 1.4; */
  }
:global(.dates-info span)
{
color:white;

padding:4px;
    background-color: #10b68f;

}
  .dates-info {

  }

  .stats-info {
    margin-bottom: 8px;
  }

  button {
    font-size: inherit;
    font-family: inherit;
  }
</style>
