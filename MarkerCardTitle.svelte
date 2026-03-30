<script>
	import * as Card from '$lib/components/ui/card/index.js';
	import FilterIcon from '@lucide/svelte/icons/funnel-plus';


	import names from './info/names.json';

	let {

		valleyCode,
		markerTitleVisible,
		onclick = () => {},
	} = $props();


</script>

<button
	{onclick}
	class="{markerTitleVisible ? 'block' : 'hidden'} marker-card-title m-0 p-0"
>
	<Card.Root
		class="bg-green-800 text-white shadow-lg hover:shadow-xl transition-all text-center duration-200 hover:-translate-y-1 m-0 p-0 min-w-30 p-1"
	>
		<Card.Header class="p-0 w-full flex items-center  h-full justify-center">
		<div class="flex pt-1 pb-1 flex-row items-center gap-1 align-middle w-full">
			<div  class="w-full">{names.valleys.find((d) => d.value === valleyCode)?.label.toUpperCase()}</div>
			<div class="mr-auto pr-1 w-fit "><FilterIcon class="w-3.5 h-3.5" /></div>
		</div>

		</Card.Header>
		<Card.Content class="p-0 mb-0 mt-0 font-light hidden">

		</Card.Content>
		<!--         <Card.Footer class="pt-2 pb-3 text-xs text-gray-500 flex items-center gap-1">
            <span>Click to filter</span>
        </Card.Footer> -->
	</Card.Root>
</button>

<style>
	.marker-card-title {
		all: unset;
		cursor: pointer;
		display: block;
	}
	.hidden {
		display: none;
	}

</style>
