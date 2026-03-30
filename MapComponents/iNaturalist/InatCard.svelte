<script>
	//@ts-nocheck
	//@ts-ignore
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { writable, derived, get } from 'svelte/store';


	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	/* import { runeStoreTaxCards } from '$lib/stores/svelte5_stores/RunesStore.svelte.js'; */
	import { runeStoreTaxCards } from '$lib/stores/svelte5_stores/RuneStoreTaxCards.svelte.js';

	import { useDebounce, watch, Previous } from 'runed';
	import XIcon from '@lucide/svelte/icons/x';


	let photoOrientationFunction = ()=>{
		console.log('photoOrientationFunction', photo_orientation);
		if (!closeClicked)
	{
		console.log('photo_orientation', photo_orientation);
		if (photo_orientation === 'top')
			photo_orientation = 'lateral';
		else
			photo_orientation = 'top';
	}
			/* photo_orientation = 'top'; */
	}
	let debouncedPhotoOrientation = useDebounce(photoOrientationFunction, 700);
	let {
		pngpTaxObj,
		inatData,
		map,
		clickedId

	} = $props();
	let closeClicked = $state(false);

	let baseCircleRadiusExpression = [
			'interpolate',
			['linear'],
			['zoom'],
			9,
					5,
					11,
					7,
					15,
					11,
		];

	function resetRadiusExpression() {
		map.setPaintProperty(
			'pngp_inat',
			'circle-radius',
			baseCircleRadiusExpression
		);

	map.setPaintProperty(
			'pngp_inat',
			'circle-radius',
			baseCircleRadiusExpression
		);
}


	function generateRadiusExpression2(inat_id) {



		let taxaActive = [inat_id];

		if (taxaActive.length == 0) return baseCircleRadiusExpression;

		const [, , , ...zoomStops] = baseCircleRadiusExpression; // Extract zoom stops
		const expression = ['interpolate', ['linear'], ['zoom']];

		console.warn(taxaActive, 'taxaActive');

		for (let i = 0; i < zoomStops.length; i += 2) {
			expression.push(zoomStops[i]); // zoom level
			let ori_r = zoomStops[i + 1];
			let _this_expression = ['case'];

			let arr = ['==', ['get', 'unique_id'], inat_id];
			_this_expression.push(arr);
			_this_expression.push(ori_r * (5));

			// default radius if no tax_id matches
			_this_expression.push(ori_r);

			expression.push(_this_expression);
		}

		console.log('Final      v', expression);
		return expression;
	}

	function remarkSpeciesOnMap(inat_id) {
		let radiusExpression = generateRadiusExpression2(inat_id);

	   map.setPaintProperty(
					'pngp_inat',
					'circle-radius',
					radiusExpression
				);

   map.setPaintProperty(
				'pngp_inat',
				'circle-stroke-color',
				[
					'case',
					['==', ['get', 'unique_id'], inat_id],
					'#ffffff',
					'#10a2eb'
				]
			);
	}

	function focusOnMap(lat, lng,inat_id) {


        if (map) {
            map.flyTo({
                center: [lng, lat],
                zoom: 15
            });
        }
    }

	let debounceDuration = $state(300);

	let debouncedTaxClick = useDebounce((tax_id) => {
		runeStoreTaxCards.setAddedToList(tax_id);
		/* 	runeStoreTaxCards.filterMapParams = {
			...runeStoreTaxCards.filterMapParams,
			tax_id: Array.from(runeStoreTaxCards.spAddedToListIds || []),
			yearsArray: Array.from(
				runeStoreTaxCards.filteredBasicStats?.yearsArray || []
			),
			valleysArray: Array.from(
				runeStoreTaxCards.filteredBasicStats?.valleysArray || []
			),
		}; */
	}, debounceDuration);

	let sel_card=$derived.by(()=>{
		return runeStoreTaxCards.spAddedToList.some((d) => d.tax_id === tax.tax_id);
	});
	let photo_orientation = $state('lateral');
	let fixed_height = $state(50);
	let fixed_width = $state(90);



</script>

<button
	class="relative rounded-sm cursor-pointer data-highlighted:bg-muted outline-hidden flex w-full select-none items-left  text-sm   {photo_orientation === 'top' ? 'flex-col' : 'flex-row pl-2 pr-2 pb-0.5 pt-1 '} {fixed_height ? 'h-[{' + fixed_height + 'px}]' : ''} {fixed_width ? 'w-[' + fixed_width + 'px]' : ''} border"
	value={inatData.pngp_tax_id}
	label={inatData.sp_name}
	role="button"
	tabindex="0"

>
<!-- {photo_orientation} -->
	<div class="w-full flex text-card-foreground {photo_orientation!=='top' ? 'bg-gray-300' : ''}"
	onmouseenter={()=>{
		if (inatData.lat && inatData.lng) {
			//focusOnMap(inatData.lat, inatData.lng, inatData.unique_id);
			remarkSpeciesOnMap(inatData.unique_id);

		}
	}}
	onmouseleave={()=>{
		resetRadiusExpression();
	}}
	>
		<!-- <div class="{sel_tax?'bg-amber-500':'bg-slate-200'} w-full mx-auto mr-2  rounded-md shadow-md overflow-hidden"> -->
		<div class="w-full {photo_orientation=='top' ? '' : 'mx-auto'} mb-0 rounded-md shadow-md overflow-hidden">
			<div
				class="md:flex {photo_orientation=='top' ? 'flex-col' : 'flex-row'} rounded-md  {clickedId===inatData.unique_id? 'bg-lime-500' : ''}"
			>
<!-- {photo_orientation} -->
				{#if inatData.image_url}
					<div class="md:shrink-0"

					onmouseenter={()=>{
						debouncedPhotoOrientation();
					}}
					onmouseleave={()=>{
						useDebounce(()=>{
							//photo_orientation = 'lateral';
							debouncedPhotoOrientation();
							closeClicked = false;
						}, 100);
					}}
					>
					{#if photo_orientation === 'top'}
						<div class="cursor-pointer absolute top-1 left-1" onclick={()=>{

							photo_orientation = 'lateral';
							closeClicked = inatData.unique_id;
						}}>
							<XIcon class="w-6 h-6" style="color: white;outline:1px solid black;border-radius:50%;padding:2px;" />
					</div>

						{/if}
						<img
							class=" object-cover
							   {photo_orientation=='top' ? 'h-fit w-full' : 'md:h-full md:w-15 h-15 w-full'}"
							src={inatData.image_url}
							alt={inatData.sp_name}
							loading="lazy"

						/>
					</div>
				{:else}
					<div class="md:shrink-0">
						<img
							class="h-15 w-full object-cover md:h-full md:w-15"
							src="https://blocks.astratic.com/img/general-img-square.png"
							alt=""
						/>
					</div>
				{/if}

				<div class="{photo_orientation=='top' ? 'p-1' : 'p-1 pt-0.5 pb-0.5'} text-left font-light">
					<div class="tracking-wide leading-tight  text-base ">
						<a href={inatData.url} target="_blank" class="text-blue-500 underline text-xs hover:text-blue-600">iNaturalist URL</a>
					</div>
					{#if inatData.description}
						<div class="tracking-wide leading-tight  text-base ">
							{inatData.description}
						</div>
						{/if}

					{#if inatData.obs_time}
						<div class="tracking-wide leading-tight  text-base ">
							{inatData.obs_time}
						</div>
						{/if}

					{#if inatData.user_login}
						<div class="tracking-wide leading-tight  text-base ">
							User: {inatData.user_name || 'Unknown'} - {inatData.user_login || 'Unknown'}
						</div>
						{/if}
						{#if inatData.lat && inatData.lng}
							<Badge class="p-0.5 py-0.5 px-0.5 text-[0.6rem] " variant="numTaxRecords"
								onclick={()=>{
									console.warn(inatData,pngpTaxObj)

									focusOnMap(inatData.lat, inatData.lng, inatData.unique_id);
									remarkSpeciesOnMap(inatData.unique_id);
								}}
								>Focus on map</Badge>
							{/if}



				</div>
			</div>
		</div>

		<!--  {#if withYear}
            <div class="text-gray-500 text-xs">
                <ul class="_{tax.id}_years" style="display:none">
                    {withYear.data.length} years
                    {#each withYearData as d, i}
                        <li>{d.year} {d.count}</li>
                    {/each}
                </ul>
            </div>
        {/if} -->
	</div>
</button>

<style>
	:global(.card_selected) {
		background: oklch(67.146% 0.18255 248.564);
		opacity: 0.5;
	}
</style>
