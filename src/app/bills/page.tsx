'use client';

import withAuth from '@/components/withAuth';
import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { useAuth } from '@/lib/auth';
import BillCard from '@/components/bill-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

function BillsPage() {
  const { user } = useAuth();
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, 'bills'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const billsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setBills(billsData);
        setLoading(false);
      });

      return () => unsubscribe();
    } 
  }, [user]);

  if (loading) {
    return <div>Loading bills...</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">
            Bill History
          </h1>
          <p className="text-muted-foreground">
            Review your past bills and savings.
          </p>
        </div>
        <Button asChild>
          <Link href="/upload">
            <PlusCircle className="mr-2 h-4 w-4" />
            Upload New Bill
          </Link>
        </Button>
      </div>

      {bills.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {bills.map((bill) => (
            <BillCard key={bill.id} bill={bill} />
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center py-20">
          <CardHeader>
            <CardTitle className="text-center">No Bills Found</CardTitle>
            <CardDescription className="text-center">
              Upload your first bill to start tracking your expenses and savings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/upload">
                <PlusCircle className="mr-2 h-4 w-4" />
                Upload Your First Bill
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default withAuth(BillsPage);
