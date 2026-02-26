# BillBuddy Savings

BillBuddy Savings is an AI-powered personal finance application designed to help users track their spending and find savings opportunities by analyzing scanned grocery bills.

## 🚀 Overview

The application allows users to upload photos of their receipts. The backend uses OCR to extract bill data and provides detailed price comparisons against community averages and nearby stores.

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Backend**: Firebase (Firestore, Storage, Functions, Auth)
- **Styling**: Tailwind CSS
- **UI Components**: ShadCN UI
- **Icons**: Lucide React

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

### Deploy to Firebase
```bash
# Login to Firebase
firebase login

# Set your project ID
firebase use your-project-id

# Deploy everything
firebase deploy
```

## 🏗 Architecture

The application is built on a serverless architecture using Firebase.

- **Frontend**: A Next.js application for the user interface.
- **Authentication**: Firebase Authentication handles user sign-up and login.
- **Database**: Firestore stores user profiles, bills, items, and aggregated price statistics.
- **File Storage**: Firebase Storage stores uploaded bill images.
- **Backend Logic**: Firebase Functions, triggered by image uploads, handle the entire backend process:
  - **OCR**: Google Cloud Vision API extracts text from bill images.
  - **Data Processing**: Deterministic normalization and enrichment of the extracted data.
  - **APIs**: HTTPS-callable functions provide the frontend with data for price comparisons and product suggestions.
- **Security**: Firestore and Storage security rules enforce strict data ownership, ensuring users can only access their own financial data.