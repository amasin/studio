import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default async function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome to your BillBuddy dashboard.
          </p>
        </div>
        <Button asChild>
          <Link href="/upload">
            <PlusCircle className="mr-2 h-4 w-4" />
            Upload New Bill
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Ready to start saving? Upload your first bill.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-4 py-10 text-center">
            <p>View your uploaded bills to track expenses and discover savings opportunities.</p>
             <Button asChild>
              <Link href="/bills">
                View Bill History
              </Link>
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
