import { renderDocument } from "./renderer.js";
import "./styles.css";
import "./host.css";

const sample = {
  root: {
    type: "collection",
    id: "review_queue",
    title: "Agent review queue",
    subtitle: "One deterministic renderer, composed from typed primitives.",
    layout: "feed",
    children: [
      {
        type: "status",
        title: "Validation",
        state: "passed",
        message: "All checks completed",
        progress: 100,
        annotations: {
          freshness: { value: "just now" },
        },
      },
      {
        type: "diff",
        title: "Proposed change",
        before: "return renderUnsafe(input);",
        after: "return render(input, safeContext);",
        annotations: {
          confidence: { value: "96%" },
          risk: { value: "low" },
          provenance: { value: "Static analyzer finding #42" },
        },
      },
      {
        type: "table",
        title: "Affected checks",
        rows: { source: "checks" },
        columns: [
          { label: "Check", cell: { type: "text", bind: "name" } },
          { label: "Result", cell: { type: "status", state: "{state}", zoom: "summary" } },
          {
            label: "Duration",
            cell: { type: "chart", data: { bind: "trend" }, zoom: "summary" },
          },
        ],
      },
      {
        type: "gate",
        id: "merge_gate",
        action: "Approve and apply this change",
        children: [
          {
            type: "card",
            title: "Effect summary",
            fields: [
              { label: "Reversibility", value: "Fully reversible" },
              { label: "Blast radius", value: "Renderer package only" },
            ],
          },
        ],
      },
    ],
  },
  data: {
    checks: [
      { name: "Unit tests", state: "passed", trend: [1.2, 1.1, 1.3] },
      { name: "Schema validation", state: "passed", trend: [0.4, 0.5, 0.3] },
    ],
  },
  links: [],
  params: {},
};

const app = document.querySelector("#app");
const rendered = document.querySelector("#rendered");
const raw = document.querySelector("#raw");
const toggle = document.querySelector("#raw-toggle");
const fallbackButton = document.querySelector("#fallback-demo");

function show(doc) {
  rendered.replaceChildren(renderDocument(doc, {
    emit(event, nodeId, payload) {
      console.info("[Facet event]", { event, nodeId, payload });
    },
  }));
  raw.textContent = JSON.stringify(doc, null, 2);
}

toggle.addEventListener("change", () => {
  app.dataset.rawVisible = String(toggle.checked);
});

fallbackButton.addEventListener("click", () => {
  show({
    ...sample,
    root: {
      type: "hallucinated-dashboard",
      title: "Unknown primitive",
      payload: { proof: "The renderer degrades without throwing." },
    },
  });
});

show(sample);
