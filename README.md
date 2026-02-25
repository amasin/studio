# BillBuddy Savings

BillBuddy Savings is an AI-powered personal finance application designed to help users track their spending and find savings opportunities by analyzing scanned grocery bills.

## 🚀 Overview

The application allows users to upload photos of their receipts. It uses OCR to extract data and provides detailed price comparisons against community averages and nearby stores.

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **AI Engine**: Google Genkit with Gemini 2.5 Flash
- **Backend**: Firebase (Firestore, Storage, Functions, Auth)
- **Styling**: Tailwind CSS
- **UI Components**: ShadCN UI
- **Icons**: Lucide React

## 💻 Local Development

### 1. Prerequisites
- Node.js 18+
- Firebase CLI (`npm install -g firebase-tools`)
- Google Cloud Vision API enabled (for production OCR)

### 2. Setup
```bash
# Install dependencies
npm install

# Build the Next.js app
npm run build
```

### 3. Firebase Emulator (Local Development)
Start the Firebase local emulator to test Firestore, Functions, and Storage locally:
```bash
# Initialize emulators if not already done
firebase init emulators

# Start emulators
firebase emulators:start
```

### 4. Run Next.js
```bash
npm run dev
```

## 🚢 Deployment

### Deploy to Firebase
```bash
# Login to Firebase
firebase login

# Set your project ID
firebase use your-project-id

# Deploy everything (Hosting, Functions, Firestore, Storage)
firebase deploy
```

## 🏗 Architecture
- **Firestore**: Stores user profiles, bills, items, and aggregated statistics.
- **Storage**: Stores bill images in `/bills/{userId}/{billId}.jpg`.
- **Functions**: Handles OCR processing via Cloud Vision and provides HTTPS APIs for comparisons.
- **Rules**: Enforces strict user ownership of financial data.
