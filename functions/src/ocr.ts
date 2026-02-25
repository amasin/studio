import * as logger from "firebase-functions/logger";
import {onObjectFinalized} from "firebase-functions/v2/storage";
import {ImageAnnotatorClient} from "@google-cloud/vision";
import {db} from "./firebase";
import {normalizeProductName} from "./normalize";
import * as crypto from "crypto";
import {parseOcrText} from "./ocr-parser";

const visionClient = new ImageAnnotatorClient();

export const ocrBill = onObjectFinalized({
  region: "us-central1",
  cpu: "gcf_gen1",
  timeoutSeconds: 300,
  memory: "512MiB",
}, async (event) => {
  const {bucket, name: filePath, contentType} = event.data;

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

  const billRef = db.collection("bills").doc(billId);

  try {
    // 1. Set initial status
    await billRef.set({
      userId,
      billImagePath: filePath,
      createdAt: new Date(),
      status: "pending_ocr",
      currency: "INR",
    }, {merge: true});


    // 2. Run OCR
    const [result] = await visionClient.documentTextDetection(`gs://${bucket}/${filePath}`);
    const fullText = result.fullTextAnnotation?.text;
    if (!fullText) {
      throw new Error("No text found in image.");
    }

    // 3. Store OCR text preview
    await billRef.update({ocrTextPreview: fullText.substring(0, 1000)});
    logger.info(`OCR text preview stored for bill: ${billId}. Length: ${fullText.length}`);


    // 4. Parse OCR text to extract items
    const parsedItems = parseOcrText(fullText);


    // 5. Delete existing items for idempotency
    const existingItems = await db.collection("billItems").where("billId", "==", billId).get();
    const deletePromises = existingItems.docs.map((doc) => doc.ref.delete());
    await Promise.all(deletePromises);


    // 6. Create new bill items
    const shopId = crypto.createHash("md5").update("default_shop").digest("hex"); // Placeholder
    const itemPromises = parsedItems.map((item, index) => {
      const billItemId = `${billId}_${index}`;
      return db.collection("billItems").doc(billItemId).set({
        ...item,
        billId,
        userId,
        shopId,
        normalizedName: normalizeProductName(item.rawName),
        category: "unknown",
        createdAt: new Date(),
      });
    });
    await Promise.all(itemPromises);


    // 7. Upsert shop
    await db.collection("shops").doc(shopId).set({
      name: "Default Shop",
      createdAt: new Date(),
    }, {merge: true});


    // 8. Update bill status to processed
    const updatePayload: any = {
      status: "processed",
      processedAt: new Date(),
    };
    if (parsedItems.length === 1 && parsedItems[0].rawName === "unknown item") {
      updatePayload.parseWarning = "NO_ITEMS_PARSED";
    }
    await billRef.update(updatePayload);

    logger.info(`Successfully processed bill: ${billId}`);
  } catch (error) {
    logger.error("Error processing bill:", error);
    await billRef.update({
      status: "failed",
      errorMessage: (error as Error).message,
      failedAt: new Date(),
    });
  }
});