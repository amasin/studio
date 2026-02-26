/**
 * Parses receipt text to extract shop name and items.
 * @param ocrText The text from OCR.
 * @return The parsed data, including shop name and a list of items.
 */
export function parseReceipt(ocrText: string): {
  shopName?: string;
  items: Array<{
    rawName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
} {
  const lines = ocrText.split("\n").filter((line) => line.trim().length > 0);
  const shopName = lines[0]?.substring(0, 60);

  const items = [];
  const priceRegex = /(\d+\.\d{2})$/;

  for (const line of lines) {
    const match = line.match(priceRegex);
    if (match) {
      const unitPrice = parseFloat(match[1]);
      const rawName = line.substring(0, match.index).trim();
      if (rawName) {
        items.push({
          rawName,
          quantity: 1,
          unitPrice,
          totalPrice: unitPrice,
        });
      }
    }
  }

  return {shopName, items};
}
