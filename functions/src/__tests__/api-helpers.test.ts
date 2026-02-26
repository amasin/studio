import {getBoundingBox} from "../api";

describe("API Helpers", () => {
  describe("getBoundingBox", () => {
    it("should calculate valid bounds for a given radius", () => {
      const lat = 34.0522;
      const lng = -118.2437;
      const radius = 5; // 5km

      const bounds = getBoundingBox(lat, lng, radius);

      expect(bounds.minLat).toBeLessThan(lat);
      expect(bounds.maxLat).toBeGreaterThan(lat);
      expect(bounds.minLng).toBeLessThan(lng);
      expect(bounds.maxLng).toBeGreaterThan(lng);

      // Rough check: 5km should be approx 0.045 degrees lat
      expect(bounds.maxLat - lat).toBeCloseTo(0.045, 2);
    });

    it("should handle zero radius gracefully (though UI restricts it)", () => {
      const lat = 0;
      const lng = 0;
      const bounds = getBoundingBox(lat, lng, 0);
      expect(bounds.minLat).toBe(0);
      expect(bounds.maxLat).toBe(0);
    });
  });
});
