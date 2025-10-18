"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

/**
 * Example component demonstrating the caching system
 * This shows how the cache automatically invalidates when prices are updated
 */
export function CacheExample() {
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState("");

	const testCacheInvalidation = async () => {
		setIsLoading(true);
		setMessage("Testing cache invalidation...");

		try {
			// Update a price to trigger cache invalidation
			const response = await fetch("/api/prices", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					itemId: "test-item-123",
					price: Math.floor(Math.random() * 10000) + 1000, // Random price
				}),
			});

			if (response.ok) {
				setMessage(
					"✅ Price updated successfully! Cache has been invalidated.",
				);
			} else {
				setMessage("❌ Failed to update price");
			}
		} catch (error) {
			setMessage("❌ Error updating price");
			console.error("Error:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const manualCacheInvalidation = async () => {
		setIsLoading(true);
		setMessage("Manually invalidating cache...");

		try {
			const response = await fetch("/api/cache/invalidate", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					tag: "monster-data",
				}),
			});

			if (response.ok) {
				setMessage("✅ Cache invalidated successfully!");
			} else {
				setMessage("❌ Failed to invalidate cache");
			}
		} catch (error) {
			setMessage("❌ Error invalidating cache");
			console.error("Error:", error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Card className="w-full max-w-md">
			<CardHeader>
				<CardTitle>Cache System Demo</CardTitle>
				<CardDescription>
					Test the automatic cache invalidation system
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<Button
						onClick={testCacheInvalidation}
						disabled={isLoading}
						className="w-full"
					>
						{isLoading ? "Updating..." : "Update Price (Auto Invalidate)"}
					</Button>

					<Button
						onClick={manualCacheInvalidation}
						disabled={isLoading}
						variant="outline"
						className="w-full"
					>
						{isLoading ? "Invalidating..." : "Manual Cache Invalidation"}
					</Button>
				</div>

				{message && (
					<div className="p-3 rounded-md bg-muted text-sm">{message}</div>
				)}

				<div className="text-xs text-muted-foreground space-y-1">
					<p>• Updating prices automatically invalidates monster caches</p>
					<p>• All users will see updated data immediately</p>
					<p>• Cache persists until prices change</p>
				</div>
			</CardContent>
		</Card>
	);
}
