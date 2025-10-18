import { Suspense } from "react";
import { HerbSelector } from "@/components/herb-selector";
import { MonsterTable, MonsterTableSkeleton } from "@/components/monster-table";
import { SpoilLevelSelector } from "@/components/spoil-level-selector";

interface PageProps {
	searchParams: Promise<{ spoilLevel?: string; herbs?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
	const resolvedSearchParams = await searchParams;
	const spoilLevel = parseInt(resolvedSearchParams.spoilLevel ?? "1", 10) || 1;
	const herbs = resolvedSearchParams.herbs === "true";

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-row gap-2">
				<SpoilLevelSelector />
				<HerbSelector />
			</div>

			<Suspense
				key={`${spoilLevel}-${herbs}`}
				fallback={<MonsterTableSkeleton />}
			>
				<MonsterTable spoilLevel={spoilLevel} herbs={herbs} />
			</Suspense>
		</div>
	);
}
