/*
 * ssl-pinning-bypass.js — standard educational SSL-pinning bypass for lab WF2.
 * Run: frida -U -f <package> -l hooks/ssl-pinning-bypass.js   (or: make hook PKG=... HOOK=...)
 * Covers the common pinning paths: default TrustManager, OkHttp3 CertificatePinner,
 * javax.net.ssl.HttpsURLConnection host verification.
 */
Java.perform(function () {
    console.log("[*] ssl-pinning-bypass loaded");

    // 1) Trust all certificates via a permissive X509TrustManager
    var X509TrustManager = Java.use('javax.net.ssl.X509TrustManager');
    var HostnameVerifier = Java.use('javax.net.ssl.HostnameVerifier');
    var SSLContext = Java.use('javax.net.ssl.SSLContext');

    var TrustManager = Java.registerClass({
        name: 'lab.TrustAllManager',
        implements: [X509TrustManager],
        methods: {
            checkClientTrusted: function (chain, authType) { },
            checkServerTrusted: function (chain, authType) { },
            getAcceptedIssuers: function () { return []; }
        }
    });

    var TrustingVerifier = Java.registerClass({
        name: 'lab.TrustAllVerifier',
        implements: [HostnameVerifier],
        methods: {
            verify: function (hostname, session) { return true; }
        }
    });

    SSLContext.init.overload(
        '[Ljavax.net.ssl.KeyManager;',
        '[Ljavax.net.ssl.TrustManager;',
        'java.security.SecureRandom'
    ).implementation = function (km, tm, sr) {
        console.log('[+] SSLContext.init → injecting TrustAllManager');
        this.init(km, [TrustManager.$new()], sr);
    };

    // 2) OkHttp3 CertificatePinner.check → no-op
    try {
        var CertificatePinner = Java.use('okhttp3.CertificatePinner');
        CertificatePinner.check.overload('java.lang.String', 'java.util.List')
            .implementation = function (hostname, peerCertificates) {
                console.log('[+] OkHttp3 CertificatePinner.check bypassed for ' + hostname);
            };
    } catch (e) {
        console.log('[-] okhttp3.CertificatePinner not present: ' + e.message);
    }

    // 3) HttpsURLConnection default hostname verifier
    try {
        var HttpsURL = Java.use('javax.net.ssl.HttpsURLConnection');
        HttpsURL.setDefaultHostnameVerifier.implementation = function (v) {
            console.log('[+] HttpsURLConnection.setDefaultHostnameVerifier → TrustAll');
            this.setDefaultHostnameVerifier(TrustingVerifier.$new());
        };
    } catch (e) {
        console.log('[-] HttpsURLConnection hook failed: ' + e.message);
    }
});
