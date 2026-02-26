'use client';

import withAuth from '@/components/withAuth';
import { useEffect, useState } from 'react';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { useAuth } from '@/lib/auth';
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
import { Button } from '@/components/ui/button';
import { getBillComparison, getCheapestShopsForItem, getSimilarProducts } from '@/lib/functionsApi';

function BillDetailPage({ params }: { params: { billId: string } }) {
  const { user } = useAuth();
  const [bill, setBill] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [comparisonData, setComparisonData] = useState<any>(null);

  useEffect(() => {
    if (user) {
      const billDocRef = doc(db, 'bills', params.billId);

      const unsubscribeBill = onSnapshot(billDocRef, (doc) => {
        if (doc.exists()) {
          setBill({ id: doc.id, ...doc.data() });
        } else {
          // Handle case where bill is not found
        }
        setLoading(false);
      });

      const itemsQuery = query(
        collection(db, 'billItems'),
        where('billId', '==', params.billId),
        orderBy('createdAt', 'desc')
      );

      const unsubscribeItems = onSnapshot(itemsQuery, (querySnapshot) => {
        const itemsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setItems(itemsData);
      });

      return () => {
        unsubscribeBill();
        unsubscribeItems();
      };
    }
  }, [user, params.billId]);

  const handleCompare = async () => {
    const data = await getBillComparison(params.billId);
    setComparisonData(data);
  };

  if (loading) {
    return <div>Loading bill details...</div>;
  }

  if (!bill) {
    return <div>Bill not found.</div>;
  }

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
          Bill from {format(new Date(bill.purchaseDate.toDate()), 'PPPp')}
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

      <div className="flex gap-4">
        <Button onClick={handleCompare}>Compare</Button>
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

export default withAuth(BillDetailPage);
