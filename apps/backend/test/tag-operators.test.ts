import assert from "node:assert/strict";
import test from "node:test";
import {
  compareTagValue,
  validateTagComparisonValue,
} from "../src/tag-operators.ts";

test("tag operators compare numeric strings and numeric config values", () => {
  assert.equal(compareTagValue("42", "greaterThan", 40, false), true);
  assert.equal(compareTagValue("42", "lessThanOrEqual", 42, false), true);
  assert.equal(compareTagValue("not-a-number", "greaterThan", 1, false), false);
});

test("tag operators compare ISO dates and Unix timestamps", () => {
  assert.equal(
    compareTagValue("2026-09-01T12:00:00.000Z", "after", "2026-01-01T00:00:00Z", false),
    true
  );
  assert.equal(compareTagValue("1767225600", "beforeOrAt", 1_767_225_600_000, false), true);
});

test("tag operator validation rejects values of the wrong kind", () => {
  assert.match(
    validateTagComparisonValue("greaterThan", "many", false) ?? "",
    /finite number/
  );
  assert.match(
    validateTagComparisonValue("before", "eventually", false) ?? "",
    /ISO 8601 date or Unix timestamp/
  );
});
