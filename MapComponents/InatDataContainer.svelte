<script>
	import { Accordion } from 'bits-ui';
    import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import WrenchIcon from '@lucide/svelte/icons/wrench';
	import ChevronsUpIcon from '@lucide/svelte/icons/chevrons-up';
    import {watch} from 'runed';
    import InatCard from './iNaturalist/InatCard.svelte';


    let { toMapObj, inatData,map } = $props();
let clickedId = $state(false);
let clicked=$state(false);

    let inatTax = $derived.by(() => {
        return toMapObj
    });

    watch(inatTax.length, (newVal,prevVal) => {
        if (newVal !== prevVal) {
            console.log('inatTax length changed in inatDataContainer', newVal,prevVal);

        }
        });
    $effect(() => {
        console.log('inatTaxssss', inatTax);
    //    debugger;
    });
    let openAccordionValue = $state('');
</script>
<p class="text-xs text-gray-500 pl-2 m-1 ml-0">Data last collection: November 2025</p>
<Accordion.Root
								type="single"
								collapsible

							>
                                {#each inatData as d}
                                {@const tax = inatTax.find(t => t.tax_id === d.pngp_tax_id)}
                                    <Accordion.Item value={d.sp_name}>
                                        <Accordion.Header class="w-full cursor-pointer">
                                            <Accordion.Trigger
												class="outline-hidden flex w-full select-none items-left py-1 pl-1 pr-1 mb-0"
											>
                                                <button

													class="accordion-button-hover border p-1 mb-0.5 rounded w-full text-left cursor-pointer
												hover:bg-gray-300"
												>
                                                	<div
                                                    class="flex flex-row justify-between items-baseline"
                                                >
                                                    <div class=" flex flex-row w-full items-baseline">

                                                        <div class="flex  w-2/3 items-left align-middle mt-auto mb-auto"

					>
						<div
							class="min-w-6 min-h-6 mt-auto mb-auto align-middle flex items-center"
						>
							<div
								class=" legend-color m-1 rounded-full   align-middle items-center justify-center"
								style="background-color: {tax.symbology.color}; width: 13px; height: 13px;
                                border: 3px solid #10a2eb;"
							></div>
						</div>
						<div class="legend-text text-lg align-middle mt-auto mb-auto">
							{tax.species_n}

							<!-- {visActive} - {JSON.stringify(taxa.symbology.visible)} -->
							<!-- {JSON.stringify(taxa.symbology)} -->
						</div>
					</div>


                                                         <!-- {JSON.stringify([...HiddenGroups])} -->

                                                        <div
                                                            class=" ml-auto align-items-center justify-center transition-transform duration-200 ease-in-out my-auto"

                                                        >
                                                            <ChevronDownIcon class="size-4" />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div class="text-xs ml-2">
                                                    <p>Observations: {d.data.length}</p>


                                                </div>
                                                <!-- <p>Observations: {taxes.reduce((acc, tax) => acc + tax.obs_count, 0)}</p> -->
                                                <!-- {JSON.stringify(classData)} -->
                                            </button>
                                            </Accordion.Trigger>
                                        </Accordion.Header>
                                        <Accordion.Content class="max-h-[600px] overflow-y-auto">
                                                {#each d.data as d}

                                                <div onclick={()=>{
                                                    clickedId = d.unique_id;
                                                }}>
                                                    <InatCard {map} pngpTaxObj={tax} inatData={d}  {clickedId}
                                                     />
                                                </div>
                                                {/each}
                                            </Accordion.Content>
                                    </Accordion.Item>
                                {/each}

                            </Accordion.Root>