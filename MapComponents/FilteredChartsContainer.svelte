

<script>
	import * as ToggleGroup from "$lib/components/ui/toggle-group/index.js";
	import FilteredValleysCharts from './FilteredValleysCharts.svelte';
	import FilteredYearsCharts from './FilteredYearsCharts.svelte';
	let {newSpeciesValleyList,newSpeciesYearsList} = $props();
	let selectedFilter = $state('valleys');



</script>

<ToggleGroup.Root
	variant="outline"
	type="single"
	bind:value={selectedFilter}
	class="mb-1 text-xs"
>
	<ToggleGroup.Item value="years" aria-label="Toggle years">
		Years
	</ToggleGroup.Item>
	<ToggleGroup.Item value="valleys" aria-label="Toggle valley">
		Valleys
	</ToggleGroup.Item>
</ToggleGroup.Root>

{#if selectedFilter === 'valleys'}
	<FilteredValleysCharts {newSpeciesValleyList}/>
{/if}
{#if selectedFilter === 'years'}

<!-- {JSON.stringify(newSpeciesYearsList)} -->
	<FilteredYearsCharts {newSpeciesYearsList}/>
{/if}