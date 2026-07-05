import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { Window } from "happy-dom";
import {
  PRIMITIVES,
  TYPES,
  registerPrimitive,
  render,
  renderDocument,
  resolveBind,
} from "../src/renderer.js";

const window = new Window();
globalThis.window = window;
globalThis.document = window.document;
globalThis.Node = window.Node;
globalThis.HTMLElement = window.HTMLElement;

beforeEach(() => {
  document.body.replaceChildren();
});

describe("renderer contract", () => {
  it("registers the closed vocabulary of 14 primitives", () => {
    assert.equal(TYPES.length, 14);
    assert.deepEqual(Object.keys(PRIMITIVES).sort(), [...TYPES].sort());
  });

  it("resolves dotted bindings from local scope before document data", () => {
    const ctx = { data: { user: { name: "root" } }, scope: { user: { name: "row" } } };
    assert.equal(resolveBind("user.name", ctx), "row");
  });

  it("renders a valid document root", () => {
    const result = renderDocument({
      root: { type: "text", bind: "message" },
      data: { message: "Hello Facet" },
    });
    assert.equal(result.textContent, "Hello Facet");
    assert(result.classList.contains("facet-node--text"));
  });

  it("never throws for unknown, null, cyclic, or failed nodes", () => {
    const cyclic = { type: "unknown" };
    cyclic.self = cyclic;

    for (const node of [null, {}, { type: "unknown" }, cyclic]) {
      assert.doesNotThrow(() => render(node));
      assert.equal(render(node).dataset.fallback, "true");
    }

    const original = PRIMITIVES.text;
    registerPrimitive("text", () => {
      throw new Error("primitive failed");
    });
    try {
      assert.doesNotThrow(() => render({ type: "text", text: "bad" }));
      assert.equal(render({ type: "text", text: "bad" }).dataset.fallback, "true");
    } finally {
      registerPrimitive("text", original);
    }
  });

  it("supports NEST including a chart inside a table cell", () => {
    const result = renderDocument({
      root: {
        type: "table",
        rows: { source: "rows" },
        columns: [
          { label: "Name", cell: { type: "text", bind: "name" } },
          { label: "Trend", cell: { type: "chart", data: { bind: "trend" } } },
        ],
      },
      data: { rows: [{ name: "Alpha", trend: [2, 4, 3] }] },
    });

    assert.equal(result.querySelector("tbody .facet-text").textContent, "Alpha");
    assert.equal(result.querySelectorAll("tbody .facet-chart__bar").length, 3);
  });

  it("maps all fixed annotations to deterministic affordances", () => {
    const result = render({
      type: "card",
      title: "Annotated",
      annotations: {
        confidence: { value: "95%" },
        provenance: { value: "source.json" },
        freshness: { value: "2m" },
        uncertainty: { value: "±3" },
        risk: { value: "medium" },
      },
    });

    for (const kind of ["confidence", "provenance", "freshness", "uncertainty", "risk"]) {
      assert(result.querySelector(`.facet-annotation--${kind}`), `${kind} affordance missing`);
    }
  });

  it("marks summary and full zoom levels without changing the renderer API", () => {
    assert.equal(render({ type: "card", zoom: "summary" }).dataset.zoom, "summary");
    assert.equal(render({ type: "card", zoom: "full" }).dataset.zoom, "full");
  });

  it("emits row selections through the shared ctx interface", () => {
    const events = [];
    const result = renderDocument({
      root: {
        type: "table",
        id: "results",
        rows: [{ name: "Selected" }],
        columns: [{ label: "Name", key: "name" }],
      },
    }, {
      emit: (...args) => events.push(args),
    });

    result.querySelector("tbody tr").click();
    assert.deepEqual(events, [["select", "results", { name: "Selected" }]]);

    const keyboardEvent = new window.KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
    });
    result.querySelector("tbody tr").dispatchEvent(keyboardEvent);
    assert.deepEqual(events[1], ["select", "results", { name: "Selected" }]);
  });

  it("degrades unsafe link and media protocols instead of navigating or fetching", () => {
    const link = render({ type: "text", text: "unsafe", href: "javascript:alert(1)" });
    const media = render({ type: "media", kind: "file", src: "javascript:alert(1)" });
    assert.equal(link.dataset.fallback, "true");
    assert.equal(media.dataset.fallback, "true");
  });

  it("lets the interaction layer replace the gate slot", () => {
    const original = PRIMITIVES.gate;
    registerPrimitive("gate", () => {
      const output = document.createElement("button");
      output.textContent = "Approve";
      return output;
    });
    try {
      assert.equal(render({ type: "gate" }).textContent, "Approve");
    } finally {
      registerPrimitive("gate", original);
    }
  });

  it("renders card fields, collections, trees, graphs, and timelines", () => {
    const card = render({
      type: "card",
      title: "Record",
      fields: [
        { label: "Amount", value: 1200, format: "number" },
        { label: "Missing", bind: "missing" },
      ],
    });
    assert.equal(card.querySelectorAll("dt").length, 2);
    assert.match(card.textContent, /1,200/);

    const collection = render({
      type: "collection",
      layout: "grid",
      items: [{ name: "One" }, { name: "Two" }],
      item: { type: "text", bind: "name" },
    });
    assert.deepEqual(
      [...collection.querySelectorAll(".facet-text")].map((node) => node.textContent),
      ["One", "Two"],
    );

    const tree = render({
      type: "tree",
      items: [{
        label: "Root",
        children: [{ label: "Leaf" }],
      }],
    });
    assert.equal(tree.querySelectorAll("details").length, 2);

    const graph = render({
      type: "graph",
      nodes: [{ id: "a", label: "A" }, { id: "b", label: "B" }],
      edges: [{ from: "a", to: "b" }],
    });
    assert.equal(graph.querySelectorAll(".facet-graph__node").length, 2);
    assert.match(graph.textContent, /a → b/);

    const timeline = render({
      type: "timeline",
      items: [
        { time: "Now", title: "Started", description: "Running" },
        { type: "text", text: "Nested event" },
      ],
    });
    assert.equal(timeline.querySelectorAll(".facet-timeline__event").length, 2);
    assert.match(timeline.textContent, /Nested event/);
  });

  it("renders chart, map, media, diff, and status states", () => {
    const emptyChart = render({ type: "chart", data: [] });
    assert.match(emptyChart.textContent, /No chart data/);

    const map = render({
      type: "map",
      points: [{ label: "HQ", x: 30, y: 40 }],
    });
    assert.equal(map.querySelector(".facet-map__marker").textContent, "HQ");
    assert.match(render({ type: "map" }).textContent, /Map/);

    const image = render({
      type: "media",
      kind: "image",
      src: "https://example.com/image.png",
      alt: "Preview",
      caption: "Image caption",
    });
    assert.equal(image.querySelector("img").alt, "Preview");
    assert.match(image.textContent, /Image caption/);

    const audio = render({
      type: "media",
      kind: "audio",
      src: "https://example.com/audio.mp3",
    });
    assert(audio.querySelector("audio").controls);

    const file = render({
      type: "media",
      kind: "file",
      src: "https://example.com/report.pdf",
      label: "Report",
    });
    assert.equal(file.querySelector("a").textContent, "Report");

    const diff = render({
      type: "diff",
      before: { bind: "before" },
      after: { bind: "after" },
      children: [{ type: "text", text: "Evidence" }],
    }, {
      data: { before: "old", after: "new" },
    });
    assert.match(diff.textContent, /old/);
    assert.match(diff.textContent, /new/);
    assert.match(diff.textContent, /Evidence/);

    const status = render({
      type: "status",
      state: "running",
      message: "Working",
      progress: 50,
      logs: ["one", "two"],
    });
    assert.equal(status.querySelector("progress").value, 50);
    assert.match(status.querySelector("pre").textContent, /one\ntwo/);
  });

  it("renders and emits every control kind", () => {
    const values = new Map([
      ["choice", "b"],
      ["toggle", false],
      ["text", "initial"],
    ]);
    const changes = [];
    const ctx = {
      params: {
        get: (name) => values.get(name),
        set: (name, value) => {
          values.set(name, value);
          changes.push([name, value]);
        },
      },
      emit: (event, id, payload) => changes.push([event, id, payload]),
    };

    const choice = render({
      type: "control",
      id: "choice-control",
      kind: "choice",
      bind: "choice",
      options: [{ label: "A", value: "a" }, "b"],
    }, ctx);
    assert.equal(choice.querySelector("select").value, "b");
    choice.querySelector("select").value = "a";
    choice.querySelector("select").dispatchEvent(new window.Event("input"));

    const toggle = render({
      type: "control",
      id: "toggle-control",
      kind: "toggle",
      bind: "toggle",
    }, ctx);
    toggle.querySelector("input").checked = true;
    toggle.querySelector("input").dispatchEvent(new window.Event("input"));

    const text = render({
      type: "control",
      id: "text-control",
      kind: "field",
      bind: "text",
      placeholder: "Type",
    }, ctx);
    text.querySelector("input").value = "updated";
    text.querySelector("input").dispatchEvent(new window.Event("input"));

    assert.deepEqual(values.get("choice"), "a");
    assert.equal(values.get("toggle"), true);
    assert.equal(values.get("text"), "updated");
    assert.equal(changes.filter(([event]) => event === "change").length, 3);
  });

  it("formats bound text values and handles invalid documents", () => {
    const currency = render(
      { type: "text", bind: "price", format: "currency" },
      { data: { price: 12.5 } },
    );
    assert.match(currency.textContent, /12\.50/);

    const date = render(
      { type: "text", bind: "date", format: "date" },
      { data: { date: "2026-07-05T00:00:00Z" } },
    );
    assert(date.textContent.length > 0);
    assert.equal(renderDocument(null).dataset.fallback, "true");
  });
});
