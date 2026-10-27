import zipfile
import os

apk_path = os.path.join(os.path.dirname(__file__), "vulnerable-test.apk")
manifest_xml = (
    '<?xml version="1.0" encoding="utf-8"?>\n'
    '<manifest xmlns:android="http://schemas.android.com/apk/res/android" '
    'package="com.testlab.vulnerable" android:versionCode="1" android:versionName="1.0">\n'
    '    <uses-permission android:name="android.permission.INTERNET"/>\n'
    '    <uses-permission android:name="android.permission.CAMERA"/>\n'
    '    <uses-permission android:name="android.permission.READ_SMS"/>\n'
    '    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>\n'
    '    <application android:debuggable="true" android:allowBackup="true" '
    'android:usesCleartextTraffic="true" android:label="VulnerableTest">\n'
    '        <activity android:name=".MainActivity" android:exported="true"/>\n'
    '    </application>\n'
    '</manifest>'
)

strings_xml = (
    '<?xml version="1.0" encoding="utf-8"?>\n'
    '<resources>\n'
    '    <string name="app_name">VulnerableTest</string>\n'
    '    <string name="google_api_key">AIzaSyB_MockGoogleApiKey1234567890ABCDE</string>\n'
    '    <string name="firebase_db">https://testapp-db.firebaseio.com</string>\n'
    '    <string name="aws_key">AKIAIOSFODNN7EXAMPLE</string>\n'
    '    <string name="backend_url">http://api.insecure-internal.corp:8080/v1/auth</string>\n'
    '</resources>'
)

from build_dex import build_minimal_dex

dex_bytes = build_minimal_dex()

with zipfile.ZipFile(apk_path, "w") as z:
    z.writestr("AndroidManifest.xml", manifest_xml.encode("utf-8"))
    z.writestr("res/values/strings.xml", strings_xml.encode("utf-8"))
    z.writestr("classes.dex", dex_bytes)

print(f"Sample APK generated: {apk_path} ({os.path.getsize(apk_path)} bytes)")

