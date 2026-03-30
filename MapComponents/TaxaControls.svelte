<script>
	// Icon imports
import { runeStoreTaxCards } from '$lib/stores/svelte5_stores/RuneStoreTaxCards.svelte.js';
	import { PaletteIcon, TrashIcon, ChartBarIcon, MoonIcon } from 'lucide-svelte';
	import EyeOffIcon from '@lucide/svelte/icons/eye-off';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import { fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	//import watch from 'svelte/watch';
	import { watch } from 'runed';



	// Props
	let {
		taxa, // The current taxa item being rendered
		changingStyleParam = $bindable(), // Bindable state for tracking style changes
	} = $props();
	let visMask = $state(false);
	let visMarkId = $state(null);
	let taxaMaskIds = $derived.by(() => {
		return runeStoreTaxCards.spAddedToList.filter((d) => d.symbology.visible && d.symbology.mask && d.symbology.mask>0).map((d) => d.tax_id);
	});
	$effect(() => {
		console.warn(taxaMaskIds, 'taxaMaskIds');
	});
	function toggleMask(taxa) {


		if (!taxa.symbology.mask || taxa.symbology.mask===false)
		{
			visMarkId=taxa.tax_id;
		}
		else
		{
			visMarkId=false;
		}
		console.warn(visMarkId,'visMarkId in toggleMask');
		taxa.symbology.mask = visMarkId;
		changingStyleParam = 'mask';

	}

	let activeElem=$derived(taxa.symbology.visible)

	// Derived constants based on taxa symbology
	const visPalette = $derived(taxa.symbology?.radius?.visibleInput || false);

	const visibleStats = $derived(taxa.symbology?.visibleStats || false);

	// Handler functions
	function togglePalette() {
		changingStyleParam = 'radiusVisibilityInput';
		taxa.symbology.radius.visibleInput = !taxa.symbology.radius.visibleInput;
	}

	function toggleVisibility() {
		changingStyleParam = 'visibility';

		taxa.symbology.visible = !taxa.symbology.visible;
		console.log('toggleVisibility', taxa.symbology.visible);

	}

	function removeTaxa() {
		changingStyleParam = 'removingTaxa';
		runeStoreTaxCards.setAddedToList(taxa.tax_id);
	}

	function toggleStats() {
		changingStyleParam = 'statsTaxa';
		taxa.symbology.visibleStats = !taxa.symbology.visibleStats;
	}
</script>

<!-- Taxa control buttons -->
<div
	class="action_container   relative flex justify-end items-center w-1/3"
>

<button
		class="{activeElem ? 'cursor-pointer':'pointer-events-none'}  p-1 flex justify-center items-center w-5 h-full  {taxaMaskIds.includes(taxa.tax_id) ? 'bg-amber-600 active' : 'bg-gray-300'} rounded-md"
		onclick={()=>toggleMask(taxa)}>
		<div
			class=" border-none {taxaMaskIds.includes(taxa.tax_id) ? 'text-white' : 'text-gray-600'}"

		>
			<MoonIcon class="w-3 h-3  {visMask ? 'active' : ''}" />
		</div>
	</button>

	<!-- Palette (radius) button -->
	 <button
		class="{activeElem ? 'cursor-pointer':'pointer-events-none'}  p-1 flex justify-center items-center w-5 h-full {visPalette ? 'bg-amber-600 active' : 'bg-gray-300'} rounded-md"
		onclick={togglePalette}>
		<div
			class=" border-none {visPalette ? 'text-white' : 'text-gray-600'}"

		>
			<PaletteIcon class="w-3 h-3  {visPalette ? 'active' : ''}" />
		</div>
	</button>
	<!-- Visibility toggle button -->
	 <button class="p-1 flex justify-center items-center w-5 h-full bg-gray-300 rounded-md"
	 onclick={toggleVisibility}>

		{#if taxa.symbology.visible}
			<EyeIcon class="w-3 h-3 text-gray-600"
			/>
		{:else}
			<EyeOffIcon class="w-3 h-3 text-gray-600" />
		{/if}
</button>
	<!-- Remove taxa button -->
	 <button class="p-1 flex justify-center items-center w-5 h-full bg-gray-300 rounded-md"
	 onclick={removeTaxa}>

	<TrashIcon class="w-3 h-3 text-gray-600 justify-end" />

</button>
<button class="{activeElem ? 'cursor-pointer':'pointer-events-none'}  p-1 flex justify-center items-center w-5 h-full {visibleStats ? 'bg-amber-600 active' : 'bg-gray-300'} rounded-md"
onclick={toggleStats}>

		<ChartBarIcon
			class="w-3 h-3  {visibleStats ? 'active' : ''}"
		/>

</button>
</div>
<style>
	:global(.active svg) {
		stroke: rgb(214, 212, 212);
	}
</style>
