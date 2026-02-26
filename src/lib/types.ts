import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  createdAt: Timestamp;
  homeLocation: {
    latitude: number;
    longitude: number;
  };
}

export interface Shop {
  id: string;
  name: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  createdAt: Timestamp;
}

export interface Bill {
  id: string;
  userId: string;
  shopId?: string;
  billImagePath: string;
  purchaseDate?: Timestamp;
  subTotal?: number;
  tax?: number;
  totalAmount?: number;
  currency: string;
  createdAt: Timestamp;
  status: 'pending_ocr' | 'processed' | 'failed';
  errorMessage?: string;
  shop?: Shop;
}

export interface BillItem {
  id: string;
  billId: string;
  userId: string;
  shopId: string;
  rawName: string;
  normalizedName: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  createdAt: Timestamp;
}

export interface PriceComparisonItem {
  normalizedName: string;
  rawName: string;
  userUnitPrice: number;
  minUnitPrice: number;
  avgUnitPrice: number;
  cheaperShopPrices: {
    shopId: string;
    shopName: string;
    unitPrice: number;
  }[];
}

export interface ComparisonResponse {
  billId: string;
  items: PriceComparisonItem[];
}
