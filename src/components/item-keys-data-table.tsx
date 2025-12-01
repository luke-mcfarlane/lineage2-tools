"use client";

import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type SortingState,
	type ColumnFiltersState,
	useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import {
	IconChevronLeft,
	IconChevronRight,
	IconChevronsLeft,
	IconChevronsRight,
	IconSearch,
} from "@tabler/icons-react";
import type { IngredientBreakdown } from "@/api/item-keys";

export type ItemKey = {
	itemId: string;
	itemName: string;
	recipeId: string;
	recipeName: string;
	productItemId: string;
	productItemName: string;
	productQuantity: number;
	quantity: number;
	crystalValue: number;
	otherIngredientsCost: number;
	value: number;
};

const columns: ColumnDef<ItemKey>[] = [
	{
		accessorKey: "itemId",
		header: "Item ID",
		cell: ({ row }) => row.original.itemId,
	},
	{
		accessorKey: "itemName",
		header: "Item Name",
		cell: ({ row }) => row.original.itemName || "Unknown",
	},
	{
		accessorKey: "productItemName",
		header: "Product",
		cell: ({ row }) => row.original.productItemName || "Unknown",
	},
	{
		accessorKey: "quantity",
		header: "Quantity",
		cell: ({ row }) => row.original.quantity,
	},
	{
		accessorKey: "crystalValue",
		header: "Crystal Value",
		cell: ({ row }) => {
			const value = row.original.crystalValue;
			return value.toLocaleString("en-US", {
				minimumFractionDigits: 0,
				maximumFractionDigits: 0,
			});
		},
	},
	{
		accessorKey: "otherIngredientsCost",
		header: "Other Ingredients Cost",
		cell: ({ row }) => {
			const value = row.original.otherIngredientsCost;
			return value.toLocaleString("en-US", {
				minimumFractionDigits: 0,
				maximumFractionDigits: 0,
			});
		},
	},
	{
		accessorKey: "value",
		header: "Value per Item",
		cell: ({ row }) => {
			const value = row.original.value;
			return value.toLocaleString("en-US", {
				minimumFractionDigits: 0,
				maximumFractionDigits: 0,
			});
		},
	},
];

export function ItemKeysDataTable({
	data: initialData,
	loading = false,
}: {
	data: ItemKey[];
	loading?: boolean;
}) {
	const [data] = useState(() => initialData);
	const [sorting, setSorting] = useState<SortingState>([
		{ id: "value", desc: true },
	]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [selectedItem, setSelectedItem] = useState<ItemKey | null>(null);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [ingredientBreakdown, setIngredientBreakdown] = useState<
		IngredientBreakdown[]
	>([]);
	const [isLoadingBreakdown, setIsLoadingBreakdown] = useState(false);

	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
			columnFilters,
		},
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		initialState: {
			pagination: {
				pageSize: 10,
			},
		},
	});

	const handleRowClick = async (item: ItemKey) => {
		setSelectedItem(item);
		setIsDrawerOpen(true);
		setIsLoadingBreakdown(true);

		try {
			const response = await fetch(
				`/api/item-keys/${item.recipeId}/breakdown`
			);
			if (!response.ok) {
				throw new Error("Failed to fetch ingredient breakdown");
			}
			const breakdown = await response.json();
			setIngredientBreakdown(breakdown);
		} catch (error) {
			console.error("Error fetching ingredient breakdown:", error);
			setIngredientBreakdown([]);
		} finally {
			setIsLoadingBreakdown(false);
		}
	};

	return (
		<div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
			<div className="flex items-center gap-2">
				<div className="relative flex-1 max-w-sm">
					<IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search by item name..."
						value={(table.getColumn("itemName")?.getFilterValue() as string) ?? ""}
						onChange={(event) =>
							table.getColumn("itemName")?.setFilterValue(event.target.value)
						}
						className="pl-9"
					/>
				</div>
			</div>
			<div className="overflow-hidden rounded-lg border">
				<Table>
					<TableHeader className="bg-muted sticky top-0 z-10">
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext()
												)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{loading ? (
							Array.from({ length: 10 }, (_, index) => (
								<TableRow key={`skeleton-row-${index + 1}`}>
									<TableCell>
										<Skeleton className="h-5 w-32" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-5 w-48" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-5 w-48" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-5 w-24" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-5 w-32" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-5 w-32" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-5 w-32" />
									</TableCell>
								</TableRow>
							))
						) : table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									onClick={() => handleRowClick(row.original)}
									className="cursor-pointer hover:bg-muted/50 transition-colors"
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext()
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
								>
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<div className="flex items-center justify-end px-4">
				<div className="flex w-full items-center gap-8 lg:w-fit">
					<div className="flex w-fit items-center justify-center text-sm font-medium">
						Page {table.getState().pagination.pageIndex + 1} of{" "}
						{table.getPageCount()}
					</div>
					<div className="ml-auto flex items-center gap-2 lg:ml-0">
						<Button
							variant="outline"
							className="hidden h-8 w-8 p-0 lg:flex"
							onClick={() => table.setPageIndex(0)}
							disabled={!table.getCanPreviousPage()}
						>
							<span className="sr-only">Go to first page</span>
							<IconChevronsLeft />
						</Button>
						<Button
							variant="outline"
							className="size-8"
							size="icon"
							onClick={() => table.previousPage()}
							disabled={!table.getCanPreviousPage()}
						>
							<span className="sr-only">Go to previous page</span>
							<IconChevronLeft />
						</Button>
						<Button
							variant="outline"
							className="size-8"
							size="icon"
							onClick={() => table.nextPage()}
							disabled={!table.getCanNextPage()}
						>
							<span className="sr-only">Go to next page</span>
							<IconChevronRight />
						</Button>
						<Button
							variant="outline"
							className="hidden size-8 lg:flex"
							size="icon"
							onClick={() => table.setPageIndex(table.getPageCount() - 1)}
							disabled={!table.getCanNextPage()}
						>
							<span className="sr-only">Go to last page</span>
							<IconChevronsRight />
						</Button>
					</div>
				</div>
			</div>

			<Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
				<DrawerContent className="max-h-[80vh]">
					<DrawerHeader>
						<DrawerTitle>
							{selectedItem?.itemName || "Ingredient Breakdown"}
						</DrawerTitle>
						<DrawerDescription>
							Recipe: {selectedItem?.recipeName}
							<br />
							Product: {selectedItem?.productItemName} (x
							{selectedItem?.productQuantity})
						</DrawerDescription>
					</DrawerHeader>
					<div className="overflow-y-auto px-4 pb-4">
						{isLoadingBreakdown ? (
							<div className="flex items-center justify-center py-8">
								<Skeleton className="h-8 w-full max-w-md" />
							</div>
						) : ingredientBreakdown.length === 0 ? (
							<div className="text-center py-8 text-muted-foreground">
								No ingredient data available
							</div>
						) : (
							<div className="space-y-2">
								<div className="rounded-lg border">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Ingredient</TableHead>
												<TableHead className="text-right">Quantity</TableHead>
												<TableHead className="text-right">Unit Price</TableHead>
												<TableHead className="text-right">Total Cost</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{ingredientBreakdown.map((ingredient, index) => (
												<TableRow
													key={`${ingredient.itemId}-${index}`}
													className={
														ingredient.isKeyItem
															? "bg-muted/50 font-medium"
															: ""
													}
												>
													<TableCell>
														{ingredient.itemName}
														{ingredient.isKeyItem && (
															<span className="ml-2 text-xs text-muted-foreground">
																(Key Item)
															</span>
														)}
													</TableCell>
													<TableCell className="text-right">
														{ingredient.quantity.toLocaleString()}
													</TableCell>
													<TableCell className="text-right">
														{ingredient.unitPrice > 0
															? ingredient.unitPrice.toLocaleString("en-US", {
																	minimumFractionDigits: 0,
																	maximumFractionDigits: 0,
																})
															: "—"}
													</TableCell>
													<TableCell className="text-right">
														{ingredient.totalCost > 0
															? ingredient.totalCost.toLocaleString("en-US", {
																	minimumFractionDigits: 0,
																	maximumFractionDigits: 0,
																})
															: "—"}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
								<div className="mt-4 rounded-lg border bg-muted/30 p-4">
									<div className="flex justify-between items-center">
										<span className="font-medium">Total Ingredients Cost:</span>
										<span className="font-semibold">
											{ingredientBreakdown
												.reduce((sum, ing) => sum + ing.totalCost, 0)
												.toLocaleString("en-US", {
													minimumFractionDigits: 0,
													maximumFractionDigits: 0,
												})}
										</span>
									</div>
									{selectedItem && (
										<div className="flex justify-between items-center mt-2 text-sm text-muted-foreground">
											<span>Crystal Value:</span>
											<span>
												{selectedItem.crystalValue.toLocaleString("en-US", {
													minimumFractionDigits: 0,
													maximumFractionDigits: 0,
												})}
											</span>
										</div>
									)}
								</div>
							</div>
						)}
					</div>
					<DrawerFooter>
						<DrawerClose asChild>
							<Button variant="outline">Close</Button>
						</DrawerClose>
					</DrawerFooter>
				</DrawerContent>
			</Drawer>
		</div>
	);
}

