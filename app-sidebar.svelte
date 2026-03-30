<script>
	//@ts-nocheck
	import { runeStoreTaxCards } from '$lib/stores/svelte5_stores/RuneStoreTaxCards.svelte.js';
	import SidenavIconsData from './sidebar-data.js';
	import SidebarLateralGroupContents from './SidebarLateralGroupContents.svelte';
	import { runeStore } from '$lib/stores/svelte5_stores/RunesStore.svelte.js';

	import NavUser from './nav-user.svelte';
	import { Label } from '$lib/components/ui/label/index.js';
	import { useSidebar } from '$lib/components/ui/sidebar/context.svelte.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import CommandIcon from '@lucide/svelte/icons/command';
	import pngpIcon from '/src/static/images/pngp_icon.svg';
	import AppSidebarIcons from './app-sidebar-icons.svelte';
	import { tax_data_joined_store } from '$lib/stores/test.svelte.js';

	import { watch } from 'runed';
	let spCount = $derived.by(() => {
		return runeStoreTaxCards.spAddedToListIds;
	});
	let viewAsGallery = $derived(runeStoreTaxCards.viewAsGallery);

	let { ref = $bindable(null), ...restProps } = $props();

	//the object of the active item

	//$state('');
	//the index of the active item

	// Make navMain reactive
	let navMain = $state(SidenavIconsData.navMain);
	let activeIndex = $derived(navMain.findIndex((item) => item.isActive));
	let activeItem = $derived(navMain[activeIndex]);

	//$state(SidenavIconsData.navMain[activeIndex]);

	//the object of the hovered item
	let hoveredItem = $state('');
	//the index of the hovered item
	let hoveredIndex = $state('');

	//let mails = $state(SidenavIconsData.mails);
	const sidebar = useSidebar();

	$effect(() => {
		//console.log(`Sidebar effect. activeItem: ${JSON.stringify(activeItem)}`);
		if (activeItem) {
			activeItem.isActive = true;
			runeStore.activeItem = activeItem;
			runeStoreTaxCards.activeItem = activeItem;
			runeStoreTaxCards.basicData.activeItem = activeItem;
			console.log(`Set runeStore.activeItem to: ${JSON.stringify(activeItem)}`);
		} else {
			console.warn('activeItem is null/undefined in sidebar');
		}
	});

	function handleMenuButtonClick(item, i) {
		activeItem = item;
		activeIndex = i;
		sidebar.setOpen(true);
	}
	function handleMenuButtonMouseEnter(item, i) {
		hoveredIndex = i;
		item.isHovered = true;
		hoveredItem = item;
	}
	function handleMenuButtonMouseLeave(item, i) {
		hoveredIndex = null;
		//console.log("onmouseleave", item.title);
		item.isHovered = false;
		hoveredItem = item;
	}

	$effect(() => {
		/* console.log("hoveredIndex", hoveredIndex);
		console.log("activeItem", activeItem);
		console.log("activeIndex", activeIndex); */
	});
</script>

<div class="overflow-hidden {viewAsGallery.active ? 'hidden' : ''}">
	<Sidebar.Root
		bind:ref
		collapsible="icon"
		class="overflow-hidden [&>[data-sidebar=sidebar]]:flex-row {viewAsGallery
			? 'hidden'
			: ''}"
		{...restProps}
	>
		<!-- This is the first sidebar -->
		<!-- We disable collapsible and adjust width to icon. -->
		<!-- This will make the sidebar appear as icons. -->
		<Sidebar.Root
			collapsible="none"
			class="w-fit h-fit {viewAsGallery.active ? 'hidden' : ''}"
		>
			<Sidebar.Header class=" size-fit gap-0">
				<Sidebar.Menu>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton class="md:p-0 mt-1">
							{#snippet child({ props })}
								<a href="##" {...props}>
									<div
										class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-12 items-center justify-center rounded-lg"
									>
										<img src={pngpIcon} alt="PNGP Icon" class="" />
									</div>
									<!-- <div class="grid flex-1 text-left text-sm leading-tight">
									<span class="truncate font-light">PNGP</span>

								</div> -->
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				</Sidebar.Menu>
			</Sidebar.Header>
			<Sidebar.Content>
				<Sidebar.Group class="w-full p-1">
					<Sidebar.GroupContent class="px-1 md:px-0">
						<Sidebar.Menu>
							<AppSidebarIcons
								SidenavIconsData={{ ...SidenavIconsData, navMain }}
								{activeIndex}
								{hoveredIndex}
								onMenuButtonClick={handleMenuButtonClick}
								onMenuButtonMouseEnter={handleMenuButtonMouseEnter}
								onMenuButtonMouseLeave={handleMenuButtonMouseLeave}
							/>
						</Sidebar.Menu>
					</Sidebar.GroupContent>
				</Sidebar.Group>
			</Sidebar.Content>
			<!-- <Sidebar.Footer>
			<NavUser user={data.user} />
		</Sidebar.Footer> -->
		</Sidebar.Root>

		<!-- This is the second sidebar -->
		<!-- We disable collapsible and let it fill remaining space -->
		<Sidebar.Root
			collapsible="none"
			class="hidden flex-1 md:flex {viewAsGallery ? 'hidden' : ''}"
		>
			<!-- <Sidebar.Header class="p-7">

		  </Sidebar.Header> -->
			<Sidebar.Content class="min-h-0 overflow-x-hidden overflow-y-auto">
				<Sidebar.Group class="flex min-h-0 flex-1 flex-col px-0">
					<Sidebar.GroupContent class="flex min-h-0 flex-1 flex-col">
						<SidebarLateralGroupContents {SidenavIconsData} {activeItem} />
					</Sidebar.GroupContent>
				</Sidebar.Group>
			</Sidebar.Content>
		</Sidebar.Root>
	</Sidebar.Root>
</div>
