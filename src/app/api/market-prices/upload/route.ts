import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { prices, items } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		const file = formData.get("file") as File;

		if (!file) {
			return NextResponse.json(
				{ error: "No file provided" },
				{ status: 400 },
			);
		}

		// Read and parse CSV
		const text = await file.text();
		const lines = text.split("\n").filter((line) => line.trim());
		
		if (lines.length === 0) {
			return NextResponse.json(
				{ error: "CSV file is empty" },
				{ status: 400 },
			);
		}

		// Parse CSV (format: itemId,price,date,server with optional header)
		// Detect header row and determine column indices
		const firstLine = lines[0]?.toLowerCase() || "";
		const hasHeader = firstLine.includes("itemid") || firstLine.includes("item_id");
		let itemIdIndex = 0;
		let priceIndex = 1;
		let dateIndex = -1;
		let serverIndex = -1;

		if (hasHeader) {
			const headerValues = firstLine.split(",").map((val) => val.trim().replace(/^"|"$/g, ""));
			itemIdIndex = headerValues.findIndex((val) => val.includes("itemid") || val.includes("item_id"));
			priceIndex = headerValues.findIndex((val) => val.includes("price"));
			dateIndex = headerValues.findIndex((val) => val.includes("date"));
			serverIndex = headerValues.findIndex((val) => val.includes("server"));
			
			// Fallback to default positions if not found in header
			if (itemIdIndex === -1) itemIdIndex = 0;
			if (priceIndex === -1) priceIndex = 1;
		} else {
			// If no header, assume format: itemId,price,date,server
			// Check if we have at least 4 columns
			const firstRowValues = lines[0]?.split(",") || [];
			if (firstRowValues.length >= 4) {
				dateIndex = 2;
				serverIndex = 3;
			} else if (firstRowValues.length === 3) {
				// Could be itemId,price,date or itemId,price,server
				// Try to detect by checking if 3rd column looks like a date
				const thirdValue = firstRowValues[2]?.trim().replace(/^"|"$/g, "") || "";
				if (thirdValue.match(/^\d{4}-\d{2}-\d{2}/) || thirdValue.match(/^\d{2}\/\d{2}\/\d{4}/)) {
					dateIndex = 2;
				} else {
					serverIndex = 2;
				}
			}
		}

		const rows: Array<{ itemId: string; price: string; date?: string; server?: string }> = [];
		
		for (let i = hasHeader ? 1 : 0; i < lines.length; i++) {
			const line = lines[i].trim();
			if (!line) continue;

			// Parse CSV line (handle quoted values)
			const values = line.split(",").map((val) => val.trim().replace(/^"|"$/g, ""));
			
			if (values.length < 2) {
				continue;
			}

			const itemId = values[itemIdIndex];
			const price = values[priceIndex];
			const date = dateIndex >= 0 && values[dateIndex] ? values[dateIndex] : undefined;
			const server = serverIndex >= 0 && values[serverIndex] ? values[serverIndex] : undefined;

			if (!itemId || !price) {
				continue;
			}

			// Validate price is a number
			const priceNum = parseFloat(price);
			if (isNaN(priceNum) || priceNum < 0) {
				continue;
			}

			// Validate date format if provided (accept YYYY-MM-DD or MM/DD/YYYY)
			let formattedDate: string | undefined = undefined;
			if (date) {
				// Try to parse and format date
				const dateStr = date.trim();
				if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
					formattedDate = dateStr;
				} else if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}/)) {
					// Convert MM/DD/YYYY to YYYY-MM-DD
					const [month, day, year] = dateStr.split("/");
					formattedDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
				} else {
					// Try to parse as Date and format
					const parsedDate = new Date(dateStr);
					if (!isNaN(parsedDate.getTime())) {
						formattedDate = parsedDate.toISOString().split("T")[0];
					}
				}
			}

			rows.push({ 
				itemId, 
				price: priceNum.toString(),
				date: formattedDate,
				server: server?.trim() || undefined,
			});
		}

		if (rows.length === 0) {
			return NextResponse.json(
				{ error: "No valid rows found in CSV" },
				{ status: 400 },
			);
		}

		// Validate that all itemIds exist in the items table
		const itemIds = rows.map((row) => row.itemId);
		const existingItems = await db
			.select({ itemId: items.itemId })
			.from(items)
			.where(inArray(items.itemId, itemIds));

		const existingItemIds = new Set(existingItems.map((item) => item.itemId));
		const invalidItemIds = itemIds.filter((id) => !existingItemIds.has(id));

		if (invalidItemIds.length > 0) {
			return NextResponse.json(
				{
					error: `The following item IDs do not exist in the items table: ${invalidItemIds.slice(0, 10).join(", ")}${invalidItemIds.length > 10 ? ` and ${invalidItemIds.length - 10} more` : ""}`,
				},
				{ status: 400 },
			);
		}

		// Insert or update prices
		let inserted = 0;
		let updated = 0;

		for (const row of rows) {
			// Build the price data object
			const priceData: {
				itemId: string;
				price: string;
				updatedAt: string;
				date?: string;
				server?: string;
			} = {
				itemId: row.itemId,
				price: row.price,
				updatedAt: new Date().toISOString(),
			};

			if (row.date) {
				priceData.date = row.date;
			}
			if (row.server) {
				priceData.server = row.server;
			}

			// Insert new price (we'll always insert to maintain history)
			await db.insert(prices).values(priceData);
			inserted++;
		}

		return NextResponse.json({
			success: true,
			inserted,
			updated,
			total: rows.length,
		});
	} catch (error) {
		console.error("Error uploading CSV:", error);
		return NextResponse.json(
			{ error: "Failed to process CSV file" },
			{ status: 500 },
		);
	}
}

