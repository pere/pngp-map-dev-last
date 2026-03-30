/**
 * Shared reactive state for {@link MarkerCard} instances created with `mount()`.
 * Props passed into `mount()` from `map.on('load')` are not reliably reactive;
 * Map.svelte keeps this object in sync via `$effect`.
 */
export const mapMarkerCardShared = $state({
	_interface: 'withoutBiennio',
	tabType: 'richness',
	selTaxonShort: 'all',
	markerVisible: /** @type {boolean | null} */ (false),
});

export const mapBiennioMarkerCardShared = $state({
	_interface: 'withBiennio',
	tabType: 'richness',
	selTaxonShort: 'all',
	markerVisible: /** @type {boolean | null} */ (false),
});
