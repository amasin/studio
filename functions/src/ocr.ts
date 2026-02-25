import * as logger from "firebase-functions/logger";
import { onObjectFinalized } from "firebase-functions/v2/storage";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import { FieldValue } from "firebase-admin/firestore";
import * as crypto from "crypto";
import { db } from "./firebase";
import { normalizeProductName } from "./normalize";
import { parseReceipt } from "./receiptParser";

const visionClient = new ImageAnnotatorClient();

export const processBillUpload = onObjectFinalized({
  region: "us-central1",
}, async (event) => {
  const { bucket, name: filePath, contentType } = event.data;

  if (!contentType?.startsWith("image/")) {
    logger.info(`Ignoring non-image file: ${filePath}`);
    return;
  }

  // bills/{userId}/{billId}.jpg
  const pathParts = filePath.split("/");
  if (pathParts[0] !== "bills" || pathParts.length < 3) {
    logger.info(`Ignoring file outside of bills folder structure: ${filePath}`);
    return;
  }

  const userId = pathParts[1];
  const billFileName = pathParts[2];
  const billId = billFileName.split(".")[0];

  logger.info(`Processing bill: ${billId} for user: ${userId}`);

  const billRef = db.collection("bills").doc(billId);

  try {
    // 1. Initial status update
    await billRef.set({
      userId,
      billImagePath: filePath,
      createdAt: FieldValue.serverTimestamp(),
      status: "pending_ocr",
      ocrStartedAt: FieldValue.serverTimestamp(),
      currency: "INR",
    }, { merge: true });

    // 2. OCR Call
    const [result] = await visionClient.documentTextDetection(`gs://${bucket}/${filePath}`);
    const fullText = result.fullTextAnnotation?.text;

    if (!fullText) {
        throw new Error("No text found in the image.");
    }

    // 3. Parsing
    const parsedData = parseReceipt(fullText);
    const ocrTextPreview = fullText.substring(0, 1000);

    // 4. Shop Handling
    let shopId = "unknown";
    if (parsedData.shopName) {
        const normalizedShopName = parsedData.shopName.toLowerCase().trim();
        shopId = crypto.createHash("sha256").update(normalizedShopName).digest("hex").substring(0, 16);

        await db.collection("shops").doc(shopId).set({
            name: parsedData.shopName,
            address: "",
            createdAt: FieldValue.serverTimestamp(),
        }, { merge: true });
    }

    // 5. Bill Items (Idempotent cleanup then write)
    const existingItems = await db.collection("billItems").where("billId", "==", billId).get();
    const batch = db.batch();
    existingItems.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    const writeBatch = db.batch();
    const itemsToSave = parsedData.items.length > 0 ? parsedData.items : [{ rawName: "unknown item", unitPrice: 0 }];

    itemsToSave.forEach((item, index) => {
        const billItemId = `${billId}_${index}`;
        const itemRef = db.collection("billItems").doc(billItemId);
        writeBatch.set(itemRef, {
            billId,
            userId,
            shopId,
            rawName: item.rawName,
            normalizedName: normalizeProductName(item.rawName),
            category: "unknown",
            quantity: item.quantity || 1,
            unit: item.unit || "",
            unitPrice: item.unitPrice || 0,
            totalPrice: item.totalPrice || (item.unitPrice || 0) * (item.quantity || 1),
            createdAt: FieldValue.serverTimestamp(),
        });
    });
    await writeBatch.commit();

    // 6. Success final status
    await billRef.update({
        status: "processed",
        processedAt: FieldValue.serverTimestamp(),
        ocrTextPreview,
        shopId,
        parseWarning: parsedData.items.length === 0 ? "NO_ITEMS_PARSED" : null,
    });

    logger.info(`Successfully processed bill: ${billId}`);

  } catch (error: any) {
    logger.error(`Error processing bill ${billId}:`, error);
    await billRef.update({
      status: "failed",
      errorMessage: error.message || "Unknown error during OCR processing",
      failedAt: FieldValue.serverTimestamp(),
    });
  }
});
