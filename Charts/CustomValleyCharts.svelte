<script>
	import * as Select from '$lib/components/ui/select/index.js';
	import highcharts from '$lib/components/myCharts/highcharts.js';
	import { browser } from '$app/environment';
	import config from './customConfig.js';
	import names from '../info/names.json';

	import { _chartStores as chartStores } from '../../chartStores.svelte.js';
	let type='valleys';
	//let byBiennio=$derived(this_store.byBiennio);
	let this_store=$derived(chartStores.valleysParams);


	import valleyDataTaxon from '../info/valley/valley_taxon.json';




	let reactiveData = $derived.by(() => {
		//return byBiennio ? valleyDataTaxon.withBiennio : valleyDataTaxon.withoutBiennio;
			//valleyDataTaxon : valleyDataTaxonGeneral;
			return valleyDataTaxon.withoutBiennio;
	});


	let taxonItems = $state(
		names.taxons.map((d, i) => ({
			value: d.value,
			label: d.label,
			selected: d.value === 'all' ? true : false,
			color: d.color,
		}))
	);
	let selectedTaxonItems = $derived.by(() => {
		return taxonItems
			.filter((d) => this_store.taxons.map(d=>d.value).includes(d.value))
			.map((d, i) => {
				return { short: d.value, label: d.label, color: d.color };
			})
	});


	let selTaxonNames = $derived.by(() => {
		return taxonItems
			.filter((d) => d.selected)
			.map((d) => {
				return { short: d.value, label: d.label, color: d.color };
			})
			.sort((a, b) => a.label.localeCompare(b.label));
	});
	$inspect(selTaxonNames);

	//let selParam='richness';
	//const taxons = ['u', 'o', 'l', 'r', 'c', 'f', 's'];

	let derivedGroups = $derived.by(() => {
		console.log('reactiveData', reactiveData);

		return reactiveData.reduce(
			(acc, item) => {
				if (!acc.codes_arr.includes(item.geocode)) {
					acc.codes_arr.push(item.geocode);
					acc.data.push({
						code: item.geocode,
						label: names.valleys.find((d) => d.value === item.geocode)?.label,
						data: [item],
					});
				} else {
					acc.data.find((d) => d.code === item.geocode).data.push(item);
				}
				return acc;
			},
			{ codes_arr: [], data: [] }
		);
	});
	$inspect(derivedGroups);

	let derivedConfig = $derived.by(() => {
		if (!derivedGroups) return [];

		let allConfigs = [];
		['richness', 'abundance', 'shannon'].forEach((p) => {
			let selParam = p;

			//extract for 'richness' and abuncance 'abundance' if taxon belongs to selectedTaxonItems ('u','l'...)

			//u_richness,u_abundance,l_richness,l_abundance,...
			//            return {value:d.value,color:d.color}
			let toSelect = selectedTaxonItems.map((d) => d.short + '_' + selParam);
			let selColors = selectedTaxonItems.map((d) => d.color);

			//  let color=taxonItems.find(d=>d.value===selectedTaxonItems[0]).color;
			//  console.log('toSelect',toSelect);

			let toSelectObj = toSelect.map((_d, i) => {
				return { name: _d, data: [], color: selColors[i] };
			});

			/*            [
    {
        "name": "o_richness",
        "data": [],
        "color": "#f0b100"
    }
] */
			let xCategories = derivedGroups.data.map((d) => d.label);
			//each geocode
			let configData = derivedGroups.data.reduce((acc, d) => {
				let geocode = d.code;

				//  console.log('flattened data',derivedGroups.data.flatMap(d=>d.data));

				// d.data is an array, so we need to iterate through each item in the array
				let f = d.data.flatMap((item) => {
					// Now extract the properties from each item objec.ct
					return Object.entries(item)
						.map(([key, value]) => {
							/* console.log(key,value, toSelect); */
							if (toSelect.includes(key)) {
								toSelectObj.find((d) => d.name === key).data.push(value);
								//                                toSelectObj.find(d=>d.name===key).color=color;
							}

							return null; // Return null for non-matching keys
						})
						.filter(Boolean); // Remove null values
				});

				return f;
			}, []);

			config.xAxis.categories = xCategories;
			config.yAxis = [
				{
					title: {
						useHTML: true,
						text:
							'<span style="color:gray">' +
							selParam.toLocaleUpperCase() +
							'</span> ',
						style: {
							color: 'black',
							fontSize: '.7rem',
							fontFamily: 'Lato',
						},
					},
					labels: {
						useHTML: true,
						id: selParam,
						style: {
							color: 'black',
							fontSize: '.8rem',
							fontFamily: 'Lato',
						},
					},
				},
			];

			//[0].title.text='<span style="color:#1e946f">'+selParam+'</span> ';
			/* config.yAxis[1].title.text='<span style="color:#f0b100">Abundance</span> '; */

			let _config = {
				...config,
				series: toSelectObj,
				title: {
					text: selParam.toLocaleUpperCase(),
					style: {
						fontFamily: 'Lato',
						fontSize: '1.3rem',
						fontWeight: 'normal',

						color: 'gray',
					},
				},
			};
			console.warn(_config, '_config in customcharts for ' + selParam);
			allConfigs.push({
				name: selParam,
				config: _config,
			});
		});
		return allConfigs;
	});

	let handleTaxonItemsChange = (value) => {
		taxonItems.forEach((d) => {
			if (value.includes(d.value)) {
				d.selected = true;
			} else {
				d.selected = false;
			}
		});
		console.warn(selTaxonNames, 'selTaxonNames in handleTaxonItemsChange');
	};
</script>




	<div class="text-sm p-2 ml-0  rounded-md bg-gray-300 m-2 w-fit text-center">
		{#if selectedTaxonItems && selectedTaxonItems.length > 0}
			{@html selectedTaxonItems
				.map((d) => {
					return `<button style="border-radius: 4px;background-color:${d.color};color:white;padding:7px">${d.label}</button>`;
				})
				.join(' ')}
		{:else}
			No taxons selected
		{/if}
	</div>

<!-- allConfigs.push({
                name:selParam,
                config:_config
            }); -->
<div>
	{#if derivedConfig && derivedConfig.length > 0 && selectedTaxonItems.length > 0}
		<div class="grid {type == 'valleys' ? 'grid-cols-2' : 'grid-cols-1'} gap-2">
			{#each derivedConfig as item}
			<!-- {JSON.stringify(item.config)} -->
				<div
					use:highcharts={item.config}
					class="chart-container rounded-md"
					style="width: 100%; height: {type == 'plots' ? '150px' : '250px'}"
				></div>
			{/each}
		</div>
	{:else}
		<div class="text-sm p-5 bg-gray-100 rounded-md">No taxons selected</div>
	{/if}
</div>
