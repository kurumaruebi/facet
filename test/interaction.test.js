import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { Window } from "happy-dom";
import {
  createParamsStore,
  installInteractionPrimitives,
  mountDocument,
} from "../src/interaction.js";

const window = new Window({ url: "http://localhost" });
globalThis.window = window;
globalThis.document = window.document;
globalThis.Node = window.Node;
globalThis.HTMLElement = window.HTMLElement;
globalThis.CSS = window.CSS;

beforeEach(() => {
  document.body.replaceChildren();
  installInteractionPrimitives();
});

describe("interaction runtime", () => {
  it("stores params and notifies subscribers only when values change", () => {
    const store = createParamsStore({ amount: 10 });
    const changes = [];
    store.subscribe((...args) => changes.push(args));
    store.set("amount", 10);
    store.set("amount", 20);
    assert.deepEqual(store.snapshot(), { amount: 20 });
    assert.deepEqual(changes, [["amount", 20]]);
  });

  it("routes LINK row selection to the target node", () => {
    const host = document.createElement("div");
    document.body.append(host);
    mountDocument({
      root: {
        type: "collection",
        children: [
          {
            type: "table",
            id: "results",
            rows: { source: "rows" },
            columns: [{ label: "Name", key: "name" }],
          },
          { type: "card", id: "detail", title: "{name}" },
        ],
      },
      data: { rows: [{ name: "Linked row" }] },
      links: [{ on: "results.select", target: "detail" }],
    }, host);

    host.querySelector("tbody tr").click();
    assert.equal(host.querySelector("#detail .facet-title").textContent, "Linked row");
  });

  it("re-renders bound controls when the params store changes", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const runtime = mountDocument({
      root: {
        type: "control",
        id: "amount",
        kind: "range",
        bind: "amount",
        min: 0,
        max: 100,
      },
      params: { amount: 25 },
    }, host);

    assert.equal(host.querySelector("input").value, "25");
    runtime.params.set("amount", 75);
    assert.equal(host.querySelector("input").value, "75");
  });

  it("emits the exact Gate resolution shape", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const events = [];
    let resolveEvent;
    const emitted = new Promise((resolve) => { resolveEvent = resolve; });
    mountDocument({
      root: {
        type: "gate",
        id: "approval",
        gate_id: "gate_123",
        action: "Apply",
        effect_summary: {
          reversibility: "revert",
          blast_radius: "one module",
        },
        resolutions: ["approve"],
      },
    }, host, {
      actor: "user_42",
      emit: (...args) => {
        events.push(args);
        resolveEvent();
      },
    });

    host.querySelector("button").click();
    await emitted;
    const event = events[0][2];
    assert.deepEqual(Object.keys(event).sort(), [
      "actor",
      "effect_summary_hash",
      "gate_id",
      "modifications",
      "resolution",
      "timestamp",
    ]);
    assert.equal(event.gate_id, "gate_123");
    assert.equal(event.resolution, "approve");
    assert.equal(event.actor, "user_42");
    assert.match(event.timestamp, /^\d{4}-\d{2}-\d{2}T/);
    assert.match(event.effect_summary_hash, /^sha256:[a-f0-9]{64}$/);
    assert.equal(event.modifications, null);
  });
});
