#!/usr/bin/env python3
"""
Comprehensive Android App Security Analyzer (apk-lab)
Performs deep static vulnerability analysis, component attack surface evaluation,
cryptographic audit, network security assessment, and OWASP Mobile Top 10 mapping.
"""

import sys
import os
import re
import json
import zipfile
from datetime import datetime

# OWASP Mobile Top 10 (2024) Categories
OWASP_MAPPING = {
    "M1": "M1: Improper Credential Usage",
    "M2": "M2: Inadequate Supply Chain Security",
    "M3": "M3: Insecure Authentication/Authorization",
    "M4": "M4: Insufficient Input/Output Validation",
    "M5": "M5: Insecure Communication",
    "M6": "M6: Inadequate Privacy Controls",
    "M7": "M7: Insufficient Binary Protections",
    "M8": "M8: Security Misconfiguration",
    "M9": "M9: Insecure Data Storage",
    "M10": "M10: Insufficient Cryptography",
}

# Code Vulnerability Pattern Signatures
CODE_AUDIT_RULES = [
    {
        "id": "CRYPTO-ECB",
        "title": "Insecure Cipher Mode (AES/ECB)",
        "severity": "HIGH",
        "owasp": "M10",
        "pattern": re.compile(r'AES/ECB/(?:PKCS5Padding|NoPadding)', re.IGNORECASE),
        "desc": "Electronic Codebook (ECB) mode produces identical ciphertext for identical plaintext blocks, leaking pattern information.",
        "remediation": "Use AES-GCM (Authenticated Encryption) or AES-CBC with a cryptographically secure random IV."
    },
    {
        "id": "CRYPTO-WEAK-HASH",
        "title": "Broken Hash Algorithm (MD5 / SHA-1)",
        "severity": "MEDIUM",
        "owasp": "M10",
        "pattern": re.compile(r'MessageDigest\.getInstance\(["\'](MD5|SHA-1|SHA1)["\']\)', re.IGNORECASE),
        "desc": "MD5 and SHA-1 suffer from known collision vulnerabilities and should not be used for security purposes.",
        "remediation": "Upgrade hashing algorithms to SHA-256, SHA-512, or PBKDF2/Argon2 for passwords."
    },
    {
        "id": "CRYPTO-STATIC-IV",
        "title": "Hardcoded Initialization Vector (IV)",
        "severity": "HIGH",
        "owasp": "M10",
        "pattern": re.compile(r'new\s+IvParameterSpec\(\s*(?:new\s+byte\[\]\s*\{[^}]+\}|["\'][^"\']+["\']\.getBytes\(\))\)', re.IGNORECASE),
        "desc": "Static/constant IVs compromise ciphertext confidentiality and replay protection.",
        "remediation": "Generate fresh, cryptographically random IVs using SecureRandom for every encryption."
    },
    {
        "id": "TLS-TRUST-ALL",
        "title": "Disabled Certificate Validation (TrustAllCertificates)",
        "severity": "CRITICAL",
        "owasp": "M5",
        "pattern": re.compile(r'checkServerTrusted\s*\([^)]*\)\s*\{\s*\}|TrustAllCerts|ALLOW_ALL_HOSTNAME_VERIFIER', re.IGNORECASE),
        "desc": "Empty checkServerTrusted or AllowAllHostnameVerifier disables TLS authentication, enabling MitM attacks.",
        "remediation": "Do not override X509TrustManager. Rely on default system CA trust or configure network_security_config.xml."
    },
    {
        "id": "WEBVIEW-JS-ENABLED",
        "title": "WebView JavaScript Execution Enabled",
        "severity": "MEDIUM",
        "owasp": "M4",
        "pattern": re.compile(r'\.setJavaScriptEnabled\(\s*true\s*\)', re.IGNORECASE),
        "desc": "Enabling JavaScript in WebViews increases exposure to Cross-Site Scripting (XSS) and bridge exploitation.",
        "remediation": "Enable JavaScript only if strictly necessary and ensure strict domain origin filtering."
    },
    {
        "id": "WEBVIEW-FILE-ACCESS",
        "title": "WebView Local File Access Permitted",
        "severity": "HIGH",
        "owasp": "M9",
        "pattern": re.compile(r'\.setAllowFileAccess\(\s*true\s*\)|\.setAllowUniversalAccessFromFileURLs\(\s*true\s*\)', re.IGNORECASE),
        "desc": "Allowing file:// scheme access in WebViews may allow remote web pages or malicious intents to read internal app files.",
        "remediation": "Disable file access via setAllowFileAccess(false) and setAllowUniversalAccessFromFileURLs(false)."
    },
    {
        "id": "WEBVIEW-JS-BRIDGE",
        "title": "Potentially Unsafe JavaScript Bridge (addJavascriptInterface)",
        "severity": "HIGH",
        "owasp": "M4",
        "pattern": re.compile(r'\.addJavascriptInterface\s*\(', re.IGNORECASE),
        "desc": "Exposing Java objects to JavaScript context can lead to unauthorized method invocation or code execution on older Android APIs.",
        "remediation": "Ensure targetSdkVersion >= 17, annotate all exposed bridge methods with @JavascriptInterface, and validate origin."
    },
    {
        "id": "STORAGE-WORLD-READABLE",
        "title": "Insecure File Storage (MODE_WORLD_READABLE)",
        "severity": "CRITICAL",
        "owasp": "M9",
        "pattern": re.compile(r'MODE_WORLD_READABLE|Context\.MODE_WORLD_READABLE', re.IGNORECASE),
        "desc": "Files created with MODE_WORLD_READABLE can be inspected and extracted by any other application on the device.",
        "remediation": "Use Context.MODE_PRIVATE or EncryptedFile from AndroidX Security library."
    },
    {
        "id": "STORAGE-EXTERNAL",
        "title": "Sensitive Storage on External / Shared Directory",
        "severity": "MEDIUM",
        "owasp": "M9",
        "pattern": re.compile(r'Environment\.getExternalStorageDirectory\(|getExternalFilesDir\(', re.IGNORECASE),
        "desc": "External storage is globally accessible to all apps holding storage permissions and does not guarantee sandbox privacy.",
        "remediation": "Store confidential data and tokens exclusively in internal app private directory (getFilesDir())."
    },
    {
        "id": "LOG-DEBUG-PRINT",
        "title": "Potential Sensitive Information Leak in Logs",
        "severity": "LOW",
        "owasp": "M6",
        "pattern": re.compile(r'Log\.[dvei]\s*\(\s*["\'][^"\']*token|password|auth|secret|key', re.IGNORECASE),
        "desc": "Logging sensitive credentials or tokens can leak data via system logcat or crash analytics.",
        "remediation": "Strip all verbose/debug logs in production release builds using ProGuard/R8 rules."
    }
]


def extract_strings_from_bytes(data: bytes) -> list[str]:
    strings = []
    pattern = re.compile(rb'[\x20-\x7e]{3,}')
    for match in pattern.finditer(data):
        try:
            s = match.group().decode('ascii', errors='ignore')
            if s and len(s) > 2:
                strings.append(s)
        except Exception:
            pass
    return strings


def parse_manifest_details(manifest_bytes: bytes) -> dict:
    details = {
        "package_name": "unknown",
        "version_name": "unknown",
        "version_code": "unknown",
        "min_sdk": "unknown",
        "target_sdk": "unknown",
        "flags": {
            "debuggable": False,
            "allowBackup": True,
            "usesCleartextTraffic": False,
            "testOnly": False,
        },
        "permissions": [],
        "activities": [],
        "services": [],
        "receivers": [],
        "providers": [],
        "exported_components": [],
        "deep_links": [],
    }

    parsed_xml = False
    try:
        import xml.etree.ElementTree as ET
        xml_text = manifest_bytes.decode('utf-8', errors='ignore')
        if "<manifest" in xml_text:
            root = ET.fromstring(xml_text)
            parsed_xml = True
            details["package_name"] = root.attrib.get("package", details["package_name"])
            ns = "{http://schemas.android.com/apk/res/android}"
            details["version_name"] = root.attrib.get(f"{ns}versionName", "unknown")
            details["version_code"] = root.attrib.get(f"{ns}versionCode", "unknown")

            app_elem = root.find("application")
            if app_elem is not None:
                if f"{ns}debuggable" in app_elem.attrib:
                    details["flags"]["debuggable"] = app_elem.attrib[f"{ns}debuggable"].lower() == "true"
                if f"{ns}allowBackup" in app_elem.attrib:
                    details["flags"]["allowBackup"] = app_elem.attrib[f"{ns}allowBackup"].lower() == "true"
                if f"{ns}usesCleartextTraffic" in app_elem.attrib:
                    details["flags"]["usesCleartextTraffic"] = app_elem.attrib[f"{ns}usesCleartextTraffic"].lower() == "true"

                for child in app_elem:
                    tag = child.tag
                    name = child.attrib.get(f"{ns}name", "")
                    exported_attr = child.attrib.get(f"{ns}exported")
                    perm = child.attrib.get(f"{ns}permission", None)
                    intent_filters = child.findall("intent-filter")

                    is_exported = False
                    if exported_attr is not None:
                        is_exported = exported_attr.lower() == "true"
                    elif len(intent_filters) > 0:
                        is_exported = True

                    if tag == "activity":
                        details["activities"].append(name)
                    elif tag == "service":
                        details["services"].append(name)
                    elif tag == "receiver":
                        details["receivers"].append(name)
                    elif tag == "provider":
                        details["providers"].append(name)

                    if is_exported and name:
                        details["exported_components"].append({
                            "type": tag,
                            "name": name,
                            "permission": perm
                        })

                    for inf in intent_filters:
                        auto_verify = inf.attrib.get(f"{ns}autoVerify", "false").lower() == "true"
                        for data in inf.findall("data"):
                            scheme = data.attrib.get(f"{ns}scheme")
                            host = data.attrib.get(f"{ns}host", "")
                            path = data.attrib.get(f"{ns}path") or data.attrib.get(f"{ns}pathPrefix") or ""
                            if scheme:
                                details["deep_links"].append({
                                    "component": name,
                                    "scheme": scheme,
                                    "host": host,
                                    "path": path,
                                    "autoVerify": auto_verify
                                })

            for perm in root.findall("uses-permission"):
                pname = perm.attrib.get(f"{ns}name")
                if pname:
                    details["permissions"].append(pname)
    except Exception:
        pass

    if not parsed_xml:
        raw_strings = extract_strings_from_bytes(manifest_bytes)
        raw_text = " ".join(raw_strings)

        # Detect package name
        m_pkg = re.search(r'package=["\']([a-zA-Z0-9_\.]+)["\']', raw_text)
        if m_pkg:
            details["package_name"] = m_pkg.group(1)
        else:
            candidates = [s for s in raw_strings if re.match(r'^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$', s) and not s.startswith("android.") and not s.startswith("androidx.")]
            if candidates:
                details["package_name"] = candidates[0]

        # Flags
        if "debuggable" in raw_text:
            details["flags"]["debuggable"] = True
        if "allowBackup" in raw_text:
            details["flags"]["allowBackup"] = True
        if "usesCleartextTraffic" in raw_text:
            details["flags"]["usesCleartextTraffic"] = True
        if "testOnly" in raw_text:
            details["flags"]["testOnly"] = True

        # Permissions
        perm_set = set()
        for s in raw_strings:
            if "android.permission." in s:
                m = re.search(r'(android\.permission\.[A-Za-z0-9_]+)', s)
                if m:
                    perm_set.add(m.group(1))
        details["permissions"] = sorted(list(perm_set))

        # Detect components
        for s in raw_strings:
            if s.endswith("Activity"):
                details["activities"].append(s)
            elif s.endswith("Service"):
                details["services"].append(s)
            elif s.endswith("Receiver"):
                details["receivers"].append(s)
            elif s.endswith("Provider"):
                details["providers"].append(s)

    details["activities"] = sorted(list(set(details["activities"])))
    details["services"] = sorted(list(set(details["services"])))
    details["receivers"] = sorted(list(set(details["receivers"])))
    details["providers"] = sorted(list(set(details["providers"])))

    return details


def analyze_app(apk_path: str, out_dir: str = None) -> dict:
    if not os.path.isfile(apk_path):
        raise FileNotFoundError(f"APK not found: {apk_path}")

    start_time = datetime.now()
    file_size = os.path.getsize(apk_path)
    file_name = os.path.basename(apk_path)

    results = {
        "target_file": file_name,
        "target_path": os.path.abspath(apk_path),
        "file_size_bytes": file_size,
        "file_size_mb": round(file_size / (1024 * 1024), 2),
        "analysis_timestamp": start_time.isoformat(),
        "package_info": {},
        "vulnerabilities": [],
        "secrets": [],
        "owasp_summary": {k: 0 for k in OWASP_MAPPING.keys()},
        "metrics": {
            "critical_count": 0,
            "high_count": 0,
            "medium_count": 0,
            "low_count": 0,
            "info_count": 0,
            "total_vulnerabilities": 0,
            "security_score": 100,
            "grade": "A",
        },
        "attack_surface": {
            "total_permissions": 0,
            "dangerous_permissions": 0,
            "total_activities": 0,
            "total_services": 0,
            "total_receivers": 0,
            "total_providers": 0,
            "dex_files_count": 0,
            "native_libraries_count": 0,
            "network_security_config": False,
        }
    }

    dex_data_list = []
    with zipfile.ZipFile(apk_path, 'r') as z:
        file_list = z.namelist()

        # 1. Manifest Analysis
        if "AndroidManifest.xml" in file_list:
            manifest_bytes = z.read("AndroidManifest.xml")
            pkg_info = parse_manifest_details(manifest_bytes)
            results["package_info"] = pkg_info
            results["attack_surface"]["total_permissions"] = len(pkg_info["permissions"])
            results["attack_surface"]["total_activities"] = len(pkg_info["activities"])
            results["attack_surface"]["total_services"] = len(pkg_info["services"])
            results["attack_surface"]["total_receivers"] = len(pkg_info["receivers"])
            results["attack_surface"]["total_providers"] = len(pkg_info["providers"])

            # Manifest security checks
            if pkg_info["flags"]["debuggable"]:
                results["vulnerabilities"].append({
                    "id": "MAN-DEBUGGABLE",
                    "title": "Application Is Debuggable in Production",
                    "severity": "HIGH",
                    "owasp": "M8",
                    "desc": "The android:debuggable attribute is enabled. Attackers can attach JDWP debuggers to inspect memory, execute arbitrary code, and bypass protections.",
                    "remediation": "Set android:debuggable=\"false\" in AndroidManifest.xml for release builds."
                })

            if pkg_info["flags"]["usesCleartextTraffic"]:
                results["vulnerabilities"].append({
                    "id": "MAN-CLEARTEXT",
                    "title": "Cleartext HTTP Traffic Explicitly Permitted",
                    "severity": "HIGH",
                    "owasp": "M5",
                    "desc": "The android:usesCleartextTraffic attribute is true. App allows unencrypted HTTP connections susceptible to MitM interception.",
                    "remediation": "Set android:usesCleartextTraffic=\"false\" and enforce HTTPS across all endpoints."
                })

            if pkg_info["flags"]["allowBackup"]:
                results["vulnerabilities"].append({
                    "id": "MAN-BACKUP",
                    "title": "Application Data Backup Allowed (allowBackup)",
                    "severity": "LOW",
                    "owasp": "M9",
                    "desc": "The android:allowBackup attribute is enabled. App sandbox data can be backed up and extracted via adb backup.",
                    "remediation": "Set android:allowBackup=\"false\" unless cloud backup is required, in which case restrict fullBackupContent."
                })

            # Exported components without permissions check
            if pkg_info.get("exported_components"):
                unprotected = [c for c in pkg_info["exported_components"] if not c.get("permission")]
                if unprotected:
                    comp_names = [c["name"] for c in unprotected[:3]]
                    results["vulnerabilities"].append({
                        "id": "INTENT-UNPROTECTED-EXPORT",
                        "title": f"Unprotected Exported Components ({len(unprotected)})",
                        "severity": "HIGH",
                        "owasp": "M4",
                        "desc": f"Exported components ({', '.join(comp_names)}) do not require permissions. Malicious apps on the device can send implicit or explicit intents to invoke them without authorization.",
                        "remediation": "Set android:exported=\"false\" for internal components or enforce custom android:permission."
                    })

            # Deep links & custom URL schemes
            if pkg_info.get("deep_links"):
                results["attack_surface"]["deep_links_count"] = len(pkg_info["deep_links"])
                custom_schemes = [dl for dl in pkg_info["deep_links"] if dl["scheme"].lower() not in ("http", "https")]
                if custom_schemes:
                    schemes_list = list(set(f"{dl['scheme']}://{dl['host']}" for dl in custom_schemes))
                    results["vulnerabilities"].append({
                        "id": "DEEPLINK-CUSTOM-SCHEME",
                        "title": f"Custom URL Scheme Deep Links ({', '.join(schemes_list[:2])})",
                        "severity": "MEDIUM",
                        "owasp": "M4",
                        "desc": "Custom URL schemes can be registered by any other application on the device without verification, risking URL hijacking and parameter injection.",
                        "remediation": "Upgrade custom schemes to verified Android App Links with android:autoVerify=\"true\" and Digital Asset Links."
                    })

        # 2. Network Security Config presence
        nsc_files = [f for f in file_list if "network_security_config" in f.lower() or "network_security" in f.lower()]
        if nsc_files:
            results["attack_surface"]["network_security_config"] = True

        # 3. Native Libraries & DEX counts
        so_files = [f for f in file_list if f.endswith(".so")]
        dex_files = [f for f in file_list if f.endswith(".dex")]
        results["attack_surface"]["native_libraries_count"] = len(so_files)
        results["attack_surface"]["dex_files_count"] = len(dex_files)

        # 4. Code & Resource Signatures Scanning (DEX & XML)
        for fname in file_list:
            if fname.endswith(".dex") or fname.endswith(".xml") or fname.endswith(".json") or fname.endswith(".properties"):
                try:
                    data = z.read(fname)
                    text = data.decode("utf-8", errors="ignore")
                    for rule in CODE_AUDIT_RULES:
                        if rule["pattern"].search(text):
                            # Avoid duplicates of same rule ID
                            if not any(v["id"] == rule["id"] for v in results["vulnerabilities"]):
                                results["vulnerabilities"].append({
                                    "id": rule["id"],
                                    "title": rule["title"],
                                    "severity": rule["severity"],
                                    "owasp": rule["owasp"],
                                    "desc": rule["desc"],
                                    "remediation": rule["remediation"],
                                    "detected_in": fname
                                })
                except Exception:
                    pass

    # 5. Integrate Secret Scanner
    try:
        from secret_scanner import scan_target
        secrets_res = scan_target(apk_path)
        results["secrets"] = secrets_res.get("findings", [])
        if secrets_res.get("critical_count", 0) > 0:
            results["vulnerabilities"].append({
                "id": "SEC-CRIT-KEYS",
                "title": f"Hardcoded Critical Secrets Detected ({secrets_res['critical_count']})",
                "severity": "CRITICAL",
                "owasp": "M1",
                "desc": "High-risk credentials (e.g. AWS Keys, Private Keys, GitHub PATs) were found hardcoded inside the APK archive.",
                "remediation": "Revoke exposed keys immediately. Store API keys securely in backend proxies or Android Keystore."
            })
    except Exception as e:
        pass

    # 6. Calculate Metrics & Security Posture Score
    score = 100
    for v in results["vulnerabilities"]:
        sev = v["severity"]
        ow = v.get("owasp", "M8")
        if ow in results["owasp_summary"]:
            results["owasp_summary"][ow] += 1

        if sev == "CRITICAL":
            results["metrics"]["critical_count"] += 1
            score -= 25
        elif sev == "HIGH":
            results["metrics"]["high_count"] += 1
            score -= 15
        elif sev == "MEDIUM":
            results["metrics"]["medium_count"] += 1
            score -= 8
        elif sev == "LOW":
            results["metrics"]["low_count"] += 1
            score -= 3
        else:
            results["metrics"]["info_count"] += 1

    score = max(0, min(100, score))
    results["metrics"]["security_score"] = score
    results["metrics"]["total_vulnerabilities"] = len(results["vulnerabilities"])

    if score >= 90:
        results["metrics"]["grade"] = "A"
    elif score >= 80:
        results["metrics"]["grade"] = "B"
    elif score >= 70:
        results["metrics"]["grade"] = "C"
    elif score >= 50:
        results["metrics"]["grade"] = "D"
    else:
        results["metrics"]["grade"] = "F"

    # Save outputs if directory requested
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)
        json_path = os.path.join(out_dir, "app-analysis.json")
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2)

    return results


def main():
    if len(sys.argv) < 2:
        print("Usage: app_analyzer.py <path/to/app.apk> [output_directory]")
        sys.exit(1)

    apk_file = sys.argv[1]
    out_dir = sys.argv[2] if len(sys.argv) > 2 else os.path.join("artifacts", "app-analysis")

    print(f"=== 📱 Comprehensive Android App Analyzer ===")
    print(f"Target: {apk_file}")
    res = analyze_app(apk_file, out_dir)

    m = res["metrics"]
    print(f"\nAnalysis Complete:")
    print(f"  Security Score: {m['security_score']}/100 (Grade: {m['grade']})")
    print(f"  Vulnerabilities: {m['total_vulnerabilities']} total")
    print(f"    - Critical : {m['critical_count']}")
    print(f"    - High     : {m['high_count']}")
    print(f"    - Medium   : {m['medium_count']}")
    print(f"    - Low      : {m['low_count']}")
    print(f"  Hardcoded Secrets: {len(res['secrets'])}")
    print(f"\nData saved to: {os.path.join(out_dir, 'app-analysis.json')}")


if __name__ == "__main__":
    main()
