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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ocrBill = void 0;
const logger = __importStar(require("firebase-functions/logger"));
const storage_1 = require("firebase-functions/v2/storage");
const vision_1 = require("@google-cloud/vision");
const firebase_1 = require("./firebase");
const normalize_1 = require("./normalize");
const crypto = __importStar(require("crypto"));
const ocr_parser_1 = require("./ocr-parser");
const visionClient = new vision_1.ImageAnnotatorClient();
exports.ocrBill = (0, storage_1.onObjectFinalized)({
    region: "us-central1",
    cpu: "gcf_gen1",
    timeoutSeconds: 300,
    memory: "512MiB",
}, async (event) => {
    const { bucket, name: filePath, contentType } = event.data;
    if (!contentType?.startsWith("image/")) {
        logger.info(`Ignoring non-image file: ${filePath}`);
        return;
    }
    const pathParts = filePath.split("/");
    if (pathParts[0] !== "bills") {
        logger.info(`Ignoring file outside of bills folder: ${filePath}`);
        return;
    }
    const userId = pathParts[1];
    const billId = pathParts[2].split(".")[0];
    logger.info(`Processing bill: ${billId} for user: ${userId}`);
    const billRef = firebase_1.db.collection("bills").doc(billId);
    try {
        // 1. Set initial status
        await billRef.set({
            userId,
            billImagePath: filePath,
            createdAt: new Date(),
            status: "pending_ocr",
            currency: "INR",
        }, { merge: true });
        // 2. Run OCR
        const [result] = await visionClient.documentTextDetection(`gs://${bucket}/${filePath}`);
        const fullText = result.fullTextAnnotation?.text;
        if (!fullText) {
            throw new Error("No text found in image.");
        }
        // 3. Store OCR text preview
        await billRef.update({ ocrTextPreview: fullText.substring(0, 1000) });
        logger.info(`OCR text preview stored for bill: ${billId}. Length: ${fullText.length}`);
        // 4. Parse OCR text to extract items
        const parsedItems = (0, ocr_parser_1.parseOcrText)(fullText);
        // 5. Delete existing items for idempotency
        const existingItems = await firebase_1.db.collection("billItems").where("billId", "==", billId).get();
        const deletePromises = existingItems.docs.map((doc) => doc.ref.delete());
        await Promise.all(deletePromises);
        // 6. Create new bill items
        const shopId = crypto.createHash("md5").update("default_shop").digest("hex"); // Placeholder
        const itemPromises = parsedItems.map((item, index) => {
            const billItemId = `${billId}_${index}`;
            return firebase_1.db.collection("billItems").doc(billItemId).set({
                ...item,
                billId,
                userId,
                shopId,
                normalizedName: (0, normalize_1.normalizeProductName)(item.rawName),
                category: "unknown",
                createdAt: new Date(),
            });
        });
        await Promise.all(itemPromises);
        // 7. Upsert shop
        await firebase_1.db.collection("shops").doc(shopId).set({
            name: "Default Shop",
            createdAt: new Date(),
        }, { merge: true });
        // 8. Update bill status to processed
        const updatePayload = {
            status: "processed",
            processedAt: new Date(),
        };
        if (parsedItems.length === 1 && parsedItems[0].rawName === "unknown item") {
            updatePayload.parseWarning = "NO_ITEMS_PARSED";
        }
        await billRef.update(updatePayload);
        logger.info(`Successfully processed bill: ${billId}`);
    }
    catch (error) {
        logger.error("Error processing bill:", error);
        await billRef.update({
            status: "failed",
            errorMessage: error.message,
            failedAt: new Date(),
        });
    }
});
//# sourceMappingURL=ocr.js.map