'use client';

import type { BillItem, PriceComparisonItem } from '@/lib/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PriceComparison from './price-comparison';

type BillItemsListProps = {
  items: BillItem[];
  comparisonData: PriceComparisonItem[];
  currency: string;
};

export default function BillItemsList({ items, comparisonData, currency }: BillItemsListProps) {
  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  });

  return (
    <Accordion type="single" collapsible className="w-full">
      {items.map((item) => {
        const comparison = comparisonData.find((c) => c.billItemId === item.id);
        return (
          <AccordionItem value={item.id} key={item.id}>
            <AccordionTrigger className="hover:bg-muted/50 px-4 rounded-md">
              <div className="flex flex-1 items-center justify-between gap-4">
                <span className="flex-1 text-left font-medium capitalize">{item.normalizedName}</span>
                <span className="text-sm text-muted-foreground">
                  {item.quantity} @ {currencyFormatter.format(item.unitPrice)}
                </span>
                <span className="w-24 text-right font-semibold">{currencyFormatter.format(item.totalPrice)}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pt-2">
              <Tabs defaultValue="comparison" className="w-full">
                <TabsList className="grid w-full grid-cols-1">
                  <TabsTrigger value="comparison">Price Comparison</TabsTrigger>
                </TabsList>
                <TabsContent value="comparison" className="pt-4">
                  {comparison ? (
                    <PriceComparison data={comparison} currency={currency} />
                  ) : (
                    <p className="text-center text-sm text-muted-foreground py-8">No comparison data available.</p>
                  )}
                </TabsContent>
              </Tabs>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
