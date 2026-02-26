# BillBuddy Savings

BillBuddy Savings is an AI-powered personal finance application designed to help users track their spending and find savings opportunities by analyzing scanned grocery bills.

## 🚀 Overview

The application allows users to upload photos of their receipts. The backend uses OCR (Google Cloud Vision) to extract bill data and provides detailed price comparisons against community averages and nearby stores.

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Backend**: Firebase (Firestore, Storage, Functions, Auth)
- **Styling**: Tailwind CSS
- **UI Components**: ShadCN UI
- **Icons**: Lucide React
- **OCR**: Google Cloud Vision API

## 🏗 Architecture

The application is built on a serverless architecture using Firebase.

- **Frontend**: Next.js client-side application.
- **Authentication**: Firebase Authentication (Google Sign-In).
- **Database**: Firestore for user profiles, bills, items, and price statistics.
- **File Storage**: Firebase Storage for bill images.
- **Cloud Functions**: 
  - **OCR Pipeline**: Triggered on upload, parses receipts and updates aggregations.
  - **HTTPS APIs**: Comparison, nearby search, and product suggestions.

## 🔒 Security Rules

Production-grade security is enforced via Firebase Security Rules:
- **Authorization**: All private data is locked to the authenticated owner (`request.auth.uid`).
- **Query Constraints**: List operations on `bills` and `billItems` MUST include a filter on `userId` to satisfy security constraints.
- **Public Data**: Shop directories and aggregated price stats are publicly readable but only writable by administrative functions (Cloud Functions).

## 💻 Local Development

### 1. Prerequisites
- Node.js 18+
- Firebase CLI (`npm install -g firebase-tools`)

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
# Start emulators
firebase emulators:start
```

### 4. Run Next.js
```bash
npm run dev
```

## 🚢 Deployment

### Deploy to Firebase App Hosting
The project is configured for Firebase App Hosting via `apphosting.yaml`. Deployment occurs automatically via GitHub integration or manual CLI deployment.