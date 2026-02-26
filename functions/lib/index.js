"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSimilarProducts = exports.getCheapestShopsForItem = exports.getBillComparison = exports.processBillUpload = exports.healthCheck = void 0;
const https_1 = require("firebase-functions/v2/https");
const api_1 = require("./api");
var health_1 = require("./health");
Object.defineProperty(exports, "healthCheck", { enumerable: true, get: function () { return health_1.healthCheck; } });
var ocr_1 = require("./ocr");
Object.defineProperty(exports, "processBillUpload", { enumerable: true, get: function () { return ocr_1.processBillUpload; } });
// HTTPS APIs
exports.getBillComparison = (0, https_1.onRequest)({ region: "us-central1" }, api_1.handleGetBillComparison);
exports.getCheapestShopsForItem = (0, https_1.onRequest)({ region: "us-central1" }, api_1.handleGetCheapestShopsForItem);
exports.getSimilarProducts = (0, https_1.onRequest)({ region: "us-central1" }, api_1.handleGetSimilarProducts);
//# sourceMappingURL=index.js.map