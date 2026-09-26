import assert from "node:assert/strict";
import test from "node:test";
import {
  defaultVersionsPageSize,
  defaultVersionsPageSizeStep,
  getVersionsPageSize,
  getVersionsPageSizeStep,
} from "../src/server.config.ts";

test("versions page size defaults to 50", () => {
  assert.equal(defaultVersionsPageSize, 50);
  assert.equal(getVersionsPageSize({}), 50);
});

test("versions page size accepts values from 1 to 1000", () => {
  assert.equal(getVersionsPageSize({ LOADRY_VERSIONS_PAGE_SIZE: "1" }), 1);
  assert.equal(getVersionsPageSize({ LOADRY_VERSIONS_PAGE_SIZE: "75" }), 75);
  assert.equal(getVersionsPageSize({ LOADRY_VERSIONS_PAGE_SIZE: "1000" }), 1000);
});

test("invalid versions page sizes use the default", () => {
  assert.equal(getVersionsPageSize({ LOADRY_VERSIONS_PAGE_SIZE: "0" }), 50);
  assert.equal(getVersionsPageSize({ LOADRY_VERSIONS_PAGE_SIZE: "1001" }), 50);
  assert.equal(getVersionsPageSize({ LOADRY_VERSIONS_PAGE_SIZE: "invalid" }), 50);
});

test("versions page size step defaults to 5", () => {
  assert.equal(defaultVersionsPageSizeStep, 5);
  assert.equal(getVersionsPageSizeStep({}), 5);
});

test("versions page size step accepts divisors of the maximum page size", () => {
  assert.equal(getVersionsPageSizeStep({ LOADRY_VERSIONS_PAGE_SIZE_STEP: "10" }), 10);
  assert.equal(
    getVersionsPageSizeStep(
      {
        LOADRY_VERSIONS_PAGE_SIZE: "75",
        LOADRY_VERSIONS_PAGE_SIZE_STEP: "15",
      },
      75
    ),
    15
  );
});

test("invalid versions page size steps use a compatible default", () => {
  assert.equal(getVersionsPageSizeStep({ LOADRY_VERSIONS_PAGE_SIZE_STEP: "0" }), 5);
  assert.equal(getVersionsPageSizeStep({ LOADRY_VERSIONS_PAGE_SIZE_STEP: "6" }), 5);
  assert.equal(getVersionsPageSizeStep({}, 7), 1);
});
