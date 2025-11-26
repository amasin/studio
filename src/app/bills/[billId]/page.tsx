import { notFound } from 'next/navigation';
import { getBill, getBillComparisonData } from '@/app/actions';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { format } from 'date-fns';
import BillItemsList from '@/components/bill-items-list';

export default async function BillDetailPage({
  params,
}: {
  params: { billId: string };
}) {
  const billDataPromise = getBill(params.billId);
  const comparisonDataPromise = getBillComparisonData(params.billId);

  const [billData, comparisonData] = await Promise.all([
    billDataPromise,
    comparisonDataPromise,
  ]);

  if (!billData) {
    notFound();
  }

  const { bill, items } = billData;
  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: bill.currency || 'USD',
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">
          {bill.shop?.name}
        </h1>
        <p className="text-muted-foreground">
          Bill from {format(new Date(bill.purchaseDate), 'PPPp')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <span className="text-muted-foreground">
              <FileText className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currencyFormatter.format(bill.totalAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              including {currencyFormatter.format(bill.tax)} tax
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Bill Items</CardTitle>
          <CardDescription>
            Click on an item to see price comparisons and similar products.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BillItemsList items={items} comparisonData={comparisonData} currency={bill.currency} />
        </CardContent>
      </Card>
    </div>
  );
}
