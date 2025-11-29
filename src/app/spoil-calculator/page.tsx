import { HerbSelector } from "@/components/herb-selector";
import { SpoilLevelSelector } from "@/components/spoil-level-selector";
import { MonsterTableSkeleton } from "@/components/monster-table";
import { MonsterTable } from "@/components/monster-table";
import { Suspense } from "react";

export default async function Page({
	searchParams,
}: {
	searchParams: Promise<{ spoilLevel?: string; herbs?: string }>;
}) {
	const resolvedSearchParams = await searchParams;
	const spoilLevelNum =
		parseInt(resolvedSearchParams.spoilLevel ?? "1", 10) || 1;
	const herbsBool =
		resolvedSearchParams.herbs === undefined
			? true
			: resolvedSearchParams.herbs === "true";

	return (
		<div className="flex w-full flex-col gap-4">
			<div className="flex w-full flex-row gap-2">
				<SpoilLevelSelector />
				<HerbSelector />
			</div>

			<Suspense
				key={`${spoilLevelNum}-${herbsBool}`}
				fallback={<MonsterTableSkeleton />}
			>
				<MonsterTable spoilLevel={spoilLevelNum} herbs={herbsBool} />
			</Suspense>
		</div>
	);
}
