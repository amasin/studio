'use server';

import {
  mockBills,
  mockBillItems,
  mockPriceComparisons,
  mockShops,
} from '@/lib/mock-data';
import type { Bill, BillItem, PriceComparisonItem, SimilarProductSuggestion } from '@/lib/types';
import { getSimilarProducts } from '@/ai/flows/similar-products-suggestion';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Simulate network latency
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function getBills(): Promise<Bill[]> {
  await delay(500);
  const billsWithShops = mockBills.map((bill) => ({
    ...bill,
    shop: mockShops.find((shop) => shop.id === bill.shopId),
  }));
  return billsWithShops;
}

export async function getBill(
  billId: string
): Promise<{ bill: Bill; items: BillItem[] } | null> {
  await delay(500);
  const bill = mockBills.find((b) => b.id === billId);
  if (!bill) {
    return null;
  }
  const items = mockBillItems.filter((item) => item.billId === billId);
  const billWithShop = {
    ...bill,
    shop: mockShops.find((shop) => shop.id === bill.shopId),
  };
  return { bill: billWithShop, items };
}

export async function getBillComparisonData(
  billId: string
): Promise<PriceComparisonItem[]> {
  await delay(800);
  const itemIdsForBill = mockBillItems
    .filter((item) => item.billId === billId)
    .map((item) => item.id);
  return mockPriceComparisons.filter((comp) =>
    itemIdsForBill.includes(comp.billItemId)
  );
}

export async function getSimilarProductsAction(
  normalizedName: string,
  category: string
): Promise<SimilarProductSuggestion[]> {
    try {
        const suggestions = await getSimilarProducts({ normalizedName, category });
        // Add some mock data if AI returns empty for demonstration
        if (suggestions.length === 0) {
            return [
                {
                    normalizedName: `generic ${category.toLowerCase()}`,
                    exampleRawNames: [`Store Brand ${normalizedName}`],
                    unit: 'each',
                    averagePrice: 1.5,
                    minimumPrice: 1.2,
                    occurrences: 42,
                },
                {
                    normalizedName: `premium ${normalizedName}`,
                    exampleRawNames: [`Premium ${normalizedName}`],
                    unit: 'each',
                    averagePrice: 3.0,
                    minimumPrice: 2.8,
                    occurrences: 15,
                }
            ];
        }
        return suggestions;
    } catch (error) {
        console.error("Error fetching similar products:", error);
        return []; // Return empty array on error
    }
}

export async function uploadBillAction(formData: FormData) {
  const file = formData.get('billImage') as File;

  if (!file || file.size === 0) {
    return { error: 'Please select a file to upload.' };
  }
  
  // Simulate OCR and processing
  await delay(2000); 

  const newBillId = `bill${String(mockBills.length + 1).padStart(3, '0')}`;
  
  const newBill: Bill = {
    id: newBillId,
    userId: 'user123',
    shopId: 'shop003',
    billImagePath: '/placeholder.jpg',
    purchaseDate: new Date(),
    subTotal: 50.0,
    tax: 4.5,
    totalAmount: 54.5,
    currency: 'USD',
    createdAt: new Date(),
    status: 'processed',
  };
  mockBills.push(newBill);

  const newItems: BillItem[] = [
    {
      id: `item${String(mockBillItems.length + 1).padStart(2, '0')}`,
      billId: newBillId,
      userId: 'user123',
      shopId: 'shop003',
      rawName: 'Scanned Item 1',
      normalizedName: 'scanned item one',
      category: 'Scanned',
      quantity: 1,
      unit: 'pc',
      unitPrice: 25.0,
      totalPrice: 25.0,
      createdAt: new Date(),
    },
    {
      id: `item${String(mockBillItems.length + 2).padStart(2, '0')}`,
      billId: newBillId,
      userId: 'user123',
      shopId: 'shop003',
      rawName: 'Scanned Item 2',
      normalizedName: 'scanned item two',
      category: 'Scanned',
      quantity: 1,
      unit: 'pc',
      unitPrice: 25.0,
      totalPrice: 25.0,
      createdAt: new Date(),
    },
  ];
  mockBillItems.push(...newItems);

  revalidatePath('/');
  revalidatePath('/bills');
  revalidatePath(`/bills/${newBillId}`);
  redirect(`/bills/${newBillId}`);
}
