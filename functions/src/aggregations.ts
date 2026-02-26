import * as admin from "firebase-admin";
import * as crypto from "crypto";

// Helper to generate a stable hash for the example ID
export const createExampleId = (normalizedName: string, rawName: string): string => {
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

      // 1. Update shopItemStats
      const shopItemRef = db.collection("shopItemStats").doc(`${shopId}_${normalizedName}`);
      const shopItemDoc = await transaction.get(shopItemRef);

      if (!shopItemDoc.exists) {
        transaction.set(shopItemRef, {
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
        const data = shopItemDoc.data()!;
        const newOccurrences = data.occurrences + 1;
        const newSum = data.sumUnitPrice + unitPrice;
        const newMin = Math.min(data.minUnitPrice, unitPrice);
        transaction.update(shopItemRef, {
          occurrences: admin.firestore.FieldValue.increment(1),
          sumUnitPrice: admin.firestore.FieldValue.increment(unitPrice),
          minUnitPrice: newMin,
          avgUnitPrice: newSum / newOccurrences,
          lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // 2. Update globalItemStats
      const globalItemRef = db.collection("globalItemStats").doc(normalizedName);
      const globalItemDoc = await transaction.get(globalItemRef);

      if (!globalItemDoc.exists) {
        transaction.set(globalItemRef, {
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
        const data = globalItemDoc.data()!;
        const newOccurrences = data.occurrences + 1;
        const newSum = data.sumUnitPrice + unitPrice;
        const newMin = Math.min(data.minUnitPrice, unitPrice);
        transaction.update(globalItemRef, {
          occurrences: admin.firestore.FieldValue.increment(1),
          sumUnitPrice: admin.firestore.FieldValue.increment(unitPrice),
          minUnitPrice: newMin,
          avgUnitPrice: newSum / newOccurrences,
          lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // 3. Update itemRawExamples
      const exampleId = createExampleId(normalizedName, rawName);
      const exampleRef = db.collection("itemRawExamples")
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
