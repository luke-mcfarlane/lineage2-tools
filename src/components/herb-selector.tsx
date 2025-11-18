"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export function HerbSelector() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const handleHerbChange = (value: string) => {
		const params = new URLSearchParams(searchParams);
		params.set("herbs", value);
		router.push(`?${params.toString()}`);
		router.refresh();
	};

	const currentHerbs = searchParams.get("herbs") || "true";

	return (
		<Select value={currentHerbs} onValueChange={handleHerbChange}>
			<SelectTrigger>
				<SelectValue placeholder="Select herb option" />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="true">Drops Herbs</SelectItem>
				<SelectItem value="false">No Herbs</SelectItem>
			</SelectContent>
		</Select>
	);
}
