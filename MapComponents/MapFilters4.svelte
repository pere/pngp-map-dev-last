<script>
	import { untrack } from 'svelte';
	import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { runeStoreTaxCards } from '$lib/stores/svelte5_stores/RuneStoreTaxCards.svelte.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { watch, Previous, resource } from 'runed';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import FilteredChartsContainer from './FilteredChartsContainer.svelte';

	$effect(() => {
		console.log(
			'Filtered Basic Stats updated:',
			runeStoreTaxCards.filteredBasicStats
		);
	});
	let selectedFilter = $state('years');

	// Separate Sets for years and valleys

	// Computed current selection based on active filter
	let selectedItems = $derived(
		selectedFilter === 'years' ? discardedYears : discardedValleys
	);

	let selectedItems2 = $state([]);
	let currentFilterType = $state('years');

	/* $inspect('filterParamsxxxx',runeStoreTaxCards.filterMapParams).with((type)=>{
		if (type === 'update') {
			console.trace('filterParamsxxxx trace');
			debugger;
		}
	}); */
	let selectedAll = $state({
		//all are selected at the beginning
		years: true,
		valleys: true,
	});
	let newSpeciesValleyList = $state([]);
	let newSpeciesYearsList = $state([]);

	let valleysList = $state(
		[
			{ valley: 'Cogne', count: 22486, present: false, discarded: false },
			{ valley: 'Orco', count: 38281, present: false, discarded: false },
			{ valley: 'Rhemes', count: 16952, present: false, discarded: false },
			{ valley: 'Soana', count: 19504, present: false, discarded: false },
			{
				valley: 'Valsavarenche',
				count: 38290,
				present: false,
				discarded: false,
			},
			{ valley: 'N/A', count: 9566, present: false, discarded: false },
		]
		//.map((valley) => ({ ...valley, discarded: false }))
	);

	let yearsList = $state(
		[
			{ year: '2007', count: 0, present: false },
			{ year: '2009', count: 0, present: false },
			{ year: '2010', count: 0, present: false },
			{ year: '2011', count: 0, present: false },
			{ year: '2012', count: 0, present: false },
			{ year: '2013', count: 0, present: false },
			{ year: '2014', count: 0, present: false },
			{ year: '2015', count: 0, present: false },
			{ year: '2016', count: 0, present: false },
			{ year: '2017', count: 0, present: false },
			{ year: '2018', count: 0, present: false },
			{ year: '2019', count: 0, present: false },
			{ year: '2020', count: 0, present: false },
			{ year: '2021', count: 0, present: false },
			{ year: 'N/A', count: 0, present: false },
		].map((year) => ({ ...year, discarded: false }))
	);
	let newYearsList = $state([]);
	let newValleysList = $state([]);
	let reloadKey = $state(0);

	let discardedYears = $derived(
		yearsList.filter((year) => year.discarded).map((year) => year.year)
	);
	let discardedValleys = $derived(
		valleysList
			.filter((valley) => valley.discarded)
			.map((valley) => valley.valley)
	);

	let presentYears = $derived(
		yearsList.filter((year) => !year.discarded).map((year) => year.year)
	);
	let presentValleys = $derived(
		valleysList
			.filter((valley) => !valley.discarded)
			.map((valley) => valley.valley)
	);

	let basicStatsData = $derived(
		runeStoreTaxCards.filteredBasicStats?.data?.[0]
	);

	//let selectedTax = Array.from(runeStoreTaxCards.spAddedToListIds);

	let selectedTax = $derived(Array.from(runeStoreTaxCards.spAddedToListIds));

	let discardedParams = $derived.by(() => {
		return {
			tax_ids: selectedTax,
			/*   years: derivedYears.filter(year => !year.discarded).map(year => year.year),
        valleys: derivedValleys.filter(valley => !valley.discarded).map(valley => valley.valley) */
			years: yearsList
				.filter((year) => year.discarded)
				.map((year) => year.year),
			valleys: valleysList
				.filter((valley) => valley.discarded)
				.map((valley) => valley.valley),
		};
	});

	const searchResource = resource(
		() => discardedParams,
		async (currParams, prevParams, { data, refetching, onCleanup, signal }) => {
			console.warn(
				'searchResource params',
				currParams.tax_ids,
				currParams.years,
				currParams.valleys
			);
			console.info('prevParams', prevParams);

			if (currParams.tax_ids.length === 0) return;
			runeStoreTaxCards.discardedParams = {
				years: currParams.years,
				valleys: currParams.valleys,
			};

			/* console.log('currIds', currIds,prevIds); */
			/*   if (!prevParams || JSON.stringify(currParams) === JSON.stringify(prevParams)) return
            else
            console.log('currParams', currParams); */

			// data: the previous value returned from the fetcher

			// refetching: whether the fetcher is currently refetching
			// or it can be the value you passed to refetch()

			// onCleanup: A cleanup function that will be called when the source is invalidated
			// and the fetcher is about to re-run

			// signal: AbortSignal for cancelling fetch requests
			const response = await fetch(
				`https://pere.gis-ninja.eu/pngp_phps_new/test/get_basic_stats_excluding2.php?ids=${currParams.tax_ids.join(',')}&years=${currParams.years.join(',')}&valleys=${currParams.valleys.join(',')}`,
				{ signal }
			);

			return response.json();
		},
		{
			debounce: 300,
		}
	);

	let res = $derived(searchResource?.current ?? null);

	watch(
		() => res,
		(curr, prev) => {
			console.warn('searchResource result', curr, prev);

			if (!curr) {

/*
				runeStoreTaxCards.filterMapParams = {
				active: false,
				tax_id: [],
				yearsArray: [],
				valleysArray: [],
			}; */

				//return
			}

			//pol_id,count
			let pol_ids = curr?.[0].by_grid || [];

			let byYear = curr?.[0].by_year;
			let byValley = curr?.[0].by_valley;
			let bySpeciesValleys = curr?.[0].by_species_valley;
			let bySpeciesYears = curr?.[0].by_species_years;
			if (!byYear && !byValley) {
				//we emptied one of these, other must be emptied/discarded	 too
				/* 	yearsList.map(year => {
				year.discarded = true;
			});
			valleysList.map(valley => {
				valley.discarded = true;
			}); */
				/* 	newYearsList=yearsList.map(year => {
				return {
					...year,
					discarded: true
				}
			});
			newValleysList=valleysList.map(valley => {
				return {
					...valley,
					discarded: true
				}
			}); */
			} else {
				newSpeciesValleyList =
					bySpeciesValleys?.map((species) => {
						return {
							...species,
							count: species?.count || 0,
						};
					}) || [];

				newSpeciesYearsList =
					bySpeciesYears?.map((year) => {
						return {
							...year,
							count: year?.count || 0,
						};
					}) || [];
				newYearsList = yearsList.map((year) => {
					let found = byYear.find((y) => y.year === year.year);
					yearsList.find((y) => y.year === year.year).present = found
						? true
						: false;
					return {
						...year,
						present: found ? true : false,
						count: found?.count || 0,
					};
				});
				/* ); */

				/* valleysList = untrack(() => */
				newValleysList = valleysList.map((valley) => {
					let found = byValley.find((v) => v.valley === valley.valley);
					if (found) {
						console.warn('found valley', found, valley);
					}
					valleysList.find((v) => v.valley === valley.valley).present = found
						? true
						: false;
					return {
						...valley,
						present: found ? true : false,
						count: found?.count || 0,
					};
				});
			}
			reloadKey++;

			runeStoreTaxCards.filterMapParams = {
				active: someDiscarded,
				tax_id: selectedTax,
				yearsArray: newYearsList
					.filter((year) => !year.discarded)
					.map((year) => year.year),
				valleysArray: newValleysList
					.filter((valley) => !valley.discarded)
					.map((valley) => valley.valley),
			};
			console.log(
				'manual change of runeStoreTaxCards.filterMapParams',
				JSON.stringify(runeStoreTaxCards.filterMapParams)
			);
		}
	);

	/* 	watch(
		() => runeStoreTaxCards.filterMapParams,
		(newVal, oldVal) => {
			console.warn('runeStoreTaxCards.filterMapParams changed', newVal, oldVal);
			if (!oldVal) return;
			if (JSON.stringify(newVal) === JSON.stringify(oldVal)) return;

			runeStoreTaxCards.paramsFilterRunes = {
				...runeStoreTaxCards.paramsFilterRunes,
				yearsArray: newVal.yearsArray,
				valleysArray: newVal.valleysArray,
			};
			console.info(
				'runeStoreTaxCards.paramsFilterRunes',
				runeStoreTaxCards.paramsFilterRunes
			);
			debugger;

			fetchRemoteDataRunes(Array.from(runeStoreTaxCards.spAddedToListIds));
		}
	); */

	let someDiscarded = $derived(
		yearsList.some((year) => year.discarded) ||
			valleysList.some((valley) => valley.discarded)
	);

	watch(
		() => someDiscarded,
		(newVal, oldVal) => {
			console.warn(
				'runeStoreTaxCards.filterMapParams discarded watch',
				newVal,
				oldVal
			);
			if (!runeStoreTaxCards.filterMapParams) return;

			if (!oldVal) return;
			if (runeStoreTaxCards.filterMapParams.tax_id.length === 0) {
				runeStoreTaxCards.filterMapParams.active = false;
				return;
			}

			if (newVal !== oldVal) {
				if (newVal === true) {
					runeStoreTaxCards.filterMapParams.active = true;
				} else {
					runeStoreTaxCards.filterMapParams.active = false;
				}
			}
		}
	);

	$effect(() => {
		console.warn('someDiscarded, some filter', someDiscarded);
	});

	// Track the last processed timestamp to prevent infinite loops
	let lastProcessedTimestamp = $state(null);

	// Track if we've done the initial load (only select all on FIRST load)
	let hasInitializedFilters = $state(false);

	// Effect to initialize both Sets ONLY when FIRST data arrives

	watch(
		() => runeStoreTaxCards.filteredBasicStats,
		(newVal, oldVal) => {
			if (!newVal || newVal.length === 0) return;
			return;
			console.warn(
				'runeStoreTaxCards.filteredBasicStats watch',
				newVal,
				oldVal
			);
			//if (!runeStoreTaxCards.filterMapParams) return;
			if (hasInitializedFilters) {
				runeStoreTaxCards.filterMapParams.tax_id = Array.from(
					runeStoreTaxCards.spAddedToListIds
				);
			} else {
				hasInitializedFilters = true;

				lastProcessedTimestamp = newVal.timestamp;
				hasInitializedFilters = true; // Mark as initialized
				const statsData = newVal.data[0];

				// Initialize years Set with all available years
				if (statsData?.by_year) {
					const allYears = new Set(
						statsData.by_year
							.map((item) => item.year)
							.filter((year) => year != null)
					);
					discardedYears = allYears;
					console.log(
						'FIRST LOAD - Initialized discardedYears:',
						Array.from(allYears)
					);
				}

				// Initialize valleys Set with all available valleys
				if (statsData?.by_valley) {
					const allValleys = new Set(
						statsData.by_valley
							.map((item) => item.valley)
							.filter((valley) => valley != null)
					);
					discardedValleys = allValleys;
					console.log(
						'FIRST LOAD - Initialized discardedValleys:',
						Array.from(allValleys)
					);
				}

				// Update filter params with the initialized data (using untrack to prevent reactivity loop)

				runeStoreTaxCards.filterMapParams = {
					tax_id: Array.from(runeStoreTaxCards.spAddedToListIds || []),
					yearsArray: Array.from(discardedYears),
					valleysArray: Array.from(discardedValleys),
				};
			}
		}
	);

	function toggleSelection(paramValue) {
		// Get the correct Set based on current filter
		const currentSet =
			selectedFilter === 'years' ? discardedYears : discardedValleys;

		if (currentSet.has(paramValue)) {
			currentSet.delete(paramValue);
		} else {
			currentSet.add(paramValue);
		}

		// Trigger reactivity by creating new Set
		if (selectedFilter === 'years') {
			discardedYears = new Set(discardedYears);
		} else {
			discardedValleys = new Set(discardedValleys);
		}

		// Update the filter params with both arrays
		runeStoreTaxCards.filterMapParams = {
			active: someDiscarded,
			/* ...runeStoreTaxCards.filterMapParams, */
			tax_id: Array.from(runeStoreTaxCards.spAddedToListIds || []),
			yearsArray: Array.from(discardedYears),
			valleysArray: Array.from(discardedValleys),
		};
	}

	function handleAllClick(selectedFilter) {
		selectedAll[selectedFilter] = !selectedAll[selectedFilter];
		let checked = selectedAll[selectedFilter];
		console.log(
			'checked all clicked',
			selectedAll[selectedFilter],
			selectedFilter
		);
		debugger;

		if (selectedAll[selectedFilter]) {
			console.log('Selecting all for', selectedFilter);
			// Select All - add all items to the appropriate Set

			if (selectedFilter === 'years') {
				yearsList.forEach((year) => {
					year.discarded = false;
				});
			} else if (selectedFilter === 'valleys') {
				valleysList.forEach((valley) => {
					valley.discarded = false;
				});
			}
		} else {
			console.log('Selecting none for', selectedFilter);
			newYearsList = [];
			newValleysList = [];
			if (selectedFilter === 'years') {
				yearsList = yearsList.map((year) => {
					return {
						...year,
						present: false,
						discarded: true,
					};
				});

				valleysList = valleysList.map((valley) => {
					return {
						...valley,
						present: false,
					};
				});
				/* yearsList.forEach(year => {
					year.discarded = true;
				});
				valleysList.forEach(valley => {
					valley.present = false;
				}); */
			} else if (selectedFilter === 'valleys') {
				valleysList = valleysList.map((valley) => {
					return {
						...valley,
						present: false,
						discarded: true,
					};
				});
				yearsList = yearsList.map((year) => {
					return {
						...year,
						present: false,
					};
				});
				/* valleysList.forEach(valley => {
					valley.discarded = true;
				}); */
			}
		}
		reloadKey++;
		console.log(
			'Selected Items:',
			selectedFilter === 'years' ? discardedYears : discardedValleys
		);

		console.log(
			'present Items:',
			selectedFilter === 'years' ? presentYears : presentValleys
		);
		console.info(
			'runeStoreTaxCards.spAddedToListIds',
			runeStoreTaxCards.spAddedToListIds
		);

		// Update filter params with both arrays
		runeStoreTaxCards.filterMapParams = {
			active: someDiscarded,
			/* ...runeStoreTaxCards.filterMapParams, */
			tax_id: Array.from(runeStoreTaxCards.spAddedToListIds || []),
			yearsArray: Array.from(presentYears),
			valleysArray: Array.from(presentValleys),
		};
	}
</script>

<!-- {JSON.stringify(runeStoreTaxCards.filteredBasicStats)}
{JSON.stringify(statsList)} -->

<div class="m-2">
	<!-- {selectedTax} -->
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

	<div class="bg-background">
		<div class="years_list {selectedFilter === 'years' ? 'block' : 'hidden'}">
			<div class="flex flex-row items-center p-1">
				<input
					type="checkbox"
					class="cursor-pointer size-3"
					onclick={() => handleAllClick('years')}
					checked={selectedAll[selectedFilter]}
				/>
				<label class="ml-1 text-xs">
					<!-- {JSON.stringify(statsList)} -->
					<!-- {JSON.stringify(selectedAll)} -->

					<!-- All {selectedFilter}
			Years: {JSON.stringify(Array.from(discardedYears))} | Valleys: {JSON.stringify(Array.from(discardedValleys))} -->
					Add/remove all</label
				>
			</div>

			<div class="w-full h-fit max-h-50 overflow-auto">
				<div
					class="grid grid-rows-auto item_selected_list
				grid-cols-4
				gap-1 text-xs"
				>
					{#key reloadKey}
						{@const sortedYears = [...yearsList].sort((a, b) => {
							const _newA = newYearsList?.find((y) => y.year === a.year);
							const _newB = newYearsList?.find((y) => y.year === b.year);
							const toShowA = !a.discarded && (_newA?.present || a.present);
							const toShowB = !b.discarded && (_newB?.present || b.present);
							// Sort: toShow=true first, then by year descending
							if (toShowA !== toShowB) {
								return (toShowB ? 1 : 0) - (toShowA ? 1 : 0);
							}
							return b.year - a.year; // Secondary sort: newer years first
						})}

						{#each sortedYears as date (date.year + reloadKey)}
							{@const _new = newYearsList?.find((y) => y.year === date.year)}
							{@const toShow =
								!date.discarded && (_new?.present || date.present)}
							{@const basicStatsYear = basicStatsData?.by_year?.find(
								(y) => y.year === date.year
							)}
							{@const count_new = _new?.count || 0}
							{@const extraText =
								basicStatsYear?.count && basicStatsYear?.count !== count_new
									? `<span class="text-xxs opacity-50 font-light">${basicStatsYear?.count?.toLocaleString()} </span>`
									: ''}
							<!--  {@const count_new=date.count_new} -->

							<button
								onclick={() => {
									date.discarded = !date.discarded;
									/*          yearsList.find(year => year.year === date.year).discarded = !date.discarded;
								yearsList = [...yearsList]; */
								}}
								class="flex flex-row bg-pngp text-left rounded-md text-white p-1 justify-between items-center hover:bg-pngp/80 cursor-pointer {date.discarded
									? 'discarded'
									: ''} {toShow ? 'opacity-100' : 'opacity-30'} "
							>
								<div class="flex-3 text-sm font-light text-xs">{date.year}</div>
								<div
									class="flex-1 text-center p-0.5 bg-amber-600 rounded-md text-white text-xs"
								>
									{count_new.toLocaleString()}
									{@html extraText}
								</div>
							</button>
						{/each}
					{/key}
				</div>
			</div>
		</div>

		<div
			class="valleys_list {selectedFilter === 'valleys' ? 'block' : 'hidden'}"
		>
			<div class="flex flex-row items-center p-1">
				<input
					type="checkbox"
					class="cursor-pointer size-3"
					onclick={() => handleAllClick('valleys')}
					checked={selectedAll[selectedFilter]}
				/>
				<label class="ml-1 text-xs">
					<!-- {JSON.stringify(statsList)} -->
					<!-- {JSON.stringify(selectedAll)} -->

					<!-- All {selectedFilter}
			Years: {JSON.stringify(Array.from(discardedYears))} | Valleys: {JSON.stringify(Array.from(discardedValleys))} -->
					Add/remove all</label
				>
			</div>

			<div class="w-full h-fit max-h-50 overflow-auto">
				<div
					class="grid grid-rows-auto item_selected_list
			grid-cols-2
			gap-1 text-xs"
				>
					{#key reloadKey}
						{@const sortedValleys = [...valleysList].sort((a, b) => {
							const _newA = newValleysList?.find((v) => v.valley === a.valley);
							const _newB = newValleysList?.find((v) => v.valley === b.valley);
							const toShowA = !a.discarded && (_newA?.present || a.present);
							const toShowB = !b.discarded && (_newB?.present || b.present);
							// Sort: toShow=true first, then alphabetically
							if (toShowA !== toShowB) {
								return (toShowB ? 1 : 0) - (toShowA ? 1 : 0);
							}
							return a.valley.localeCompare(b.valley); // Secondary sort: alphabetical
						})}

						{#each sortedValleys as valley (valley.valley + reloadKey)}
							{@const _new = newValleysList?.find(
								(v) => v.valley === valley.valley
							)}
							{@const toShow =
								!valley.discarded && (_new?.present || valley.present)}

							{@const count_new = _new?.count || 0}
							{@const basicStatsValley = basicStatsData?.by_valley?.find(
								(v) => v.valley === valley.valley
							)}
							{@const diffCounts = count_new !== basicStatsValley}
							{@const extraText =
								basicStatsValley?.count && basicStatsValley?.count !== count_new
									? `<span class="text-xxs opacity-50 font-light">${basicStatsValley?.count?.toLocaleString()} </span>`
									: ''}

							<button
								class="flex flex-row bg-pngp text-left rounded-md text-white p-1 justify-between items-center hover:bg-pngp/80 cursor-pointer {valley.discarded
									? 'discarded'
									: ''} {toShow ? 'opacity-100' : 'opacity-30'}"
								onclick={() => {
									valley.discarded = !valley.discarded;
								}}
							>
								<div class="flex-3 font-light text-xs">{valley.valley}</div>
								<div
									class="flex-1 text-center p-0.5 bg-amber-600 rounded-md text-white text-xs"
								>
									{count_new.toLocaleString()}
									{@html extraText}
								</div>
							</button>
						{/each}
					{/key}
				</div>
			</div>
		</div>
		<!-- 	{#if selectedFilter === 'years'}
		<p>Year filters go here</p>
	{:else if selectedFilter === 'valley'}
		<p>Valley filters go here</p>
	{/if} -->
	</div>
	<div
		class="current_filters_info mt-1.5 m-2 outline border-muted bg-background p-1.5 rounded-md"
	>
		<!-- someDiscarded: {someDiscarded}
	basic stats data: {JSON.stringify(basicStatsData)} -->
		<!-- newValleysList: {JSON.stringify(newValleysList)} -->

		<span class="text-xs">Your current filters are:</span>
		<div class="flex flex-col text-xs">
			<div class="flex flex-row">
				<span class="title">Taxa:</span>
				{runeStoreTaxCards.spAddedToListIds.size} species
			</div>
			{#if discardedYears?.length > 0}
				<div class="flex flex-row">
					<span class="title">Years:</span> NOT in {Array.from(
						discardedYears
					).join(', ')}
				</div>
			{/if}
			{#if discardedValleys?.length > 0}
				<div class="flex flex-row">
					<span class="title">Valleys:</span> NOT in {Array.from(
						discardedValleys
					).join(', ')}
				</div>
			{/if}
		</div>
		<div class="text-xs">
		<Badge variant="outline" class="bg-red-800 text-white p-1 rounded-md max-w-full h-fit whitespace-normal wrap-break-word inline-block"
				>All data must fulfill all filters to be shown on the map</Badge
			>
		</div>
	</div>
	{#if newSpeciesValleyList?.length > 0}
		<FilteredChartsContainer {newSpeciesValleyList} {newSpeciesYearsList} />
	{/if}
	<!-- <ValleysCharts {valleysStats}/> -->
</div>

<style>
	:global(.item_selected_list button) {
	}
	:global(.item_selected_list button.item_selected) {
	}
	:global(.discarded) {
		border: 2px solid #e40014;
		opacity: 0.6;
	}
	:global(.text-xxs) {
		font-size: 0.525rem;
	}
	:global(.title) {
		font-weight: bold;
		margin-right: 0.5rem;
		color: #000;
	}
</style>
