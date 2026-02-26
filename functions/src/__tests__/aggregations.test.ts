import {updateAggregationsForBillItems} from "../aggregations";
import * as admin from "firebase-admin";
import * as crypto from "crypto";

describe("Aggregation Helpers", () => {
  it("should not process items with zero unit price", async () => {
    const billItems = [
      {
        rawName: "Test Item",
        normalizedName: "test item",
        category: "test",
        unit: "unit",
        unitPrice: 0,
      },
    ];

    // This is a mock of the firestore transaction
    const mockTransaction = {
      get: jest.fn(),
      set: jest.fn(),
      update: jest.fn(),
    };

    const mockDb = {
      runTransaction: jest.fn().mockImplementation(async (updateFunction) => {
        await updateFunction(mockTransaction);
      }),
    };
    jest.spyOn(admin, "firestore").mockReturnValue(
      mockDb as admin.firestore.Firestore
    );

    await updateAggregationsForBillItems({shopId: "test-shop", billItems});

    expect(mockDb.runTransaction).toHaveBeenCalled();
    expect(mockTransaction.set).not.toHaveBeenCalled();
    expect(mockTransaction.update).not.toHaveBeenCalled();
  });

  it("should generate a predictable exampleId", () => {
    const createExampleId = (
      normalizedName: string,
      rawName: string
    ): string => {
      const hash = crypto.createHash("sha1");
      hash.update(normalizedName);
      hash.update(rawName);
      return hash.digest("hex").substring(0, 10);
    };

    const id1 = createExampleId("milk", "Fresh Milk 1L");
    const id2 = createExampleId("milk", "Fresh Milk 1L");
    const id3 = createExampleId("MILK", "Fresh Milk 1L");

    expect(id1).toEqual(id2);
    expect(id1).not.toEqual(id3);
  });
});
