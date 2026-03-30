<script>
            import highcharts from '$lib/components/myCharts/highcharts.js';
import highchartsBarConfig from '$lib/components/myCharts/highchartsBarConfig.js';
import { watch, Previous ,resource} from 'runed';
    let { taxa } = $props();
 let dataReady=$state(false);
 let selectedStats = $state('years');
let selectedViz = $state('chart');

    const searchResource = resource(
		() => taxa,
		async (currIds, prevIds, { data, refetching, onCleanup, signal }) => {
			// data: the previous value returned from the fetcher

			// refetching: whether the fetcher is currently refetching
			// or it can be the value you passed to refetch()

			// onCleanup: A cleanup function that will be called when the source is invalidated
			// and the fetcher is about to re-run

			// signal: AbortSignal for cancelling fetch requests
			const response = await fetch(`https://pere.gis-ninja.eu/pngp_phps_new/get_basic_stats_indiv.php?tax_id=${taxa.tax_id}`, { signal });
			//return response.json();
            let _data = response.json();
            dataReady=true;
            return _data;

		},

	);


    let foo=$derived(searchResource?.current ?? null);
$inspect(foo);

let statsList = $derived.by(() => {
	if (searchResource.loading || !foo) return [];
	let data,paramCount;
	if (selectedStats === 'years') {
		data = foo[0].by_year;
		paramCount='year';
	}
	if (selectedStats === 'valleys') {
		data = foo[0].by_valley;
		paramCount='valley';
	}
	if (data) {
		return [...data].sort((a, b) => a[paramCount] - b[paramCount]).map(item => {return {paramCountValue: (item[paramCount] ? item[paramCount] : 'N/A'), count: item.count}});
	}
	return [];
});

let highchartsStatsBarConfigModified = $derived.by(() =>
    {
        if (searchResource.loading || !foo) return highchartsBarConfig; // Return base config instead of null
		let data,paramCount;
		if (selectedStats === 'years') {
        data = foo[0].by_year;
		paramCount='year';
		}
		if (selectedStats === 'valleys') {
			data = foo[0].by_valley;
			paramCount='valley';
		}
        if (data) {
            //some data may be null
            let t=[...data].sort((a, b) => a[paramCount] - b[paramCount]).map(item => {return {paramCountValue: (item[paramCount] ? item[paramCount] : 'N/A'), count: item.count}});

			highchartsBarConfig.yAxis.labels.enabled=true;
			highchartsBarConfig.yAxis.tickAmount= 4;
			highchartsBarConfig.yAxis.labels.formatter=function() {
				return this.value.toLocaleString();
			}

            highchartsBarConfig.xAxis.categories=t.map(item => item.paramCountValue);
              let config = {
                ...highchartsBarConfig,
                series: [{
					animation: false,
                    color: '#00c951',
                    name: `${paramCount}ly stats`,
                    data: t.map(item => {return {y: item.count, category: item.paramCountValue}})
                }],
                categories: t.map((item) => item.paramCountValue),

            }
            console.log('config', config);
            return config;
        }
        return highchartsBarConfig; // Return base config instead of null
    }
)


</script>

<div class="flex flex-row gap-2 text-xs m-2">
	<div class="flex-1/2 align-left">
		<button class="mr-1  cursor-pointer {selectedStats === 'years' ? 'decoration-green-500 decoration-2 underline' : ''}" onclick={() => {
			selectedStats = 'years';
		}}>Years</button>
		<button class="cursor-pointer {selectedStats === 'valleys' ? 'decoration-green-500 underline' : ''}" onclick={() => {
			selectedStats = 'valleys';
		}}>Valleys</button>
	</div>
	<div class="flex-1/2 align-right text-right mr-2">
		<button class="mr-1 cursor-pointer {selectedViz === 'chart' ? 'decoration-blue-500 decoration-2 underline' : ''}" onclick={() => {
			selectedViz = 'chart';
		}}>Chart</button>
		<button class="cursor-pointer {selectedViz === 'list' ? 'decoration-blue-500 decoration-2 underline' : ''}" onclick={() => {
			selectedViz = 'list';
		}}>List</button>
	</div>
</div>
{#if searchResource.loading}
	<div class="w-full h-30 flex items-center justify-center text-xs">Loading...</div>
{:else if searchResource.error}
	<div class="w-full h-30 flex items-center justify-center text-xs text-red-500">Error: {searchResource.error.message}</div>
{:else}
	{#if selectedViz === 'chart'}
		<div use:highcharts={highchartsStatsBarConfigModified} class="w-full h-30"></div>
	{:else if selectedViz === 'list'}
		{#if statsList.length > 0}
		<div class="w-full h-fit max-h-50 overflow-auto">

			<div class="grid grid-rows-auto
			{selectedStats === 'years' ? 'grid-cols-4' : 'grid-cols-2'}
			gap-1 text-xs">
			{#each statsList as item, index}
				<div class="m-1 pb-0.5">
					<span class="bg-pngp text-white p-1 rounded-md mr-1">{item.paramCountValue}</span>  <span class="text-right">{item.count.toLocaleString()}</span></div>
			{/each}
			</div>

			<!-- <ul class="list-none p1 m-2 max-h-40 overflow-y-auto">
				{#each statsList as item, index}
					<li class="m-1 pb-0.5">{item.paramCountValue} : {item.count}</li>
				{/each}
			</ul> -->
		</div>
		{/if}
	{/if}
{/if}