import type { PriceComparisonItem } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowDown, ArrowUp, Minus, MapPin } from 'lucide-react';

type PriceComparisonProps = {
  data: PriceComparisonItem;
  currency: string;
};

export default function PriceComparison({ data, currency }: PriceComparisonProps) {
  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  });

  const priceDiff = data.userUnitPrice - data.minUnitPrice;

  const getPriceDifferenceBadge = () => {
    if (priceDiff > 0) {
      return (
        <Badge variant="destructive" className="text-xs">
          <ArrowDown className="mr-1 h-3 w-3" />
          {currencyFormatter.format(priceDiff)} more
        </Badge>
      );
    }
    if (priceDiff < 0) {
      return (
        <Badge className="bg-green-600 text-xs">
          <ArrowUp className="mr-1 h-3 w-3" />
          {currencyFormatter.format(Math.abs(priceDiff))} less
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="text-xs">
        <Minus className="mr-1 h-3 w-3" />
        Best price
      </Badge>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Your Price</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{currencyFormatter.format(data.userUnitPrice)}</p>
          {getPriceDifferenceBadge()}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Lowest Price Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{currencyFormatter.format(data.minUnitPrice)}</p>
          <p className="text-xs text-muted-foreground">Across all stores</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Average Price</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{currencyFormatter.format(data.avgUnitPrice)}</p>
          <p className="text-xs text-muted-foreground">Community average</p>
        </CardContent>
      </Card>

      {data.cheaperShops.length > 0 && (
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Find it Cheaper Nearby</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {data.cheaperShops.map((shop) => (
                <li key={shop.shopId} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{shop.shopName}</span>
                  </div>
                  <Badge variant="outline" className="font-semibold">{currencyFormatter.format(shop.price)}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
