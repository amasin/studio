"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAggregationsForBillItems = exports.createExampleId = void 0;
const admin = __importStar(require("firebase-admin"));
const crypto = __importStar(require("crypto"));
// Helper to generate a stable hash for the example ID
const createExampleId = (normalizedName, rawName) => {
    const hash = crypto.createHash("sha1");
    hash.update(normalizedName);
    hash.update(rawName);
    return hash.digest("hex").substring(0, 10);
};
exports.createExampleId = createExampleId;
const updateAggregationsForBillItems = async (params) => {
    const { shopId, billItems } = params;
    const db = admin.firestore();
    const validItems = billItems.filter((item) => item.unitPrice > 0);
    if (validItems.length === 0) {
        return;
    }
    await db.runTransaction(async (transaction) => {
        for (const item of validItems) {
            const { rawName, normalizedName, category, unit, unitPrice } = item;
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
            }
            else {
                const data = shopItemDoc.data();
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
            }
            else {
                const data = globalItemDoc.data();
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
            const exampleId = (0, exports.createExampleId)(normalizedName, rawName);
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
            }
            else {
                transaction.update(exampleRef, {
                    count: admin.firestore.FieldValue.increment(1),
                    lastSeenAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            }
        }
    });
};
exports.updateAggregationsForBillItems = updateAggregationsForBillItems;
//# sourceMappingURL=aggregations.js.map