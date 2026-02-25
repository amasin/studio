import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {onObjectFinalized} from "firebase-functions/v2/storage";
import {ImageAnnotatorClient} from "@google-cloud/vision";
import {parseReceipt} from "./receiptParser";
import {normalizeProductName} from "./normalize";
import * as crypto from "crypto";

admin.initializeApp();
const db = admin.firestore();
const visionClient = new ImageAnnotatorClient();

export const processBillUpload = onObjectFinalized({region: "us-central1"}, async (event) => {
  const {bucket, name: filePath, contentType} = event.data;

  if (!contentType?.startsWith("image/") || !filePath) {
    logger.info(`Ignoring non-image file: ${filePath}`);
    return;
  }

  const filePathParts = filePath.split("/");
  if (filePathParts.length < 3 || filePathParts[0] !== "bills") {
    logger.info(`Ignoring file outside of bills folder or with incorrect path structure: ${filePath}`);
    return;
  }
  const userId = filePathParts[1];
  const billId = filePathParts[2].split(".")[0];

  const billRef = db.collection("bills").doc(billId);

  try {
    await billRef.set(
        {
          userId,
          billImagePath: filePath,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          status: "pending_ocr",
          currency: "INR",
          ocrStartedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        {merge: true},
    );

    const [result] = await visionClient.documentTextDetection(`gs://${bucket}/${filePath}`);
    const ocrText = result.fullTextAnnotation?.text ?? "";
    await billRef.update({ocrTextPreview: ocrText.substring(0, 1000)});

    const {shopName, items} = parseReceipt(ocrText);

    let shopId = "unknown";
    if (shopName) {
      const normalizedShopName = shopName.toLowerCase().replace(/\s+/g, " ").trim();
      shopId = crypto.createHash("sha256").update(normalizedShopName).digest("hex").substring(0, 16);
      await db.collection("shops").doc(shopId).set({name: shopName, address: ""}, {merge: true});
    }

    const existingItems = await db.collection("billItems").where("billId", "==", billId).get();
    const batch = db.batch();
    existingItems.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    if (items.length > 0) {
      const newBatch = db.batch();
      items.forEach((item, index) => {
        const billItemId = `${billId}_${index}`;
        const billItemRef = db.collection("billItems").doc(billItemId);
        newBatch.set(billItemRef, {
          billId,
          userId,
          shopId,
          rawName: item.rawName,
          normalizedName: normalizeProductName(item.rawName),
          category: "unknown",
          quantity: item.quantity || 1,
          unit: "",
          unitPrice: item.unitPrice || 0,
          totalPrice: item.totalPrice || 0,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });
      await newBatch.commit();
    } else {
      await billRef.update({parseWarning: "NO_ITEMS_PARSED"});
    }

    await billRef.update({status: "processed", processedAt: admin.firestore.FieldValue.serverTimestamp()});
  } catch (error) {
    logger.error(`Error processing bill ${billId}:`, error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await billRef.update({
      status: "failed",
      errorMessage,
      failedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
});
