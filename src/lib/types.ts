export interface User {
  id: string;
  displayName: string;
  email: string;
  createdAt: Date;
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
  createdAt: Date;
}

export interface Bill {
  id: string;
  userId: string;
  shopId: string;
  billImagePath: string;
  purchaseDate: Date;
  subTotal: number;
  tax: number;
  totalAmount: number;
  currency: string;
  createdAt: Date;
  status: 'pending_ocr' | 'processed' | 'failed';
  shop?: Shop; // Populated for convenience
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
  createdAt: Date;
}

export interface PriceComparisonItem {
  billItemId: string;
  userUnitPrice: number;
  minUnitPrice: number;
  avgUnitPrice: number;
  cheaperShops: {
    shopId: string;
    shopName: string;
    price: number;
  }[];
}

export interface SimilarProductSuggestion {
  normalizedName: string;
  exampleRawNames: string[];
  unit: string;
  averagePrice: number;
  minimumPrice: number;
  occurrences: number;
}
