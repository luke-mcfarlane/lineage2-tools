import { db } from "@/db/drizzle";
import { items, prices, recipes, recipeIngredients, recipeBaseIngredients } from "@/db/schema";
import { sql, eq, and, notInArray, inArray } from "drizzle-orm";

export const getItemKeys = async () => {
	// Crystal price IDs
	const crystalPriceIds = {
		d: "1458",
		c: "1459",
		b: "1460",
		a: "1461",
		s: "1462",
	};

	// Get all item IDs that have prices
	const pricedItems = await db
		.select({ itemId: prices.itemId })
		.from(prices);

	const pricedItemIds = pricedItems.map((p) => p.itemId);

	if (pricedItemIds.length === 0) {
		return [];
	}

	// Use raw SQL to find recipes where exactly one ingredient is NOT in prices table
	// Build the NOT IN clause safely (escape single quotes)
	const notInClause = pricedItemIds
		.map((id) => `'${String(id).replace(/'/g, "''")}'`)
		.join(", ");
	const recipesWithOneUnpricedIngredient = await db.execute(
		sql.raw(`
			SELECT recipe_id
			FROM recipe_base_ingredients
			GROUP BY recipe_id
			HAVING COUNT(CASE WHEN item_id NOT IN (${notInClause}) THEN 1 END) = 1
		`)
	);

	const recipeIds = recipesWithOneUnpricedIngredient.rows.map(
		(r: any) => r.recipe_id
	);

	if (recipeIds.length === 0) {
		return [];
	}

	// For each recipe, get the key item (the one not in prices) and calculate value
	// Build the IN clauses safely (escape single quotes)
	const inClause = pricedItemIds
		.map((id) => `'${String(id).replace(/'/g, "''")}'`)
		.join(", ");
	const recipeIdsClause = recipeIds
		.map((id) => `'${String(id).replace(/'/g, "''")}'`)
		.join(", ");
	const results = await db.execute(
		sql.raw(`
			SELECT 
				r.recipe_id,
				r.name as recipe_name,
				r.product_item_id,
				r.product_item_name,
				r.product_quantity,
				ri.item_id as key_item_id,
				ri.item_name as key_item_name,
				ri.quantity as key_item_quantity,
				-- Calculate crystal value for product item
				CASE 
					WHEN i.crystal_type IN ('a', 'b', 'c', 'd', 's') AND i.crystal_count IS NOT NULL THEN
						i.crystal_count * COALESCE(
							CASE i.crystal_type
								WHEN 'd' THEN (SELECT price FROM prices WHERE item_id = '${crystalPriceIds.d}')
								WHEN 'c' THEN (SELECT price FROM prices WHERE item_id = '${crystalPriceIds.c}')
								WHEN 'b' THEN (SELECT price FROM prices WHERE item_id = '${crystalPriceIds.b}')
								WHEN 'a' THEN (SELECT price FROM prices WHERE item_id = '${crystalPriceIds.a}')
								WHEN 's' THEN (SELECT price FROM prices WHERE item_id = '${crystalPriceIds.s}')
							END, 0)
					ELSE 0
				END as crystal_value,
				-- Calculate cost of other ingredients (those in prices table)
				-- Use recipe_base_ingredients to get fully expanded ingredient costs
				COALESCE((
					SELECT SUM(rbi.quantity * COALESCE(p.price, 0))
					FROM recipe_base_ingredients rbi
					LEFT JOIN prices p ON rbi.item_id = p.item_id
					WHERE rbi.recipe_id = r.recipe_id
					AND rbi.item_id IN (${inClause})
				), 0) as other_ingredients_cost
			FROM recipes r
			INNER JOIN recipe_base_ingredients ri ON r.recipe_id = ri.recipe_id
				AND ri.item_id NOT IN (${notInClause})
			INNER JOIN items i ON r.product_item_id = i.item_id
			WHERE r.recipe_id IN (${recipeIdsClause})
		`)
	);

	// Calculate final value: (crystal_value - other_ingredients_cost) / key_item_quantity
	return results.rows.map((row: any) => {
		const crystalValue = parseFloat(row.crystal_value) || 0;
		const otherCost = parseFloat(row.other_ingredients_cost) || 0;
		const keyQuantity = parseInt(row.key_item_quantity) || 1;

		const value = keyQuantity > 0 ? (crystalValue - otherCost) / keyQuantity : 0;

		return {
			itemId: row.key_item_id,
			itemName: row.key_item_name || "Unknown",
			recipeId: row.recipe_id,
			recipeName: row.recipe_name,
			productItemId: row.product_item_id,
			productItemName: row.product_item_name,
			productQuantity: parseInt(row.product_quantity) || 1,
			quantity: keyQuantity,
			crystalValue,
			otherIngredientsCost: otherCost,
			value,
		};
	});
};

export type IngredientBreakdown = {
	itemId: string;
	itemName: string;
	quantity: number;
	unitPrice: number;
	totalCost: number;
	isKeyItem: boolean;
};

/**
 * Get item keys values as a map (itemId -> value)
 * This is used for calculating spoil values
 */
export const getItemKeysValueMap = async (): Promise<Map<string, number>> => {
	const itemKeys = await getItemKeys();
	const valueMap = new Map<string, number>();
	
	for (const itemKey of itemKeys) {
		valueMap.set(itemKey.itemId, itemKey.value);
	}
	
	return valueMap;
};

export const getRecipeIngredientBreakdown = async (
	recipeId: string
): Promise<IngredientBreakdown[]> => {
	// Get all item IDs that have prices
	const pricedItems = await db
		.select({ itemId: prices.itemId })
		.from(prices);

	const pricedItemIds = pricedItems.map((p) => p.itemId);

	if (pricedItemIds.length === 0) {
		return [];
	}

	// Build the IN clause safely (escape single quotes)
	const inClause = pricedItemIds
		.map((id) => `'${String(id).replace(/'/g, "''")}'`)
		.join(", ");

	// Get all base ingredients for this recipe with their prices
	const results = await db.execute(
		sql.raw(`
			SELECT 
				rbi.item_id,
				rbi.item_name,
				rbi.quantity,
				COALESCE(p.price, 0) as unit_price,
				CASE WHEN rbi.item_id NOT IN (${inClause}) THEN true ELSE false END as is_key_item
			FROM recipe_base_ingredients rbi
			LEFT JOIN prices p ON rbi.item_id = p.item_id
			WHERE rbi.recipe_id = '${String(recipeId).replace(/'/g, "''")}'
			ORDER BY is_key_item DESC, rbi.item_name ASC
		`)
	);

	return results.rows.map((row: any) => ({
		itemId: row.item_id,
		itemName: row.item_name || "Unknown",
		quantity: parseInt(row.quantity) || 0,
		unitPrice: parseFloat(row.unit_price) || 0,
		totalCost: (parseInt(row.quantity) || 0) * (parseFloat(row.unit_price) || 0),
		isKeyItem: row.is_key_item === true,
	}));
};

