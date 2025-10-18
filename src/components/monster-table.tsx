import { getMonsters } from "@/api/monsters";
import { DataTable } from "@/components/data-table";

interface MonsterTableProps {
	spoilLevel: number;
	herbs: boolean;
}

export async function MonsterTable({ spoilLevel, herbs }: MonsterTableProps) {
	const monsters = await getMonsters(spoilLevel, herbs);

	return <DataTable data={monsters} />;
}

export function MonsterTableSkeleton() {
	return <DataTable data={[]} />;
}
