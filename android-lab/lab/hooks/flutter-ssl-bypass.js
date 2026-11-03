/**
 * Flutter SSL Pinning Bypass for Frida
 * Targets BoringSSL / libflutter.so session cert verification function:
 * session_verify_cert_chain(SSL_HANDSHAKE *hs, uint8_t *out_alert)
 * Compatible with modern Flutter ARM, ARM64, and x86_64 binaries.
 */

function hookFlutter() {
    console.log("[*] Searching for libflutter.so...");

    var flutterModule = Process.findModuleByName("libflutter.so");
    if (!flutterModule) {
        console.log("[-] libflutter.so not loaded yet. Hooking dlopen/android_dlopen_ext...");
        var dlopen = Module.findExportByName(null, "android_dlopen_ext") || Module.findExportByName(null, "dlopen");
        if (dlopen) {
            Interceptor.attach(dlopen, {
                onEnter: function (args) {
                    var path = args[0].readCString();
                    if (path && path.indexOf("libflutter.so") !== -1) {
                        this.found = true;
                    }
                },
                onLeave: function (retval) {
                    if (this.found) {
                        console.log("[+] libflutter.so loaded via dlopen. Applying hooks...");
                        setTimeout(findAndHookVerifyChain, 1000);
                    }
                }
            });
        }
    } else {
        console.log("[+] libflutter.so already loaded at: " + flutterModule.base);
        findAndHookVerifyChain();
    }
}

function findAndHookVerifyChain() {
    var module = Process.findModuleByName("libflutter.so");
    if (!module) {
        console.log("[-] libflutter.so not found.");
        return;
    }

    // Pattern for ssl_crypto_x509_session_verify_cert_chain
    // ssl_verify_result_t ssl_verify_result_ok = 1
    var patterns = [
        "55 41 57 41 56 41 55 41 54 53 48 83 ec ??", // x86_64
        "ff 83 00 d1 ?? ?? ?? ?? ?? ?? ?? ?? f3 03 00 aa", // ARM64
        "2d e9 f0 4f ?? ?? ?? ?? ?? ?? ?? ??" // ARMv7
    ];

    var hooked = false;
    patterns.forEach(function (pattern) {
        if (hooked) return;
        try {
            var matches = Memory.scanSync(module.base, module.size, pattern);
            if (matches.length > 0) {
                var target = matches[0].address;
                console.log("[+] Found session_verify_cert_chain signature at: " + target);
                Interceptor.attach(target, {
                    onLeave: function (retval) {
                        console.log("[+] Overriding BoringSSL certificate verification -> SUCCESS (1)");
                        retval.replace(ptr(0x1));
                    }
                });
                hooked = true;
            }
        } catch (e) {
            // Ignore scan failure for incompatible arch patterns
        }
    });

    if (!hooked) {
        console.log("[*] Fallback: Scanning for SSL_CTX_set_custom_verify export...");
        var customVerify = Module.findExportByName("libflutter.so", "SSL_CTX_set_custom_verify");
        if (customVerify) {
            Interceptor.attach(customVerify, {
                onEnter: function (args) {
                    console.log("[+] Hooked SSL_CTX_set_custom_verify, forcing mode SSL_VERIFY_NONE");
                    args[1] = ptr(0x0); // SSL_VERIFY_NONE
                }
            });
            hooked = true;
        }
    }

    if (hooked) {
        console.log("[🎯] Flutter SSL Pinning Bypass successfully activated!");
    } else {
        console.log("[-] Could not find Flutter cert verification function.");
    }
}

Java.perform(function () {
    hookFlutter();
});
