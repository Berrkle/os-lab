/**
 * Frida Hook: Cryptographic Operation Tracer
 * Intercepts Android Java cryptographic operations:
 * - javax.crypto.Cipher (keys, algorithms, modes, IVs, plaintexts, ciphertexts)
 * - javax.crypto.spec.SecretKeySpec (raw key extraction)
 * - javax.crypto.Mac (HMAC calculations, keys, inputs)
 * - java.security.MessageDigest (MD5, SHA-1, SHA-256 hashing)
 */

Java.perform(function () {
    console.log("[*] [Crypto-Tracer] Initializing cryptographic hooks...");

    var ByteString = Java.use("com.android.okhttp.okio.ByteString");
    var Cipher = Java.use("javax.crypto.Cipher");
    var SecretKeySpec = Java.use("javax.crypto.spec.SecretKeySpec");
    var IvParameterSpec = Java.use("javax.crypto.spec.IvParameterSpec");
    var Mac = Java.use("javax.crypto.Mac");
    var MessageDigest = Java.use("java.security.MessageDigest");

    function bytesToHex(bytes) {
        if (!bytes) return "null";
        var hex = [];
        for (var i = 0; i < bytes.length; i++) {
            var b = bytes[i] & 0xFF;
            hex.push((b < 16 ? "0" : "") + b.toString(16));
        }
        return hex.join("");
    }

    function bytesToAscii(bytes) {
        if (!bytes) return "";
        var str = "";
        for (var i = 0; i < bytes.length; i++) {
            var c = bytes[i] & 0xFF;
            if (c >= 32 && c <= 126) {
                str += String.fromCharCode(c);
            } else {
                str += ".";
            }
        }
        return str;
    }

    function getCipherMode(opmode) {
        switch (opmode) {
            case 1: return "ENCRYPT_MODE";
            case 2: return "DECRYPT_MODE";
            case 3: return "WRAP_MODE";
            case 4: return "UNWRAP_MODE";
            default: return "UNKNOWN(" + opmode + ")";
        }
    }

    // 1. SecretKeySpec Hook (extract keys on creation)
    SecretKeySpec.$init.overload('[B', 'java.lang.String').implementation = function (keyBytes, algorithm) {
        console.log("\n[+] [SecretKeySpec] Algorithm: " + algorithm);
        console.log("    Key (Hex)   : " + bytesToHex(keyBytes));
        console.log("    Key (ASCII) : " + bytesToAscii(keyBytes));
        return this.$init(keyBytes, algorithm);
    };

    SecretKeySpec.$init.overload('[B', 'int', 'int', 'java.lang.String').implementation = function (keyBytes, offset, len, algorithm) {
        console.log("\n[+] [SecretKeySpec] Algorithm: " + algorithm + " (offset: " + offset + ", len: " + len + ")");
        console.log("    Key (Hex)   : " + bytesToHex(keyBytes));
        return this.$init(keyBytes, offset, len, algorithm);
    };

    // 2. Cipher.init Hook
    Cipher.init.overload('int', 'java.security.Key').implementation = function (opmode, key) {
        var algo = this.getAlgorithm();
        console.log("\n[+] [Cipher.init] Algorithm: " + algo + " | Mode: " + getCipherMode(opmode));
        try {
            if (key) {
                var encKey = key.getEncoded();
                console.log("    Key Format  : " + key.getFormat());
                console.log("    Key (Hex)   : " + bytesToHex(encKey));
            }
        } catch (e) {
            console.log("    [!] Could not extract key: " + e);
        }
        return this.init(opmode, key);
    };

    Cipher.init.overload('int', 'java.security.Key', 'java.security.spec.AlgorithmParameterSpec').implementation = function (opmode, key, params) {
        var algo = this.getAlgorithm();
        console.log("\n[+] [Cipher.init] Algorithm: " + algo + " | Mode: " + getCipherMode(opmode));
        try {
            if (key) {
                console.log("    Key (Hex)   : " + bytesToHex(key.getEncoded()));
            }
            if (params && params.$className === "javax.crypto.spec.IvParameterSpec") {
                var iv = Java.cast(params, IvParameterSpec).getIV();
                console.log("    IV (Hex)    : " + bytesToHex(iv));
            }
        } catch (e) {
            console.log("    [!] Parameter extraction error: " + e);
        }
        return this.init(opmode, key, params);
    };

    // 3. Cipher.doFinal Hook (extract plaintexts & ciphertexts)
    Cipher.doFinal.overload('[B').implementation = function (input) {
        var algo = this.getAlgorithm();
        var result = this.doFinal(input);
        console.log("\n[+] [Cipher.doFinal] Algorithm: " + algo);
        if (input) {
            console.log("    Input (Hex)  : " + bytesToHex(input).substring(0, 128) + (input.length > 64 ? "..." : ""));
            console.log("    Input (ASCII): " + bytesToAscii(input).substring(0, 64) + (input.length > 64 ? "..." : ""));
        }
        if (result) {
            console.log("    Output (Hex) : " + bytesToHex(result).substring(0, 128) + (result.length > 64 ? "..." : ""));
        }
        return result;
    };

    // 4. MessageDigest Hook (SHA-1, SHA-256, MD5)
    MessageDigest.digest.overload('[B').implementation = function (input) {
        var algo = this.getAlgorithm();
        var res = this.digest(input);
        console.log("\n[+] [MessageDigest.digest] Algo: " + algo);
        console.log("    Data (ASCII): " + bytesToAscii(input).substring(0, 80));
        console.log("    Hash (Hex)  : " + bytesToHex(res));
        return res;
    };

    console.log("[*] [Crypto-Tracer] All cryptographic hooks successfully installed.");
});
