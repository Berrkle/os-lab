/*
 * root-detection-bypass.js — standard educational root-detection bypass for lab WF2.
 * Run: frida -U -f <package> -l hooks/root-detection-bypass.js
 * Masks the common checks: Runtime.exec of su/which/ mount, System.getProperty tags,
 * and PackageManager probes for superuser packages.
 */
Java.perform(function () {
    console.log("[*] root-detection-bypass loaded");

    var SUSPECTS = ['su', 'which', 'mount', 'busybox', 'supersu', 'Superuser.apk'];

    // 1) Runtime.exec — fake "not found" for su-related commands
    var Runtime = Java.use('java.lang.Runtime');
    Runtime.exec.overload('java.lang.String').implementation = function (cmd) {
        for (var i = 0; i < SUSPECTS.length; i++) {
            if (cmd.indexOf(SUSPECTS[i]) !== -1) {
                console.log('[+] blocked exec: ' + cmd);
                throw Java.use('java.io.IOException').$new('not found');
            }
        }
        return this.exec(cmd);
    };

    // 2) System.getProperty — hide common build tags used by detectors
    var System = Java.use('java.lang.System');
    var TAGS = ['ro.build.tags', 'ro.debuggable', 'ro.secure', 'vphone', 'goldfish'];
    System.getProperty.overload('java.lang.String').implementation = function (key) {
        if (TAGS.indexOf(key) !== -1) {
            console.log('[+] masked getProperty: ' + key);
            return null;
        }
        return this.getProperty(key);
    };

    // 3) PackageManager.getPackageInfo — hide superuser packages
    var PM = Java.use('android.app.ApplicationPackageManager');
    var HIDDEN = ['com.topjohnwu.magisk', 'eu.chainfire.supersu', 'com.noshufou.android.su',
                  'com.koushikdutta.superuser', 'com.thirdparty.superuser'];
    PM.getPackageInfo.overload('java.lang.String', 'int').implementation = function (pkg, flags) {
        if (HIDDEN.indexOf(pkg) !== -1) {
            console.log('[+] hid package from detector: ' + pkg);
            throw Java.use('android.content.pm.PackageManager$NameNotFoundException').$new(pkg);
        }
        return this.getPackageInfo(pkg, flags);
    };
});
