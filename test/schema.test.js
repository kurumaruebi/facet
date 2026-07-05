import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";

const schema = JSON.parse(readFileSync(new URL("../schema/facet.schema.json", import.meta.url)));
const validate = new Ajv2020({ strict: true }).compile(schema);
const names = ["gstack", "linzumi", "crustdata", "jinba", "agent_scrub"];

describe("Facet JSON Schema", () => {
  for (const name of names) {
    it(`validates the ${name} demo`, () => {
      const doc = JSON.parse(
        readFileSync(new URL(`../examples/${name}.json`, import.meta.url)),
      );
      assert.equal(validate(doc), true, JSON.stringify(validate.errors));
    });
  }

  it("rejects unsupported primitive types", () => {
    assert.equal(validate({ root: { type: "dashboard" } }), false);
    assert(validate.errors.some((error) => error.keyword === "enum"));
  });

  it("rejects unknown annotation affordances", () => {
    assert.equal(validate({
      root: {
        type: "text",
        annotations: { sentiment: { value: "positive" } },
      },
    }), false);
  });

  it("rejects Gate resolution values outside the event contract", () => {
    assert.equal(validate({
      root: {
        type: "gate",
        resolutions: ["approve", "execute"],
      },
    }), false);
  });
});
