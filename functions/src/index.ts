import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

// Minimal scaffolding for future implementation
export const helloWorld = functions.https.onRequest((request, response) => {
  response.send("Hello from Firebase!");
});
