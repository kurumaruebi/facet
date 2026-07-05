import { mountDocument } from "./interaction.js";
import gstack from "../examples/gstack.json";
import linzumi from "../examples/linzumi.json";
import crustdata from "../examples/crustdata.json";
import jinba from "../examples/jinba.json";
import "./styles.css";
import "./host.css";

const demos = { gstack, linzumi, crustdata, jinba };
const app = document.querySelector("#app");
const rendered = document.querySelector("#rendered");
const raw = document.querySelector("#raw");
const toggle = document.querySelector("#raw-toggle");
const demoSelect = document.querySelector("#demo-select");
const fallbackButton = document.querySelector("#fallback-demo");
let runtime;

function show(doc) {
  runtime?.destroy();
  runtime = mountDocument(doc, rendered, {
    actor: "demo-user",
    emit(event, nodeId, payload) {
      console.info("[Facet event]", { event, nodeId, payload });
    },
  });
  raw.textContent = JSON.stringify(doc, null, 2);
}

toggle.addEventListener("change", () => {
  app.dataset.rawVisible = String(toggle.checked);
});

demoSelect.addEventListener("change", () => show(demos[demoSelect.value]));

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
