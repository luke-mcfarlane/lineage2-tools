"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";

const headers = {
	"/spoil-calculator": {
		title: "Spoil Calculator",
	},
	"/market-prices": {
		title: "Market Prices",
	},
	"/item-keys": {
		title: "Item Keys",
	},
};

export function SiteHeader() {
	const pathname = usePathname();
	if (
		pathname !== "/spoil-calculator" &&
		pathname !== "/market-prices" &&
		pathname !== "/item-keys"
	) {
		return null;
	}

	const header = headers[pathname];

	return (
		<header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
			<div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
				<SidebarTrigger className="-ml-1" />
				<Separator
					orientation="vertical"
					className="mx-2 data-[orientation=vertical]:h-4"
				/>
				<h1 className="text-base font-medium">{header.title || "L2Tools"}</h1>
			</div>
		</header>
	);
}
