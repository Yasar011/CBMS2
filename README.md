# Brandix Unit 4 — Shade Control

Digital Shade Management dashboard (RMWH, Cutting, MQA, Executive, Reports),
backed by Firebase Realtime Database with login and department-scoped access.

MQA scans are read on the Datacolor spectrophotometer under three illuminants (A, F2, D65);
a shade passes only when every Da and Db reading is negative. Each scan is mapped into a Master
Shade Library — matches within tolerance reuse an existing standard and its Roman-numeral Shade
Group, while the original shade name is retained for traceability. Reports can be downloaded as
Excel or PDF.

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

This creates the super admin account **admin@brandix.local / Brandix123** and writes it to
`/users/{uid}` with `role: "admin"`. Firebase Auth requires an email format, so "admin" became
`admin@brandix.local` — sign in with that.

> `Brandix123` is a placeholder password for getting started (Firebase requires 6+ characters,
> so the originally documented `123` never actually worked). Change it in Firebase Console →
> Authentication → Users once you're set up, since anyone with it has full admin access.

## 4. Run it

```bash
npm run dev
```

Sign in as `admin@brandix.local` / `Brandix123`. From the **Users** tab, create accounts for each
department (RMWH, MQA, Cutting) — those users will only see their own department's
dashboard. Admins see everything, including Executive and Reports.

## Data model

```
/users/{uid}         → { name, email, role: "admin"|"user", dept: "RMWH"|"MQA"|"CUTTING"|"ALL" }
/depts/RMWH/grn       → GRN records
/depts/CUTTING/dockets → cutting docket records
/depts/MQA/results     → spectrophotometer results (Da/Db per illuminant, shade group)
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
- **MQA** data is illustrative — random Da/Db readings generated for the real shade codes already
  present, since no spectrophotometer export was provided yet. Replace `depts/MQA/results` in
  Firebase with a real export when you have one; the dashboard needs no code changes to pick it up.
