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
exports.processBillUpload = void 0;
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
const storage_1 = require("firebase-functions/v2/storage");
const vision_1 = require("@google-cloud/vision");
const receiptParser_1 = require("./receiptParser");
const normalize_1 = require("./normalize");
const aggregations_1 = require("./aggregations");
const crypto = __importStar(require("crypto"));
// admin.initializeApp() already called in firebase.ts if used or assuming index.ts
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
const visionClient = new vision_1.ImageAnnotatorClient();
exports.processBillUpload = (0, storage_1.onObjectFinalized)({ region: "us-central1" }, async (event) => {
    const { bucket, name: filePath, contentType } = event.data;
    if (!contentType?.startsWith("image/") || !filePath) {
        logger.info(`Ignoring non-image file: ${filePath}`);
        return;
    }
    const filePathParts = filePath.split("/");
    if (filePathParts.length < 3 || filePathParts[0] !== "bills") {
        logger.info(`Ignoring file outside of bills folder: ${filePath}`);
        return;
    }
    const userId = filePathParts[1];
    const billId = filePathParts[2].split(".")[0];
    const billRef = db.collection("bills").doc(billId);
    try {
        await billRef.set({
            userId,
            billImagePath: filePath,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            status: "pending_ocr",
            currency: "INR",
            ocrStartedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        const [result] = await visionClient.documentTextDetection(`gs://${bucket}/${filePath}`);
        const ocrText = result.fullTextAnnotation?.text ?? "";
        await billRef.update({ ocrTextPreview: ocrText.substring(0, 1000) });
        const { shopName, items } = (0, receiptParser_1.parseReceipt)(ocrText);
        let shopId = "unknown";
        if (shopName) {
            const normalizedShopName = shopName.toLowerCase().replace(/\s+/g, " ").trim();
            shopId = crypto.createHash("sha256").update(normalizedShopName).digest("hex").substring(0, 16);
            await db.collection("shops").doc(shopId).set({ name: shopName, address: "" }, { merge: true });
        }
        // Idempotent: delete old items
        const existingItems = await db.collection("billItems").where("billId", "==", billId).get();
        const batch = db.batch();
        existingItems.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        if (items.length > 0) {
            const newBatch = db.batch();
            const aggregationItems = [];
            items.forEach((item, index) => {
                const billItemId = `${billId}_${index}`;
                const normalizedName = (0, normalize_1.normalizeProductName)(item.rawName);
                const billItemRef = db.collection("billItems").doc(billItemId);
                const billItemData = {
                    billId,
                    userId,
                    shopId,
                    rawName: item.rawName,
                    normalizedName,
                    category: "unknown",
                    quantity: item.quantity || 1,
                    unit: "",
                    unitPrice: item.unitPrice || 0,
                    totalPrice: item.totalPrice || 0,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                };
                newBatch.set(billItemRef, billItemData);
                aggregationItems.push(billItemData);
            });
            await newBatch.commit();
            // Call aggregations
            await (0, aggregations_1.updateAggregationsForBillItems)({
                shopId,
                billItems: aggregationItems,
            });
        }
        else {
            await billRef.update({ parseWarning: "NO_ITEMS_PARSED" });
        }
        await billRef.update({ status: "processed", processedAt: admin.firestore.FieldValue.serverTimestamp() });
    }
    catch (error) {
        logger.error(`Error processing bill ${billId}:`, error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        await billRef.update({
            status: "failed",
            errorMessage,
            failedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
});
//# sourceMappingURL=ocr.js.map