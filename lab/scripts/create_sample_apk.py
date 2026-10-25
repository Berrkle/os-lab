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

with zipfile.ZipFile(apk_path, "w") as z:
    z.writestr("AndroidManifest.xml", manifest_xml.encode("utf-8"))
    z.writestr("classes.dex", b"dex\n035\x00")

print(f"Sample APK generated: {apk_path} ({os.path.getsize(apk_path)} bytes)")
