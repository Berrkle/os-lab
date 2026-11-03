/* os-lab web console — client.
 *
 * Layout and behaviour follow qLar's app shell (PR #174): a grouped sidebar that collapses to an
 * icon rail (a rail click expands it as a temporary "peek"), the same nav in a drawer on small
 * screens, Spotlight on Ctrl/⌘K, a sticky top bar with a back crumb, live lab state and a theme
 * toggle. Pages are hash routes (#/android/console, #/windows …) rendered from the data below.
 *
 * Every value that comes from the server or the user is escaped (esc) before it reaches innerHTML.
 */
(function () {
  "use strict";

  // ── Helpers ───────────────────────────────────────────────────────────
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = (v) =>
    String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[c]);
  const store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem(key);
        return v === null ? fallback : v;
      } catch (e) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        /* storage unavailable: the choice lasts for this page view */
      }
    }
  };
  async function getJSON(url) {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(r.status + " " + r.statusText);
    return r.json();
  }
  async function postJSON(url, body) {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {})
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || r.status + " " + r.statusText);
    return data;
  }

  // ── Icons (inline, 24px grid, stroke) ─────────────────────────────────
  const ICONS = {
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    sidebar: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    back: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    phone: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>',
    laptop: '<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19h20"/>',
    windows: '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/>',
    terminal: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3M13 15h4"/>',
    tree: '<rect x="9" y="2" width="6" height="5" rx="1"/><rect x="2" y="17" width="6" height="5" rx="1"/><rect x="16" y="17" width="6" height="5" rx="1"/><path d="M12 7v5M5 17v-2a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v2"/>',
    plug: '<path d="M9 2v6M15 2v6M6 8h12v4a6 6 0 0 1-12 0zM12 18v4"/>',
    chart: '<path d="M3 3v18h18"/><path d="M7 15v2M11 11v6M15 7v10M19 12v5"/>',
    map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    play: '<path d="M7 4v16l13-8z"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="1"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
    check: '<path d="m5 12 5 5 9-10"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
    pkg: '<path d="m21 8-9-5-9 5v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
    key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.3-9.3M17 6l3 3M15 8l2 2"/>',
    bug: '<rect x="7" y="7" width="10" height="13" rx="5"/><path d="M12 7V4M3 13h4M17 13h4M4 19l3-2M20 19l-3-2M4 7l3 2M20 7l-3 2"/>',
    wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>',
    sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10"/>',
    pulse: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
    file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5V21h16"/>',
    loader: '<path d="M21 12a9 9 0 1 1-6.2-8.6"/>',
    warn: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
    cpu: '<rect x="6" y="6" width="12" height="12" rx="1"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
    command: '<path d="M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3z"/>'
  };
  const icon = (name, cls) =>
    '<svg class="i' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || "") + "</svg>";

  // ── Data ──────────────────────────────────────────────────────────────
  /** Runnable lab actions; ids match POST /api/run in web_ui.py. */
  const ACTIONS = {
    preflight: { label: "Pre-flight check", icon: "pulse", desc: "Verify Python, ADB, JADX and the lab toolchain before a run.", group: "Setup" },
    "create-sample": { label: "Generate sample APK", icon: "pkg", desc: "Build the deliberately vulnerable test APK used by the demo workflows.", group: "Setup" },
    wf1: { label: "WF1 static audit", icon: "shield", desc: "Decompile with JADX, audit the manifest, apply OWASP MASVS rules and render the report.", group: "Static", primary: true },
    "scan-secrets": { label: "Scan secrets", icon: "key", desc: "Search the APK for API keys, tokens and hard-coded credentials.", group: "Static" },
    analyze: { label: "Extract attack surface", icon: "scan", desc: "Enumerate exported activities, services, receivers, providers and deep links.", group: "Static" },
    fuzz: { label: "IPC fuzzer", icon: "bug", desc: "Probe exported components and content providers with boundary and SQLi payloads.", group: "Dynamic" },
    patch: { label: "Patch APK", icon: "wrench", desc: "Inject a permissive network-security config and the Frida gadget for non-root testing.", group: "Dynamic" },
    agentic: { label: "Agentic playbook", icon: "sparkle", desc: "Rank attack hypotheses and generate tailored Frida hooks for the target.", group: "Agentic", primary: true }
  };

  const ANDROID_PAGES = [
    { id: "overview", label: "Overview", icon: "grid", title: "Android Lab · Security Overview", desc: "Lab health, APK staging and quick launch", aliases: "home dashboard upload" },
    { id: "providers", label: "Code & Providers", icon: "plug", title: "Android Lab · Code & Providers", desc: "ADB devices, target APK and emulator endpoints", aliases: "adb devices apk target emulator" },
    { id: "workflows", label: "Workflows & DAG", icon: "tree", title: "Android Lab · Workflows & DAG", desc: "Static and dynamic pipelines and every runnable action", aliases: "wf1 wf2 static dynamic pipeline dag" },
    { id: "console", label: "Execution & Logs", icon: "terminal", title: "Android Lab · Execution & Logs", desc: "Live job log, run history and troubleshooting", aliases: "logs console output terminal" },
    { id: "analytics", label: "Analytics", icon: "chart", title: "Android Lab · Analytics & Reports", desc: "Run outcomes and generated HTML security reports", aliases: "reports findings html" },
    { id: "sitemap", label: "Routes & Sitemap", icon: "map", title: "Android Lab · Routes & Sitemap", desc: "Every page, workflow and endpoint of the lab", aliases: "sitemap attack surface routes" }
  ];

  /** The other labs, as in qLar's os-lab/lab-page.tsx; commands run from the os-lab checkout. */
  const LABS = {
    ios: {
      label: "iOS Lab", icon: "phone",
      description: "Run iOS Simulator through the macOS VM on Ubuntu, or use native Xcode and Appium on a Mac.",
      directory: "ios-lab",
      check: "./labctl ios status",
      setup: "./labctl ios profile use development\n./labctl ios start --wait",
      endpoints: [["Web viewer", "http://127.0.0.1:8006/"], ["VNC", "127.0.0.1:5900"]]
    },
    windows: {
      label: "Windows Lab", icon: "windows",
      description: "Windows in Docker with KVM, a web desktop, RDP and shared storage.",
      directory: "win-lab",
      check: "./labctl win status",
      setup: "./labctl win profile use development\n./labctl win start --wait",
      endpoints: [["Web viewer", "http://127.0.0.1:8006/"], ["RDP", "127.0.0.1:3389"]]
    },
    macos: {
      label: "macOS Lab", icon: "laptop",
      description: "Configure the macOS VM shared with iOS, or native Xcode Simulator and Appium on a Mac.",
      directory: "ios-lab/mac",
      check: "make -C ios-lab mac-doctor",
      setup: "make -C ios-lab mac-setup mac-sim mac-appium",
      endpoints: [["Web viewer", "http://127.0.0.1:8006/"]]
    },
    linux: {
      label: "Linux Lab", icon: "terminal",
      description: "Linux in Docker with KVM, a web console, SSH and shared storage.",
      directory: "linux-lab",
      check: "./labctl linux status",
      setup: "./labctl linux profile use development\n./labctl linux start --wait",
      endpoints: [["Web viewer", "http://127.0.0.1:8006/"], ["SSH", "ssh -p 2222 root@127.0.0.1"]]
    }
  };

  const ANDROID_ENDPOINTS = [
    ["noVNC", "http://127.0.0.1:6080/"],
    ["MobSF", "http://127.0.0.1:8000/"],
    ["mitmweb", "http://127.0.0.1:8081/"],
    ["mitmproxy", "127.0.0.1:8080"],
    ["ADB", "127.0.0.1:5555"]
  ];

  // ── State ─────────────────────────────────────────────────────────────
  const state = {
    healthy: null,
    version: "",
    running: false,
    logs: [],
    jobs: [],
    devices: null,
    devicesRaw: "",
    reports: null,
    apk: store.get("oslab.apk", "scripts/vulnerable-test.apk"),
    collapsed: store.get("oslab.sidebar.collapsed", "0") === "1",
    peek: false,
    open: {},
    workflowMode: store.get("oslab.workflow", "static"),
    snippetTab: {}
  };

  // ── Routing ───────────────────────────────────────────────────────────
  function currentRoute() {
    const raw = (location.hash || "").replace(/^#\/?/, "");
    const [a, b] = raw.split("/");
    if (a === "android" && ANDROID_PAGES.some((p) => p.id === b)) return { lab: "android", page: b };
    if (LABS[a]) return { lab: a, page: null };
    return { lab: "android", page: "overview" };
  }
  const routeId = (r) => (r.lab === "android" ? "android-" + r.page : r.lab);
  const hrefFor = (id) => (id.startsWith("android-") ? "#/android/" + id.slice(8) : "#/" + id);
  function go(href) {
    if (location.hash === href) render();
    else location.hash = href;
  }

  // ── Sidebar ───────────────────────────────────────────────────────────
  function navGroups() {
    const count = (v) => (v == null ? "…" : v);
    return [
      {
        label: "OS Lab",
        items: [
          {
            id: "android", label: "Android Lab", icon: "shield",
            badge: '<span class="pill" data-tone="orange">' + (state.running ? "Running" : "Pro") + "</span>",
            children: ANDROID_PAGES.map((p) => ({
              id: "android-" + p.id,
              label: p.label,
              badge:
                p.id === "providers" ? '<span class="leaf-count">' + count(state.devices && state.devices.length) + "</span>"
                : p.id === "analytics" ? '<span class="leaf-count">' + count(state.reports && state.reports.length) + "</span>"
                : p.id === "console" && state.running ? '<span class="dot run" aria-label="running"></span>'
                : ""
            }))
          },
          ...Object.entries(LABS).map(([id, lab]) => ({ id, label: lab.label, icon: lab.icon }))
        ]
      },
      {
        label: "Help",
        items: [
          { id: "health", label: "Health check", icon: "pulse", href: "/api/health" },
          { id: "repo", label: "Repository", icon: "book", href: "https://github.com/keyvanarasteh/os-lab" }
        ]
      }
    ];
  }

  function sidebarHTML(variant) {
    const drawer = variant === "drawer";
    const collapsed = !drawer && state.collapsed && !state.peek;
    const active = routeId(currentRoute());
    const parentOf = active.startsWith("android-") ? "android" : null;
    const toggle =
      '<button type="button" class="btn ghost icon" data-act="toggle-sidebar" aria-label="' +
      (collapsed ? "Expand sidebar" : "Collapse sidebar") + '" title="' +
      (collapsed ? "Expand sidebar" : "Collapse sidebar") + '">' + icon("sidebar") + "</button>";
    const close = '<button type="button" class="btn ghost icon" data-act="close-drawer" aria-label="Close navigation">' + icon("x") + "</button>";

    let html =
      '<div class="brand"><span class="logo">' + icon("shield") + "</span>" +
      '<div class="brand-text"><div class="brand-name">os-lab</div><div class="brand-sub">Security lab console</div></div>' +
      (drawer ? close : toggle) + "</div>";
    if (!drawer) html += '<div class="rail-toggle">' + toggle + "</div>";
    html +=
      '<div class="search-wrap">' +
      '<button type="button" class="search-trigger" data-act="spotlight" aria-label="Open search">' + icon("search") +
      "<span>Quick search…</span>" + (drawer ? "" : "<kbd>⌘K</kbd>") + "</button>" +
      '<button type="button" class="btn ghost icon rail-search" data-act="spotlight" aria-label="Search (⌘K)" title="Search (⌘K)">' + icon("search") + "</button>" +
      "</div>";
    html += '<nav class="nav scroll" aria-label="Sections">';
    for (const group of navGroups()) {
      html += '<div class="nav-group"><div class="nav-label">' + esc(group.label) + "</div>";
      for (const item of group.items) {
        const kids = item.children || [];
        if (item.href) {
          const ext = /^https?:/.test(item.href);
          html += '<a class="row" href="' + esc(item.href) + '" target="_blank" rel="noreferrer" title="' + esc(item.label) + '">' +
            icon(item.icon) + '<span class="row-text">' + esc(item.label) + "</span>" +
            (ext ? '<span class="pill" style="border:0;background:none;padding:0">' + icon("external") + "</span>" : "") + "</a>";
          continue;
        }
        if (!kids.length) {
          html += '<a class="row' + (item.id === active ? " active" : "") + '" href="' + hrefFor(item.id) + '"' +
            (item.id === active ? ' aria-current="page"' : "") + ' data-rail="' + item.id + '" title="' + esc(item.label) + '">' +
            icon(item.icon) + '<span class="row-text">' + esc(item.label) + "</span></a>";
          continue;
        }
        const open = state.open[item.id] != null ? state.open[item.id] : parentOf === item.id;
        const childActive = parentOf === item.id;
        html += '<button type="button" class="row' + ((childActive && !open) || (collapsed && childActive) ? " active" : "") +
          '" aria-expanded="' + open + '" data-toggle-item="' + item.id + '" title="' + esc(item.label) + '">' +
          icon(item.icon) + '<span class="row-text">' + esc(item.label) + "</span>" + (item.badge || "") +
          icon("chevron", "caret") + "</button>";
        html += '<div class="nav-children"' + (open ? "" : " hidden") + ">";
        for (const leaf of kids) {
          html += '<a class="row leaf' + (leaf.id === active ? " active" : "") + '" href="' + hrefFor(leaf.id) + '"' +
            (leaf.id === active ? ' aria-current="page"' : "") + '><span class="row-text">' + esc(leaf.label) + "</span>" + leaf.badge + "</a>";
        }
        html += "</div>";
      }
      html += "</div>";
    }
    html += "</nav>";
    html +=
      '<div class="sidebar-footer"><span class="with-dot"><span class="dot ' +
      (state.healthy ? "on" : state.healthy === false ? "off" : "") + '"></span><span>' +
      (state.healthy ? "Lab engine connected" : state.healthy === false ? "Lab engine offline" : "Connecting…") +
      "</span></span><span>os-lab" + (state.version ? " " + esc(state.version) : "") + "</span></div>";
    return html;
  }

  let sidebarSig = "";
  function renderSidebar(force) {
    const sig = JSON.stringify([
      state.collapsed, state.peek, state.open, routeId(currentRoute()), state.healthy, state.running,
      state.devices && state.devices.length, state.reports && state.reports.length
    ]);
    if (!force && sig === sidebarSig) return;
    sidebarSig = sig;
    const aside = $("#sidebar");
    aside.classList.toggle("collapsed", state.collapsed && !state.peek);
    aside.innerHTML = sidebarHTML("desktop");
    const drawer = $("#drawer");
    if (drawer.open) drawer.innerHTML = '<div class="sidebar">' + sidebarHTML("drawer") + "</div>";
  }

  function setCollapsed(next) {
    state.collapsed = next;
    state.peek = false;
    store.set("oslab.sidebar.collapsed", next ? "1" : "0");
    renderSidebar(true);
  }

  // ── Top bar ───────────────────────────────────────────────────────────
  function renderTopbar(route) {
    let title, crumb = "";
    if (route.lab === "android") {
      const page = ANDROID_PAGES.find((p) => p.id === route.page);
      title = page.title;
      if (route.page !== "overview")
        crumb = '<a class="crumb" href="#/android/overview">' + icon("back") + " Overview</a><span class=\"muted\">/</span>";
    } else {
      title = LABS[route.lab].label;
    }
    $("#page-title").textContent = title;
    $("#crumb").innerHTML = crumb;
    $("#crumb").style.display = crumb ? "contents" : "none";
    document.title = title + " — os-lab";
  }

  function renderLabState() {
    const dot = $("#lab-dot");
    const text = $("#lab-state");
    dot.className = "dot " + (state.running ? "run" : state.healthy ? "on" : state.healthy === false ? "off" : "");
    text.textContent = state.running ? "Job running" : state.healthy ? "Lab Active" : state.healthy === false ? "Offline" : "Connecting…";
  }

  function renderThemeButton() {
    const dark = document.documentElement.getAttribute("data-mode") === "dark";
    $("#theme-toggle").innerHTML = dark ? icon("sun") : icon("moon");
  }
  function toggleTheme() {
    const next = document.documentElement.getAttribute("data-mode") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-mode", next);
    store.set("oslab.theme", next);
    renderThemeButton();
  }

  // ── Components ────────────────────────────────────────────────────────
  function section(opts, body) {
    return '<section class="card section"' + (opts.id ? ' id="' + opts.id + '"' : "") + ">" +
      '<div class="section-head"><div><h2>' + (opts.icon ? icon(opts.icon) : "") + esc(opts.title) + "</h2>" +
      (opts.desc ? "<p>" + opts.desc + "</p>" : "") + "</div>" + (opts.action || "") + "</div>" +
      "<div>" + body + "</div></section>";
  }

  function pageHead(iconName, title, desc, action) {
    return '<div class="page-head"><div><h1>' + icon(iconName) + esc(title) + "</h1><p>" + esc(desc) + "</p></div>" + (action || "") + "</div>";
  }

  /** Tabbed command runner with copy (ShellSnippet). Only the first word is highlighted as the tool. */
  function snippet(key, tabs, prefix) {
    const activeId = state.snippetTab[key] || tabs[0].id;
    const tab = tabs.find((t) => t.id === activeId) || tabs[0];
    const lines = tab.command.split("\n");
    let html = '<div class="snippet crosshair" data-snippet="' + key + '"><div class="snippet-inner dot-grid-dense">';
    if (tabs.length > 1) {
      html += '<div class="snippet-tabs" role="tablist">';
      for (const t of tabs)
        html += '<button type="button" role="tab" class="snippet-tab' + (t.id === tab.id ? " on" : "") + '" aria-selected="' +
          (t.id === tab.id) + '" data-snippet-tab="' + key + ":" + t.id + '">' + esc(t.label) + "</button>";
      html += "</div>";
    }
    html += '<div class="snippet-cmd"><code class="scroll">' +
      lines.map((l) => {
        const sp = l.indexOf(" ");
        const tool = sp < 0 ? l : l.slice(0, sp);
        const rest = sp < 0 ? "" : l.slice(sp);
        return '<span class="prompt">' + esc(prefix || "$") + "</span>" + '<span class="tool">' + esc(tool) + "</span>" + esc(rest);
      }).join("\n") +
      '</code><button type="button" class="copy" data-copy="' + esc(tab.command) + '" aria-label="Copy command" title="Copy">' + icon("copy") + "</button></div>";
    if (tab.explanation) html += '<p class="small muted" style="margin-top:8px">' + esc(tab.explanation) + "</p>";
    html += "</div></div>";
    return html;
  }

  function runButton(id, variant) {
    const a = ACTIONS[id];
    return '<button type="button" class="btn ' + (variant || (a.primary ? "brand" : "outline")) + '" data-run="' + id + '"' +
      (state.running ? " disabled" : "") + ">" + icon("play") + esc(a.label) + "</button>";
  }

  function actionTile(id) {
    const a = ACTIONS[id];
    return '<div class="card tile"><div style="display:flex;align-items:center;justify-content:space-between">' +
      '<span class="tile-icon">' + icon(a.icon) + '</span><span class="badge">' + esc(a.group) + "</span></div>" +
      "<h3>" + esc(a.label) + "</h3><p>" + esc(a.desc) + "</p>" + runButton(id) + "</div>";
  }

  function apkField() {
    return '<label class="field"><span>Target APK</span>' +
      '<input class="input mono" type="text" data-apk value="' + esc(state.apk) + '" placeholder="apks/app.apk" spellcheck="false">' +
      '<span class="small muted">Relative to android-lab/lab. Used by every workflow that takes an APK.</span></label>';
  }

  function dropzone() {
    return '<div class="dropzone" data-dropzone role="button" tabindex="0" aria-label="Upload an APK">' +
      '<span class="big">' + icon("upload") + "</span>" +
      '<strong style="margin-top:6px">Drop an APK here or click to upload</strong>' +
      '<span class="small muted">Staged into <code>apks/</code> and set as the target for the next run.</span>' +
      '<span class="small" data-upload-status aria-live="polite"></span></div>';
  }

  function endpointList(items) {
    return '<ul class="list">' + items.map(([name, value]) => {
      const isUrl = /^https?:/.test(value);
      return "<li><span style=\"width:7rem\" class=\"small muted\">" + esc(name) + '</span><span class="name">' + esc(value) + "</span>" +
        (isUrl
          ? '<a class="btn ghost icon" href="' + esc(value) + '" target="_blank" rel="noreferrer" aria-label="Open ' + esc(name) + '">' + icon("external") + "</a>"
          : '<button type="button" class="copy" data-copy="' + esc(value) + '" aria-label="Copy ' + esc(name) + '">' + icon("copy") + "</button>") +
        "</li>";
    }).join("") + "</ul>";
  }

  function devicesBody() {
    if (state.devices == null) return '<p class="muted small">Probing the ADB bridge…</p>';
    if (!state.devices.length)
      return '<p class="empty">' + esc(state.devicesRaw && !/List of devices/.test(state.devicesRaw) ? state.devicesRaw.trim() : "No devices attached. Boot the emulator (make boot) or run adb connect 127.0.0.1:5555.") + "</p>";
    return '<ul class="list devices">' + state.devices.map((d) =>
      '<li><span class="tile-icon">' + icon("phone") + '</span><span class="name">' + esc(d.serial) + "</span>" +
      '<span class="badge" data-tone="' + (d.state === "device" ? "success" : "warning") + '">' + esc(d.state) + "</span></li>").join("") + "</ul>";
  }

  function kpi(label, iconName, value, sub, bind) {
    return '<div class="card kpi"><span class="kpi-label">' + icon(iconName) + esc(label) + "</span>" +
      '<span class="kpi-value"' + (bind ? ' data-bind="' + bind + '"' : "") + ">" + value + "</span>" +
      '<span class="kpi-sub">' + sub + "</span></div>";
  }

  function jobsList(limit) {
    const jobs = state.jobs.slice(-limit).reverse();
    if (!jobs.length) return '<div class="job"><span class="job-sub">No jobs yet. Start one from Workflows or the Overview.</span></div>';
    return jobs.map((j) => {
      const st = j.status === "running"
        ? '<span class="job-state run">' + icon("loader", "spin") + "Running</span>"
        : j.status === "ok"
          ? '<span class="job-state ok">' + icon("check") + "Exit 0</span>"
          : '<span class="job-state err">' + icon("warn") + (j.code != null ? "Exit " + esc(j.code) : "Error") + "</span>";
      return '<div class="job"><div style="min-width:0"><div class="job-title">' + esc(j.title) + '</div><div class="job-sub">' +
        esc(j.lines) + " lines of output</div></div>" + st + "</div>";
    }).join("");
  }

  function logLines() {
    if (!state.logs.length) return '<div class="log-line"><span class="n">1</span><span>Waiting for commands…</span></div>';
    return state.logs.map((line, i) => {
      const cls = /^\s*\[\+\] ===/.test(line) ? "head"
        : /^\s*\[\+\] Task finished with exit code 0/.test(line) ? "ok"
        : /^\s*\[!\]|error|traceback|exit code [1-9]/i.test(line) ? "err"
        : /warn/i.test(line) ? "warn" : "";
      return '<div class="log-line ' + cls + '"><span class="n">' + (i + 1) + "</span><span>" + esc(line.replace(/^\n+|\n+$/g, "")) + "</span></div>";
    }).join("");
  }

  // ── Pages ─────────────────────────────────────────────────────────────
  const PAGES = {
    overview() {
      const last = state.jobs[state.jobs.length - 1];
      return '<div class="page">' +
        '<section class="hero card dot-grid crosshair">' +
        '<span class="hero-badge mono">&lt;&gt; OS Lab</span>' +
        "<h1>The Mobile OS Lab</h1>" +
        "<p>Agentic Android reverse engineering and vulnerability scanning: JADX decompilation, OWASP MASVS rules, IPC fuzzing, APK patching and Frida playbooks, driven from one console.</p>" +
        '<div class="hero-ctas"><a class="btn brand" href="#/android/workflows">' + icon("play") + "Launch security scan</a>" +
        '<a class="btn outline" href="#/android/sitemap">Explore architecture</a></div></section>' +

        '<div class="kpis">' +
        kpi("Lab engine", "pulse", '<span data-bind="engine">' + (state.healthy ? "Ready" : state.healthy === false ? "Offline" : "…") + "</span>", "Python web console on this host") +
        kpi("ADB devices", "phone", state.devices == null ? "…" : esc(state.devices.length), "Attached emulators and phones", "devices") +
        kpi("Reports", "file", state.reports == null ? "…" : esc(state.reports.length), "HTML reports in artifacts/", "reports") +
        kpi("Last run", "terminal", last ? esc(last.status === "running" ? "Running" : last.status === "ok" ? "Passed" : "Failed") : "—",
          last ? esc(last.title) : "No jobs this session", "last") +
        "</div>" +

        '<section class="stack"><div><h2 class="section-title">Target APK</h2><p class="small muted">Upload a package or point the lab at one already on disk.</p></div>' +
        '<div class="card section"><div style="display:grid;gap:1rem">' + dropzone() + apkField() + "</div></div></section>" +

        '<section class="stack"><div><h2 class="section-title">Quick pipeline launch</h2><p class="small muted">Common first steps. Output streams to Execution &amp; Logs.</p></div>' +
        '<div class="tiles">' + ["preflight", "create-sample", "wf1", "scan-secrets"].map(actionTile).join("") + "</div></section>" +

        '<section class="stack"><div><h2 class="section-title">Quick environment setup</h2><p class="small muted">Pick your host to verify KVM acceleration and boot the containerised emulator.</p></div>' +
        snippet("env", [
          { id: "linux", label: "Linux (native)", command: "make preflight\nmake boot", explanation: "Checks KVM, Docker, ADB, ports and disk, then starts the stack and waits until the emulator reports ready." },
          { id: "static", label: "No KVM (static)", command: "make static-up", explanation: "Starts only MobSF, mitmproxy and the tools container: everything WF1 needs, without an emulator." },
          { id: "windows", label: "Windows", command: "./lab.ps1 setup\n./lab.ps1 start", explanation: "Zero-admin Windows runtime; see README-WINDOWS.md for the VirtualBox and WSL2 options." },
          { id: "adb", label: "ADB control", command: "adb connect 127.0.0.1:5555\nadb devices", explanation: "Attach to the emulator over TCP for instrumentation and Frida injection." }
        ]) + "</section>" +

        '<section class="dark-panel bento crosshair">' +
        '<div class="bento-lead"><div><span class="hero-badge mono">&lt;&gt; Lab architecture</span>' +
        "<h2>End-to-end mobile pentest pipeline</h2>" +
        '<p class="muted">From static bytecode decompilation to runtime hooking and live traffic interception.</p></div>' +
        '<div><a class="btn pill-btn" href="#/android/workflows">View execution workflows</a></div></div>' +
        '<div class="bento-grid">' +
        [["01", "Static decompilation", "JADX and the manifest audit map permissions, exported components and hard-coded secrets."],
         ["02", "Containerised emulator", "Docker-Android with KVM passthrough, ADB on 5555 and a noVNC screen on 6080."],
         ["03", "Runtime instrumentation", "Frida hooks bypass root detection and certificate pinning; IPC fuzzing probes exported components."],
         ["04", "Interception & reporting", "mitmproxy records traffic to artifacts/; findings render into HTML reports."]]
          .map(([n, t, d]) => '<div class="bento-cell"><span class="bento-num">' + n + "</span><h3>" + t + '</h3><p class="muted">' + d + "</p></div>").join("") +
        "</div></section>" +

        '<section class="dark-panel tips crosshair"><div><blockquote><span class="q">“</span>Containerising the Android emulator with hardware KVM passthrough gives fully reproducible mobile testing environments, so agents can run end-to-end reverse engineering without a physical device farm.<span class="q">”</span></blockquote>' +
        '<div class="tips-author"><strong>Mobile OS Lab guideline</strong><div class="muted">knowledge/segmentation.md</div></div></div>' +
        '<div class="tips-side"><span class="tile-icon" style="width:3.5rem;height:3.5rem;background:#18181b;border-color:#3f3f46;color:#f36c21">' + icon("shield") + '</span><span class="muted">Android Lab</span></div></section>' +
        "</div>";
    },

    providers() {
      return '<div class="page">' +
        pageHead("plug", "Code & target providers", "Where the lab gets its targets: attached ADB devices, staged APKs and the emulator stack's endpoints.",
          '<button type="button" class="btn outline" data-act="refresh-devices">' + icon("refresh") + "Refresh devices</button>") +
        section({ icon: "phone", title: "Connected devices (ADB)", desc: "Output of <code>adb devices</code> on this host." }, '<div data-bind="devices-list">' + devicesBody() + "</div>") +
        section({ icon: "pkg", title: "Target APK", desc: "Upload a package or enter a path on disk." }, '<div style="display:grid;gap:1rem">' + dropzone() + apkField() + "</div>") +
        section({ icon: "cpu", title: "Emulator stack endpoints", desc: "Published by <code>docker-compose.yml</code> when the dynamic stack is up (<code>make boot</code>)." }, endpointList(ANDROID_ENDPOINTS)) +
        '<section class="stack"><h2 class="section-title">ADB &amp; Frida</h2>' +
        snippet("adb", [
          { id: "connect", label: "Connect", command: "adb connect 127.0.0.1:5555", explanation: "Attach to the containerised emulator over TCP." },
          { id: "install", label: "Install APK", command: "make install APK=" + state.apk, explanation: "Push the current target APK into the emulator." },
          { id: "hook", label: "Frida hook", command: "make hook PKG=com.example.app HOOK=hooks/ssl-pinning-bypass.js", explanation: "Spawn the app with a bundled hook from hooks/." }
        ]) + "</section></div>";
    },

    workflows() {
      const mode = state.workflowMode === "dynamic" ? "dynamic" : "static";
      const steps = mode === "static"
        ? [["APK ingestion", "Resolve the target and create a per-APK folder under artifacts/."],
           ["JADX decompilation & manifest parsing", "Disassemble DEX to Java and extract permissions and exported components."],
           ["OWASP MASVS rule audit", "Flag weak crypto, debuggable builds, cleartext traffic and hard-coded secrets."],
           ["Report", "Write static-report.md and static-manifest-analysis.json; render the HTML report."]]
        : [["Install APK", "Push the target into the running Docker-Android emulator over ADB."],
           ["Route traffic through mitmproxy", "Point the emulator's proxy at the mitmproxy container; flows stream to artifacts/flows.mitm."],
           ["Launch the package", "Start the target app when a package name is given."],
           ["Frida server", "Start frida-server in the rooted emulator so hooks from hooks/ can attach."]];
      return '<div class="page">' +
        pageHead("tree", "Agentic orchestration & workflows", "Multi-phase pipelines for mobile penetration testing and reverse engineering.",
          runButton("wf1", "brand").replace(esc(ACTIONS.wf1.label), "Execute pipeline")) +
        '<section class="stack"><h2 class="eyebrow">Agent lifecycle (DAG)</h2>' +
        '<div class="dark-panel dag crosshair dot-grid"><div class="dag-row">' +
        [["Static decompilation", "JADX and the manifest audit extract components, permissions and secrets."],
         ["Containerised boot", "Docker-Android starts with KVM, ADB on 5555 and noVNC on 6080."],
         ["Frida hook injection", "Hooks bypass root detection and pinning inside the ART runtime."],
         ["Interception & telemetry", "mitmproxy captures API traffic; findings land in artifacts/."]]
          .map(([t, d]) => '<div class="dag-node"><h3>' + t + '</h3><p class="muted">' + d + "</p></div>").join("") +
        "</div></div></section>" +
        '<section class="stack"><div class="mode-tabs" role="tablist">' +
        '<button type="button" role="tab" class="mode-tab' + (mode === "static" ? " on" : "") + '" aria-selected="' + (mode === "static") + '" data-mode="static">' + icon("shield") + "Workflow 1: Static bytecode &amp; manifest audit</button>" +
        '<button type="button" role="tab" class="mode-tab' + (mode === "dynamic" ? " on" : "") + '" aria-selected="' + (mode === "dynamic") + '" data-mode="dynamic">' + icon("cpu") + "Workflow 2: Dynamic runtime &amp; Frida</button></div>" +
        '<div class="card stepper"><div class="page-head"><div><h2 class="section-title">' + (mode === "static" ? "Static bytecode audit" : "Dynamic runtime analysis") + "</h2>" +
        '<p class="small muted">' + (mode === "static" ? "Runs here, on the target APK below." : "Needs the emulator stack (make boot); runs from the host shell.") + "</p></div>" +
        (mode === "static" ? runButton("wf1", "brand") : "") + "</div><ol>" +
        steps.map(([t, d], i) => '<li><span class="step-num">' + (i + 1) + "</span><div><h3>" + t + "</h3><p>" + d + "</p></div></li>").join("") +
        "</ol></div>" +
        (mode === "dynamic" ? snippet("wf2", [{ id: "wf2", label: "WF2", command: "make wf2 APK=" + state.apk + " PKG=com.example.app", explanation: "Boots the stack if needed, deploys the APK, routes traffic through mitmproxy and starts frida-server." }]) : "") +
        "</section>" +
        '<section class="stack"><h2 class="section-title">Target</h2><div class="card section"><div>' + apkField() + "</div></div></section>" +
        '<section class="stack"><h2 class="section-title">All actions</h2><div class="tiles">' + Object.keys(ACTIONS).map(actionTile).join("") + "</div></section>" +
        "</div>";
    },

    console() {
      return '<div class="page">' +
        pageHead("terminal", "Execution engine & progress console", "Live output of lab jobs started from this console, with their outcome.",
          '<div style="display:flex;gap:8px" data-bind="console-actions">' + consoleActions() + "</div>") +
        '<section class="dark-panel console crosshair"><div class="console-head"><h2>Execution pipeline status</h2>' +
        '<p class="muted">Jobs started from this console, newest first. Output streams below as it arrives.</p></div>' +
        '<div class="jobs" data-bind="jobs">' + jobsList(6) + "</div>" +
        '<div class="log-head"><span>' + icon("terminal") + "lab output</span>" +
        '<span class="live' + (state.running ? "" : " idle") + '" data-bind="live"><span class="dot ' + (state.running ? "run" : "") + '"></span>' + (state.running ? "streaming" : "idle") + "</span></div>" +
        '<div class="log code-scroll" id="log" role="log" aria-live="off">' + logLines() + "</div></section>" +
        '<section class="stack"><h2 class="section-title">Troubleshooting &amp; terminal diagnosis</h2>' +
        snippet("diag", [
          { id: "status", label: "Lab status", command: "./labctl android status", explanation: "Containers, endpoints, CPU/RAM and device readiness in one report." },
          { id: "logs", label: "Tail emulator logs", command: "make logs", explanation: "Follows the emulator container's output to confirm KVM and ADB came up." },
          { id: "logcat", label: "Filtered logcat", command: "adb logcat -v time | grep -i frida", explanation: "Android system log filtered to Frida instrumentation messages." }
        ]) + "</section></div>";
    },

    analytics() {
      const done = state.jobs.filter((j) => j.status !== "running");
      const ok = done.filter((j) => j.status === "ok").length;
      return '<div class="page">' +
        pageHead("chart", "Analytics & reports", "Outcomes of this session's runs and the security reports generated so far.",
          '<button type="button" class="btn outline" data-act="refresh-reports">' + icon("refresh") + "Refresh</button>") +
        '<div class="kpis">' +
        kpi("Jobs run", "terminal", esc(state.jobs.length), "This console session") +
        kpi("Passed", "check", esc(ok), done.length ? Math.round((ok / done.length) * 100) + "% of finished jobs" : "No finished jobs") +
        kpi("Failed", "warn", esc(done.length - ok), "Non-zero exit or error") +
        kpi("Reports", "file", state.reports == null ? "…" : esc(state.reports.length), "HTML files in artifacts/") +
        "</div>" +
        section({ icon: "file", title: "Generated security reports", desc: "HTML reports written under <code>artifacts/</code>. Run WF1 to create one.",
          action: runButton("wf1", "outline") }, '<div data-bind="reports-list">' + reportsBody() + "</div>") +
        "</div>";
    },

    sitemap() {
      const link = (href, iconName, title, desc, badge) =>
        '<a class="sitemap-link" href="' + href + '"><span class="tile-icon">' + icon(iconName) + "</span><span><strong>" + esc(title) +
        (badge ? ' <span class="pill" data-tone="orange" style="margin:0">' + esc(badge) + "</span>" : "") + '</strong><span class="d">' + esc(desc) + "</span></span></a>";
      return '<div class="page">' +
        pageHead("map", "Routes & capability sitemap", "Every page, workflow and endpoint of the lab, and where it leads.", runButton("analyze", "brand")) +
        '<div class="sitemap crosshair">' +
        '<div class="sitemap-col"><h2>Targets</h2>' +
        link("#/android/overview", "upload", "Upload APK", "Stage a package into apks/") +
        link("#/android/providers", "phone", "ADB devices", "Emulators and phones on this host") +
        link("#/android/providers", "cpu", "Emulator endpoints", "noVNC, MobSF, mitmweb, ADB") + "</div>" +
        '<div class="sitemap-col"><h2>Workflows</h2>' +
        link("#/android/workflows", "shield", "WF1 static audit", "JADX, manifest and MASVS rules", "Core") +
        link("#/android/workflows", "cpu", "WF2 dynamic", "Emulator, mitmproxy and Frida") +
        link("#/android/workflows", "bug", "IPC fuzzer", "Exported components and providers") +
        link("#/android/workflows", "sparkle", "Agentic playbook", "Hypotheses and Frida hooks") + "</div>" +
        '<div class="sitemap-col"><h2>Observe</h2>' +
        link("#/android/console", "terminal", "Execution & logs", "Live job output") +
        link("#/android/analytics", "chart", "Analytics", "Run outcomes and reports") +
        link("/api/health", "pulse", "Health endpoint", "GET /api/health") + "</div>" +
        '<div class="sitemap-col"><h2>Platforms</h2>' +
        Object.entries(LABS).map(([id, lab]) => link("#/" + id, lab.icon, lab.label, lab.directory)).join("") + "</div>" +
        "</div>" +
        section({ icon: "scan", title: "Attack surface extraction", desc: "Runs the app analyzer on <code>" + esc(state.apk) + "</code> and prints exported components, deep links and permissions to the console." },
          '<div style="display:flex;gap:8px;flex-wrap:wrap">' + runButton("analyze") + '<a class="btn ghost" href="#/android/console">Open console</a></div>') +
        "</div>";
    }
  };

  function labPage(id) {
    const lab = LABS[id];
    return '<div class="page narrow">' +
      section({ icon: lab.icon, title: lab.label, desc: esc(lab.description) },
        '<p class="small muted">These commands run from your os-lab checkout. Lab runtime status is available through <code>labctl</code> on the host.</p>') +
      section({ icon: "pulse", title: "Check the host" }, snippet(id + "-check", [{ id: "c", label: "check", command: lab.check }])) +
      section({ icon: "play", title: "Start the lab", desc: "Configuration: <code>" + esc(lab.directory) + "</code>" }, snippet(id + "-setup", [{ id: "s", label: "setup", command: lab.setup }])) +
      section({ icon: "external", title: "Endpoints", desc: "Defaults from labctl; ports follow the lab's .env." }, endpointList(lab.endpoints)) +
      "</div>";
  }

  function reportsBody() {
    if (state.reports == null) return '<p class="muted small">Scanning artifacts/ for reports…</p>';
    if (!state.reports.length) return '<p class="empty">No reports generated yet. Run WF1 first.</p>';
    return '<ul class="list">' + state.reports.map((r) =>
      '<li><span class="tile-icon">' + icon("file") + '</span><span class="name" title="' + esc(r.name) + '">' + esc(r.name) + "</span>" +
      '<a class="btn outline" href="' + esc(r.url) + '" target="_blank" rel="noreferrer">' + icon("external") + "Open</a></li>").join("") + "</ul>";
  }

  function consoleActions() {
    return (state.running
      ? '<button type="button" class="btn stop" data-act="stop">' + icon("stop") + "Stop job</button>"
      : '<a class="btn go" href="#/android/workflows">' + icon("play") + "New run</a>") +
      '<button type="button" class="btn outline" data-act="clear-logs"' + (state.running ? " disabled" : "") + ">" + icon("trash") + "Clear</button>";
  }

  // ── Render ────────────────────────────────────────────────────────────
  function render() {
    const route = currentRoute();
    if (state.peek) state.peek = false;
    renderTopbar(route);
    renderSidebar(true);
    const view = $("#view");
    view.innerHTML = route.lab === "android" ? PAGES[route.page]() : labPage(route.lab);
    $("#content").scrollTop = 0;
    if (route.page === "console") scrollLog(true);
    if (route.page === "providers" || route.page === "overview") loadDevices();
    if (route.page === "analytics") loadReports();
  }

  /** Update live regions in place, so typing and focus are not disturbed by polling. */
  function refreshLive(prevRunning) {
    renderLabState();
    renderSidebar(false);
    const route = currentRoute();
    if (route.lab !== "android") return;
    const set = (key, html) => $$('[data-bind="' + key + '"]').forEach((el) => { el.innerHTML = html; });
    if (route.page === "console") {
      const log = $("#log");
      const atBottom = log && log.scrollHeight - log.scrollTop - log.clientHeight < 40;
      if (log) log.innerHTML = logLines();
      if (atBottom) scrollLog(true);
      set("jobs", jobsList(6));
      const live = $('[data-bind="live"]');
      if (live) {
        live.className = "live" + (state.running ? "" : " idle");
        live.innerHTML = '<span class="dot ' + (state.running ? "run" : "") + '"></span>' + (state.running ? "streaming" : "idle");
      }
      if (prevRunning !== state.running) set("console-actions", consoleActions());
    }
    if (prevRunning !== state.running) {
      $$("[data-run]").forEach((b) => { b.disabled = state.running; });
      if (route.page === "overview" || route.page === "analytics") {
        const y = $("#content").scrollTop;
        $("#view").innerHTML = PAGES[route.page]();
        $("#content").scrollTop = y;
      }
    }
  }

  function scrollLog(force) {
    const log = $("#log");
    if (log && force) log.scrollTop = log.scrollHeight;
  }

  // ── Data loading ──────────────────────────────────────────────────────
  function parseJobs(lines) {
    const jobs = [];
    let cur = null;
    for (const line of lines) {
      let m = /\[\+\] === Executing: (.*) ===/.exec(line);
      if (m) {
        if (cur && cur.status === "running") cur.status = "err";
        cur = { title: m[1], status: "running", code: null, lines: 0 };
        jobs.push(cur);
        continue;
      }
      if (!cur) continue;
      m = /\[\+\] Task finished with exit code (-?\d+)/.exec(line);
      if (m) {
        cur.code = Number(m[1]);
        cur.status = cur.code === 0 ? "ok" : "err";
        continue;
      }
      if (/^\[!\] Error:/.test(line.trim())) {
        cur.status = "err";
        continue;
      }
      cur.lines++;
    }
    if (cur && cur.status === "running" && !state.running) cur.status = "err";
    return jobs;
  }

  let logSig = "";
  async function pollLogs() {
    try {
      const data = await getJSON("/api/logs");
      const logs = data.logs || [];
      const running = Boolean(data.running);
      const sig = logs.length + ":" + (logs[logs.length - 1] || "") + ":" + running;
      if (sig === logSig) return;
      logSig = sig;
      const prev = state.running;
      state.logs = logs;
      state.running = running;
      state.jobs = parseJobs(logs);
      if (prev && !running) {
        loadReports();
        const last = state.jobs[state.jobs.length - 1];
        if (last) toast((last.status === "ok" ? "Finished: " : "Failed: ") + last.title, last.status === "ok" ? "check" : "warn");
      }
      refreshLive(prev);
    } catch (e) {
      /* health polling reports the outage */
    }
  }

  async function pollHealth() {
    try {
      const data = await getJSON("/api/health");
      state.healthy = data.status === "ok";
      state.version = data.version || "";
    } catch (e) {
      state.healthy = false;
    }
    renderLabState();
    renderSidebar(false);
    $$('[data-bind="engine"]').forEach((el) => { el.textContent = state.healthy ? "Ready" : "Offline"; });
  }

  async function loadDevices() {
    try {
      const data = await getJSON("/api/devices");
      const raw = data.devices || "";
      state.devicesRaw = raw;
      state.devices = raw.split(/\r?\n/).slice(1)
        .map((l) => l.trim()).filter(Boolean)
        .map((l) => { const [serial, st] = l.split(/\s+/); return { serial, state: st || "unknown" }; })
        .filter((d) => d.serial && !/^\*/.test(d.serial));
      if (!/List of devices/.test(raw)) state.devices = [];
    } catch (e) {
      state.devices = [];
      state.devicesRaw = "Could not reach the lab engine.";
    }
    $$('[data-bind="devices-list"]').forEach((el) => { el.innerHTML = devicesBody(); });
    $$('[data-bind="devices"]').forEach((el) => { el.textContent = state.devices.length; });
    renderSidebar(false);
  }

  async function loadReports() {
    try {
      const data = await getJSON("/api/reports");
      state.reports = data.reports || [];
    } catch (e) {
      state.reports = [];
    }
    $$('[data-bind="reports-list"]').forEach((el) => { el.innerHTML = reportsBody(); });
    $$('[data-bind="reports"]').forEach((el) => { el.textContent = state.reports.length; });
    renderSidebar(false);
  }

  // ── Actions ───────────────────────────────────────────────────────────
  async function runAction(id) {
    if (!ACTIONS[id] || state.running) return;
    try {
      const res = await postJSON("/api/run", { action: id, apk: state.apk });
      toast("Started: " + (res.title || ACTIONS[id].label), "play");
      state.running = true;
      go("#/android/console");
      pollLogs();
    } catch (e) {
      toast("Could not start " + ACTIONS[id].label + ": " + e.message, "warn");
    }
  }

  function setApk(value) {
    state.apk = value.trim() || "scripts/vulnerable-test.apk";
    store.set("oslab.apk", state.apk);
    $$("[data-apk]").forEach((el) => { if (el.value !== state.apk && document.activeElement !== el) el.value = state.apk; });
  }

  async function upload(files) {
    if (!files || !files.length) return;
    const file = files[0];
    const status = $$("[data-upload-status]");
    const say = (html) => status.forEach((el) => { el.innerHTML = html; });
    say(icon("loader", "spin") + " Uploading " + esc(file.name) + " (" + Math.round(file.size / 1024) + " KB)…");
    const form = new FormData();
    form.append("apk", file);
    try {
      const r = await fetch("/api/upload", { method: "POST", body: form });
      const data = await r.json();
      if (data.status !== "success") throw new Error(data.error || "Upload failed");
      setApk(data.path);
      $$("[data-apk]").forEach((el) => { el.value = data.path; });
      say('<span class="status-line ok" style="justify-content:center">' + icon("check") + "Staged <code>" + esc(data.path) + "</code> (" + Math.round(data.size / 1024) + " KB)</span>");
      toast("Target set to " + data.path, "check");
    } catch (e) {
      say('<span class="status-line err" style="justify-content:center">' + icon("warn") + esc(e.message) + "</span>");
    }
  }

  let toastTimer;
  function toast(text, iconName) {
    let el = $(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      el.setAttribute("role", "status");
      document.body.appendChild(el);
    }
    el.innerHTML = icon(iconName || "check") + "<span>" + esc(text) + "</span>";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.remove(), 3500);
  }

  async function copy(text, btn) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (err) { /* nothing more to try */ }
      ta.remove();
    }
    if (btn) {
      btn.classList.add("done");
      btn.innerHTML = icon("check");
      setTimeout(() => { btn.classList.remove("done"); btn.innerHTML = icon("copy"); }, 1500);
    }
  }

  // ── Drawer ────────────────────────────────────────────────────────────
  function openDrawer() {
    const d = $("#drawer");
    d.innerHTML = '<div class="sidebar">' + sidebarHTML("drawer") + "</div>";
    if (!d.open) d.showModal();
  }
  function closeDrawer() {
    const d = $("#drawer");
    if (d.open) d.close();
  }

  // ── Spotlight ─────────────────────────────────────────────────────────
  function spotlightEntries() {
    const entries = [];
    for (const p of ANDROID_PAGES)
      entries.push({ group: "Android Lab", title: p.label, desc: p.desc, icon: p.icon, kind: "Page", keys: p.aliases, run: () => go("#/android/" + p.id) });
    for (const [id, lab] of Object.entries(LABS))
      entries.push({ group: "OS Lab", title: lab.label, desc: lab.description, icon: lab.icon, kind: "Page", keys: lab.directory, run: () => go("#/" + id) });
    for (const [id, a] of Object.entries(ACTIONS))
      entries.push({ group: "Run", title: a.label, desc: a.desc, icon: a.icon, kind: state.running ? "Busy" : "Action", keys: id + " run " + a.group, run: () => runAction(id) });
    const dark = document.documentElement.getAttribute("data-mode") === "dark";
    entries.push(
      { group: "Commands", title: "Toggle theme", desc: "Switch to " + (dark ? "light" : "dark") + " mode", icon: dark ? "sun" : "moon", kind: "Command", keys: "dark light appearance", run: toggleTheme },
      { group: "Commands", title: state.collapsed ? "Expand sidebar" : "Collapse sidebar", desc: "Icon rail or full sidebar", icon: "sidebar", kind: "Command", keys: "sidebar rail nav", run: () => setCollapsed(!state.collapsed) },
      { group: "Commands", title: "Refresh ADB devices", desc: "Re-run adb devices", icon: "refresh", kind: "Command", keys: "adb devices reload", run: loadDevices },
      { group: "Commands", title: "Upload APK", desc: "Pick a package to stage as the target", icon: "upload", kind: "Command", keys: "apk file import", run: () => $("#apk-file-picker").click() }
    );
    return entries;
  }

  let spotItems = [];
  let spotIndex = 0;
  function renderSpotlight() {
    const q = $("#spot-q").value.trim().toLowerCase();
    const words = q.split(/\s+/).filter(Boolean);
    spotItems = spotlightEntries().filter((e) => {
      const hay = (e.title + " " + e.desc + " " + e.keys + " " + e.group).toLowerCase();
      return words.every((w) => hay.includes(w));
    });
    spotIndex = Math.min(spotIndex, Math.max(spotItems.length - 1, 0));
    const list = $("#spot-list");
    if (!spotItems.length) {
      list.innerHTML = '<li class="spot-group">No results for “' + esc(q) + "”</li>";
      return;
    }
    let html = "", group = "";
    spotItems.forEach((e, i) => {
      if (e.group !== group) {
        group = e.group;
        html += '<li class="spot-group" role="presentation">' + esc(group) + "</li>";
      }
      html += '<li class="spot-item" role="option" id="spot-' + i + '" data-spot="' + i + '" aria-selected="' + (i === spotIndex) + '">' +
        '<span class="tile-icon">' + icon(e.icon) + '</span><div><div class="t">' + esc(e.title) + '</div><div class="d">' + esc(e.desc) + "</div></div>" +
        '<span class="kind">' + esc(e.kind) + "</span></li>";
    });
    list.innerHTML = html;
    $("#spot-q").setAttribute("aria-activedescendant", "spot-" + spotIndex);
    const sel = $("#spot-" + spotIndex);
    if (sel) sel.scrollIntoView({ block: "nearest" });
  }
  function openSpotlight() {
    closeDrawer();
    const d = $("#spotlight");
    $("#spot-q").value = "";
    spotIndex = 0;
    renderSpotlight();
    if (!d.open) d.showModal();
    $("#spot-q").focus();
  }
  function choose(i) {
    const e = spotItems[i];
    $("#spotlight").close();
    if (e) e.run();
  }

  // ── Events ────────────────────────────────────────────────────────────
  document.addEventListener("click", (ev) => {
    const t = ev.target.closest("[data-run],[data-act],[data-toggle-item],[data-copy],[data-snippet-tab],[data-mode],[data-dropzone],[data-spot],a.row");
    const aside = $("#sidebar");

    // A click outside a "peek" (rail-expanded) sidebar collapses it again
    if (state.peek && !aside.contains(ev.target) && !ev.target.closest("dialog[open]")) {
      state.peek = false;
      renderSidebar(true);
    }
    if (!t) return;

    if (t.matches("a.row")) {
      if (t.closest("#drawer")) closeDrawer();
      // In the collapsed rail a plain item still navigates (it has no submenu to reveal)
      return;
    }
    if (t.dataset.run) return runAction(t.dataset.run);
    if (t.dataset.copy != null) return copy(t.dataset.copy, t.matches(".copy") ? t : null);
    if (t.dataset.spot != null) return choose(Number(t.dataset.spot));
    if (t.dataset.dropzone != null) return $("#apk-file-picker").click();
    if (t.dataset.mode) {
      state.workflowMode = t.dataset.mode;
      store.set("oslab.workflow", t.dataset.mode);
      const y = $("#content").scrollTop;
      $("#view").innerHTML = PAGES.workflows();
      $("#content").scrollTop = y;
      return;
    }
    if (t.dataset.snippetTab) {
      const [key, id] = t.dataset.snippetTab.split(":");
      state.snippetTab[key] = id;
      const route = currentRoute();
      const y = $("#content").scrollTop;
      $("#view").innerHTML = route.lab === "android" ? PAGES[route.page]() : labPage(route.lab);
      $("#content").scrollTop = y;
      const again = $('[data-snippet-tab="' + key + ":" + id + '"]');
      if (again) again.focus();
      return;
    }
    if (t.dataset.toggleItem) {
      const id = t.dataset.toggleItem;
      const inRail = !t.closest("#drawer") && state.collapsed && !state.peek;
      if (inRail) {
        // A rail click expands the sidebar with this item's submenu open; it never navigates
        state.peek = true;
        state.open[id] = true;
      } else {
        const now = t.getAttribute("aria-expanded") === "true";
        state.open[id] = !now;
      }
      renderSidebar(true);
      if (t.closest("#drawer")) openDrawer();
      return;
    }
    switch (t.dataset.act) {
      case "toggle-sidebar":
        return state.peek ? (state.peek = false, setCollapsed(false)) : setCollapsed(!state.collapsed);
      case "spotlight":
        return openSpotlight();
      case "close-drawer":
        return closeDrawer();
      case "refresh-devices":
        state.devices = null;
        $$('[data-bind="devices-list"]').forEach((el) => { el.innerHTML = devicesBody(); });
        return loadDevices();
      case "refresh-reports":
        return loadReports();
      case "clear-logs":
        return postJSON("/api/logs/clear").then(() => { logSig = ""; pollLogs(); }).catch((e) => toast(e.message, "warn"));
      case "stop":
        return postJSON("/api/stop").then(() => toast("Stop requested", "stop")).catch((e) => toast(e.message, "warn"));
    }
  });

  document.addEventListener("keydown", (ev) => {
    if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === "k") {
      ev.preventDefault();
      const d = $("#spotlight");
      if (d.open) d.close();
      else openSpotlight();
      return;
    }
    const dz = ev.target.closest && ev.target.closest("[data-dropzone]");
    if (dz && (ev.key === "Enter" || ev.key === " ")) {
      ev.preventDefault();
      $("#apk-file-picker").click();
    }
  });

  document.addEventListener("input", (ev) => {
    if (ev.target.matches("[data-apk]")) setApk(ev.target.value);
  });

  // Drag-and-drop onto any drop zone
  document.addEventListener("dragover", (ev) => {
    const dz = ev.target.closest && ev.target.closest("[data-dropzone]");
    if (!dz) return;
    ev.preventDefault();
    dz.classList.add("over");
  });
  document.addEventListener("dragleave", (ev) => {
    const dz = ev.target.closest && ev.target.closest("[data-dropzone]");
    if (dz) dz.classList.remove("over");
  });
  document.addEventListener("drop", (ev) => {
    const dz = ev.target.closest && ev.target.closest("[data-dropzone]");
    if (!dz) return;
    ev.preventDefault();
    dz.classList.remove("over");
    upload(ev.dataTransfer && ev.dataTransfer.files);
  });
  $("#apk-file-picker").addEventListener("change", (ev) => {
    upload(ev.target.files);
    ev.target.value = "";
  });

  $("#spot-q").addEventListener("input", () => { spotIndex = 0; renderSpotlight(); });
  $("#spot-q").addEventListener("keydown", (ev) => {
    if (ev.key === "ArrowDown") { ev.preventDefault(); spotIndex = Math.min(spotIndex + 1, spotItems.length - 1); renderSpotlight(); }
    else if (ev.key === "ArrowUp") { ev.preventDefault(); spotIndex = Math.max(spotIndex - 1, 0); renderSpotlight(); }
    else if (ev.key === "Enter") { ev.preventDefault(); choose(spotIndex); }
  });
  for (const id of ["#spotlight", "#drawer"]) {
    // Backdrop click closes; Escape is native to <dialog>
    $(id).addEventListener("click", (ev) => { if (ev.target === ev.currentTarget) ev.currentTarget.close(); });
  }

  $("#open-nav").addEventListener("click", openDrawer);
  $("#open-search").addEventListener("click", openSpotlight);
  $("#theme-toggle").addEventListener("click", toggleTheme);
  window.addEventListener("hashchange", () => { closeDrawer(); render(); });

  // Static icon slots in index.html
  $$("[data-icon]").forEach((el) => {
    el.insertAdjacentHTML("afterbegin", icon(el.dataset.icon, el.classList.contains("shield-slot") ? "shield" : ""));
  });
  $(".shield-slot svg").classList.add("shield");
  $(".shield-slot").style.display = "contents";

  // ── Boot ──────────────────────────────────────────────────────────────
  renderThemeButton();
  render();
  pollHealth();
  pollLogs();
  loadReports();
  if (state.devices == null) loadDevices();
  setInterval(pollLogs, 1000);
  setInterval(pollHealth, 5000);
})();
