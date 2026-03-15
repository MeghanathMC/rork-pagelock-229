# Full Setup Guide – From Rork to Running on Device

A complete, beginner-friendly guide to building a React Native app with Rork and running it on a real Android device with native Google Sign-In and Supabase auth.

**App built:** PageLock (reading habit app with social media blocking)  
**Stack:** Expo + React Native + Supabase + RevenueCat + @react-native-google-signin  
**Target platform:** Android (and iOS)

---

## Overview

Building a full-fledged app involves two phases:

1. **Rork phase** – Build the app visually with AI (screens, logic, Supabase client, auth screens, etc.)
2. **Local phase** – Clone to Cursor, set up Android Studio, configure Google Cloud + Supabase, then run on device

You cannot complete phase 2 inside Rork. Rork handles the code; you handle the environment and credentials.

---

## Phase 1: Build in Rork

1. Go to [rork.com](https://rork.com) and start a new project.
2. Describe your app and let Rork scaffold the structure: screens, navigation, components, hooks, services.
3. Connect your Supabase project (URL + anon key) in Rork's environment settings if supported, or note them for later.
4. Build all screens: onboarding, auth, home, verification, streaks, settings, paywall.
5. Sync the project to GitHub from Rork's dashboard.

---

## Phase 2: Clone the repo and run locally

### Requirements

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Bun](https://bun.sh) (faster package manager used by Rork projects)
- [Git](https://git-scm.com/)
- [Cursor](https://cursor.sh/) or any code editor

### Steps

**1. Clone the repository**

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

**2. Go into the Expo folder**

Rork projects have an `expo` subfolder with the app code:

```bash
cd expo
```

**3. Install dependencies**

```bash
bun install
```

Or with npm:

```bash
npm install
```

**4. Copy the env file**

```bash
cp .env.example .env
```

Open `.env` and fill in the credentials (Supabase URL, anon key, Google Web Client ID) as you get them in the next phases.

---

## Phase 3: Install Android Studio

Android Studio includes the Android SDK, emulator, and a Java JDK. All three are required.

1. Download: [developer.android.com/studio](https://developer.android.com/studio)
2. Run the installer. Accept defaults.
3. On first launch, the setup wizard will ask to install the **Android SDK**. Accept. The default path is:
   `C:\Users\YOUR_USERNAME\AppData\Local\Android\Sdk`
4. Note that path; you need it for `ANDROID_HOME`.

---

## Phase 4: Set ANDROID_HOME and JAVA_HOME

The build tools (`expo run:android`, Gradle) need these variables to find the SDK and Java.

**Open PowerShell and run both commands:**

```powershell
[System.Environment]::SetEnvironmentVariable("ANDROID_HOME", "C:\Users\megha\AppData\Local\Android\Sdk", "User")
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Android\Android Studio\jbr", "User")
```

> If `jbr` doesn't exist inside Android Studio's folder, use `jre` instead.

**Close and reopen your terminal after setting these.** The values are not picked up in the same session.

**Verify:**

```powershell
echo $env:ANDROID_HOME
echo $env:JAVA_HOME
```

---

## Phase 5: Google Cloud Console – OAuth setup

This is needed for native Google Sign-In (account picker dialog).

### 5.1 Create a Google Cloud project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Top dropdown → New Project → Name it (e.g. "PageLock") → Create.

### 5.2 OAuth consent screen

1. Left menu → **APIs & Services** → **OAuth consent screen**
2. Choose **External** → Create
3. Fill in: App name, support email, developer contact email
4. Add scopes: `userinfo.email`, `userinfo.profile`, `openid`
5. Add yourself as a **test user** (required while app is in Testing mode)
6. Save and continue

### 5.3 Create three OAuth Client IDs

**APIs & Services** → **Credentials** → **+ Create Credentials** → **OAuth client ID**

#### Client 1: Web application

- Application type: **Web application**
- Name: e.g. "PageLock Web"
- Authorized redirect URIs: `https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback`  
  (replace `YOUR_SUPABASE_PROJECT_REF` with your Supabase project ref from the URL)
- Click Create
- Copy **Client ID** → goes to `.env` as `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- Copy **Client secret** → goes to Supabase Google provider

#### Client 2: Android

- Application type: **Android**
- Package name: use the value from `app.json` → `android.package` (e.g. `app.rork.exzbk8cvjwdfv4z82e83e`)
- SHA-1: see Phase 6 below (you need to build once first to generate the debug keystore)
- Click Create
- Copy **Client ID** → goes to Supabase Google provider (comma-separated with other IDs)

#### Client 3: iOS

- Application type: **iOS**
- Bundle ID: use the value from `app.json` → `ios.bundleIdentifier` (e.g. `app.rork.exzbk8cvjwdfv4z82e83e`)
- Click Create
- Copy **Client ID** → goes to Supabase Google provider
- Copy **iOS URL Scheme** (e.g. `com.googleusercontent.apps.123456789-xxxxx`) → goes to `app.json` `iosUrlScheme`

> **Why three clients?**
> The **Web** client ID is what your app code uses in `GoogleSignin.configure({ webClientId: '...' })` – required even on mobile.
> The **Android** client lets Google validate sign-in from your Android package.
> The **iOS** client lets Google validate sign-in from your iOS bundle ID.

---

## Phase 6: Get the Android SHA-1

The SHA-1 fingerprint proves to Google that requests come from your app. You need it for the Android OAuth client above.

**The debug keystore is created automatically on the first successful Android build.**

### Step 1: Run the first build

```bash
npx expo prebuild --clean
npx expo run:android
```

Wait for it to say **BUILD SUCCESSFUL** or for the app to open on device/emulator.

### Step 2: Get the SHA-1

```powershell
& "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -list -v -keystore "$env:USERPROFILE\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

Find the **SHA1:** line in the output, e.g.:
```
SHA1: AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD
```

Copy that value and add it to your **Android** OAuth client in Google Cloud Console.

> **For release builds:** Use the SHA-1 from your release keystore (or from Expo EAS credentials dashboard). The debug SHA-1 only works for development.

---

## Phase 7: Supabase configuration

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → your project
2. **Authentication** → **Providers** → **Google**
3. Enable Google
4. **Client ID (for OAuth):** paste the **Web** Client ID
5. **Client Secret:** paste the Web client secret
6. **Client IDs (for OAuth):** paste all three Client IDs separated by commas:
   ```
   web_id.apps.googleusercontent.com,android_id.apps.googleusercontent.com,ios_id.apps.googleusercontent.com
   ```
7. Enable **Skip nonce check** (recommended for React Native)
8. Save

---

## Phase 8: Update app.json and .env

### app.json

Replace the `iosUrlScheme` placeholder with the iOS URL scheme from your iOS OAuth client:

```json
{
  "expo": {
    "plugins": [
      [
        "@react-native-google-signin/google-signin",
        {
          "iosUrlScheme": "com.googleusercontent.apps.YOUR_IOS_CLIENT_ID_PREFIX"
        }
      ]
    ]
  }
}
```

### .env

Fill in all values:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
```

Get the Supabase URL and anon key from:  
Supabase Dashboard → **Project Settings** → **API** → **Project URL** and **anon public** key.

---

## Phase 9: Final build and run

```bash
npx expo prebuild --clean
npx expo run:android
```

The app should build and launch on your connected Android device (USB debugging enabled) or emulator.

---

## Errors we faced and fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `'keytool' is not recognized` | `keytool` not in PATH | Use full path: `& "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" ...` |
| `ANDROID_HOME not found` | Environment variable not set | Run `[System.Environment]::SetEnvironmentVariable("ANDROID_HOME", "C:\Users\YOU\AppData\Local\Android\Sdk", "User")` then reopen terminal |
| `JAVA_HOME is not set` | Java not in PATH | Run `[System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Android\Android Studio\jbr", "User")` then reopen terminal |
| `Keystore file does not exist` | Debug keystore not generated yet | Run `npx expo run:android` once to create it, then run keytool |
| `'adb' is not recognized` | Android SDK not installed or ANDROID_HOME not set | Install SDK via Android Studio, set ANDROID_HOME, reopen terminal |
| `Failed to resolve the Android SDK path` | ANDROID_HOME not set | Set ANDROID_HOME as above |
| `keytool.exe` path not found via `$env:ANDROID_HOME\jbr\...` | The SDK folder doesn't contain `jbr` | Use Android Studio's `jbr` folder directly: `C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe` |
| App builds but Google Sign-In fails | SHA-1 not added to Android OAuth client or wrong Client ID | Add debug SHA-1 to Android client in Google Cloud Console; ensure webClientId in app is the **Web** client ID not Android |
| `Filename longer than 260 characters` (ninja/CMake) | Project path is too long; Windows has a 260-character path limit | **Move the project to a shorter path**, e.g. `C:\dev\rork-pagelock` or `C:\projects\pagelock`. Avoid deep paths like `OneDrive\Documents\New project\...`. Then run `npx expo prebuild --clean` and `npx expo run:android` again. |
| D8 warnings: `Expected stack map table` (amazon-appstore-sdk) | Third-party JAR compatibility; harmless | Ignore. Build can still succeed. |
| CMake warnings: `Object file directory has 189 characters` | Path length warning; may lead to 260-char failure | Shorten project path (see above). |

---

## Windows: Keep the project path short

On Windows, the full path to your project must stay under **260 characters** or the Android native build (CMake/ninja) will fail with:

```
ninja: error: ... Filename longer than 260 characters
```

**Do this before building:**

- Clone or move the repo to a **short path**, e.g.:
  - `C:\dev\rork-pagelock`
  - `C:\projects\pagelock`
- Avoid paths like `C:\Users\...\OneDrive\Documents\New project\rork-pagelock-229\expo` (too long once `node_modules` and build outputs are included).

After moving, run from the new location:

```bash
cd C:\dev\rork-pagelock\expo
bun install
npx expo prebuild --clean
npx expo run:android
```

---

## Complete checklist

**Environment setup**
- [ ] Node.js installed (v18+)
- [ ] Bun installed
- [ ] Android Studio installed
- [ ] Android SDK installed (via Android Studio setup wizard)
- [ ] `ANDROID_HOME` set to SDK path
- [ ] `JAVA_HOME` set to Android Studio `jbr` folder
- [ ] Terminal reopened after setting env vars

**Supabase**
- [ ] Project created
- [ ] URL and anon key copied
- [ ] Google provider enabled
- [ ] Web Client ID + Secret added
- [ ] All three Client IDs added (comma-separated)
- [ ] Skip nonce check enabled

**Google Cloud Console**
- [ ] Project created
- [ ] OAuth consent screen configured (scopes + test users)
- [ ] Web application OAuth client created (redirect URI = Supabase callback URL)
- [ ] Android OAuth client created (with SHA-1)
- [ ] iOS OAuth client created
- [ ] Web Client ID → `.env` as `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- [ ] iOS URL scheme → `app.json` `iosUrlScheme`
- [ ] All three Client IDs → Supabase Google provider

**Local project**
- [ ] Repo cloned (or moved) to a **short path** on Windows (e.g. `C:\dev\projectname`) to avoid "Filename longer than 260 characters"
- [ ] `bun install` (or `npm install`) run in `expo` folder
- [ ] `.env` created from `.env.example` and filled in
- [ ] `app.json` `iosUrlScheme` updated
- [ ] `npx expo prebuild --clean` run
- [ ] `npx expo run:android` run successfully
- [ ] SHA-1 obtained via keytool and added to Android client in Google Cloud

---

## Key insight

> If you want a **basic app** (email/password sign-in only, no native SDKs), Rork + Supabase dashboard is mostly enough.  
> If you want a **full-fledged app** (native Google Sign-In dialog, Play Store ready), you must go through all the steps in this guide.  
> The code is built in Rork. The environment and credentials are set up locally in Cursor (or any editor).
