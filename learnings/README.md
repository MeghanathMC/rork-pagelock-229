# Learnings – Rork to Full-Fledged Mobile App

This folder contains shared learnings from building **PageLock** (and similar apps) with **Rork** and then completing the setup locally in **Cursor** / **Codex** for production-ready features like native Google Sign-In.

---

## When to use these guides

- You started an app in Rork and want to run it locally with real auth and native builds.
- You need a step-by-step plan from "clone repo" to "app running on device."
- You hit environment or credential errors and want quick fixes.

---

## Contents

| Document | Description |
|----------|-------------|
| [FULL_SETUP_GUIDE.md](./FULL_SETUP_GUIDE.md) | End-to-end plan: Rork → GitHub → clone → env setup → Android Studio → Google Console → Supabase → run app. Every command, every error we faced, every fix. |

---

## The core lesson

> **Rork is not for building a complete, fully native app from zero to production.**
> It is a powerful starting point. It gives you the code, screens, UI, and wired-up flows.
> But to run on a real device with real auth (e.g. native Google Sign-In), you need local tooling and credentials.

**Rork handles:**
- App structure, navigation, components
- Supabase client setup
- Auth screens ("Continue with Google" button)
- RevenueCat integration
- AI verification flows

**You handle (locally in Cursor):**
- Android Studio + SDK + JAVA_HOME + ANDROID_HOME
- Google OAuth clients (Web, Android, iOS) in Google Cloud Console
- SHA-1 keystore fingerprint from your machine
- Supabase Google provider configuration
- `.env` file with real credentials
- Building and running on device/emulator
