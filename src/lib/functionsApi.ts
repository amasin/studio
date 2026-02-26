import { auth, functions } from "./firebaseClient";
import { httpsCallable } from "firebase/functions";

const getAuthHeader = async () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not authenticated.");
  }
  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
  };
};

const getFunctionUrl = (name: string) => {
    const region = 'us-central1';
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    return `https://${region}-${projectId}.cloudfunctions.net/${name}`;
}

export const getBillComparison = async (billId: string) => {
  const headers = await getAuthHeader();
  const url = getFunctionUrl('getBillComparison');
  const response = await fetch(`${url}?billId=${billId}`, { headers });
  return response.json();
};

export const getCheapestShopsForItem = async (normalizedName: string, lat: number, lng: number, radiusKm: number = 5) => {
    const headers = await getAuthHeader();
    const url = getFunctionUrl('getCheapestShopsForItem');
    const response = await fetch(`${url}?normalizedName=${normalizedName}&lat=${lat}&lng=${lng}&radiusKm=${radiusKm}`, { headers });
    return response.json();
};

export const getSimilarProducts = async (normalizedName: string, category: string) => {
    const headers = await getAuthHeader();
    const url = getFunctionUrl('getSimilarProducts');
    const response = await fetch(`${url}?normalizedName=${normalizedName}&category=${category}`, { headers });
    return response.json();
};
