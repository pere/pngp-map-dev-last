<script>
	import { Debounced } from "runed";
	import { runeStoreTaxCards } from "$lib/stores/svelte5_stores/RuneStoreTaxCards.svelte";

	let { modifTaxaPaletteExport = $bindable(), this_modifPalette, changingStyleParamExport = $bindable(),active } = $props();

  /* {
    "modifTaxaPalette": [
        {
            "tax_id": 217,
            "species_n": "Rupicapra rupicapra",
            "inaturalist_id": 42347,
            "preferred_common_name": "Northern Chamois",
            "iconic_taxon_name": "Mammalia",
            "wikipedia_url": "https://en.wikipedia.org/wiki/Chamois",
            "matched_term": "Rupicapra rupicapra",
            "medium_url": "https://inaturalist-open-data.s3.amazonaws.com/photos/456684191/medium.jpg",
            "pngp_data": {
                "tax_id": 217,
                "name_it": "Camoscio",
                "name_eng": "Alpine chamois",
                "species_n": "Rupicapra rupicapra",
                "genus_n": "Rupicapra",
                "family_n": "Bovidae",
                "order_n": "Cetartiodactyla",
                "class_n": "Mammalia",
                "obs_count": 27024
            },
            "inat_photo": "217.jpg",
            "taxonomy": {
                "tax_id": 217,
                "name_it": "Camoscio",
                "name_eng": "Alpine chamois",
                "species_n": "Rupicapra rupicapra",
                "genus_n": "Rupicapra",
                "family_n": "Bovidae",
                "order_n": "Cetartiodactyla",
                "class_n": "Mammalia",
                "obs_count": 27024
            },
            "name": "Rupicapra rupicapra",
            "id": 217,
            "colorObj": {
                "id": 82,
                "color": "#cc9833"
            },
            "active": true,
            "palette": {
                "visibleInput": true
            }
        }
    ]
}*/
//let this_taxa = $derived(modifTaxaPaletteExport.find((r) => r.tax_id === taxa.tax_id));

//$derived(runeStoreTaxCards.spAddedToList.find((r) => r.tax_id === taxa.tax_id));

$inspect('this_modifPalette inspected', this_modifPalette);
	// Object containing tax, we gonna modify its radius
	let arr = $state();
	//let newR = $state(0);
	let newR = $derived.by(() => {
        return (this_modifPalette.palette?.radius?.r || 0).toFixed(2);
    });
    console.log('newR derived', newR);
	let debouncedHandleSelectedRadius = $state();

	function debounce(fn, delay = 300) {
		let timeout;
		return (...args) => {
			clearTimeout(timeout);
			timeout = setTimeout(() => fn(...args), delay);
		};
	}

	// Initialize values
/* 	$effect(() => {

		if (this_taxa &&  this_taxa.palette?.radius && modifTaxaPaletteExport) {

			newR = (this_taxa.palette.radius?.r || 0).toFixed(2);
		}
	}); */

	debouncedHandleSelectedRadius = debounce((e) => {
		changingStyleParamExport='radius';
		let val = parseFloat(e.target.value);
		console.log('Selected radius value:', val);

		// Update the modifTaxaPalette array
		if (this_modifPalette) {
			this_modifPalette.palette.radius = {
				r: Math.exp(val),
				inputVal: val.toFixed(2),
				visibleInput: true,
				active: true
			}

			/* let found = runeStoreTaxCards.spAddedToList.find((d) => d.tax_id === this_modifPalette.tax_id);
			if (found) {
				found.palette = {
					radius: {
						r: Math.exp(val),
						inputVal: val.toFixed(2),
						visibleInput: true,
						active: true
					}
				}
			}
			runeStoreTaxCards.spAddedToList = [...runeStoreTaxCards.spAddedToList.filter((d) => d.tax_id !== this_modifPalette.tax_id), found]; */

			modifTaxaPaletteExport = [...modifTaxaPaletteExport.filter((d) => d.tax_id !== this_modifPalette.tax_id), this_modifPalette];
			console.warn(modifTaxaPaletteExport);

		}

		//let data=modifTaxaPaletteExport.filter((d) => d.tax_id !== taxa.tax_id);
		/* modifTaxaPaletteExport = [
			...modifTaxaPaletteExport,
			{
                ...this_taxa,
                radius:{
				r: Math.exp(val),
				id: taxa.tax_id,
				inputVal: val.toFixed(2),
				visibleInput: true,
                active: true
			}
        }
		]; */

	}, 200);



    modifTaxaPaletteExport = [
			...modifTaxaPaletteExport,

    ]
</script>
{#if this_modifPalette}
<div class="p-2 w-full border border-gray-300 rounded bg-gray-50 {active ? 'block' : 'opaque'}">
	<label class="text-sm font-medium text-gray-700">
		Radius {this_modifPalette.palette.radius?.inputVal > 0 ? '+' : ''}{newR}%
	</label>
	<input
		oninput={debouncedHandleSelectedRadius}
		type="range"
		min="-2"
		max="2"
		step="0.2"
		value={this_modifPalette.palette.radius?.inputVal || 0}
		class="w-full mt-1"
	/>
</div>
{:else}
<div>
	<p>No taxa found</p>
</div>
{/if}

<style>
	.opaque {
		opacity: 0.5;
		pointer-events: none;
	}
</style>