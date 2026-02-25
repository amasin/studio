export function parseReceipt(ocrText: string): {
    shopName?: string;
    purchaseDate?: Date;
    totals?: { subTotal?: number; tax?: number; totalAmount?: number; currency?: string };
    items: Array<{ rawName: string; quantity?: number; unit?: string; unitPrice?: number; totalPrice?: number }>;
} {
    const lines = ocrText.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    const shopName = lines.length > 0 ? lines[0].substring(0, 60) : undefined;

    const items: Array<{ rawName: string; quantity?: number; unit?: string; unitPrice?: number; totalPrice?: number }> = [];

    // Simple price regex: looks for a number (optional decimals) at the end of the line
    const priceRegex = /[\s]+(\d+(?:\.\d{1,2})?)$/;

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(priceRegex);

        if (match) {
            const price = parseFloat(match[1]);
            const rawName = line.replace(priceRegex, "").trim();

            if (rawName) {
                items.push({
                    rawName,
                    unitPrice: price,
                    totalPrice: price,
                    quantity: 1,
                    unit: ""
                });
            }
        }
    }

    return {
        shopName,
        items
    };
}
