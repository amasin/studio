"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheck = void 0;
const https_1 = require("firebase-functions/v2/https");
exports.healthCheck = (0, https_1.onRequest)((req, res) => {
    res.status(200).send("OK");
});
//# sourceMappingURL=health.js.map