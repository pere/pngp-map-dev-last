<script>
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import data from './info/park.json';
	import StyledCard from '$lib/components/ui/styled-card.svelte';
	import names from '../info/names.json';

	import CalculatorIcon from '@lucide/svelte/icons/calculator';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import CreditCardIcon from '@lucide/svelte/icons/credit-card';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import SmileIcon from '@lucide/svelte/icons/smile';
	import UserIcon from '@lucide/svelte/icons/user';
	import * as Command from '$lib/components/ui/command/index.js';

	/* import { Command } from "bits-ui"; */

	import {
		CardHeader,
		CardTitle,
		CardContent,
		CardDescription,
	} from '$lib/components/ui/card';

	let taxonTableData = data.park_taxon_biennio.sort((a, b) =>
		a.taxon.localeCompare(b.taxon)
	);

	let biennioTableData = data.biennio;
	//.sort((a, b) => a.biennio - b.biennio);

	let showCard = $state(true);

	function handleClose() {
		showCard = false;
		// Or any other close logic
	}
	let derivedPlotsValleys = $derived.by(() => {
		return names.plots_valleys.map((p) => ({
			...p,
			selected: true,
		}));
	});
	let derivedValleys = $derived.by(() => {
		return names.valleys.map((v) => ({
			...v,
			selected: true,
		}));
	});
</script>

<!-- Card Variants Demo -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
	<Command.Root class="hidden rounded-lg border shadow-md md:min-w-[450px]">
		<Command.Input placeholder="Type a command or search..." />
		<Command.List>
			<Command.Empty>No results found.</Command.Empty>
			<Command.Group heading="Suggestions">
				{#each derivedValleys as d}
					{@const plots = derivedPlotsValleys.filter(
						(p) => p.valley_code === d.value
					)}
					<!-- {@debug d}
        {@debug derivedPlotsValleys} -->

					<Command.Item class="block p-2" key={d.value}>
						<div class="w-full flex-row text-lg">
							<input type="checkbox" checked={d.selected} />
							<label for={d.value}>
								{d.label}
							</label>
						</div>

						<div class="grid grid-cols-5 w-full">
							{#each plots as p}
								<div class="">
									<input type="checkbox" checked={p.selected} />
									<label for={p.plot_code}>
										{p.plot_code}
									</label>
								</div>
							{/each}
						</div>
					</Command.Item>
				{/each}
			</Command.Group>
			<Command.Separator />
			<Command.Group heading="Settings">
				<Command.Item>
					<UserIcon />
					<span>Profile</span>
					<Command.Shortcut>⌘P</Command.Shortcut>
				</Command.Item>
				<Command.Item>
					<CreditCardIcon />
					<span>Billing</span>
					<Command.Shortcut>⌘B</Command.Shortcut>
				</Command.Item>
				<Command.Item>
					<SettingsIcon />
					<span>Settings</span>
					<Command.Shortcut>⌘S</Command.Shortcut>
				</Command.Item>
			</Command.Group>
		</Command.List>
	</Command.Root>

	<!-- 	<Command.Root
				class="divide-border border-muted flex h-full w-full flex-col divide-y self-start overflow-hidden  border"

			>

				<Command.List
					class="overflow-y-auto overflow-x-hidden px-0 pb-1"
				>
					<Command.Viewport>


					   <Command.Group>
        <Command.GroupHeading>
        Valleys
        </Command.GroupHeading>
        <Command.GroupItems>
      {#each names.valleys as d}
						<Command.Item key={d.value}>{d.label}</Command.Item>
						{/each}
        </Command.GroupItems>
      </Command.Group>
      <Command.Separator />
      <Command.Group/>

					</Command.Viewport>
				</Command.List>
			</Command.Root> -->
	<Card.Root class="border-1 border-foreground">
		<Card.Header class="bg-background text-lg text-center">
			<Card.Title data-tid="plots_page.main">Main</Card.Title>
			<Card.Description
				class="text-sm text-muted-foreground"
				data-tid="plots_page.main_indexes">Main indexes</Card.Description
			>
		</Card.Header>
		<Card.Content>
			<ul class="text-sm text-muted-foreground">
				<li>
					<span data-tid="parameters.richness">Richness</span>: {data.general[0]
						.richness}
				</li>
				<li>
					<span data-tid="parameters.abundance">Abundance</span>: {data
						.general[0].abundance}
				</li>
				<li>
					<span data-tid="parameters.shannon_index">Shannon</span>: {data
						.general[0].shannon}
				</li>
			</ul>
			<div class="align-center text-sm text-muted-foreground">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Cell data-tid="table_headers.biennio">Biennio</Table.Cell>
							<Table.Cell data-tid="table_headers.richness">Richness</Table.Cell
							>
							<Table.Cell data-tid="table_headers.abundance"
								>Abundance</Table.Cell
							>
							<Table.Cell data-tid="table_headers.shannon">Shannon</Table.Cell>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each biennioTableData as d}
							<Table.Row key={d.biennio}>
								<Table.Cell>{d.biennio}</Table.Cell>
								<Table.Cell>{d.richness}</Table.Cell>
								<Table.Cell>{d.abundance.toLocaleString()}</Table.Cell>
								<Table.Cell>{d.shannon}</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		</Card.Content>
	</Card.Root>

	<Card.Root class="border-1 border-foreground">
		<Card.Header class="bg-background text-lg text-center">
			<Card.Title data-tid="plots_page.main">Main</Card.Title>
			<Card.Description
				class="text-sm text-muted-foreground"
				data-tid="plots_page.main_indexes">Main indexes</Card.Description
			>
		</Card.Header>
		<Card.Content>
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Cell data-tid="table_headers.taxon">Taxon</Table.Cell>
						<Table.Cell data-tid="table_headers.biennio">Biennio</Table.Cell>
						<Table.Cell data-tid="table_headers.richness">Richness</Table.Cell>
						<Table.Cell data-tid="table_headers.abundance">Abundance</Table.Cell
						>
						<Table.Cell data-tid="table_headers.shannon">Shannon</Table.Cell>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each taxonTableData as d}
						<Table.Row key={d.taxon + d.biennio}>
							<Table.Cell>{d.taxon}</Table.Cell>
							<Table.Cell>{d.biennio}</Table.Cell>
							<Table.Cell>{d.richness}</Table.Cell>
							<Table.Cell>{d.abundance.toLocaleString()}</Table.Cell>
							<Table.Cell>{d.shannon.toLocaleString()}</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</Card.Content>
	</Card.Root>
</div>
