import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * Health check endpoint to verify backend connectivity.
 */
export const healthCheck = onRequest((request, response) => {
  response.json({
    ok: true,
    service: "billbuddy-backend",
    timestamp: new Date().toISOString(),
  });
});
