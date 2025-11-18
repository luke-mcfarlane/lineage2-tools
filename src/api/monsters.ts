import { and, eq, gte, lte, ne, sql, sum } from "drizzle-orm";
import { db } from "@/db/drizzle";
import {
	items,
	monsterDrops,
	monsterSpoils,
	monsters,
	prices,
} from "@/db/schema";

const spoilLevelRanges = new Map<number, [number, number]>([
	[1, [5, 15]],
	[2, [16, 25]],
	[3, [24, 33]],
	[4, [32, 41]],
	[5, [40, 47]],
	[6, [46, 53]],
	[7, [52, 59]],
	[8, [57, 64]],
	[9, [62, 67]],
	[10, [66, 71]],
	[11, [70, 75]],
]);

export const getMonsters = async (spoilLevel: number, herbs: boolean) => {
	const dropTotals = db
		.select({
			monsterNpcId: monsterDrops.monsterNpcId,
			total: sum(
				sql`
					round(((monster_drops.min_quantity + monster_drops.max_quantity) / 2) * 
					(monster_drops.drop_chance / 100) * 
					CASE 
						WHEN prices.price IS NOT NULL THEN prices.price
						ELSE GREATEST(
							CASE 
								WHEN items.crystal_type IN ('a', 'b', 'c', 'd', 's') AND items.crystal_count IS NOT NULL THEN
									items.crystal_count * COALESCE(
										CASE items.crystal_type
											WHEN 'd' THEN (SELECT price FROM prices WHERE item_id = '1458')
											WHEN 'c' THEN (SELECT price FROM prices WHERE item_id = '1459')
											WHEN 'b' THEN (SELECT price FROM prices WHERE item_id = '1460')
											WHEN 'a' THEN (SELECT price FROM prices WHERE item_id = '1461')
											WHEN 's' THEN (SELECT price FROM prices WHERE item_id = '1462')
										END, 0)
								ELSE 0
							END,
							items.default_price / 2
						)
					END, 2)
				`,
			).as("total"),
		})
		.from(monsterDrops)
		.innerJoin(items, eq(monsterDrops.itemId, items.itemId))
		.leftJoin(prices, eq(monsterDrops.itemId, prices.itemId))
		.groupBy(monsterDrops.monsterNpcId)
		.as("dropTotals");

	const spoilTotals = db
		.select({
			monsterNpcId: monsterSpoils.monsterNpcId,
			total: sum(
				sql`
					round(((monster_spoils.min_quantity + monster_spoils.max_quantity) / 2) * 
					(monster_spoils.drop_chance / 100) * 
					CASE 
						WHEN prices.price IS NOT NULL THEN prices.price
						ELSE GREATEST(
							CASE 
								WHEN items.crystal_type IN ('a', 'b', 'c', 'd', 's') AND items.crystal_count IS NOT NULL THEN
									items.crystal_count * COALESCE(
										CASE items.crystal_type
											WHEN 'd' THEN (SELECT price FROM prices WHERE item_id = '1458')
											WHEN 'c' THEN (SELECT price FROM prices WHERE item_id = '1459')
											WHEN 'b' THEN (SELECT price FROM prices WHERE item_id = '1460')
											WHEN 'a' THEN (SELECT price FROM prices WHERE item_id = '1461')
											WHEN 's' THEN (SELECT price FROM prices WHERE item_id = '1462')
										END, 0)
								ELSE 0
							END,
							items.default_price / 2
						)
					END, 2)
				`,
			).as("total"),
		})
		.from(monsterSpoils)
		.innerJoin(items, eq(monsterSpoils.itemId, items.itemId))
		.leftJoin(prices, eq(monsterSpoils.itemId, prices.itemId))
		.groupBy(monsterSpoils.monsterNpcId)
		.as("spoilTotals");

	const results = await db
		.select({
			npcId: monsters.npcId,
			name: monsters.name,
			level: monsters.level,
			type: monsters.type,
			orgHp: monsters.orgHp,
			totalDrop: sql<number>`coalesce("dropTotals".total, 0)`,
			totalSpoil: sql<number>`coalesce("spoilTotals".total, 0)`,
			total: sql<number>`coalesce("dropTotals".total, 0) + coalesce("spoilTotals".total, 0)`,
		})
		.from(monsters)
		.leftJoin(dropTotals, eq(monsters.npcId, dropTotals.monsterNpcId))
		.leftJoin(spoilTotals, eq(monsters.npcId, spoilTotals.monsterNpcId))
		.where(
			and(
				gte(monsters.level, spoilLevelRanges.get(spoilLevel)?.[0] ?? 0),
				lte(monsters.level, spoilLevelRanges.get(spoilLevel)?.[1] ?? 0),
				ne(monsters.type, "boss"),
				eq(monsters.herbs, herbs ? 1 : 0),
			),
		)
		.orderBy(
			sql`coalesce("dropTotals".total, 0) + coalesce("spoilTotals".total, 0) DESC`,
		)
		.limit(20);

	return results;
};
