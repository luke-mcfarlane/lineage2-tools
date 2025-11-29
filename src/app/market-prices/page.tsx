import {
	MarketPricesTable,
	MarketPricesTableSkeleton,
} from "@/components/market-prices-table";
import { Suspense } from "react";
import { db } from "@/db/drizzle";
import { items, prices } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export default async function Page() {
	const results = await db
		.select({
			itemId: prices.itemId,
			price: prices.price,
			updatedAt: prices.updatedAt,
			name: items.name,
		})
		.from(prices)
		.innerJoin(items, eq(prices.itemId, items.itemId))
		.orderBy(asc(items.name));

	const data = results.map((row) => ({
		itemId: row.itemId,
		name: row.name,
		price: typeof row.price === "string" ? parseFloat(row.price) : row.price,
		updatedAt: row.updatedAt || new Date().toISOString(),
	}));

	return (
		<div className="flex w-full flex-col gap-4">
			<Suspense fallback={<MarketPricesTableSkeleton />}>
				<MarketPricesTable data={data} />
			</Suspense>
		</div>
	);
}
