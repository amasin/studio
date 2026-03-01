
import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { onObjectFinalized } from "firebase-functions/v2/storage";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import * as crypto from "crypto";

import { normalizeProductName } from "./normalize";
import { handleGetBillComparison, handleGetCheapestShopsForItem, handleGetSimilarProducts } from "./api";

admin.initializeApp();
const db = admin.firestore();
const visionClient = new ImageAnnotatorClient();

export const processBillUpload = onObjectFinalized({ region: "us-central1" }, async (event) => {
  const { bucket, name: filePath, contentType } = event.data;

  if (!contentType?.startsWith("image/") || !filePath) return;

  const parts = filePath.split("/");
  if (parts[0] !== "bills" || parts.length < 3) return;

  const userId = parts[1];
  const billId = parts[2].split(".")[0];
  const billRef = db.collection("bills").doc(billId);

  try {
    const [result] = await visionClient.documentTextDetection(`gs://${bucket}/${filePath}`);
    const ocrText = result.fullTextAnnotation?.text ?? "";
    
    // Simple robust parsing logic
    const lines = ocrText.split("\n");
    const shopName = lines[0]?.substring(0, 50) || "Unknown Shop";
    const items: any[] = [];
    const priceRegex = /(\d+\.\d{2})/;

    lines.forEach(line => {
      const match = line.match(priceRegex);
      if (match) {
        const price = parseFloat(match[1]);
        const name = line.replace(match[0], "").trim();
        if (name) {
          items.push({
            rawName: name,
            unitPrice: price,
            totalPrice: price,
            quantity: 1
          });
        }
      }
    });

    const normalizedShop = shopName.toLowerCase().trim();
    const shopId = crypto.createHash("sha256").update(normalizedShop).digest("hex").substring(0, 16);

    await db.collection("shops").doc(shopId).set({
      name: shopName,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      location: new admin.firestore.GeoPoint(0, 0)
    }, { merge: true });

    const batch = db.batch();
    items.forEach((item, idx) => {
      const normName = normalizeProductName(item.rawName);
      const itemId = `${billId}_${idx}`;
      batch.set(db.collection("billItems").doc(itemId), {
        ...item,
        billId,
        userId,
        shopId,
        normalizedName: normName,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    const processedTimestamp = admin.firestore.FieldValue.serverTimestamp();

    batch.update(billRef, {
      shopId,
      shopName: shopName,
      status: "processed",
      totalAmount: items.reduce((acc, i) => acc + i.totalPrice, 0),
      processedAt: processedTimestamp,
      purchaseDate: processedTimestamp
    });

    await batch.commit();

  } catch (error: any) {
    console.error(`OCR failed for ${billId}:`, error);
    await billRef.update({
      status: "failed",
      errorMessage: error.message,
      failedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
});

export const healthCheck = onRequest({ region: "us-central1" }, (req, res) => {
  res.json({ ok: true, service: "billbuddy-backend", timestamp: new Date().toISOString() });
});

export const getBillComparison = onRequest({ region: "us-central1" }, handleGetBillComparison);
export const getCheapestShopsForItem = onRequest({ region: "us-central1" }, handleGetCheapestShopsForItem);
export const getSimilarProducts = onRequest({ region: "us-central1" }, handleGetSimilarProducts);
