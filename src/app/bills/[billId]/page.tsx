'use client';

import { useMemo, useState } from 'react';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import { useFirestore, useDoc, useCollection, useUser, useMemoFirebase } from '@/firebase';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { FileText, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import BillItemsList from '@/components/bill-items-list';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useParams } from 'next/navigation';
import type { Bill, BillItem, ComparisonResponse } from '@/lib/types';

export default function BillDetailPage() {
  const { billId } = useParams() as { billId: string };
  const { user } = useUser();
  const db = useFirestore();
  const [comparisonData, setComparisonData] = useState<ComparisonResponse | null>(null);
  const [comparing, setComparing] = useState(false);

  const billRef = useMemo(() => billId ? doc(db, 'bills', billId) : null, [db, billId]);
  const { data: bill, isLoading: billLoading } = useDoc<Bill>(billRef);

  const itemsQuery = useMemoFirebase(() => {
    if (!user || !billId) return null;
    return query(
      collection(db, 'billItems'),
      where('userId', '==', user.uid),
      where('billId', '==', billId),
      orderBy('createdAt', 'desc')
    );
  }, [db, user, billId]);

  const { data: items, isLoading: itemsLoading } = useCollection<BillItem>(itemsQuery);

  const handleCompare = async () => {
    if (!user) return;
    setComparing(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`https://us-central1-${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.cloudfunctions.net/getBillComparison?billId=${billId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setComparisonData(data);
    } catch (error) {
      console.error("Comparison failed:", error);
    } finally {
      setComparing(false);
    }
  };

  if (billLoading || itemsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading bill details...</p>
      </div>
    );
  }

  if (!bill) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Bill not found or you don't have permission to view it.</AlertDescription>
      </Alert>
    );
  }

  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: bill.currency || 'INR',
  });

  const purchaseDate = bill.purchaseDate?.toDate() || bill.createdAt?.toDate() || new Date();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-headline tracking-tight">
          {bill.status === 'processed' ? 'Bill Summary' : 'Processing Bill...'}
        </h1>
        <p className="text-muted-foreground">
          Uploaded on {format(purchaseDate, 'PPP')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bill.totalAmount ? currencyFormatter.format(bill.totalAmount) : '...'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Status: <span className={cn(
                "font-medium",
                bill.status === 'processed' ? "text-green-600" : 
                bill.status === 'failed' ? "text-red-600" : "text-amber-600"
              )}>
                {bill.status.replace('_', ' ')}
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {bill.status === 'failed' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Processing Failed</AlertTitle>
          <AlertDescription>{bill.errorMessage || 'An error occurred during OCR.'}</AlertDescription>
        </Alert>
      )}

      {bill.status === 'processed' && (
        <div className="flex gap-4">
          <Button onClick={handleCompare} disabled={comparing}>
            {comparing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Comparing...
              </>
            ) : (
              comparisonData ? 'Refresh Comparison' : 'Find Better Prices'
            )}
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Bill Items</CardTitle>
          <CardDescription>
            Individual line items extracted from your receipt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {items && items.length > 0 ? (
            <BillItemsList 
              items={items} 
              comparisonData={comparisonData?.items || []} 
              currency={bill.currency || 'INR'} 
            />
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              {bill.status === 'pending_ocr' ? 'Extraction in progress...' : 'No items found.'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
