import { registerPrimitive, render, renderDocument, resolve } from "./renderer.js";

function element(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text != null) el.textContent = String(text);
  return el;
}

function append(parent, ...children) {
  children.flat().filter(Boolean).forEach((child) => parent.append(child));
  return parent;
}

function canonicalJSON(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJSON).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => (
      `${JSON.stringify(key)}:${canonicalJSON(value[key])}`
    )).join(",")}}`;
  }
  return JSON.stringify(value);
}

async function effectHash(value) {
  const content = new TextEncoder().encode(canonicalJSON(value ?? null));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", content);
  return `sha256:${[...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")}`;
}

function gateSummary(node, ctx) {
  const summary = node.effect_summary ?? node.effects ?? {};
  return {
    action: resolve(node.action ?? node.title ?? "Approval required", ctx),
    reversibility: resolve(
      summary.reversibility ?? node.reversibility ?? "Not specified",
      ctx,
    ),
    blast_radius: resolve(
      summary.blast_radius ?? node.blast_radius ?? "Not specified",
      ctx,
    ),
  };
}

export function renderGate(node, ctx) {
  const gate = element("section", "facet-gate");
  const summary = gateSummary(node, ctx);
  const header = element("header", "facet-header");
  append(
    header,
    element("h3", "facet-title", summary.action),
    node.description
      ? element("p", "facet-subtitle", resolve(node.description, ctx))
      : null,
  );

  const facts = element("dl", "facet-fields facet-gate__effects");
  append(
    facts,
    element("dt", "facet-field__label", "Reversibility"),
    element("dd", "facet-field__value", summary.reversibility),
    element("dt", "facet-field__label", "Blast radius"),
    element("dd", "facet-field__value", summary.blast_radius),
  );

  const evidence = element("div", "facet-children facet-gate__evidence");
  (node.children ?? node.evidence ?? []).forEach((child) => append(evidence, render(child, ctx)));

  const comment = element("textarea", "facet-gate__comment");
  comment.placeholder = "Optional comment";
  comment.setAttribute("aria-label", "Gate comment");

  const actions = element("div", "facet-gate__actions");
  const allowed = node.resolutions ?? ["approve", "deny", "modify"];
  if (
    !Array.isArray(allowed)
    || !allowed.length
    || allowed.some((resolution) => !["approve", "deny", "modify"].includes(resolution))
  ) {
    throw new TypeError("Gate resolutions must be approve, deny, or modify");
  }
  allowed.forEach((resolution) => {
    const button = element(
      "button",
      `facet-gate__button facet-gate__button--${resolution}`,
      resolution[0].toUpperCase() + resolution.slice(1),
    );
    button.type = "button";
    button.addEventListener("click", async () => {
      actions.querySelectorAll("button").forEach((item) => { item.disabled = true; });
      const event = {
        gate_id: node.gate_id ?? node.id ?? "gate",
        resolution,
        actor: ctx.actor ?? "local-user",
        timestamp: new Date().toISOString(),
        effect_summary_hash: node.effect_summary_hash ?? await effectHash(summary),
        modifications: resolution === "modify" ? (node.modifications ?? {}) : null,
        comment: comment.value || undefined,
      };
      if (event.comment === undefined) delete event.comment;
      ctx.emit?.("resolve", node.id ?? node.gate_id, event);
      gate.dataset.resolution = resolution;
      const result = element(
        "output",
        `facet-gate__result facet-gate__result--${resolution}`,
        `Resolved: ${resolution}`,
      );
      actions.replaceChildren(result);
    });
    append(actions, button);
  });

  append(gate, header, facts);
  if (evidence.childNodes.length) append(gate, evidence);
  append(gate, comment, actions);
  return gate;
}

export function createParamsStore(initial = {}) {
  const values = new Map(Object.entries(initial));
  const subscribers = new Set();
  return {
    get(name) {
      return values.get(name);
    },
    set(name, value) {
      if (!name || Object.is(values.get(name), value)) return;
      values.set(name, value);
      subscribers.forEach((subscriber) => subscriber(name, value));
    },
    subscribe(subscriber) {
      subscribers.add(subscriber);
      return () => subscribers.delete(subscriber);
    },
    snapshot() {
      return Object.fromEntries(values);
    },
  };
}

function findNode(value, id, visited = new Set()) {
  if (!value || typeof value !== "object" || visited.has(value)) return null;
  visited.add(value);
  if (value.id === id && value.type) return value;
  for (const child of Object.values(value)) {
    if (Array.isArray(child)) {
      for (const item of child) {
        const found = findNode(item, id, visited);
        if (found) return found;
      }
    } else {
      const found = findNode(child, id, visited);
      if (found) return found;
    }
  }
  return null;
}

export function mountDocument(doc, target, options = {}) {
  if (!(target instanceof HTMLElement)) throw new TypeError("A host HTMLElement is required");
  const params = options.params ?? createParamsStore(doc.params);
  let unsubscribe = null;

  const externalEmit = options.emit;
  const baseContext = {
    data: doc.data ?? {},
    params,
    actor: options.actor,
  };

  function emit(event, nodeId, payload) {
    if (event === "select" && nodeId) {
      const route = (doc.links ?? []).find((link) => link.on === `${nodeId}.select`);
      const targetNode = route && findNode(doc.root, route.target);
      const escapedId = globalThis.CSS?.escape
        ? globalThis.CSS.escape(route.target)
        : route.target.replace(/([^a-zA-Z0-9_-])/g, "\\$1");
      const current = route && target.querySelector(`#${escapedId}`);
      if (targetNode && current) {
        current.replaceWith(render(targetNode, {
          ...baseContext,
          scope: payload,
          emit,
        }));
      }
    }
    externalEmit?.(event, nodeId, payload);
  }

  function paint() {
    target.replaceChildren(renderDocument(doc, { ...baseContext, emit }));
  }

  installInteractionPrimitives();
  paint();
  unsubscribe = params.subscribe(() => paint());

  return {
    params,
    render: paint,
    destroy() {
      unsubscribe?.();
      target.replaceChildren();
    },
  };
}

let installed = false;
export function installInteractionPrimitives() {
  if (installed) return;
  registerPrimitive("gate", renderGate);
  installed = true;
}
