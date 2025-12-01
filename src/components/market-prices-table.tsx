import { getMarketPrices } from "@/api/market-prices";
import { MarketPricesDataTable } from "@/components/market-prices-data-table";

export async function MarketPricesTable() {
	const marketPrices = await getMarketPrices();

	return <MarketPricesDataTable data={marketPrices} />;
}

export function MarketPricesTableSkeleton() {
	return <MarketPricesDataTable data={[]} loading={true} />;
}
