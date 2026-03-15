# PageLock – App Plan for Rork

## What This App Does

PageLock is a reading habit app for Android. The user sets a daily reading goal (number of pages). Until they complete and verify that goal, their chosen social media apps stay locked. Once they prove they read, the apps unlock for the day. Simple loop. No distractions, no fluff.

---

## Tech Stack

- **Framework:** React Native (Expo) via Rork
- **Database + Auth:** Supabase
- **Payments:** RevenueCat
- **AI Validation:** OpenAI GPT-4o Vision API
- **App Blocking:** Native Android module using UsageStatsManager + AccessibilityService

---

## Architecture Rules

- Strict OOP principles throughout
- Single global `theme.ts` file for all colors, fonts, spacing, corner radius, shadows. Zero hardcoded styles inside components
- Every UI element is a reusable component
- Clean folder structure: `/components`, `/screens`, `/services`, `/hooks`, `/theme`, `/navigation`
- All API calls go through a `/services` layer, never directly inside components
- State managed with React Context or Zustand

---

## Screens

---

### 1. Onboarding (first launch only)

Onboarding is the most important part of this app. It sets the tone. It must feel premium, intentional, and emotionally resonant. Reference quality: Calm app, Duolingo Plus onboarding, Headspace. Think full-screen immersive slides, not a tour wizard.

**Design rules for onboarding:**

- Full-screen illustrations or animated visuals on each slide. Dark background. Amber/gold accent.
- Large, bold headline on each screen. Single short subline. Nothing else.
- Bottom sheet style CTA button. Soft haptic feedback on tap.
- Progress dots at bottom (not a progress bar). Minimal.
- Skip option top-right on slides 1 through 3. Not on slide 4 (identity screen).
- Smooth slide transitions with slight parallax on the illustration layer.
- No feature lists. No bullet points. Emotion first, function second.

**Slide 1 – The Hook**

- Full-screen dark background with a glowing book illustration, soft light rays coming from the pages
- Headline: "Your future self reads every day."
- Subline: "Most people never start. You're already here."
- CTA: "Let's go" (bottom button)

**Slide 2 – The Problem**

- Illustration: phone with Instagram/social media app icons blurred or faded, book in sharp focus in foreground
- Headline: "The scroll never stops. Until now."
- Subline: "Lock your apps until you've read your pages. Then unlock everything."
- CTA: "Makes sense" or swipe forward

**Slide 3 – The Proof**

- Illustration: camera capturing a book page, AI sparkle icon, checkmark
- Headline: "Prove you read it. No cheating."
- Subline: "Photograph your page. Answer two questions. Done."
- CTA: "I'm in"

**Slide 4 – The Streak / Identity**

- Illustration: a heatmap calendar filling up with amber squares, flame icon glowing
- Headline: "One page a day. Every day."
- Subline: "Streaks build readers. Readers build lives."
- CTA: "Start my streak" (primary action, no skip)

**Slide 5 – Auth Screen**

- Clean, minimal. Dark card center screen.
- App logo and name at top
- "Continue with Google" button (filled, primary)
- "Continue with Email" button (outlined, secondary)
- Small legal text at bottom: "By continuing, you agree to our Terms of Service and Privacy Policy." (linked)
- No social proof, no ratings, no noise. Just sign up.

**After auth: Paywall screen appears before home screen (see paywall section below)**

---

### 2. Home Screen

- Shows today's reading status: locked or unlocked
- Current book title and author
- Today's goal: e.g., "Read 5 pages"
- Progress indicator: pages read today vs goal
- Big primary CTA button: "I've Read My Pages" (leads to verification flow)
- Streak counter at top: flame icon + number of consecutive days
- If goal is already completed today: show success state with unlocked status

---

### 3. Verification Flow (3 steps, modal or stack)

**Step 1: Photograph the page**

- Instruction: "Take a photo of the last page you read"
- Camera opens directly
- User captures the page
- Photo preview shown with "Looks good" confirm button

**Step 2: AI Question Screen**

- Show the captured page photo at top (small thumbnail)
- Loading state while GPT-4o Vision analyses the page
- GPT-4o extracts key content from the page and generates 2 questions specific to that page
- Display both questions with text input fields
- User types answers manually
- Paste detection: if user pastes text, show warning "Type it in your own words"
- Submit button

**Step 3: Result Screen**

- GPT-4o evaluates answers against page content
- If pass: success animation, "Great job! Apps unlocked for today." Streak updated.
- If fail: "Try again. Answer in your own words." Allow one retry.
- On success: update Supabase streak record, mark today as complete

---

### 4. Book Setup Screen

- Search for book by title (use Open Library API or manual entry)
- Enter: book title, author, total pages
- Set daily page goal (number picker: 1 to 50 pages)
- Set which apps to lock (multi-select list: Instagram, YouTube, Twitter/X, Reddit, TikTok, custom)
- Save to Supabase user profile

---

### 5. Streak & History Screen

- GitHub-style heatmap calendar showing daily completions
- Each completed day: filled square with color intensity based on pages read
- Total streak (current), longest streak (all time)
- Reading log: list of completed days with date, pages read, book title
- Tapping a day shows the questions answered that day

---

### 6. Settings Screen

- Edit current book and daily goal
- Edit locked apps list
- Manage subscription (opens paywall or links to Google Play subscription management)
- Restore purchases (required by Play Store)
- Delete account (required by Play Store since 2024)
- Sign out
- Privacy Policy link (required)
- Terms of Service link (required)
- App version

---

## App Blocking (Android Native Module)

- On setup, prompt user to grant Accessibility Service and Usage Stats permissions
- Show clear explanation screen before requesting permissions: "We need this to lock apps until your goal is done. We never read your data."
- When goal is incomplete: intercept launch of locked apps, redirect to PageLock with a reminder screen
- When goal is complete for the day: allow all apps normally
- Reset lock at midnight daily (or user-defined reset time)
- App blocking must never interfere with emergency calls, system apps, or Google Play itself

---

## Supabase Schema

```
users
  id, email, created_at

profiles
  user_id, current_book_title, current_book_author, total_pages, daily_page_goal, locked_apps[]

reading_logs
  id, user_id, date, pages_read, book_title, questions[], answers[], passed, created_at

streaks
  user_id, current_streak, longest_streak, last_completed_date
```

---

## OpenAI GPT-4o Vision Integration

Single service file: `/services/openai.ts`

**Call 1: Generate questions**

- Input: page photo (base64)
- Prompt: "You are a reading comprehension checker. Analyse this book page carefully. Extract the key ideas. Generate exactly 2 specific questions about the content of this page that can only be answered by someone who actually read it. Return JSON: { questions: [string, string] }"
- Output: 2 questions shown to user

**Call 2: Evaluate answers**

- Input: page photo (base64) + questions + user answers
- Prompt: "You are a reading comprehension checker. Given this book page and these questions and answers, evaluate whether the answers show genuine understanding of the page content. Be reasonable, not strict. Minor wording differences are fine. Return JSON: { passed: boolean, feedback: string }"
- Output: pass or fail with short feedback shown to user

---

## RevenueCat – Subscription & Paywall

### Pricing

| Plan    | Price         | RevenueCat Product Identifier |
| ------- | ------------- | ----------------------------- |
| Monthly | $9.00 / month | `pagelock_pro_monthly`        |
| Yearly  | $40.00 / year | `pagelock_pro_yearly`         |

Set up both as auto-renewing subscriptions in Google Play Console first. Then map them inside RevenueCat dashboard under one Offering called `default`. The yearly plan saves 63% vs paying monthly ($9 x 12 = $108 vs $40).

### Free vs Pro

**Free tier:**

- 1 active book at a time
- Lock up to 2 apps
- 7-day streak history only

**PageLock Pro:**

- Unlimited books
- Lock unlimited apps
- Full streak history and heatmap
- Streak recovery (once per week: skip one day without breaking streak)
- Priority AI validation

### Paywall Screen – Play Store Compliant

The paywall appears once right after auth during onboarding. It also appears when a free user hits a Pro-only feature.

**Mandatory Play Store compliance rules built into this screen:**

1. All subscription benefits shown clearly before the user taps subscribe. Nothing hidden.
2. Price, billing period, and auto-renewal statement visible on screen before purchase tap. Not in fine print. Not behind a scroll.
3. "Restore Purchases" button present and functional on this screen.
4. "Continue with Free" option clearly visible, full opacity, minimum 14sp font. Never greyed out. Never hidden. Users must be able to leave the paywall without subscribing.
5. No dark patterns: no fake countdown timers, no false scarcity messaging, no misleading strikethrough prices.
6. Savings percentage shown ("Save 63%") is honest and accurate.
7. Privacy Policy and Terms of Service links visible on the paywall screen.
8. After subscribing, user can manage or cancel via Google Play. Settings screen links to: `https://play.google.com/store/account/subscriptions`

**Paywall screen layout:**

- Top section: amber crown or premium badge icon
- Headline: "Read more. Scroll less. Go Pro."
- Subline: "Unlock the full PageLock experience."
- Feature list (3 items, icon + label each):
  - Unlimited books
  - Lock any app
  - Streak recovery
- Pricing toggle pill: "Monthly" / "Yearly" — default to Yearly
  - Yearly: "$40 / year • Save 63%"
  - Monthly: "$9 / month"
- Auto-renewal disclosure directly below price: "Auto-renews. Cancel anytime in Google Play."
- Primary CTA: "Start PageLock Pro" (full width, amber fill, 56dp height)
- Below CTA: "Restore Purchases" (text button, centered, 14sp)
- Below that: "Continue with Free" (text button, centered, 14sp, full opacity, NOT greyed out)
- Footer: "Privacy Policy · Terms of Service" (small, linked)

**RevenueCat service implementation:**

```typescript
// /services/revenuecat.ts

import Purchases, { PurchasesOffering } from "react-native-purchases";

class RevenueCatService {
  async initialize(): Promise<void>;
  async getOfferings(): Promise<PurchasesOffering>;
  async purchasePackage(packageToPurchase): Promise<void>;
  async restorePurchases(): Promise<void>;
  async checkSubscriptionStatus(): Promise<boolean>;
}
```

Handle all three purchase states explicitly:

- Success: unlock Pro, navigate to home
- Cancelled: user backed out, not an error, return to paywall silently
- Error: show error message, do not crash, allow retry

---

## UI Design Direction

- Dark theme. Background: #0A0A0F (near black).
- Accent: warm amber #F5A623. Used for CTAs, streak flame, active states, Pro badge.
- Success: #4CAF82. Error: #E05555.
- Typography: Inter. Bold 700 for headlines, Medium 500 for body, Regular 400 for captions.
- Corner radius: 16px cards, 12px buttons, 8px chips. All defined in theme.ts.
- Cards: 1px border at 10% white opacity, subtle drop shadow.
- Streak flame: amber with soft glow.
- Locked state: padlock icon overlay, muted red tint on app icon.
- Unlocked state: open padlock, green tint, brief confetti animation on first unlock of the day.
- One primary action per screen. No competing CTAs anywhere.

---

## Play Store Submission Compliance Checklist

Every item below must be built into the app before submitting to Play Store:

- [ ] Privacy Policy URL hosted, linked in app and in Play Store listing
- [ ] Terms of Service URL hosted, linked in app and in Play Store listing
- [ ] Subscription price and billing period shown on paywall before purchase confirmation
- [ ] Auto-renewal disclosure on paywall screen
- [ ] "Restore Purchases" button on paywall screen
- [ ] "Continue with Free" clearly visible and tappable on paywall screen (not greyed out)
- [ ] Manage Subscription link in Settings (deep links to Google Play subscriptions page)
- [ ] Account deletion option in Settings (required by Play Store since 2024)
- [ ] Accessibility Service permission screen explains exactly why the permission is needed
- [ ] Usage Stats permission screen explains exactly why the permission is needed
- [ ] Camera permission rationale shown before requesting access
- [ ] No permissions declared in manifest that are not used
- [ ] App blocking never interferes with emergency calls, Phone app, or Google Play
- [ ] App handles offline gracefully (no crashes, shows appropriate message)
- [ ] Target SDK: API level 34 minimum (current Play Store requirement)
- [ ] No fake urgency, no countdown timers, no misleading pricing on paywall
- [ ] App does not use Accessibility Service for any purpose other than app blocking

---

## What NOT to Build in Rork

The following must be handled in Cursor after syncing to GitHub:

- Native Android AccessibilityService module (app blocking)
- UsageStatsManager integration
- Any Android system-level permission handling

Rork handles everything else. Once synced to GitHub, open in Cursor and build the native module as a separate Android module that the Expo app bridges into.

---

## Build Order

1. Auth flow (Supabase)
2. Premium onboarding (all 5 slides with animations)
3. Paywall screen (RevenueCat, fully Play Store compliant)
4. Book setup screen
5. Home screen with locked/unlocked state (mocked blocking for now)
6. Verification flow with GPT-4o Vision
7. Streak and history screen
8. Settings screen (all required links, account deletion, restore purchases)
9. Native Android app blocking module (in Cursor)
10. End-to-end testing on physical Android device
11. Play Store compliance audit against checklist above
12. Play Store submission
