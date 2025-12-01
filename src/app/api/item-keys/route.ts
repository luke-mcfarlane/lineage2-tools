import { NextRequest, NextResponse } from "next/server";
import { getItemKeys } from "@/api/item-keys";

export async function GET(request: NextRequest) {
	try {
		const itemKeys = await getItemKeys();
		return NextResponse.json(itemKeys);
	} catch (error) {
		console.error("Error fetching item keys:", error);
		return NextResponse.json(
			{ error: "Failed to fetch item keys" },
			{ status: 500 }
		);
	}
}

