const TYPES = [
  "card",
  "collection",
  "table",
  "tree",
  "graph",
  "timeline",
  "chart",
  "map",
  "text",
  "media",
  "diff",
  "control",
  "gate",
  "status",
];

const SVG_NS = "http://www.w3.org/2000/svg";

function element(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined && text !== null) el.textContent = String(text);
  return el;
}

function svgElement(tag, attributes = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  Object.entries(attributes).forEach(([key, value]) => el.setAttribute(key, value));
  return el;
}

function append(parent, ...children) {
  children.flat().filter(Boolean).forEach((child) => {
    parent.append(child instanceof Node ? child : document.createTextNode(String(child)));
  });
  return parent;
}

function pathValue(source, path) {
  if (!path) return source;
  return String(path)
    .split(".")
    .reduce((value, key) => (value == null ? undefined : value[key]), source);
}

export function resolve(value, ctx = {}) {
  if (value && typeof value === "object" && !Array.isArray(value) && "bind" in value) {
    return resolveBind(value.bind, ctx);
  }
  if (typeof value !== "string") return value;
  return value.replace(/\{([^}]+)\}/g, (_, path) => {
    const found = resolveBind(path.trim(), ctx);
    return found == null ? "" : String(found);
  });
}

export function resolveBind(path, ctx = {}) {
  if (typeof path !== "string") return undefined;
  const scoped = pathValue(ctx.scope, path);
  if (scoped !== undefined) return scoped;
  return pathValue(ctx.data, path);
}

function formatValue(value, format) {
  if (value == null) return "—";
  if (format === "currency") {
    const amount = Number(value);
    if (!Number.isNaN(amount)) {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      }).format(amount);
    }
  }
  if (format === "number") {
    const amount = Number(value);
    if (!Number.isNaN(amount)) return new Intl.NumberFormat().format(amount);
  }
  if (format === "date") {
    const date = new Date(value);
    if (!Number.isNaN(date.valueOf())) {
      return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
    }
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function nodeValue(node, ctx, fallback = "") {
  const bound = node.bind ? resolveBind(node.bind, ctx) : undefined;
  const value = bound ?? resolve(node.value ?? node.text ?? node.content, ctx);
  return formatValue(value ?? fallback, node.format);
}

function titleBlock(node, ctx) {
  const title = resolve(node.title ?? node.label, ctx);
  const subtitle = resolve(node.subtitle ?? node.description, ctx);
  if (title == null && subtitle == null) return null;
  const header = element("header", "facet-header");
  if (title != null) append(header, element("h3", "facet-title", title));
  if (subtitle != null) append(header, element("p", "facet-subtitle", subtitle));
  return header;
}

function scopedContext(ctx, scope) {
  return { ...ctx, scope };
}

function renderChildren(node, ctx, className = "facet-children") {
  const children = Array.isArray(node.children) ? node.children : [];
  if (!children.length) return null;
  const region = element("div", className);
  children.forEach((child) => append(region, render(child, ctx)));
  return region;
}

function renderText(node, ctx) {
  const tag = ["p", "span", "pre", "code", "blockquote"].includes(node.as) ? node.as : "p";
  const body = element(tag, `facet-text facet-text--${tag}`, nodeValue(node, ctx));
  if (node.href) {
    const link = element("a", "facet-link");
    link.href = resolve(node.href, ctx);
    link.target = "_blank";
    link.rel = "noreferrer";
    append(link, body);
    return link;
  }
  return body;
}

function renderCard(node, ctx) {
  const card = element("article", "facet-card");
  append(card, titleBlock(node, ctx));

  const media = node.media && typeof node.media === "object"
    ? render({ type: "media", ...node.media }, ctx)
    : null;
  append(card, media);

  if (Array.isArray(node.fields) && node.fields.length) {
    const fields = element("dl", "facet-fields");
    node.fields.forEach((field) => {
      append(
        fields,
        element("dt", "facet-field__label", resolve(field.label, ctx)),
        element(
          "dd",
          "facet-field__value",
          formatValue(
            field.bind ? resolveBind(field.bind, ctx) : resolve(field.value, ctx),
            field.format,
          ),
        ),
      );
    });
    append(card, fields);
  } else if (node.text != null || node.content != null || node.bind) {
    append(card, renderText(node, ctx));
  }

  append(card, renderChildren(node, ctx));
  return card;
}

function renderCollection(node, ctx) {
  const layout = ["list", "grid", "carousel", "feed", "kanban"].includes(node.layout)
    ? node.layout
    : "list";
  const collection = element("section", `facet-collection facet-collection--${layout}`);
  append(collection, titleBlock(node, ctx));
  const items = element("div", "facet-collection__items");
  const source = node.items?.bind ? resolveBind(node.items.bind, ctx) : resolve(node.items, ctx);
  const nodes = Array.isArray(source) ? source : node.children ?? [];

  nodes.forEach((item) => {
    if (item && TYPES.includes(item.type)) append(items, render(item, ctx));
    else if (node.item) append(items, render(node.item, scopedContext(ctx, item)));
    else append(items, render({ type: "card", text: formatValue(item) }, ctx));
  });
  append(collection, items);
  return collection;
}

function renderTable(node, ctx) {
  const wrapper = element("section", "facet-table-wrap");
  append(wrapper, titleBlock(node, ctx));
  const table = element("table", "facet-table");
  const columns = Array.isArray(node.columns) ? node.columns : [];
  const rowSpec = node.rows;
  const rows = Array.isArray(rowSpec)
    ? rowSpec
    : resolveBind(rowSpec?.source ?? rowSpec?.bind ?? "", ctx);

  if (columns.length) {
    const head = element("thead");
    const tr = element("tr");
    columns.forEach((column) => append(tr, element("th", "", resolve(column.label, ctx))));
    append(head, tr);
    append(table, head);
  }

  const body = element("tbody");
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const rowCtx = scopedContext(ctx, row);
    const tr = element("tr");
    if (node.id) {
      tr.tabIndex = 0;
      tr.addEventListener("click", () => ctx.emit?.("select", node.id, row));
    }
    columns.forEach((column) => {
      const td = element("td");
      const cell = column.cell;
      if (cell && typeof cell === "object") append(td, render(cell, rowCtx));
      else {
        const value = column.bind
          ? resolveBind(column.bind, rowCtx)
          : pathValue(row, column.key);
        td.textContent = formatValue(value, column.format);
      }
      append(tr, td);
    });
    append(body, tr);
  });
  append(table, body);
  append(wrapper, table);
  return wrapper;
}

function renderTreeBranch(item, ctx, template) {
  const details = element("details", "facet-tree__branch");
  details.open = item.open !== false;
  const label = item.label ?? item.title ?? item.name ?? "Item";
  append(details, element("summary", "", resolve(label, scopedContext(ctx, item))));
  if (template) append(details, render(template, scopedContext(ctx, item)));
  const children = item.children ?? item.items;
  if (Array.isArray(children)) {
    children.forEach((child) => append(details, renderTreeBranch(child, ctx, template)));
  }
  return details;
}

function renderTree(node, ctx) {
  const tree = element("section", "facet-tree");
  append(tree, titleBlock(node, ctx));
  const items = node.items?.bind ? resolveBind(node.items.bind, ctx) : node.items ?? node.children;
  (Array.isArray(items) ? items : []).forEach((item) => {
    if (item?.type) append(tree, render(item, ctx));
    else append(tree, renderTreeBranch(item, ctx, node.node));
  });
  return tree;
}

function renderGraph(node, ctx) {
  const graph = element("section", `facet-graph facet-graph--${node.layout ?? "network"}`);
  append(graph, titleBlock(node, ctx));
  const nodes = node.nodes?.bind ? resolveBind(node.nodes.bind, ctx) : node.nodes;
  const edges = node.edges?.bind ? resolveBind(node.edges.bind, ctx) : node.edges;
  const nodeList = element("div", "facet-graph__nodes");
  (Array.isArray(nodes) ? nodes : []).forEach((item) => {
    append(
      nodeList,
      item?.content?.type
        ? render(item.content, scopedContext(ctx, item))
        : element("div", "facet-graph__node", item.label ?? item.title ?? item.id),
    );
  });
  append(graph, nodeList);
  if (Array.isArray(edges) && edges.length) {
    const edgeList = element("ul", "facet-graph__edges");
    edges.forEach((edge) => {
      append(edgeList, element("li", "", `${edge.from ?? "?"} → ${edge.to ?? "?"}`));
    });
    append(graph, edgeList);
  }
  return graph;
}

function renderTimeline(node, ctx) {
  const timeline = element("section", "facet-timeline");
  append(timeline, titleBlock(node, ctx));
  const items = node.items?.bind ? resolveBind(node.items.bind, ctx) : node.items ?? node.children;
  (Array.isArray(items) ? items : []).forEach((item) => {
    const event = element("article", "facet-timeline__event");
    if (item?.type) append(event, render(item, ctx));
    else {
      append(
        event,
        element("time", "facet-timeline__time", item.time ?? item.date ?? item.start ?? ""),
        element("strong", "facet-timeline__title", item.title ?? item.label ?? "Event"),
      );
      if (item.description) append(event, element("p", "", item.description));
    }
    append(timeline, event);
  });
  return timeline;
}

function renderChart(node, ctx) {
  const chart = element("section", "facet-chart");
  append(chart, titleBlock(node, ctx));
  const values = node.data?.bind ? resolveBind(node.data.bind, ctx) : node.data ?? node.values;
  const points = (Array.isArray(values) ? values : [])
    .map((item, index) => ({
      label: item?.label ?? item?.x ?? index + 1,
      value: Number(item?.value ?? item?.y ?? item),
    }))
    .filter((point) => Number.isFinite(point.value));

  if (!points.length) {
    append(chart, element("div", "facet-empty", "No chart data"));
    return chart;
  }

  const max = Math.max(...points.map((point) => Math.abs(point.value)), 1);
  const plot = element("div", `facet-chart__plot facet-chart__plot--${node.kind ?? "bar"}`);
  points.forEach((point) => {
    const bar = element("div", "facet-chart__bar");
    bar.style.setProperty("--facet-value", `${Math.max(3, Math.abs(point.value / max) * 100)}%`);
    bar.title = `${point.label}: ${point.value}`;
    append(
      bar,
      element("span", "facet-chart__value", formatValue(point.value, node.format)),
      element("span", "facet-chart__label", point.label),
    );
    append(plot, bar);
  });
  append(chart, plot);
  return chart;
}

function renderMap(node, ctx) {
  const map = element("section", "facet-map");
  append(map, titleBlock(node, ctx));
  const canvas = element("div", "facet-map__canvas");
  const points = node.points?.bind ? resolveBind(node.points.bind, ctx) : node.points;
  (Array.isArray(points) ? points : []).forEach((point, index) => {
    const marker = element("span", "facet-map__marker", point.label ?? index + 1);
    marker.style.left = `${Math.min(92, Math.max(8, Number(point.x ?? point.lng ?? 50)))}%`;
    marker.style.top = `${Math.min(88, Math.max(12, Number(point.y ?? point.lat ?? 50)))}%`;
    append(canvas, marker);
  });
  if (!Array.isArray(points) || !points.length) {
    append(canvas, element("span", "facet-empty", node.kind ?? "Map"));
  }
  append(map, canvas);
  return map;
}

function renderMedia(node, ctx) {
  const media = element("figure", "facet-media");
  const src = resolve(node.src ?? node.url ?? (node.bind ? resolveBind(node.bind, ctx) : ""), ctx);
  const kind = node.kind ?? node.mediaType ?? "file";
  let content;
  if (kind === "image") {
    content = element("img", "facet-media__content");
    content.src = src;
    content.alt = resolve(node.alt ?? node.title ?? "", ctx);
  } else if (kind === "audio" || kind === "video") {
    content = element(kind, "facet-media__content");
    content.src = src;
    content.controls = true;
  } else {
    content = element("a", "facet-media__file", resolve(node.label ?? node.title ?? src, ctx));
    content.href = src;
    content.target = "_blank";
    content.rel = "noreferrer";
  }
  append(media, content);
  if (node.caption) append(media, element("figcaption", "", resolve(node.caption, ctx)));
  return media;
}

function renderDiff(node, ctx) {
  const diff = element("section", "facet-diff");
  append(diff, titleBlock(node, ctx));
  const before = formatValue(
    node.before?.bind ? resolveBind(node.before.bind, ctx) : resolve(node.before, ctx),
  );
  const after = formatValue(
    node.after?.bind ? resolveBind(node.after.bind, ctx) : resolve(node.after, ctx),
  );
  const grid = element("div", "facet-diff__grid");
  const beforePanel = element("div", "facet-diff__panel facet-diff__panel--before");
  const afterPanel = element("div", "facet-diff__panel facet-diff__panel--after");
  append(
    beforePanel,
    element("span", "facet-diff__label", node.beforeLabel ?? "Before"),
    element("pre", "", before),
  );
  append(
    afterPanel,
    element("span", "facet-diff__label", node.afterLabel ?? "After"),
    element("pre", "", after),
  );
  append(grid, beforePanel, afterPanel);
  append(diff, grid, renderChildren(node, ctx));
  return diff;
}

function renderControl(node, ctx) {
  const wrapper = element("label", "facet-control");
  const param = node.param ?? node.bind;
  append(wrapper, element("span", "facet-control__label", resolve(node.label ?? param, ctx)));
  const current = ctx.params?.get?.(param);
  let input;
  if (node.kind === "choice") {
    input = element("select", "facet-control__input");
    (node.options ?? []).forEach((option) => {
      const value = option?.value ?? option;
      const item = element("option", "", option?.label ?? option);
      item.value = value;
      item.selected = String(value) === String(current);
      append(input, item);
    });
  } else {
    input = element("input", "facet-control__input");
    input.type = node.kind === "toggle" ? "checkbox" : node.kind === "range" ? "range" : "text";
    if (input.type === "checkbox") input.checked = Boolean(current);
    else input.value = current ?? node.default ?? "";
    ["min", "max", "step", "placeholder"].forEach((key) => {
      if (node[key] != null) input[key] = node[key];
    });
  }
  input.addEventListener("input", () => {
    const value = input.type === "checkbox"
      ? input.checked
      : input.type === "range"
        ? Number(input.value)
        : input.value;
    if (param) ctx.params?.set?.(param, value);
    ctx.emit?.("change", node.id, { param, value });
  });
  append(wrapper, input);
  return wrapper;
}

function renderGateStub(node, ctx) {
  const gate = element("section", "facet-gate facet-gate--stub");
  gate.dataset.renderer = "stub";
  append(
    gate,
    titleBlock({ ...node, title: node.title ?? node.action ?? "Approval required" }, ctx),
    element(
      "p",
      "facet-gate__notice",
      "Gate interaction renderer is registered by the interaction layer.",
    ),
    renderChildren(node, ctx),
  );
  return gate;
}

function renderStatus(node, ctx) {
  const state = resolve(node.state ?? node.status ?? "unknown", ctx);
  const status = element("section", `facet-status facet-status--${String(state).toLowerCase()}`);
  append(status, titleBlock(node, ctx));
  const summary = element("div", "facet-status__summary");
  append(summary, element("span", "facet-status__dot"), element("strong", "", state));
  if (node.message) append(summary, element("span", "", resolve(node.message, ctx)));
  append(status, summary);
  if (node.progress != null) {
    const progress = element("progress", "facet-status__progress");
    progress.max = 100;
    progress.value = Number(resolve(node.progress, ctx));
    append(status, progress);
  }
  const logs = node.logs?.bind ? resolveBind(node.logs.bind, ctx) : node.logs;
  if (Array.isArray(logs) && logs.length) {
    append(status, element("pre", "facet-status__logs", logs.join("\n")));
  }
  append(status, renderChildren(node, ctx));
  return status;
}

export const PRIMITIVES = Object.assign(Object.create(null), {
  card: renderCard,
  collection: renderCollection,
  table: renderTable,
  tree: renderTree,
  graph: renderGraph,
  timeline: renderTimeline,
  chart: renderChart,
  map: renderMap,
  text: renderText,
  media: renderMedia,
  diff: renderDiff,
  control: renderControl,
  gate: renderGateStub,
  status: renderStatus,
});

export function registerPrimitive(type, renderer) {
  if (!TYPES.includes(type)) throw new TypeError(`Unsupported primitive: ${type}`);
  if (typeof renderer !== "function") throw new TypeError("Renderer must be a function");
  PRIMITIVES[type] = renderer;
}

function rawJSON(value) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function renderCardText(value) {
  const card = element("article", "facet-card facet-fallback");
  card.dataset.fallback = "true";
  append(
    card,
    element("strong", "facet-fallback__title", "Unsupported content"),
    element("pre", "facet-fallback__raw", rawJSON(value)),
  );
  return card;
}

function applyAnnotations(root, node, ctx) {
  const annotations = node.annotations;
  if (!annotations || typeof annotations !== "object") return root;
  const region = element("aside", "facet-annotations");

  Object.entries(annotations).forEach(([kind, spec]) => {
    if (!["confidence", "provenance", "freshness", "uncertainty", "risk"].includes(kind)) return;
    const value = spec?.bind ? resolveBind(spec.bind, ctx) : resolve(spec?.value ?? spec, ctx);
    if (value == null) return;

    if (kind === "provenance") {
      const details = element("details", "facet-annotation facet-annotation--provenance");
      append(
        details,
        element("summary", "", "Provenance"),
        element("pre", "", formatValue(value)),
      );
      append(region, details);
    } else {
      const labels = {
        confidence: "Confidence",
        freshness: "Freshness",
        uncertainty: "Uncertainty",
        risk: "Risk",
      };
      append(
        region,
        element(
          kind === "freshness" ? "time" : "span",
          `facet-annotation facet-annotation--${kind}`,
          `${labels[kind]}: ${formatValue(value)}`,
        ),
      );
    }
  });

  if (region.childNodes.length) append(root, region);
  return root;
}

function applyZoom(root, node) {
  if (!node.zoom) return root;
  root.dataset.zoom = node.zoom;
  root.classList.add(`facet-zoom--${node.zoom}`);
  return root;
}

function validateNode(node) {
  return Boolean(
    node
      && typeof node === "object"
      && !Array.isArray(node)
      && typeof node.type === "string"
      && PRIMITIVES[node.type],
  );
}

export function render(node, ctx = {}) {
  try {
    if (!validateNode(node)) return renderCardText(node);
    const normalizedCtx = {
      ...ctx,
      data: ctx.data ?? {},
      params: ctx.params,
      emit: ctx.emit,
      scope: ctx.scope,
    };
    const root = PRIMITIVES[node.type](node, normalizedCtx);
    if (!(root instanceof HTMLElement)) throw new TypeError("Primitive renderer returned no element");
    root.classList.add("facet-node", `facet-node--${node.type}`);
    if (node.id) {
      root.id = node.id;
      root.dataset.nodeId = node.id;
    }
    applyZoom(root, node);
    applyAnnotations(root, node, normalizedCtx);
    return root;
  } catch {
    return renderCardText(node);
  }
}

export function renderDocument(doc, ctx = {}) {
  try {
    if (!doc || typeof doc !== "object" || !doc.root) return renderCardText(doc);
    return render(doc.root, { ...ctx, data: doc.data ?? ctx.data ?? {} });
  } catch {
    return renderCardText(doc);
  }
}

export { TYPES };
