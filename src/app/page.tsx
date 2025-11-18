import { Suspense } from "react";
import { HerbSelector } from "@/components/herb-selector";
import { MonsterTable, MonsterTableSkeleton } from "@/components/monster-table";
import { SpoilLevelSelector } from "@/components/spoil-level-selector";

interface PageProps {
	searchParams: Promise<{ spoilLevel?: string; herbs?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
	const resolvedSearchParams = await searchParams;
	const spoilLevelNum = parseInt(resolvedSearchParams.spoilLevel ?? "1", 10) || 1;
	const herbsBool = resolvedSearchParams.herbs === undefined ? true : resolvedSearchParams.herbs === "true";

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-row gap-2">
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
