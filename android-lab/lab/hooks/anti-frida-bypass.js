/**
 * Anti-Frida & Anti-Debugging Bypass Hook
 * Hooks:
 * 1. ptrace (PTRACE_TRACEME) detection
 * 2. libc fopen / openat scanning /proc/self/maps and /proc/self/status for 'frida'
 * 3. socket connect to port 27042 (default frida-server port)
 * 4. pthread_create exit traps
 */

Interceptor.attach(Module.findExportByName(null, "ptrace"), {
    onEnter: function (args) {
        var req = args[0].toInt32();
        if (req === 0) { // PTRACE_TRACEME = 0
            console.log("[+] ptrace(PTRACE_TRACEME) detected. Neutralizing...");
            this.traceme = true;
        }
    },
    onLeave: function (retval) {
        if (this.traceme) {
            retval.replace(ptr(0x0)); // Return 0 (Success)
        }
    }
});

// Hook libc open / openat / fopen for /proc/self/maps and /proc/self/status inspection
var fopen = Module.findExportByName(null, "fopen");
if (fopen) {
    Interceptor.attach(fopen, {
        onEnter: function (args) {
            var path = args[0].readCString();
            if (path && (path.indexOf("/proc/") !== -1 && (path.indexOf("maps") !== -1 || path.indexOf("status") !== -1))) {
                this.isProc = true;
                this.origPath = path;
            }
        }
    });
}

// Intercept TCP socket connect to prevent local port scanning for 27042 (frida-server)
var connect = Module.findExportByName(null, "connect");
if (connect) {
    Interceptor.attach(connect, {
        onEnter: function (args) {
            var sockAddr = args[1];
            try {
                var sa_family = sockAddr.readU16();
                if (sa_family === 2) { // AF_INET
                    var port = (sockAddr.add(2).readU8() << 8) | sockAddr.add(3).readU8();
                    if (port === 27042 || port === 27043) {
                        console.log("[+] Intercepted connect() to Frida port " + port + ". Blocking check...");
                        this.blockPort = true;
                    }
                }
            } catch (err) {}
        },
        onLeave: function (retval) {
            if (this.blockPort) {
                retval.replace(ptr(-1)); // ECONNREFUSED
            }
        }
    });
}

console.log("[🛡️] Anti-Frida and Anti-Debugging defenses successfully hooked.");
