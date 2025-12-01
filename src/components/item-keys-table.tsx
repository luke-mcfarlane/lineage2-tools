import { getItemKeys } from "@/api/item-keys";
import { ItemKeysDataTable } from "@/components/item-keys-data-table";

export async function ItemKeysTable() {
	const itemKeys = await getItemKeys();

	return <ItemKeysDataTable data={itemKeys} />;
}

export function ItemKeysTableSkeleton() {
	return <ItemKeysDataTable data={[]} loading={true} />;
}
