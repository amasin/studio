import * as admin from "firebase-admin";
import {initializeApp} from "firebase-admin/app";

if (admin.apps.length === 0) {
  initializeApp();
}

export const db = admin.firestore();
