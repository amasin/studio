# BillBuddy Savings - Technical Documentation

BillBuddy Savings is an AI-powered personal finance application designed to help users track their spending and find savings opportunities by analyzing scanned grocery bills.

## 🚀 Overview

The application allows users to upload photos of their receipts. It then uses Generative AI to "clean" the messy receipt data (normalization) and provides detailed price comparisons against community averages and nearby stores.

## 🛠 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **AI Engine**: [Google Genkit](https://firebase.google.com/docs/genkit) with Gemini 2.5 Flash
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/) (Radix UI primitives)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Date Handling**: [date-fns](https://date-fns.org/)

## 🏗 Architecture

### 1. AI Layer (`src/ai/`)
The core intelligence of the app resides in Genkit flows:
- **Normalization Flow** (`src/ai/flows/enhanced-bill-item-normalization.ts`): Uses GenAI to transform raw, truncated receipt strings (e.g., "Org Mlk 1g") into clean product names ("organic milk").
- **Suggestions Flow** (`src/ai/flows/similar-products-suggestion.ts`): Provides market insights, including average prices, minimum prices found, and common brand variations.

### 2. Data Layer (`src/lib/`)
- **Types** (`src/lib/types.ts`): Strict TypeScript interfaces for Bills, BillItems, Shops, and PriceComparisons.
- **Mock Data** (`src/lib/mock-data.ts`): A centralized set of data used to demonstrate the app's functionality before connecting to a live database like Firestore.

### 3. Page Routing (`src/app/`)
- **`/` (Dashboard)**: A high-level entry point for the user.
- **`/bills` (History)**: Lists all processed bills with summaries of total spending.
- **`/bills/[billId]` (Details)**: A deep-dive view into a specific receipt, featuring itemized lists and AI comparison tabs.
- **`/upload`**: The interface for capturing and submitting new bill images.

### 4. Component Architecture (`src/components/`)
- **Layout**: `AppShell` provides the responsive sidebar navigation and header.
- **Interactive UI**:
  - `BillItemsList`: Uses Radix Accordions to show details for each receipt line item.
  - `SimilarProductsLoader`: A client-side component that fetches AI suggestions asynchronously to keep the UI snappy.
  - `BillUploadForm`: Handles image selection, previews, and form submission with React `useTransition`.

## 🌟 Key Features

1. **AI Item Normalization**: Automatically categorizes and names products for better searchability.
2. **Community Price Benchmarking**: See at a glance if you paid more or less than the average for your "Milk" or "Eggs".
3. **Cheaper Store Discovery**: Identifies specific nearby shops where items on your current bill could have been purchased for less.
4. **Responsive Sidebar Navigation**: A modern, collapsible sidebar for easy access across all device sizes.

## 📝 Developer Notes

- **Mock Processing**: The `uploadBillAction` in `actions.ts` simulates network latency and OCR processing to give a realistic feel of the background work being performed by AI.
- **Dynamic Images**: All placeholder images are managed via `src/lib/placeholder-images.json` to ensure visual consistency throughout the prototype.
