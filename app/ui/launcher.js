// The launcher: ask the native side to start the os-lab console, then hand the window to the
// dashboard it serves. Plain JS on purpose — no build step, nothing to bundle.
(function () {
  "use strict";
  var invoke = window.__TAURI__ && window.__TAURI__.core && window.__TAURI__.core.invoke;
  var $ = function (id) { return document.getElementById(id); };
  var statusEl = $("status"), spinner = $("spinner"), problem = $("problem");
  var detail = $("detail"), where = $("where"), resetBtn = $("reset");

  function show(message, isError) {
    statusEl.textContent = message;
    spinner.hidden = !!isError;
    problem.hidden = !isError;
  }

  function fail(err) {
    show("The os-lab console could not start.", true);
    detail.textContent = String(err && err.message ? err.message : err);
    invoke("console_logs").then(function (log) {
      if (log) detail.textContent += "\n\n— console.log —\n" + log;
    }, function () {});
  }

  function start() {
    show("Starting the console…", false);
    if (!invoke) { return fail("The Tauri bridge is missing; open this app from its window, not a browser."); }
    invoke("console_start").then(function (info) {
      where.textContent = info.source + ": " + info.root;
      resetBtn.hidden = info.source !== "chosen";
      show("Opening the dashboard…", false);
      window.location.replace(info.url);
    }, fail);
  }

  $("retry").addEventListener("click", start);
  $("choose").addEventListener("click", function () {
    invoke("console_choose_root").then(function (path) { if (path) start(); }, fail);
  });
  resetBtn.addEventListener("click", function () {
    invoke("console_reset_root").then(start, fail);
  });
  start();
})();
