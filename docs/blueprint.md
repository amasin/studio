# **App Name**: BillBuddy Savings

## Core Features:

- Bill Photo Upload & OCR: Users upload bill photos, and OCR extracts data using Google Cloud Vision, upserting shop info and updating bill status. The normalization tool lowercases text, removes punctuation, unifies spacing and removes unit descriptors.
- Price Comparison: An HTTPS endpoint `getBillComparison(billId)` that returns unit price comparison (user vs. min/avg) and cheaper shops for each item on the bill.
- Cheapest Shops Nearby: Function `getCheapestShopsForItem(normalizedName, userLocation, radiusKm)` filters shops by distance, gets min unit price per shop, and returns cheapest shops first. A tool is employed here for filtering
- Similar Products: Function `getSimilarProducts(normalizedName, category)` returns similar products based on normalized name and category, with example raw names, average/min price, and occurrences. The AI tool will prefix-match, check token-based similarity, and then perform simple Levenshtein fallback to enhance suggestions.
- User Bill History: Stores user bills for future reference.
- Firestore Integration: Utilizes Firestore for storing user, shop, bill, and bill item data.
- Secure Data Handling: Ensures data security by requiring authentication and limiting data access to authorized users/roles. The AI powered security policies, automatically generated in conjunction with Google, are managed as part of your profile to create a safe tool environment for all.

## Style Guidelines:

- Primary color: Desaturated green (#8FBC8F), inspired by the idea of savings, is the primary color. It's versatile and contrasts well on light and dark backgrounds.
- Background color: Light grey (#F0F0F0), same hue as the primary, creates a clean backdrop.
- Accent color: Blue (#77B5FE), slightly to the 'left' of green, to provide interactive accents.
- Body and headline font: 'PT Sans', a humanist sans-serif, which creates a friendly and modern feel that works great for both.
- Use simple, geometric icons to represent product categories and actions (e.g., shopping cart, price tags, locations).
- Clean and structured layout with clear sections for bills, item comparisons, and shop listings.
- Subtle animations for loading data and transitions to enhance user experience.