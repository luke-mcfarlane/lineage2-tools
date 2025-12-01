import { db } from "@/db/drizzle";
import { items, prices } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export const getMarketPrices = async () => {
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

	return results.map((row) => ({
		itemId: row.itemId,
		name: row.name,
		price: typeof row.price === "string" ? parseFloat(row.price) : row.price,
		updatedAt: row.updatedAt || new Date().toISOString(),
	}));
};
