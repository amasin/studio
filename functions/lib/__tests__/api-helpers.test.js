"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("../api");
console.log("Running API Helpers tests...");
let passed = 0;
let failed = 0;
const lat = 34.0522;
const lng = -118.2437;
const radius = 5; // 5km
const bounds = (0, api_1.getBoundingBox)(lat, lng, radius);
if (bounds.minLat < lat) {
    passed++;
    console.log("  ✓ OK: minLat is less than lat");
}
else {
    failed++;
    console.error(`  ✗ FAIL: minLat (${bounds.minLat}) >= lat (${lat})`);
}
if (bounds.maxLat > lat) {
    passed++;
    console.log("  ✓ OK: maxLat is greater than lat");
}
else {
    failed++;
    console.error(`  ✗ FAIL: maxLat (${bounds.maxLat}) <= lat (${lat})`);
}
if (bounds.minLng < lng) {
    passed++;
    console.log("  ✓ OK: minLng is less than lng");
}
else {
    failed++;
    console.error(`  ✗ FAIL: minLng (${bounds.minLng}) >= lng (${lng})`);
}
if (bounds.maxLng > lng) {
    passed++;
    console.log("  ✓ OK: maxLng is greater than lng");
}
else {
    failed++;
    console.error(`  ✗ FAIL: maxLng (${bounds.maxLng}) <= lng (${lng})`);
}
// Rough check: 5km should be approx 0.045 degrees lat
const diff = Math.abs((bounds.maxLat - lat) - 0.045);
if (diff < 0.01) {
    passed++;
    console.log("  ✓ OK: latitude difference check");
}
else {
    failed++;
    console.error(`  ✗ FAIL: latitude difference check, expected 0.045, got ${bounds.maxLat - lat}`);
}
const boundsZero = (0, api_1.getBoundingBox)(0, 0, 0);
if (boundsZero.minLat === 0 && boundsZero.maxLat === 0) {
    passed++;
    console.log("  ✓ OK: zero radius check");
}
else {
    failed++;
    console.error("  ✗ FAIL: zero radius check");
}
console.log(`\nTests finished. Passed: ${passed}, Failed: ${failed}\n`);
if (failed > 0) {
    process.exit(1);
}
//# sourceMappingURL=api-helpers.test.js.map