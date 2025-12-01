import {
	ItemKeysTable,
	ItemKeysTableSkeleton,
} from "@/components/item-keys-table";
import { Suspense } from "react";

export default async function Page() {
	return (
		<div className="flex w-full flex-col gap-4">
			<Suspense fallback={<ItemKeysTableSkeleton />}>
				<ItemKeysTable />
			</Suspense>
		</div>
	);
}

