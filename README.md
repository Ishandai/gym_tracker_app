# Gym Tracker (an app to see you progress)

A React + Capacitor app that logs gym workouts day-by-day (Sun–Sat), with
dynamic user-defined exercises and automatic progressive-overload suggestions.
Everything runs and stores data **entirely on your phone** via a real
on-device SQLite database (`@capacitor-community/sqlite`) — no backend
server, no network connection required. Works anywhere, gym included, even
with zero signal.

---

## Project structure

```
gym-tracker/
└── frontend/
    ├── src/
    │   ├── assets/gym-logo.svg       Custom flexing-figure logo (loading screen)
    │   ├── components/               DayTabs, WorkoutForm, WorkoutList,
    │   │                             OverloadSuggestion, LoadingScreen
    │   ├── pages/                    Dashboard, History, Backup
    │   ├── db/database.js            All on-device SQLite reads/writes
    │   ├── services/progressiveOverload.js   Weight/rep/deload suggestion math
    │   ├── App.jsx / main.jsx        Routing + startup (loading screen, DB init)
    │   └── styles.css
    ├── capacitor.config.json         appId: com.gymtracker.app, webDir: dist
    ├── package.json
    └── android/                      Generated — native Android project (not in git)
```

There is no backend folder. `src/db/database.js` talks directly to a SQLite
file stored in the app's private on-device storage.

---

## Prerequisites (install once)

- **Node.js** ≥ 18.x and npm — https://nodejs.org
- **Android Studio** — https://developer.android.com/studio
  During its first launch, let its setup wizard finish completely — it
  downloads the Android SDK, platform tools, and a bundled JDK automatically.
  You don't need to set `ANDROID_HOME`/`JAVA_HOME` manually if you always open
  the project through Android Studio (see Step 5 below) — it writes
  `android/local.properties` with the correct SDK path itself.

---

## First-time setup

```bash
cd frontend
npm install
```

## Making a code change and rebuilding

Every time you edit anything in `src/`, repeat these three steps in order:

### Step 1 — Build the production frontend
```bash
npm run build
```
Compiles React into `frontend/dist/` — the static bundle that gets packaged
into the app.

### Step 2 — Sync into the native Android project
```bash
npx cap add android      # first time only — generates android/
npx cap sync
```
`npx cap sync` copies the new `dist/` output and any native plugins into
`android/`. Run this every single time after `npm run build`, even for small
changes — skipping it means Android Studio builds the *old* code.

### Step 3 — Open in Android Studio
```bash
npx cap open android
```
Launches Android Studio with the project loaded. Wait for Gradle sync to
**fully finish** (watch the elephant icon / progress bar at the bottom) before
doing anything else — building while sync is still running can silently fail.

---

## Building the installable APK

1. In Android Studio's top menu: **Build → Build Bundle(s) / APK(s) → Build
   APK(s)**. This works with **no phone or emulator connected** — it just
   compiles a file, it doesn't install anything.
2. Wait for it to finish (30 sec – few minutes). Watch the **bottom-right
   corner** for a notification: *"APK(s) generated successfully"* → click
   **locate** to jump straight to the file.
3. If you miss the popup, find it manually at:
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

### Installing straight onto your own phone (alternative to the above)

If your phone is connected via USB with **USB debugging** enabled (Settings →
About phone → tap "Build number" 7 times to unlock Developer Options →
enable USB debugging), you can skip the manual APK step:
- Select your phone in Android Studio's device dropdown (top toolbar)
- Click the green **Run ▶** button
- It builds, installs, and launches on your phone automatically

This only works with a device/emulator connected — for sharing with someone
else, you still need the standalone `.apk` file from the steps above.

---

## Getting the APK onto a phone (yours or a friend's)

**Already installed via Run ▶ and want the standalone file too?**
Use a free app like **"APK Extractor"** from the Play Store — open it, find
Gym Tracker in your installed apps, tap Extract/Export, and it saves the
`.apk` to your phone's storage. From there, share it however you like.

**Via USB + adb:**
```bash
adb install app-debug.apk
```
Run from inside the folder containing the APK. `adb` ships with Android
Studio (usually under the SDK's `platform-tools/` folder).

**Via local Wi-Fi (no cable):**
```bash
cd android/app/build/outputs/apk/debug
python -m http.server 8080
```
Then on the phone's browser (same Wi-Fi): `http://<your-PC-LAN-IP>:8080/app-debug.apk`

**Via Nearby Share (phone-to-phone, no PC needed):**
Files app → tap the APK → Share → **Nearby Share** → pick the other phone
(Bluetooth/Wi-Fi on, both nearby).

**Simplest of all:** email it to yourself, or drop it in Google Drive and
download on the target phone.

### Installing it
Tap the downloaded `.apk` file → Android prompts to allow installing from
that source (Files/Chrome/WhatsApp, whichever app opened it) → **Allow** →
**Install**.

Since `appId` (`com.gymtracker.app`) stays the same across rebuilds,
reinstalling a newer APK **updates the app in place** — existing data is
preserved, not wiped.

---

## Sharing with a friend

Since there's no backend or accounts, sharing is just sharing the file:
- Send the `.apk` via any method above.
- They install it the same way.
- They get their **own independent copy** — own local SQLite database,
  completely separate from yours. No shared data, no sync, no login. Each
  install is its own island.

---

## Data & backup

All data lives in a single SQLite file inside the app's private on-device
storage. This means:
- **No internet required, ever** — works in airplane mode.
- **Uninstalling the app deletes the data** — Android wipes an app's private
  storage on uninstall. There is no server copy to restore from.
- **Use the in-app "Backup" tab regularly** — it exports everything to a
  JSON file in your phone's Documents folder. Copy that file somewhere safe
  afterward (cloud drive, email, USB) so a lost/wiped/replaced phone doesn't
  cost you your history.

---

## Common errors & fixes

**`The jeep-sqlite element is not present in the DOM!` (only when running
`npm run dev` in a browser)**
The SQLite plugin needs native Android (or a web shim) to function — it
can't run in a plain browser as-is. Either skip browser testing and go
straight to the Android build, or ask to have the `jeep-sqlite` web shim
added for browser preview.

**`Could not install Gradle distribution ... SocketTimeoutException: Read
timed out`**
A flaky/slow download, not a real config issue.
1. Just retry the sync (elephant icon, or File → Sync Project with Gradle Files).
2. If it keeps failing, edit `android/gradle/wrapper/gradle-wrapper.properties`
   and change the `distributionUrl` from `-all.zip` to `-bin.zip` (smaller,
   faster download, works identically).
3. Try disabling VPN/firewall temporarily, or switch to mobile hotspot for
   just that one sync.

**"No device found" when clicking Run ▶**
Only matters if you're trying to install directly to a connected
phone/emulator. If you only need the standalone APK file, use **Build →
Build Bundle(s) / APK(s) → Build APK(s)** instead — it needs zero devices
connected.

**Build seems to succeed but no APK notification appears**
Check the **Build** panel at the bottom of Android Studio — if it only shows
"Gradle sync finished" and nothing about `assembleDebug`, the actual build
task never ran. Explicitly trigger it via the Build menu (see above), and
wait for it to fully complete before checking the output folder.

---

## Loading screen & logo

`src/main.jsx` shows `src/components/LoadingScreen.jsx` (custom green
bodybuilder-silhouette logo + spinner) for a guaranteed minimum 2.5 seconds
on every launch, regardless of how fast the on-device database actually
opens — so there's no jarring instant flash, and no blank white screen while
SQLite initializes.

---

## iOS (if you want it there too)

Capacitor supports iOS with almost no code changes — the SQLite plugin
already works natively on iOS. But there are real constraints Android
doesn't have:

- **Building requires a Mac** — Xcode only runs on macOS, no Windows/Linux
  equivalent. A cloud Mac rental (e.g. MacinCloud) works if you don't own one.
- **Sideloading is restricted**, unlike Android's open APK install:
  - Free Apple ID → install to your *own* iPhone via Xcode, but it expires
    every 7 days and needs re-signing.
  - Apple Developer Program ($99/year) → use **TestFlight** to share with
    friends via a simple link (up to 10,000 testers, builds last 90 days).
  - Ad Hoc distribution → register up to 100 specific device IDs manually.

Commands (on a Mac, after the above prerequisites are sorted):
```bash
npx cap add ios
npx cap sync
npx cap open ios
```
Opens the project in Xcode instead of Android Studio — build/run from there.

---

## Security notes

- No accounts, no passwords, no network calls — nothing to attack remotely,
  since there's no server.
- Data is only as protected as your phone itself — use a phone lock
  screen/PIN, since anyone with physical access to your unlocked phone can
  open the app.
- The exported backup JSON is plain, unencrypted text — treat it like any
  personal document if you store it in the cloud.
