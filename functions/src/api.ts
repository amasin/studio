
import * as admin from "firebase-admin";
import { Request } from "firebase-functions/v2/https";
import { Response } from "express";
import { combinedSimilarity } from "./similarity";

async function verifyAuth(req: Request): Promise<string> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");
  const token = authHeader.split("Bearer ")[1];
  const decoded = await admin.auth().verifyIdToken(token);
  return decoded.uid;
}

export async function handleGetBillComparison(req: Request, res: Response) {
  try {
    const uid = await verifyAuth(req);
    const billId = req.query.billId as string;
    const db = admin.firestore();
    
    const billDoc = await db.collection("bills").doc(billId).get();
    if (!billDoc.exists || billDoc.data()?.userId !== uid) {
      return res.status(403).json({ error: { message: "Access denied" } });
    }

    const itemsSnap = await db.collection("billItems").where("billId", "==", billId).get();
    const items = itemsSnap.docs.map(d => d.data());

    // Comparison logic would go here, joining with stats collections
    res.json({ billId, items });
  } catch (e: any) {
    res.status(500).json({ error: { message: e.message } });
  }
}

export async function handleGetCheapestShopsForItem(req: Request, res: Response) {
  try {
    await verifyAuth(req);
    // Bounding box logic for nearby shops
    res.json({ results: [] });
  } catch (e: any) {
    res.status(500).json({ error: { message: e.message } });
  }
}

export async function handleGetSimilarProducts(req: Request, res: Response) {
  try {
    await verifyAuth(req);
    res.json({ results: [] });
  } catch (e: any) {
    res.status(500).json({ error: { message: e.message } });
  }
}
