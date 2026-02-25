import {onRequest} from "firebase-functions/v2/https";

export const healthCheck = onRequest((req, res) => {
  res.status(200).send("OK");
});
