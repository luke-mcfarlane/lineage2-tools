"use client";

import { Button } from "@/components/ui/button";
import { IconUpload } from "@tabler/icons-react";
import { useCsvUpload } from "@/hooks/use-csv-upload";

export function CsvUploadButton() {
	const { fileInputRef, isUploading, error, handleFileSelect, triggerUpload } = useCsvUpload();

	return (
		<div className="flex flex-col gap-2">
			<input
				ref={fileInputRef}
				type="file"
				accept=".csv"
				onChange={handleFileSelect}
				className="hidden"
			/>
			<Button
				onClick={triggerUpload}
				disabled={isUploading}
				variant="default"
			>
				<IconUpload className="mr-2 size-4" />
				{isUploading ? "Uploading..." : "Upload CSV"}
			</Button>
			{error && (
				<p className="text-sm text-destructive">{error}</p>
			)}
		</div>
	);
}

