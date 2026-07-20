# Brandix Unit 4 — Shade Control

Digital Shade Management dashboard (RMWH, Cutting, MQA, Planning, Executive, Reports),
backed by Firebase Realtime Database with login and department-scoped access.

## 1. Install

```bash
npm install
```

## 2. Update the database rules

The project's Realtime Database currently has a **rule that expires 2026-08-19** (test mode).
Replace it before that date, or writes will start failing.

In Firebase Console → Realtime Database → Rules, paste the contents of
[`database.rules.json`](./database.rules.json) and publish. It removes the expiry and instead
scopes access by login: each user can only read/write their own department's data under
`/depts/{DEPT}`, and admins can read/write everything.

## 3. Seed the database (one-time)

This creates the super admin login and loads the starting dataset (real RMWH GRN data,
real Cutting docket data, and illustrative MQA/Planning data).

1. Firebase Console → Project Settings → Service Accounts → **Generate new private key**.
2. Save the downloaded file as `scripts/serviceAccountKey.json` (already gitignored — never commit it).
3. Run:

```bash
npm run seed
```

This creates the super admin account **admin@brandix.local / 123** and writes it to
`/users/{uid}` with `role: "admin"`. Firebase Auth requires an email format, so "admin" became
`admin@brandix.local` — sign in with that.

> `123` is a placeholder password for getting started. Change it in Firebase Console →
> Authentication → Users once you're set up, since anyone with it has full admin access.

## 4. Run it

```bash
npm run dev
```

Sign in as `admin@brandix.local` / `123`. From the **Users** tab, create accounts for each
department (RMWH, MQA, Planning, Cutting) — those users will only see their own department's
dashboard. Admins see everything, including Executive and Reports.

## Data model

```
/users/{uid}         → { name, email, role: "admin"|"user", dept: "RMWH"|"MQA"|"PLANNING"|"CUTTING"|"ALL" }
/depts/RMWH/grn       → GRN records
/depts/CUTTING/dockets → cutting docket records
/depts/MQA/results     → spectrophotometer results
/depts/PLANNING/rows   → schedule allocation records
```

The dashboard reads live from these paths — edit data directly in the Firebase Console, or write
to it from another system, and the dashboard updates immediately (it uses `onValue` listeners).

## Pushing to GitHub

This repo is already git-initialized locally. To push it:

```bash
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

## Notes on what's real vs. illustrative

- **RMWH** and **Cutting** data are transcribed from the documents you uploaded.
- **MQA** and **Planning** data are illustrative — generated from the real shade codes and
  schedules already present, since no spectrophotometer or planning export was provided yet.
  Replace `depts/MQA/results` and `depts/PLANNING/rows` in Firebase with real exports when you
  have them; the dashboard needs no code changes to pick them up.
