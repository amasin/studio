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
exports.handleGetSimilarProducts = exports.handleGetCheapestShopsForItem = exports.handleGetBillComparison = exports.getBoundingBox = exports.verifyAuth = void 0;
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
const similarity_1 = require("./similarity");
/**
 * Verifies the Firebase Auth ID token in the Authorization header.
 * @param {Request} req The HTTPS request.
 * @return {Promise<string>} The verified UID or throws an error.
 */
async function verifyAuth(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new Error("Unauthorized: Missing or invalid Authorization header");
    }
    const idToken = authHeader.split("Bearer ")[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        return decodedToken.uid;
    }
    catch (error) {
        logger.error("Auth verification failed:", error);
        throw new Error("Unauthorized: Token verification failed");
    }
}
exports.verifyAuth = verifyAuth;
/**
 * Calculates a simple bounding box for latitude/longitude.
 * @param {number} lat The latitude.
 * @param {number} lng The longitude.
 * @param {number} radiusKm The radius in kilometers.
 * @return {{minLat: number, maxLat: number, minLng: number, maxLng: number}}
 */
function getBoundingBox(lat, lng, radiusKm) {
    const latDelta = radiusKm / 111.32;
    const lngDelta = radiusKm / (111.32 * Math.cos(lat * (Math.PI / 180)));
    return {
        minLat: lat - latDelta,
        maxLat: lat + latDelta,
        minLng: lng - lngDelta,
        maxLng: lng + lngDelta,
    };
}
exports.getBoundingBox = getBoundingBox;
/**
 * API: getBillComparison
 * @param {Request} req The request object.
 * @param {Response} res The response object.
 * @return {Promise<void>}
 */
async function handleGetBillComparison(req, res) {
    try {
        const uid = await verifyAuth(req);
        const billId = req.query.billId;
        if (!billId) {
            res.status(400).json({
                error: { code: "invalid-argument", message: "billId is required" },
            });
            return;
        }
        const db = admin.firestore();
        const billDoc = await db.collection("bills").doc(billId).get();
        if (!billDoc.exists) {
            res.status(404).json({
                error: { code: "not-found", message: "Bill not found" },
            });
            return;
        }
        if (billDoc.data()?.userId !== uid) {
            res.status(403).json({
                error: {
                    code: "permission-denied",
                    message: "Not authorized to view this bill",
                },
            });
            return;
        }
        const billItemsSnap = await db.collection("billItems")
            .where("billId", "==", billId).get();
        const items = [];
        for (const itemDoc of billItemsSnap.docs) {
            const itemData = itemDoc.data();
            const normName = itemData.normalizedName;
            const globalStatDoc = await db.collection("globalItemStats")
                .doc(normName).get();
            const globalData = globalStatDoc.exists ? globalStatDoc.data() : null;
            const shopStatsSnap = await db.collection("shopItemStats")
                .where("normalizedName", "==", normName)
                .where("minUnitPrice", "<", itemData.unitPrice)
                .orderBy("minUnitPrice", "asc")
                .limit(5)
                .get();
            const cheaperShopPrices = [];
            for (const statDoc of shopStatsSnap.docs) {
                const statData = statDoc.data();
                const shopDoc = await db.collection("shops").doc(statData.shopId).get();
                cheaperShopPrices.push({
                    shopId: statData.shopId,
                    shopName: shopDoc.data()?.name || "Unknown Shop",
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
    }
    catch (error) {
        const message = error.message;
        res.status(message.startsWith("Unauthorized") ? 401 : 500)
            .json({ error: { message } });
    }
}
exports.handleGetBillComparison = handleGetBillComparison;
/**
 * API: getCheapestShopsForItem
 * @param {Request} req The request object.
 * @param {Response} res The response object.
 * @return {Promise<void>}
 */
async function handleGetCheapestShopsForItem(req, res) {
    try {
        await verifyAuth(req);
        const normalizedName = req.query.normalizedName;
        const lat = parseFloat(req.query.lat);
        const lng = parseFloat(req.query.lng);
        const radiusKm = parseFloat(req.query.radiusKm) || 5;
        if (!normalizedName || isNaN(lat) || isNaN(lng)) {
            res.status(400).json({
                error: { message: "Missing parameters: normalizedName, lat, lng" },
            });
            return;
        }
        const validatedRadius = Math.max(0.5, Math.min(25, radiusKm));
        const bounds = getBoundingBox(lat, lng, validatedRadius);
        const db = admin.firestore();
        const shopsSnap = await db.collection("shops")
            .where("location", ">=", new admin.firestore.GeoPoint(bounds.minLat, bounds.minLng))
            .where("location", "<=", new admin.firestore.GeoPoint(bounds.maxLat, bounds.maxLng))
            .limit(100)
            .get();
        const results = [];
        for (const shopDoc of shopsSnap.docs) {
            const shopData = shopDoc.data();
            const shopId = shopDoc.id;
            const shopLoc = shopData.location;
            if (shopLoc.longitude < bounds.minLng ||
                shopLoc.longitude > bounds.maxLng)
                continue;
            const statDoc = await db.collection("shopItemStats")
                .doc(`${shopId}_${normalizedName}`).get();
            if (statDoc.exists) {
                const statData = statDoc.data();
                if (statData && statData.occurrences > 0 &&
                    statData.minUnitPrice > 0) {
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
    }
    catch (error) {
        const message = error.message;
        res.status(message.startsWith("Unauthorized") ? 401 : 500)
            .json({ error: { message } });
    }
}
exports.handleGetCheapestShopsForItem = handleGetCheapestShopsForItem;
/**
 * API: getSimilarProducts
 * @param {Request} req The request object.
 * @param {Response} res The response object.
 * @return {Promise<void>}
 */
async function handleGetSimilarProducts(req, res) {
    try {
        await verifyAuth(req);
        const normalizedName = req.query.normalizedName;
        const category = req.query.category;
        if (!normalizedName) {
            res.status(400).json({ error: { message: "normalizedName is required" } });
            return;
        }
        const db = admin.firestore();
        let query = db.collection("globalItemStats");
        if (category) {
            query = query.where("category", "==", category);
        }
        const candidatesSnap = await query.limit(200).get();
        const scores = [];
        for (const doc of candidatesSnap.docs) {
            const data = doc.data();
            if (data.normalizedName === normalizedName)
                continue;
            const score = (0, similarity_1.combinedSimilarity)(normalizedName, data.normalizedName);
            if (score > 0.3) {
                scores.push({ ...data, similarityScore: score });
            }
        }
        scores.sort((a, b) => b.similarityScore - a.similarityScore);
        const top10 = scores.slice(0, 10);
        const results = [];
        for (const candidate of top10) {
            const examplesSnap = await db.collection("itemRawExamples")
                .doc(candidate.normalizedName)
                .collection("examples")
                .limit(5)
                .get();
            const exampleRawNames = examplesSnap.docs.map((d) => d.data().rawName);
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
    }
    catch (error) {
        const message = error.message;
        res.status(message.startsWith("Unauthorized") ? 401 : 500)
            .json({ error: { message } });
    }
}
exports.handleGetSimilarProducts = handleGetSimilarProducts;
//# sourceMappingURL=api.js.map