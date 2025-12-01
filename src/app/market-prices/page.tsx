import {
	MarketPricesTable,
	MarketPricesTableSkeleton,
} from "@/components/market-prices-table";
import { Suspense } from "react";

export default async function Page() {
	return (
		<div className="flex w-full flex-col gap-4">
			<Suspense fallback={<MarketPricesTableSkeleton />}>
				<MarketPricesTable />
			</Suspense>
		</div>
	);
}
