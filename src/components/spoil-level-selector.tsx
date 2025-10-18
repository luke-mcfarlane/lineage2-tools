"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export function SpoilLevelSelector() {
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const { replace } = useRouter();

	const handleSpoilLevelChange = (value: string) => {
		const params = new URLSearchParams(searchParams);
		params.set("spoilLevel", value);
		replace(`${pathname}?${params.toString()}`);
	};

	return (
		<div className="flex pl-6">
			<Select
				defaultValue={searchParams.get("spoilLevel")?.toString()}
				onValueChange={handleSpoilLevelChange}
			>
				<SelectTrigger>
					<SelectValue placeholder="Select spoiler level" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="1">10-19 Spoil Level 1</SelectItem>
					<SelectItem value="2">20-27 Spoil Level 2</SelectItem>
					<SelectItem value="3">28-35 Spoil Level 3</SelectItem>
					<SelectItem value="4">36-42 Spoil Level 4</SelectItem>
					<SelectItem value="5">43-48 Spoil Level 5</SelectItem>
					<SelectItem value="6">49-54 Spoil Level 6</SelectItem>
					<SelectItem value="7">55-59 Spoil Level 7</SelectItem>
					<SelectItem value="8">60-63 Spoil Level 8</SelectItem>
					<SelectItem value="9">64-67 Spoil Level 9</SelectItem>
					<SelectItem value="10">68-71 Spoil Level 10</SelectItem>
					<SelectItem value="11">72-80 Spoil Level 11</SelectItem>
				</SelectContent>
			</Select>
		</div>
	);
}
