// The launcher: ask the native side to start the os-lab console, then hand the window to the
// dashboard it serves. Plain JS on purpose — no build step, nothing to bundle.
(function () {
  "use strict";
  var invoke = window.__TAURI__ && window.__TAURI__.core && window.__TAURI__.core.invoke;
  var $ = function (id) { return document.getElementById(id); };
  var statusEl = $("status"), spinner = $("spinner"), problem = $("problem");
  var detail = $("detail"), where = $("where"), resetBtn = $("reset");
  var language = (navigator.languages || [navigator.language || "en"])
    .map(function (value) { return value.toLowerCase().split("-")[0]; })
    .find(function (value) { return ["en", "tr", "de", "fr", "es", "it", "fa", "ar"].indexOf(value) !== -1; }) || "en";
  document.documentElement.lang = language;
  document.documentElement.dir = language === "fa" || language === "ar" ? "rtl" : "ltr";
  var strings = {
    en: { starting: "Starting the console…", opening: "Opening the dashboard…", failed: "The os-lab console could not start.", bridge: "The Tauri bridge is missing; open this app from its window, not a browser.", retry: "Retry", choose: "Use my os-lab checkout…", reset: "Use bundled copy" },
    tr: { starting: "Konsol başlatılıyor…", opening: "Pano açılıyor…", failed: "os-lab konsolu başlatılamadı.", bridge: "Tauri bağlantısı bulunamadı; bu uygulamayı tarayıcı yerine kendi penceresinde açın.", retry: "Yeniden dene", choose: "Kendi os-lab kopyamı kullan…", reset: "Paketlenmiş kopyayı kullan" },
    de: { starting: "Konsole wird gestartet…", opening: "Dashboard wird geöffnet…", failed: "Die os-lab-Konsole konnte nicht gestartet werden.", bridge: "Die Tauri-Verbindung fehlt. Öffne diese App im eigenen Fenster, nicht im Browser.", retry: "Erneut versuchen", choose: "Meine os-lab-Arbeitskopie verwenden…", reset: "Mitgelieferte Kopie verwenden" },
    fr: { starting: "Démarrage de la console…", opening: "Ouverture du tableau de bord…", failed: "La console os-lab n’a pas pu démarrer.", bridge: "La connexion Tauri est absente. Ouvrez cette application dans sa fenêtre, et non dans un navigateur.", retry: "Réessayer", choose: "Utiliser ma copie de travail os-lab…", reset: "Utiliser la copie intégrée" },
    es: { starting: "Iniciando la consola…", opening: "Abriendo el panel…", failed: "No se pudo iniciar la consola de os-lab.", bridge: "Falta la conexión de Tauri. Abre esta aplicación en su propia ventana, no en un navegador.", retry: "Reintentar", choose: "Usar mi copia de trabajo de os-lab…", reset: "Usar la copia incluida" },
    it: { starting: "Avvio della console…", opening: "Apertura della dashboard…", failed: "Impossibile avviare la console os-lab.", bridge: "Manca la connessione Tauri. Apri questa app nella sua finestra, non in un browser.", retry: "Riprova", choose: "Usa la mia copia di lavoro di os-lab…", reset: "Usa la copia inclusa" },
    fa: { starting: "کنسول در حال راه‌اندازی است…", opening: "داشبورد در حال باز شدن است…", failed: "کنسول os-lab راه‌اندازی نشد.", bridge: "اتصال Tauri موجود نیست؛ این برنامه را در پنجره خودش باز کنید، نه در مرورگر.", retry: "تلاش دوباره", choose: "استفاده از نسخه کاری os-lab من…", reset: "استفاده از نسخه همراه برنامه" },
    ar: { starting: "جارٍ تشغيل وحدة التحكم…", opening: "جارٍ فتح لوحة المعلومات…", failed: "تعذّر تشغيل وحدة تحكم os-lab.", bridge: "اتصال Tauri غير موجود؛ افتح هذا التطبيق في نافذته الخاصة، وليس في المتصفح.", retry: "إعادة المحاولة", choose: "استخدام نسخة العمل الخاصة بي من os-lab…", reset: "استخدام النسخة المضمّنة" }
  };
  var t = strings[language] || strings.en;
  $("retry").textContent = t.retry;
  $("choose").textContent = t.choose;
  resetBtn.textContent = t.reset;

  function show(message, isError) {
    statusEl.textContent = message;
    spinner.hidden = !!isError;
    problem.hidden = !isError;
  }

  function fail(err) {
    show(t.failed, true);
    detail.textContent = String(err && err.message ? err.message : err);
    invoke("console_logs").then(function (log) {
      if (log) detail.textContent += "\n\n— console.log —\n" + log;
    }, function () {});
  }

  function start() {
    show(t.starting, false);
    if (!invoke) { return fail(t.bridge); }
    invoke("console_start").then(function (info) {
      where.textContent = info.source + ": " + info.root;
      resetBtn.hidden = info.source !== "chosen";
      show(t.opening, false);
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
