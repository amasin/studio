import { onRequest } from 'firebase-functions/v2/https';
import { handleGetBillComparison, handleGetCheapestShopsForItem, handleGetSimilarProducts } from './api';

export { healthCheck } from "./health";
export { processBillUpload } from "./ocr";

// HTTPS APIs
export const getBillComparison = onRequest({ region: 'us-central1' }, handleGetBillComparison);
export const getCheapestShopsForItem = onRequest({ region: 'us-central1' }, handleGetCheapestShopsForItem);
export const getSimilarProducts = onRequest({ region: 'us-central1' }, handleGetSimilarProducts);
