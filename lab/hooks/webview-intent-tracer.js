/**
 * Frida Hook: WebView & Intent IPC Tracer
 * Intercepts:
 * - android.webkit.WebView.loadUrl / postUrl (unencrypted URLs, deep links)
 * - android.webkit.WebView.addJavascriptInterface (JS bridge injection surface)
 * - android.content.Intent (sensitive data leaks across activities/services)
 */

Java.perform(function () {
    console.log("[*] [IPC-Tracer] Initializing WebView and Intent hooks...");

    var WebView = Java.use("android.webkit.WebView");
    var Intent = Java.use("android.content.Intent");

    // 1. WebView URL loads
    WebView.loadUrl.overload('java.lang.String').implementation = function (url) {
        console.log("\n[+] [WebView.loadUrl] " + url);
        if (url.startsWith("http://")) {
            console.log("    [⚠️ RISK] Insecure HTTP URL loaded in WebView!");
        }
        if (url.startsWith("javascript:")) {
            console.log("    [ℹ️ INFO] Executing JavaScript in WebView context");
        }
        return this.loadUrl(url);
    };

    // 2. JavaScript Interface additions
    WebView.addJavascriptInterface.implementation = function (object, name) {
        console.log("\n[+] [WebView.addJavascriptInterface] Bridge registered: '" + name + "' -> Class: " + object.$className);
        console.log("    [⚠️ RISK] Review methods of " + object.$className + " for Javascript interface exploitation");
        return this.addJavascriptInterface(object, name);
    };

    // 3. Intent Extras & Data
    Intent.putExtra.overload('java.lang.String', 'java.lang.String').implementation = function (key, value) {
        console.log("\n[+] [Intent.putExtra] Key: '" + key + "' | Value: '" + value + "'");
        return this.putExtra(key, value);
    };

    Intent.setData.implementation = function (uri) {
        if (uri) {
            console.log("\n[+] [Intent.setData] URI: " + uri.toString());
        }
        return this.setData(uri);
    };

    console.log("[*] [IPC-Tracer] WebView and Intent hooks active.");
});
