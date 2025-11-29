import { relations } from "drizzle-orm/relations";
import { monsters, monsterDrops, items, monsterSpoils, monsterHerbs, prices } from "./schema";

export const monsterDropsRelations = relations(monsterDrops, ({one}) => ({
	monster: one(monsters, {
		fields: [monsterDrops.monsterNpcId],
		references: [monsters.npcId]
	}),
	item: one(items, {
		fields: [monsterDrops.itemId],
		references: [items.itemId]
	}),
}));

export const monstersRelations = relations(monsters, ({many}) => ({
	monsterDrops: many(monsterDrops),
	monsterSpoils: many(monsterSpoils),
	monsterHerbs: many(monsterHerbs),
}));

export const itemsRelations = relations(items, ({many}) => ({
	monsterDrops: many(monsterDrops),
	monsterSpoils: many(monsterSpoils),
	monsterHerbs: many(monsterHerbs),
	prices: many(prices),
}));

export const monsterSpoilsRelations = relations(monsterSpoils, ({one}) => ({
	monster: one(monsters, {
		fields: [monsterSpoils.monsterNpcId],
		references: [monsters.npcId]
	}),
	item: one(items, {
		fields: [monsterSpoils.itemId],
		references: [items.itemId]
	}),
}));

export const monsterHerbsRelations = relations(monsterHerbs, ({one}) => ({
	monster: one(monsters, {
		fields: [monsterHerbs.monsterNpcId],
		references: [monsters.npcId]
	}),
	item: one(items, {
		fields: [monsterHerbs.itemId],
		references: [items.itemId]
	}),
}));

export const pricesRelations = relations(prices, ({one}) => ({
	item: one(items, {
		fields: [prices.itemId],
		references: [items.itemId]
	}),
}));