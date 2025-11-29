import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { items, prices } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
	try {
		const results = await db
			.select({
				itemId: prices.itemId,
				price: prices.price,
				updatedAt: prices.updatedAt,
				name: items.name,
			})
			.from(prices)
			.innerJoin(items, eq(prices.itemId, items.itemId))
			.orderBy(desc(prices.updatedAt))
			.limit(1000);

		const formattedResults = results.map((row) => ({
			itemId: row.itemId,
			name: row.name,
			price: typeof row.price === "string" ? parseFloat(row.price) : row.price,
			updatedAt: row.updatedAt,
		}));

		return NextResponse.json(formattedResults);
	} catch (error) {
		console.error("Error fetching market prices:", error);
		return NextResponse.json(
			{ error: "Failed to fetch market prices" },
			{ status: 500 },
		);
	}
}

