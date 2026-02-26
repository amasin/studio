import * as admin from 'firebase-admin';
import { Request, Response } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { combinedSimilarity } from './similarity';

/**
 * Verifies the Firebase Auth ID token in the Authorization header.
 * @param req The HTTPS request.
 * @returns The verified UID or throws an error.
 */
export async function verifyAuth(req: Request): Promise<string> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized: Missing or invalid Authorization header');
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken.uid;
  } catch (error) {
    logger.error('Auth verification failed:', error);
    throw new Error('Unauthorized: Token verification failed');
  }
}

/**
 * Calculates a simple bounding box for latitude/longitude.
 */
export function getBoundingBox(lat: number, lng: number, radiusKm: number) {
  // 1 degree of latitude is approx 111.32 km
  const latDelta = radiusKm / 111.32;
  // 1 degree of longitude is approx 111.32 * cos(lat) km
  const lngDelta = radiusKm / (111.32 * Math.cos(lat * (Math.PI / 180)));

  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  };
}

/**
 * API: getBillComparison
 */
export async function handleGetBillComparison(req: Request, res: Response) {
  try {
    const uid = await verifyAuth(req);
    const billId = req.query.billId as string;

    if (!billId) {
      res.status(400).json({ error: { code: 'invalid-argument', message: 'billId is required' } });
      return;
    }

    const db = admin.firestore();
    const billDoc = await db.collection('bills').doc(billId).get();

    if (!billDoc.exists) {
      res.status(404).json({ error: { code: 'not-found', message: 'Bill not found' } });
      return;
    }

    if (billDoc.data()?.userId !== uid) {
      res.status(403).json({ error: { code: 'permission-denied', message: 'Not authorized to view this bill' } });
      return;
    }

    const billItemsSnap = await db.collection('billItems').where('billId', '==', billId).get();
    const items = [];

    for (const itemDoc of billItemsSnap.docs) {
      const itemData = itemDoc.data();
      const normName = itemData.normalizedName;

      // Global Stats
      const globalStatDoc = await db.collection('globalItemStats').doc(normName).get();
      const globalData = globalStatDoc.exists ? globalStatDoc.data() : null;

      // Cheaper Shops
      const shopStatsSnap = await db.collection('shopItemStats')
        .where('normalizedName', '==', normName)
        .where('minUnitPrice', '<', itemData.unitPrice)
        .orderBy('minUnitPrice', 'asc')
        .limit(5)
        .get();

      const cheaperShopPrices = [];
      for (const statDoc of shopStatsSnap.docs) {
        const statData = statDoc.data();
        const shopDoc = await db.collection('shops').doc(statData.shopId).get();
        cheaperShopPrices.push({
          shopId: statData.shopId,
          shopName: shopDoc.data()?.name || 'Unknown Shop',
          unitPrice: statData.minUnitPrice,
        });
      }

      items.push({
        normalizedName: normName,
        rawName: itemData.rawName,
        userUnitPrice: itemData.unitPrice,
        minUnitPrice: globalData?.minUnitPrice || 0,
        avgUnitPrice: globalData?.avgUnitPrice || 0,
        cheaperShopPrices,
      });
    }

    res.json({ billId, items });
  } catch (error: any) {
    res.status(error.message.startsWith('Unauthorized') ? 401 : 500).json({ error: { message: error.message } });
  }
}

/**
 * API: getCheapestShopsForItem
 */
export async function handleGetCheapestShopsForItem(req: Request, res: Response) {
  try {
    await verifyAuth(req);
    const normalizedName = req.query.normalizedName as string;
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radiusKm = parseFloat(req.query.radiusKm as string) || 5;

    if (!normalizedName || isNaN(lat) || isNaN(lng)) {
      res.status(400).json({ error: { message: 'Missing parameters: normalizedName, lat, lng' } });
      return;
    }

    const validatedRadius = Math.max(0.5, Math.min(25, radiusKm));
    const bounds = getBoundingBox(lat, lng, validatedRadius);

    const db = admin.firestore();
    // Use latitude for range query, filter longitude and shops in memory
    const shopsSnap = await db.collection('shops')
      .where('location', '>=', new admin.firestore.GeoPoint(bounds.minLat, bounds.minLng))
      .where('location', '<=', new admin.firestore.GeoPoint(bounds.maxLat, bounds.maxLng))
      .limit(100)
      .get();

    const results = [];
    for (const shopDoc of shopsSnap.docs) {
      const shopData = shopDoc.data();
      const shopId = shopDoc.id;

      // Check if within longitude bounds manually for safety if query is too broad
      const shopLoc = shopData.location as admin.firestore.GeoPoint;
      if (shopLoc.longitude < bounds.minLng || shopLoc.longitude > bounds.maxLng) continue;

      const statDoc = await db.collection('shopItemStats').doc(`${shopId}_${normalizedName}`).get();
      if (statDoc.exists) {
        const statData = statDoc.data();
        if (statData && statData.occurrences > 0 && statData.minUnitPrice > 0) {
          results.push({
            shopId,
            shopName: shopData.name,
            minUnitPrice: statData.minUnitPrice,
            avgUnitPrice: statData.avgUnitPrice,
            occurrences: statData.occurrences,
          });
        }
      }
    }

    results.sort((a, b) => a.minUnitPrice - b.minUnitPrice);

    res.json({
      normalizedName,
      radiusKm: validatedRadius,
      results: results.slice(0, 20),
    });
  } catch (error: any) {
    res.status(error.message.startsWith('Unauthorized') ? 401 : 500).json({ error: { message: error.message } });
  }
}

/**
 * API: getSimilarProducts
 */
export async function handleGetSimilarProducts(req: Request, res: Response) {
  try {
    await verifyAuth(req);
    const normalizedName = req.query.normalizedName as string;
    const category = req.query.category as string;

    if (!normalizedName) {
      res.status(400).json({ error: { message: 'normalizedName is required' } });
      return;
    }

    const db = admin.firestore();
    let query: admin.firestore.Query = db.collection('globalItemStats');

    if (category) {
      query = query.where('category', '==', category);
    }
    
    // Limit candidates to avoid huge memory usage
    const candidatesSnap = await query.limit(200).get();
    const scores = [];

    for (const doc of candidatesSnap.docs) {
      const data = doc.data();
      if (data.normalizedName === normalizedName) continue;

      const score = combinedSimilarity(normalizedName, data.normalizedName);
      if (score > 0.3) { // Minimum threshold
        scores.push({ ...data, similarityScore: score });
      }
    }

    scores.sort((a, b) => b.similarityScore - a.similarityScore);
    const top10 = scores.slice(0, 10);

    const results = [];
    for (const candidate of top10) {
      const examplesSnap = await db.collection('itemRawExamples')
        .doc(candidate.normalizedName)
        .collection('examples')
        .limit(5)
        .get();
      
      const exampleRawNames = examplesSnap.docs.map(d => d.data().rawName);

      results.push({
        normalizedName: candidate.normalizedName,
        unit: candidate.unit,
        avgUnitPrice: candidate.avgUnitPrice,
        minUnitPrice: candidate.minUnitPrice,
        occurrences: candidate.occurrences,
        exampleRawNames,
        similarityScore: candidate.similarityScore,
      });
    }

    res.json({ normalizedName, category, results });
  } catch (error: any) {
    res.status(error.message.startsWith('Unauthorized') ? 401 : 500).json({ error: { message: error.message } });
  }
}
