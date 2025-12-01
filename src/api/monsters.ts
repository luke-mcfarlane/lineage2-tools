import { and, eq, gte, lte, ne, sql, sum } from "drizzle-orm";
import { db } from "@/db/drizzle";
import {
	items,
	monsterDrops,
	monsterSpoils,
	monsters,
	prices,
} from "@/db/schema";
import { getItemKeysValueMap } from "@/api/item-keys";

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

// S: top 10%, A: top 20%, B: top 30%, C: top 40%, D: top 50%

export const getMonsters = async (spoilLevel: number, herbs: boolean) => {
	// Get item keys values map
	const itemKeysValueMap = await getItemKeysValueMap();
	
	// Build VALUES clause for item keys (only include items that have values)
	const itemKeysValues = Array.from(itemKeysValueMap.entries())
		.map(([itemId, value]) => `('${String(itemId).replace(/'/g, "''")}', ${value})`)
		.join(", ");
	
	const itemKeysCTE = itemKeysValues.length > 0
		? `WITH item_keys_values AS (
			SELECT * FROM (VALUES ${itemKeysValues}) AS t(item_id, value)
		),`
		: `WITH`;

	const itemKeysJoinDrops = itemKeysValues.length > 0
		? `LEFT JOIN item_keys_values ikv_drops ON md.item_id = ikv_drops.item_id`
		: "";

	const itemKeysJoinSpoils = itemKeysValues.length > 0
		? `LEFT JOIN item_keys_values ikv_spoils ON ms.item_id = ikv_spoils.item_id`
		: "";

	const itemKeysValueSelectDrops = itemKeysValues.length > 0
		? `COALESCE(ikv_drops.value, 0)`
		: `0`;

	const itemKeysValueSelectSpoils = itemKeysValues.length > 0
		? `COALESCE(ikv_spoils.value, 0)`
		: `0`;

	const [minLevel, maxLevel] = spoilLevelRanges.get(spoilLevel) ?? [0, 0];
	const herbsValue = herbs ? 1 : 0;

	// Use raw SQL for the entire query to support CTEs
	const results = await db.execute(
		sql.raw(`
			${itemKeysCTE}
			drop_totals AS (
				SELECT 
					md.monster_npc_id,
					SUM(
						ROUND(((md.min_quantity + md.max_quantity) / 2.0) * 
						(md.drop_chance / 100.0) * 
						CASE 
							WHEN p.price IS NOT NULL THEN p.price
							ELSE GREATEST(
								CASE 
									WHEN i.crystal_type IN ('a', 'b', 'c', 'd', 's') AND i.crystal_count IS NOT NULL THEN
										i.crystal_count * COALESCE(
											CASE i.crystal_type
												WHEN 'd' THEN (SELECT price FROM prices WHERE item_id = '1458')
												WHEN 'c' THEN (SELECT price FROM prices WHERE item_id = '1459')
												WHEN 'b' THEN (SELECT price FROM prices WHERE item_id = '1460')
												WHEN 'a' THEN (SELECT price FROM prices WHERE item_id = '1461')
												WHEN 's' THEN (SELECT price FROM prices WHERE item_id = '1462')
											END, 0)
									ELSE 0
								END,
								i.default_price / 2,
								${itemKeysValueSelectDrops}
							)
						END, 2)
					) as total
				FROM monster_drops md
				INNER JOIN items i ON md.item_id = i.item_id
				LEFT JOIN prices p ON md.item_id = p.item_id
				${itemKeysJoinDrops}
				GROUP BY md.monster_npc_id
			),
			spoil_totals AS (
				SELECT 
					ms.monster_npc_id,
					SUM(
						ROUND(((ms.min_quantity + ms.max_quantity) / 2.0) * 
						(ms.drop_chance / 100.0) * 
						CASE 
							WHEN p.price IS NOT NULL THEN p.price
							ELSE GREATEST(
								CASE 
									WHEN i.crystal_type IN ('a', 'b', 'c', 'd', 's') AND i.crystal_count IS NOT NULL THEN
										i.crystal_count * COALESCE(
											CASE i.crystal_type
												WHEN 'd' THEN (SELECT price FROM prices WHERE item_id = '1458')
												WHEN 'c' THEN (SELECT price FROM prices WHERE item_id = '1459')
												WHEN 'b' THEN (SELECT price FROM prices WHERE item_id = '1460')
												WHEN 'a' THEN (SELECT price FROM prices WHERE item_id = '1461')
												WHEN 's' THEN (SELECT price FROM prices WHERE item_id = '1462')
											END, 0)
									ELSE 0
								END,
								i.default_price / 2,
								${itemKeysValueSelectSpoils}
							)
						END, 2)
					) as total
				FROM monster_spoils ms
				INNER JOIN items i ON ms.item_id = i.item_id
				LEFT JOIN prices p ON ms.item_id = p.item_id
				${itemKeysJoinSpoils}
				GROUP BY ms.monster_npc_id
			)
			SELECT 
				m.npc_id,
				m.name,
				m.level,
				m.type,
				COALESCE(dt.total, 0) as total_drop,
				COALESCE(st.total, 0) as total_spoil,
				COALESCE(dt.total, 0) + COALESCE(st.total, 0) as total
			FROM monsters m
			LEFT JOIN drop_totals dt ON m.npc_id = dt.monster_npc_id
			LEFT JOIN spoil_totals st ON m.npc_id = st.monster_npc_id
			WHERE m.level >= ${minLevel}
				AND m.level <= ${maxLevel}
				AND m.type != 'boss'
				AND m.herbs = ${herbsValue}
			ORDER BY COALESCE(dt.total, 0) + COALESCE(st.total, 0) DESC
			LIMIT 20
		`)
	);

	return results.rows.map((row: any) => ({
		npcId: row.npc_id,
		name: row.name,
		level: row.level,
		type: row.type,
		totalDrop: parseFloat(row.total_drop) || 0,
		totalSpoil: parseFloat(row.total_spoil) || 0,
		total: parseFloat(row.total) || 0,
	}));
};
