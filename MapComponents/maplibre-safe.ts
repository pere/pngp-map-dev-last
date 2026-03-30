import type { Map, FilterSpecification } from 'maplibre-gl';
import type { MapLayerId } from '$lib/types/layers';

export function setPaintProperty(map: Map, layer: MapLayerId, prop: string, value: unknown) {
	map.setPaintProperty(layer, prop, value);
}

export function setLayoutProperty(map: Map, layer: MapLayerId, prop: string, value: unknown) {
	map.setLayoutProperty(layer, prop, value);
}

export function setFilter(map: Map, layer: MapLayerId, filter: FilterSpecification | null) {
	map.setFilter(layer, filter);
}

export function moveLayer(map: Map, layer: MapLayerId, before?: MapLayerId) {
	map.moveLayer(layer, before);
}

export function removeLayer(map: Map, layer: MapLayerId) {
	map.removeLayer(layer);
}

export function getLayer(map: Map, layer: MapLayerId) {
	return map.getLayer(layer);
}
