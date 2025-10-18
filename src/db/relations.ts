import { relations } from "drizzle-orm/relations";
import {
	items,
	monsterDrops,
	monsterHerbs,
	monsterSpoils,
	monsters,
} from "./schema";

export const monsterDropsRelations = relations(monsterDrops, ({ one }) => ({
	monster: one(monsters, {
		fields: [monsterDrops.monsterNpcId],
		references: [monsters.npcId],
	}),
	item: one(items, {
		fields: [monsterDrops.itemId],
		references: [items.itemId],
	}),
}));

export const monstersRelations = relations(monsters, ({ many }) => ({
	monsterDrops: many(monsterDrops),
	monsterSpoils: many(monsterSpoils),
	monsterHerbs: many(monsterHerbs),
}));

export const itemsRelations = relations(items, ({ many }) => ({
	monsterDrops: many(monsterDrops),
	monsterSpoils: many(monsterSpoils),
	monsterHerbs: many(monsterHerbs),
}));

export const monsterSpoilsRelations = relations(monsterSpoils, ({ one }) => ({
	monster: one(monsters, {
		fields: [monsterSpoils.monsterNpcId],
		references: [monsters.npcId],
	}),
	item: one(items, {
		fields: [monsterSpoils.itemId],
		references: [items.itemId],
	}),
}));

export const monsterHerbsRelations = relations(monsterHerbs, ({ one }) => ({
	monster: one(monsters, {
		fields: [monsterHerbs.monsterNpcId],
		references: [monsters.npcId],
	}),
	item: one(items, {
		fields: [monsterHerbs.itemId],
		references: [items.itemId],
	}),
}));
