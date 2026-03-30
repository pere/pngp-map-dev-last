<script>
  import highcharts from '$lib/components/myCharts/highcharts.js';
import highchartsBarConfig from '$lib/components/myCharts/highchartsBarConfig.js';
import {runeStoreTaxCards} from '$lib/stores/svelte5_stores/RuneStoreTaxCards.svelte.js';
import Highcharts from 'highcharts';
import { Badge } from '$lib/components/ui/badge/index.js';

let { newSpeciesValleyList } = $props();

// $inspect('newSpeciesValleyList', newSpeciesValleyList) // Disabled for performance

// Track which tax_ids are visible in the chart
let visibleTaxIds = $state(new Set());
let chartInstance = $state(null);
let hideAllSpecies = $state(false);
let foundTaxes=$derived.by(() => {
    return newSpeciesValleyList.map((item,i) => {

        let found= runeStoreTaxCards.spAll.find((d) => d.tax_id === item.tax_id);
        let pngp_data=found.pngp_data?found.pngp_data:null;





        return {
            ...item,
            color: found.symbology.color,
            species_n:found.species_n,
            inat_photo:found.inat_photo?'./data/new_sources/inat_photos/'+found.inat_photo:null,
            name_it:pngp_data?.name_it?pngp_data.name_it:'',
            name_eng:pngp_data?.name_eng?pngp_data.name_eng:'',
            filtered_count:item.count

        }
    });
});

let uniqueFoundTaxes=$derived.by(() => {
    return foundTaxes.reduce((acc, item) => {
        if (!acc.find((d) => d.tax_id === item.tax_id)) {
            acc.push({tax_id: item.tax_id,
                data: [],
                species_n: item.species_n,
                inat_photo: item.inat_photo,
                name_it: item.name_it,
                name_eng: item.name_eng,
                color: item.color,
                filtered_count: item.filtered_count,
            });
        }
        else
        {
            acc.find((d) => d.tax_id === item.tax_id).filtered_count += item.filtered_count;
        }
        return acc;
    }, []);
});

// Initialize visibleTaxIds when data changes
$effect(() => {
    if (uniqueFoundTaxes.length > 0) {
        visibleTaxIds = new Set(uniqueFoundTaxes.map(t => t.tax_id));
    }
});

// Custom action to capture chart instance
function chartAction(node, config) {
    const result = highcharts(node, config);
    // Store the chart instance from the node
    chartInstance = node.highcharts || Highcharts.charts[Highcharts.charts.length - 1];

    return {
        update(newConfig) {
            result.update(newConfig);
            chartInstance = node.highcharts || Highcharts.charts[Highcharts.charts.length - 1];
        },
        destroy() {
            result.destroy();
            chartInstance = null;
        }
    };
}

function toggleAllSpecies() {
    if (!hideAllSpecies) {
        visibleTaxIds = new Set(uniqueFoundTaxes.map(t => t.tax_id));
    } else {
        visibleTaxIds = new Set();
    }
    console.log('visibleTaxIds', visibleTaxIds);

      // Find the species name for this tax_id
      uniqueFoundTaxes.forEach(t => {
        let series=chartInstance.series.find(s => s.name === t.species_n);
        if (visibleTaxIds.has(t.tax_id)) {
            series.show();
        } else {
            series.hide();
        }
    });



}

// Toggle series visibility
function toggleSpecies(tax_id) {
    if (!chartInstance) return;

    if (visibleTaxIds.has(tax_id)) {
        visibleTaxIds.delete(tax_id);
    } else {
        visibleTaxIds.add(tax_id);
    }

    // Find the species name for this tax_id
    const taxSpecies = uniqueFoundTaxes.find(t => t.tax_id === tax_id);
    if (!taxSpecies) return;

    // Update chart series visibility by matching series name
    chartInstance.series.forEach((series) => {
        if (series.name === taxSpecies.species_n) {
            if (visibleTaxIds.has(tax_id)) {
                series.show();
            } else {
                series.hide();
            }
        }
    });

    // Force reactivity
    visibleTaxIds = new Set(visibleTaxIds);
}
let reduced=$derived.by(() => {
    return newSpeciesValleyList.reduce((acc, item) => {
        let tax_id=item.tax_id;
        let valley=item.valley;
        /* let color=foundTaxes.find((d) => d.tax_id === tax_id).color; */
        if (!acc.categories.includes(valley)) {
            acc.categories.push(valley);
        }
        if (!acc.tax_ids.includes(tax_id)) {
            acc.tax_ids.push(tax_id);
            acc.data.push({tax_id: tax_id, data: []});
        }
        acc.data.find((d) => d.tax_id === tax_id).data.push({
            category: item.valley,
            y: item.count
        });
        return acc;
    }, {tax_ids:[],data:[],categories:[]});
})

    // $inspect('foundTaxes', foundTaxes) // Disabled for performance
    let highchartsValleyBarConfigModified = $derived.by(() => {
        let series=reduced.data.map((d) => {
            let f=foundTaxes.find((v) => v.tax_id === d.tax_id);
            let color=f.color;
            return {
                name: f.species_n,
                // Set associated_data on each point, not on the series
                data: d.data.map((point) => ({
                    y: point.y,
                    associated_data:
                    {
                        species_name: f.species_n,
                        name_it: f.name_it,
                        name_eng: f.name_eng,
                        inat_photo: f.inat_photo,
                        color: f.color,
                    },
                    //`Species: ${f.species_n}, Valley: ${point.category}, Count: ${point.y}`,
                    // You can add more custom data here
                    tax_id: d.tax_id,

                })),
                color: color,
            }
        });

        // Create tooltip formatter function
        const tooltipFormatter = function() {
            console.log('this.point', this.point)
            let html=`    <div class="w-full flex text-card-foreground">


            <div class="w-full mx-auto mr-1 mb-0 rounded-sm shadow-md overflow-hidden">`
        html+=`<div class="md:flex  bg-sidebar-accent  hover:bg-lime-500">`
        html+=`<div class="md:shrink-0">`
        html+=`<img class="h-15 w-full object-cover md:h-full md:w-15" src="${this.point.associated_data.inat_photo}" alt="${this.point.associated_data.species_name}">`
        html+=`</div>`
        html+=`<div class="mt-2 text-xs ">${this.point.y} filtered records in <span class="font-bold text-lg">${this.point.category}</span>
            </div>`
        html+=`<div class="p-2">`
        html+=`<div class="tracking-wide text-xs ">${this.point.associated_data.species_name}</div>`
        html+=`<span class="block mt-1 text-xs leading-tight font-light">${this.point.associated_data.name_it} / ${this.point.associated_data.name_eng}</span>`

        html+=`</div>`


        return html
        }

        // Return new config with proper deep structure (no mutation)
        return {
            ...highchartsBarConfig,
            tooltip: {
                ...highchartsBarConfig.tooltip,
                useHTML: true,
                formatter: tooltipFormatter
            },
            legend: {
                enabled: false,
                align: 'center',
                verticalAlign: 'bottom',
                layout: 'horizontal'
            },
            series: series,
            xAxis: {
                ...highchartsBarConfig.xAxis,
                categories: reduced.categories
            }
        }
    });
</script>
{#if (highchartsValleyBarConfigModified)}
<div class="border-pngp border rounded-md pt-0 pb-0 p-2">
    <div class="w-full">
        <div use:chartAction={highchartsValleyBarConfigModified} class="w-full h-50"></div>
    </div>

 <!--    uniqueFoundTaxes
    {JSON.stringify(uniqueFoundTaxes)} -->
    <div class="w-full">

        <input type="checkbox"
        class="cursor-pointer w-3 h-3 mr-1"
        onclick={() => {
            hideAllSpecies = !hideAllSpecies;
           toggleAllSpecies();
            console.log('visibleTaxIds', visibleTaxIds);
        }}
        bind:checked={hideAllSpecies} /> <label for="showAllSpecies" class="text-xs ">{hideAllSpecies ? 'Show' : 'Hide'} all species in the chart</label>

        <div class="text-xs ">Click on species name to show/hide in the chart</div>
    </div>
    <div class="w-full grid gridded">
        {#each uniqueFoundTaxes as foundTax}
        {@const isVisible = visibleTaxIds.has(foundTax.tax_id)}
            <button
                onclick={() => toggleSpecies(foundTax.tax_id)}
                class="flex flex-row w-full h-auto m-1 p-1 border-2 rounded-md cursor-pointer transition-all hover:shadow-md {isVisible ? 'border-gray-300 opacity-100' : 'border-red-500 opacity-40'}"
            >
                <div class="w-1/3 h-auto">
                    <img src={foundTax.inat_photo} alt={foundTax.species_n} class="w-full h-full object-cover rounded-sm">
                </div>
                <div class="w-2/3  h-auto m-0.5 p-0.5">
                    <div class="items-left align-middle mt-auto mb-auto">
                        <div class="flex w-full items-left align-middle flex-row">
                        <div class="min-w-4 min-h-4 mt-auto mb-auto align-middle items-center">
                            <div class="mr-1 legend-color m-1 rounded-full border border-white align-middle items-center justify-center" style="background-color: {foundTax.color}; width: 10px; height: 10px;"></div>

                            </div>
                            <div class="text-xs font-bold text-left">{foundTax.species_n}</div>
                        </div>
                    </div>
                        <div class="block w-full items-left text-left align-middle mt-2">

                            <div class="text-xs">{foundTax.name_it} / {foundTax.name_eng}
                            <div class="inline-block">
                                <Badge variant="numTaxRecords" class="text-xs mr-1 p-0.5">{foundTax.filtered_count}</Badge>filtered</div>
                            </div>
                    </div>

                </div>

            </button>


        {/each}
    </div>
</div>
{/if}

<style>
    .gridded {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 3px;
    }
    /* Add this CSS to ensure Tailwind applies to Highcharts tooltips */
        :global(.highcharts-tooltip) {
        pointer-events: auto !important;
    }

    :global(.highcharts-tooltip > span) {
        background: transparent !important;
        border: none !important;
    }
</style>