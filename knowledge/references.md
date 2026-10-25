**References: Docker-Android for Penetration Testing & Reverse Engineering**

### 📚 Dynamic Analysis & Instrumentation

1.  **hackermater/mobile-pentesting-setup** – An all-in-one Ubuntu-based Docker environment for Android application security testing, pre-loaded with Frida, Objection, Apktool, Drozer, ADB, and JADX.
2.  **andrewmackrodt/objection** – Docker image for Objection, a runtime mobile exploration toolkit powered by Frida, designed to assess mobile app security without jailbreaking.
3.  **va1da5/docker-objection-for-android** – Docker image containing the Objection tool for Android application instrumentation.
4.  **Dynamic Analysis & Instrumentation for Android (Medium)** – Step-by-step guide covering MobSF, Frida, Objection, and reFlutter for runtime exploration and instrumentation.

### 🛡️ MobSF (Mobile Security Framework)

5.  **MobSF Official Docker Documentation** – Instructions for running MobSF via Docker for static and dynamic analysis. Dynamic analysis requires a separate Android emulator and the `MOBSF_ANALYZER_IDENTIFIER` environment variable to connect to ADB.
6.  **shahil-sk/AndroidVaptTools** – Notes on installing MobSF via Docker and configuring it to connect to an Android emulator for dynamic analysis.
7.  **HackerNoon – How to Run Android in Docker** – Discusses integration of Docker-Android with third-party security tools like MobSF for application security testing.

### 🌐 Network Traffic Analysis

8.  **Android Sniffing on Ubuntu with mitmproxy** – Guide for routing Android emulator traffic through mitmproxy (run in Docker) to intercept and inspect HTTP/HTTPS communications.
9.  **mitmproxy in Docker** – mitmproxy is available as a Docker image, making it easy to deploy as an intercepting proxy for traffic analysis.
10. **Burp Suite & mitmproxy for Android** – Reference for using Burp Suite and mitmproxy as intercepting proxies at the HTTP/HTTPS level for application-focused traffic analysis.

### 🤖 Appium & Automation

11. **budtmo/docker-android – Distributed Testing** – Docker-Android registers Appium instances with a Selenium Grid hub, enabling distributed test execution across containers.
12. **Run Appium Tests Using Docker Android** – Appium is a cross-platform framework for driving Android, iOS, and Windows apps via the WebDriver protocol, usable within Docker-Android.
13. **docker-android (git.speedcow.top)** – Notes that Docker-Android can run UI tests with Appium, Espresso, and Robotium for Android applications.

### 🔬 Reverse Engineering Toolkits

14. **cryptax/androidre (GitHub)** – A Docker image specifically for reverse engineering Android applications. It includes a comprehensive toolset: Android emulators (5.1, 6.0, 7.0), androguard, apkid, apktool, AXMLPrinter, baksmali/smali, classyshark, CFR, dex2jar, enjarify, Frida, JADX, java decompiler, krakatau, procyon, and radare2.
15. **cryptax/android-re (Docker Hub)** – The published Docker image for the androidre toolkit, available via `docker pull cryptax/android-re`.
16. **msonst/docker-android-reverse-engineering** – A Docker image for Android APK reverse engineering, including decompilation and deobfuscation tools.
17. **Docker Hub – Android APK Reverse Engineering Image** – A container image bundling JADX, Apktool, Ghidra, Frida, dex2jar, and smali for APK decompilation and native library analysis.
18. **REA (Reverse Engineer Anything) in Docker** – A Docker-based environment for Android APK decompilation with JADX, Apktool, and ADB built-in, plus Ghidra available on demand, exposed via an MCP endpoint.

### ⚔️ Attack Simulation

19. **conteluca/androidExploitwithMetasploit** – A Docker Compose project that simulates an attack scenario by creating a subnet containing an Android device (via budtmo/docker-android) and a Kali Linux machine. It includes a full Metasploit workflow for generating, delivering, and executing a malicious APK.
20. **Dockerized Android for Cyber Ranges (HackerNoon)** – Describes Dockerized Android as a platform for cyber-range designers to simulate mobile attack and defense scenarios, with modular features (Bluetooth, GPS) toggled via Docker Compose.