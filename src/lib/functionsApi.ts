import { auth } from "./firebaseClient";

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
  const region = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION || 'us-central1';
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const useEmulators = process.env.NEXT_PUBLIC_USE_EMULATORS === "true";
  const emulatorHost = process.env.NEXT_PUBLIC_FUNCTIONS_EMULATOR_HOST || 'localhost:5001';

  if (useEmulators) {
    // Emulator URL format: http://localhost:5001/<projectId>/<region>/<functionName>
    return `http://${emulatorHost}/${projectId}/${region}/${name}`;
  }

  // Production URL format: https://<region>-<projectId>.cloudfunctions.net/<functionName>
  return `https://${region}-${projectId}.cloudfunctions.net/${name}`;
};

/**
 * Enhanced fetch helper that handles auth tokens and surfaces better error info.
 */
const apiFetch = async (functionName: string, queryParams: Record<string, string> = {}) => {
  const headers = await getAuthHeader();
  const baseUrl = getFunctionUrl(functionName);
  const url = new URL(baseUrl);
  
  Object.entries(queryParams).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const response = await fetch(url.toString(), { 
    headers,
    method: 'GET' // Default to GET for these specific APIs
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorJson;
    try {
      errorJson = JSON.parse(errorText);
    } catch (e) {
      errorJson = { message: errorText };
    }
    throw new Error(`API Error (${response.status} ${response.statusText}): ${errorJson.error?.message || errorJson.message || 'Unknown error'}`);
  }

  return response.json();
};

export const getBillComparison = async (billId: string) => {
  return apiFetch('getBillComparison', { billId });
};

export const getCheapestShopsForItem = async (normalizedName: string, lat: number, lng: number, radiusKm: number = 5) => {
  return apiFetch('getCheapestShopsForItem', { 
    normalizedName, 
    lat: lat.toString(), 
    lng: lng.toString(), 
    radiusKm: radiusKm.toString() 
  });
};

export const getSimilarProducts = async (normalizedName: string, category: string) => {
  return apiFetch('getSimilarProducts', { normalizedName, category });
};

export const pingHealthCheck = async () => {
  return apiFetch('healthCheck');
};
