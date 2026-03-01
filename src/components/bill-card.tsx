import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import type { Bill } from '@/lib/types';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type BillCardProps = {
  bill: Bill;
};

export default function BillCard({ bill }: BillCardProps) {
  const shopImage = PlaceHolderImages.find((img) => img.id === 'shop-facade');
  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: bill.currency || 'INR',
  });

  const purchaseDate = (bill.purchaseDate && typeof bill.purchaseDate.toDate === 'function') 
    ? bill.purchaseDate.toDate() 
    : (bill.createdAt && typeof bill.createdAt.toDate === 'function')
    ? bill.createdAt.toDate()
    : new Date();

  const shopName = bill.shopName || bill.shop?.name || 'Unknown Shop';

  return (
    <Link href={`/bills/${bill.id}`} className="group block">
      <Card className="flex h-full flex-col overflow-hidden transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1">
        <CardHeader className="p-0">
          <div className="relative h-40 w-full">
            <Image
              src={shopImage?.imageUrl ?? ''}
              alt={shopName}
              fill
              className="object-cover"
              data-ai-hint={shopImage?.imageHint}
            />
          </div>
        </CardHeader>
        <CardContent className="flex-grow p-4">
          <CardTitle className="mb-1 text-lg font-bold font-headline">
            {shopName}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {format(purchaseDate, 'PPP')}
          </p>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <p className="text-xl font-semibold text-primary">
            {bill.totalAmount ? currencyFormatter.format(bill.totalAmount) : 'Processing...'}
          </p>
        </CardFooter>
      </Card>
    </Link>
  );
}
