import { mountDocument } from "./interaction.js";
import gstack from "../examples/gstack.json";
import linzumi from "../examples/linzumi.json";
import crustdata from "../examples/crustdata.json";
import jinba from "../examples/jinba.json";
import agent_scrub from "../examples/agent_scrub.json";
import "./styles.css";
import "./host.css";

const demos = { gstack, linzumi, crustdata, jinba, agent_scrub };
const app = document.querySelector("#app");
const rendered = document.querySelector("#rendered");
const raw = document.querySelector("#raw");
const treeView = document.querySelector("#tree-view");
const toggle = document.querySelector("#raw-toggle");
const demoSelect = document.querySelector("#demo-select");
const fallbackButton = document.querySelector("#fallback-demo");

const tabRaw = document.querySelector("#tab-raw");
const tabTree = document.querySelector("#tab-tree");

const liveInput = document.querySelector("#live-input");
const liveEmit = document.querySelector("#live-emit");

let runtime;

const scrubSteps = [
  { progress: 20, current_tool: "read_file", tool_status: "success", tool_output: "Read src/renderer.js successfully.", before_code: "const VERSION = '0.0.9';", after_code: "const VERSION = '0.0.9';" },
  { progress: 40, current_tool: "grep_search", tool_status: "success", tool_output: "Found 'renderUnsafe' call in preview.js", before_code: "return renderUnsafe(input);", after_code: "return renderUnsafe(input);" },
  { progress: 60, current_tool: "edit_file", tool_status: "success", tool_output: "Modified preview.js to call secure renderer", before_code: "return renderUnsafe(input);", after_code: "return render(input, safeContext);" },
  { progress: 80, current_tool: "run_command", tool_status: "success", tool_output: "Ran npm test. All tests passed.", before_code: "All green", after_code: "All green" },
  { progress: 100, current_tool: "gate", tool_status: "pending", tool_output: "Waiting for human approval to merge.", before_code: "Feature branch", after_code: "Main branch" }
];

function renderTreeElement(node) {
  const item = document.createElement("div");
  item.className = "tree-node";

  const summary = document.createElement("div");
  summary.className = "tree-node__summary";

  const mark = document.createElement("span");
  mark.textContent = "•";
  summary.append(mark);

  const typeEl = document.createElement("span");
  typeEl.className = "tree-node__type";
  typeEl.textContent = node.type;
  summary.append(typeEl);

  if (node.id) {
    const idEl = document.createElement("span");
    idEl.className = "tree-node__id";
    idEl.textContent = `(#${node.id})`;
    summary.append(idEl);
  }
  item.append(summary);

  const childNodes = [];
  if (Array.isArray(node.children)) childNodes.push(...node.children);
  if (Array.isArray(node.evidence)) childNodes.push(...node.evidence);
  if (node.cell && typeof node.cell === "object") childNodes.push(node.cell);
  if (Array.isArray(node.columns)) {
    node.columns.forEach((col) => {
      if (col.cell && typeof col.cell === "object") {
        childNodes.push({
          type: `column: ${col.label || col.key || "cell"}`,
          children: [col.cell],
        });
      }
    });
  }

  if (childNodes.length) {
    const childrenContainer = document.createElement("div");
    childrenContainer.className = "tree-node__children";
    childNodes.forEach((child) => {
      childrenContainer.append(renderTreeElement(child));
    });
    item.append(childrenContainer);
  }

  return item;
}

function updateTreeView(doc) {
  treeView.replaceChildren();
  if (doc && doc.root) {
    treeView.append(renderTreeElement(doc.root));
  }
}

function show(doc) {
  runtime?.destroy();
  
  if (doc.root.id === "agent_scrub_dashboard") {
    const stepIdx = doc.params?.step_idx || 1;
    Object.assign(doc.data, scrubSteps[stepIdx - 1]);
  }

  runtime = mountDocument(doc, rendered, {
    actor: "demo-user",
    emit(event, nodeId, payload) {
      console.info("[Facet event]", { event, nodeId, payload });
    },
  });
  raw.textContent = JSON.stringify(doc, null, 2);
  updateTreeView(doc);

  if (doc.root.id === "agent_scrub_dashboard") {
    runtime.params.subscribe((name, value) => {
      if (name === "step_idx") {
        const idx = Math.min(5, Math.max(1, Number(value)));
        Object.assign(doc.data, scrubSteps[idx - 1]);
        runtime.render();
        raw.textContent = JSON.stringify(doc, null, 2);
        updateTreeView(doc);
      }
    });
  }
}

toggle.addEventListener("change", () => {
  app.dataset.rawVisible = String(toggle.checked);
});

demoSelect.addEventListener("change", () => show(demos[demoSelect.value]));

tabRaw.addEventListener("click", () => {
  tabRaw.classList.add("active");
  tabTree.classList.remove("active");
  raw.style.display = "block";
  treeView.style.display = "none";
});

tabTree.addEventListener("click", () => {
  tabTree.classList.add("active");
  tabRaw.classList.remove("active");
  raw.style.display = "none";
  treeView.style.display = "block";
});

liveEmit.addEventListener("click", () => {
  const promptText = liveInput.value.trim();
  if (!promptText) return;

  let matchedDoc;
  const lowerPrompt = promptText.toLowerCase();

  if (lowerPrompt.includes("flight") || lowerPrompt.includes("travel")) {
    matchedDoc = JSON.parse(JSON.stringify(demos.crustdata));
    matchedDoc.root.title = `Live UI: ${promptText}`;
  } else if (lowerPrompt.includes("migration") || lowerPrompt.includes("database")) {
    matchedDoc = JSON.parse(JSON.stringify(demos.linzumi));
    matchedDoc.root.title = `Live UI: ${promptText}`;
  } else if (lowerPrompt.includes("workflow") || lowerPrompt.includes("compliance") || lowerPrompt.includes("step")) {
    matchedDoc = JSON.parse(JSON.stringify(demos.jinba));
    matchedDoc.root.title = `Live UI: ${promptText}`;
  } else if (lowerPrompt.includes("scrub") || lowerPrompt.includes("timeline")) {
    matchedDoc = JSON.parse(JSON.stringify(demos.agent_scrub));
    matchedDoc.root.title = `Live UI: ${promptText}`;
  } else {
    matchedDoc = {
      root: {
        type: "card",
        id: "live_fallback_card",
        title: `Generated UI: ${promptText}`,
        subtitle: "Extracted from prompt automatically",
        text: "The model analyzed the prompt and returned a standard content card."
      },
      data: {},
      links: [],
      params: {}
    };
  }

  show(matchedDoc);
});

fallbackButton.addEventListener("click", () => {
  show({
    root: {
      type: "hallucinated-dashboard",
      title: "Unknown primitive",
      payload: { proof: "The renderer degrades without throwing." },
    },
    data: {},
    links: [],
    params: {},
  });
});

show(demos.gstack);
