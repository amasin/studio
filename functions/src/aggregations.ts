
import * as admin from "firebase-admin";
import * as crypto from "crypto";

// Helper to generate a stable hash for the example ID
const createExampleId = (normalizedName: string, rawName: string): string => {
  const hash = crypto.createHash("sha1");
  hash.update(normalizedName);
  hash.update(rawName);
  return hash.digest("hex").substring(0, 10);
};

export const updateAggregationsForBillItems = async (params: {
  shopId: string;
  billItems: Array<{
    rawName: string;
    normalizedName: string;
    category: string;
    unit: string;
    unitPrice: number;
  }>;
}): Promise<void> => {
  const {shopId, billItems} = params;
  const db = admin.firestore();

  const validItems = billItems.filter((item) => item.unitPrice > 0);
  if (validItems.length === 0) {
    return;
  }

  await db.runTransaction(async (transaction) => {
    for (const item of validItems) {
      const {rawName, normalizedName, category, unit, unitPrice} = item;

      // Shop Item Stats
      const shopItemStatsRef = db
        .collection("shopItemStats")
        .doc(`${shopId}_${normalizedName}`);
      const shopItemStatDoc = await transaction.get(shopItemStatsRef);

      if (!shopItemStatDoc.exists) {
        transaction.set(shopItemStatsRef, {
          shopId,
          normalizedName,
          category,
          unit,
          occurrences: 1,
          sumUnitPrice: unitPrice,
          minUnitPrice: unitPrice,
          avgUnitPrice: unitPrice,
          lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        const data = shopItemStatDoc.data();
        if (data) {
          const newOccurrences = data.occurrences + 1;
          const newSumUnitPrice = data.sumUnitPrice + unitPrice;
          transaction.update(shopItemStatsRef, {
            occurrences: admin.firestore.FieldValue.increment(1),
            sumUnitPrice: admin.firestore.FieldValue.increment(unitPrice),
            minUnitPrice: Math.min(data.minUnitPrice, unitPrice),
            avgUnitPrice: newSumUnitPrice / newOccurrences,
            lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }

      // Global Item Stats
      const globalItemStatsRef = db
        .collection("globalItemStats")
        .doc(normalizedName);
      const globalItemStatDoc = await transaction.get(globalItemStatsRef);

      if (!globalItemStatDoc.exists) {
        transaction.set(globalItemStatsRef, {
          normalizedName,
          category,
          unit,
          occurrences: 1,
          sumUnitPrice: unitPrice,
          minUnitPrice: unitPrice,
          avgUnitPrice: unitPrice,
          lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        const data = globalItemStatDoc.data();
        if (data) {
          const newOccurrences = data.occurrences + 1;
          const newSumUnitPrice = data.sumUnitPrice + unitPrice;
          transaction.update(globalItemStatsRef, {
            occurrences: admin.firestore.FieldValue.increment(1),
            sumUnitPrice: admin.firestore.FieldValue.increment(unitPrice),
            minUnitPrice: Math.min(data.minUnitPrice, unitPrice),
            avgUnitPrice: newSumUnitPrice / newOccurrences,
            lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }

      // Raw Example
      const exampleId = createExampleId(normalizedName, rawName);
      const exampleRef = db
        .collection("itemRawExamples")
        .doc(normalizedName)
        .collection("examples")
        .doc(exampleId);
      const exampleDoc = await transaction.get(exampleRef);

      if (!exampleDoc.exists) {
        transaction.set(exampleRef, {
          rawName,
          count: 1,
          lastSeenAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        transaction.update(exampleRef, {
          count: admin.firestore.FieldValue.increment(1),
          lastSeenAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }
  });
};
