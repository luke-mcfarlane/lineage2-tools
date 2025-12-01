import { NextRequest, NextResponse } from "next/server";
import { getRecipeIngredientBreakdown } from "@/api/item-keys";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ recipeId: string }> }
) {
	try {
		const { recipeId } = await params;
		if (!recipeId) {
			return NextResponse.json(
				{ error: "Recipe ID is required" },
				{ status: 400 }
			);
		}

		const breakdown = await getRecipeIngredientBreakdown(recipeId);
		return NextResponse.json(breakdown);
	} catch (error) {
		console.error("Error fetching ingredient breakdown:", error);
		return NextResponse.json(
			{ error: "Failed to fetch ingredient breakdown" },
			{ status: 500 }
		);
	}
}

