import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const androidDir = path.join(root, 'android');
const appGradlePath = path.join(androidDir, 'app', 'build.gradle');
const manifestPath = path.join(androidDir, 'app', 'src', 'main', 'AndroidManifest.xml');
const variablesPath = path.join(androidDir, 'variables.gradle');
const keystorePropertiesPath = path.join(androidDir, 'keystore.properties');

const requireFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required file not found: ${path.relative(root, filePath)}`);
  }
  return fs.readFileSync(filePath, 'utf8');
};

const writeIfChanged = (filePath, next) => {
  const prev = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  if (prev !== next) fs.writeFileSync(filePath, next);
};

const insertAfterManifestOpen = (xml, snippet) => {
  if (xml.includes('android.permission.POST_NOTIFICATIONS')) return xml;
  return xml.replace(/(<manifest\b[^>]*>)/, `$1\n${snippet}`);
};

const permissions = `
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.CALL_PHONE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-feature android:name="android.hardware.location" android:required="false" />
    <uses-feature android:name="android.hardware.location.gps" android:required="false" />

    <queries>
        <intent>
            <action android:name="android.intent.action.DIAL" />
            <data android:scheme="tel" />
        </intent>
        <intent>
            <action android:name="android.intent.action.SENDTO" />
            <data android:scheme="mailto" />
        </intent>
        <intent>
            <action android:name="android.intent.action.VIEW" />
            <data android:scheme="https" />
        </intent>
    </queries>`;

let manifest = requireFile(manifestPath);
manifest = insertAfterManifestOpen(manifest, permissions);
manifest = manifest.replace(/android:label="[^"]*"/, 'android:label="집다 (Zibda)"');
if (!manifest.includes('android:usesCleartextTraffic=')) {
  manifest = manifest.replace(/(<application\b[^>]*)(>)/, '$1\n        android:usesCleartextTraffic="false"$2');
}
writeIfChanged(manifestPath, manifest);

let variables = requireFile(variablesPath);
variables = variables
  .replace(/compileSdkVersion\s*=\s*\d+/, 'compileSdkVersion = 36')
  .replace(/targetSdkVersion\s*=\s*\d+/, 'targetSdkVersion = 36')
  .replace(/minSdkVersion\s*=\s*\d+/, 'minSdkVersion = 24');
writeIfChanged(variablesPath, variables);

const keystore = {
  storeFile: process.env.ANDROID_KEYSTORE_PATH || '../zibda-release.keystore',
  storePassword: process.env.ANDROID_KEYSTORE_PASSWORD,
  keyAlias: process.env.ANDROID_KEY_ALIAS || 'zibda',
  keyPassword: process.env.ANDROID_KEY_PASSWORD,
};

for (const [key, value] of Object.entries(keystore)) {
  if (!value) throw new Error(`Missing signing value: ${key}`);
}

writeIfChanged(
  keystorePropertiesPath,
  `storeFile=${keystore.storeFile}\nstorePassword=${keystore.storePassword}\nkeyAlias=${keystore.keyAlias}\nkeyPassword=${keystore.keyPassword}\n`,
);

let gradle = requireFile(appGradlePath);
if (!gradle.includes('def keystorePropertiesFile')) {
  gradle = `def keystoreProperties = new Properties()\ndef keystorePropertiesFile = rootProject.file("keystore.properties")\nif (keystorePropertiesFile.exists()) {\n    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))\n}\n\n${gradle}`;
}

gradle = gradle.replace(/namespace\s*=\s*"[^"]+"|namespace\s+"[^"]+"/, 'namespace = "com.zibda.app"');
gradle = gradle.replace(/applicationId\s*=\s*"[^"]+"|applicationId\s+"[^"]+"/, 'applicationId "com.zibda.app"');
gradle = gradle.replace(/versionCode\s*=\s*\d+|versionCode\s+\d+/, `versionCode ${process.env.ANDROID_VERSION_CODE || '1'}`);
gradle = gradle.replace(/versionName\s*=\s*"[^"]+"|versionName\s+"[^"]+"/, `versionName "${process.env.ANDROID_VERSION_NAME || '1.0.0'}"`);

if (!gradle.includes('signingConfigs {')) {
  gradle = gradle.replace(
    /(\n\s*buildTypes\s*\{)/,
    `\n    signingConfigs {\n        release {\n            storeFile file(keystoreProperties['storeFile'])\n            storePassword keystoreProperties['storePassword']\n            keyAlias keystoreProperties['keyAlias']\n            keyPassword keystoreProperties['keyPassword']\n        }\n    }\n$1`,
  );
}

gradle = gradle.replace(/(signingConfigs\s*\{[\s\S]*?release\s*\{)([\s\S]*?)(\n\s*\})/, (match, releaseOpen, body, releaseClose) => {
  return `${releaseOpen}${body.replace(/\n\s*signingConfig\s+signingConfigs\.release/g, '')}${releaseClose}`;
});

gradle = gradle.replace(/(buildTypes\s*\{[\s\S]*?release\s*\{)([\s\S]*?)(\n\s*\})/, (match, releaseOpen, body, releaseClose) => {
  if (body.includes('signingConfig signingConfigs.release')) return match;
  return `${releaseOpen}\n            signingConfig signingConfigs.release${body}${releaseClose}`;
});

writeIfChanged(appGradlePath, gradle);
console.log('Prepared Capacitor Android project for signed Zibda release AAB.');