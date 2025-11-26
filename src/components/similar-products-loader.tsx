'use client';

import { useEffect, useState } from 'react';
import type { SimilarProductSuggestion } from '@/lib/types';
import { getSimilarProductsAction } from '@/app/actions';
import { Skeleton } from './ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tag } from 'lucide-react';

type SimilarProductsLoaderProps = {
  normalizedName: string;
  category: string;
  currency: string;
};

export default function SimilarProductsLoader({
  normalizedName,
  category,
  currency,
}: SimilarProductsLoaderProps) {
  const [suggestions, setSuggestions] = useState<SimilarProductSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSuggestions = async () => {
      setIsLoading(true);
      const result = await getSimilarProductsAction(normalizedName, category);
      setSuggestions(result);
      setIsLoading(false);
    };
    fetchSuggestions();
  }, [normalizedName, category]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-2/4" />
              <Skeleton className="h-4 w-1/4" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-8">
        No similar product suggestions found.
      </p>
    );
  }

  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  });

  return (
    <div className="space-y-4">
      {suggestions.map((product, index) => (
        <Card key={index}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-base capitalize">
                  {product.normalizedName}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {product.occurrences} occurrences found
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary">
                  Avg: {currencyFormatter.format(product.averagePrice)}
                </Badge>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Min: {currencyFormatter.format(product.minimumPrice)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Examples:</span>
              {product.exampleRawNames.map((name, i) => (
                <Badge key={i} variant="outline" className="font-normal">
                  {name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
