// One-time setup script. Run with: npm run seed
//
// Requires a Firebase service account key (bypasses database rules, which is
// why this has to run outside the browser):
//   Firebase Console → Project Settings → Service Accounts →
//   "Generate new private key" → save the file as scripts/serviceAccountKey.json
//
// This script:
//   1. Creates the super admin login (admin@brandix.local / 123) in Firebase Auth
//   2. Writes that admin's profile to /users/{uid}
//   3. Loads the real RMWH + Cutting data and the illustrative MQA + Planning
//      sample data into /depts/...
//
// Safe to re-run: it skips creating the admin if the account already exists,
// and overwrites /depts data each time (so re-run after editing the data below).

const admin = require("firebase-admin");
const path = require("path");

let serviceAccount;
try {
  serviceAccount = require(path.join(__dirname, "serviceAccountKey.json"));
} catch {
  console.error(
    "\nMissing scripts/serviceAccountKey.json.\n" +
    "Download it from Firebase Console → Project Settings → Service Accounts → Generate new private key,\n" +
    "save it as scripts/serviceAccountKey.json, then re-run: npm run seed\n"
  );
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://cbms-7dac3-default-rtdb.firebaseio.com",
});

const db = admin.database();
const auth = admin.auth();

const ADMIN_EMAIL = "admin@brandix.local";
const ADMIN_PASSWORD = "Brandix123"; // Firebase Auth requires 6+ characters

// ---- Real GRN data, from the uploaded "Black Colour Batch Details" sheet ----
const grnRecords = [
  { po: "4010027919", style: "PN45159F60", batch: "B25131194S", invoice: "H26643850-P8", qty: 410.50, date: "2026-02-16", shades: ["A7", "B7"] },
  { po: "4010027919", style: "PN45159F60", batch: "B26003310", invoice: "H26643850-P8", qty: 298.50, date: "2026-02-16", shades: ["A6", "B6", "C6"] },
  { po: "4010027919", style: "PN45159F60", batch: "B26003310Q", invoice: "H26643850-P8", qty: 96.00, date: "2026-02-16", shades: ["A5"] },
  { po: "4010027919", style: "PN45159F60", batch: "B26006381", invoice: "H26643850-P8", qty: 227.00, date: "2026-02-16", shades: ["A8", "B8", "C8"] },
  { po: "4010027919", style: "PN45159F60", batch: "B26006381Q", invoice: "H26643850-P8", qty: 164.00, date: "2026-02-16", shades: ["A11", "B11"] },
  { po: "4010028618", style: "PN45159F61", batch: "B26006611", invoice: "H26653961-P8", qty: 463.50, date: "2026-04-17", shades: ["A29", "B29"] },
  { po: "4010027919", style: "PN45159F60", batch: "B26009666", invoice: "H26649153-P8", qty: 649.50, date: "2026-03-18", shades: ["A20", "B20", "C20", "D20"] },
  { po: "4010027919", style: "PN45159F60", batch: "B26016941", invoice: "H26649153-P8", qty: 342.50, date: "2026-03-18", shades: ["A26", "B26", "C26"] },
  { po: "4010027919", style: "PN45159F60", batch: "B26016997", invoice: "H26649153-P8", qty: 378.50, date: "2026-03-18", shades: ["A25", "B25", "C25", "D25"] },
  { po: "4010028618", style: "PN45159F61", batch: "B26017923", invoice: "H26653961-P8", qty: 274.00, date: "2026-04-17", shades: ["A36", "B36"] },
  { po: "4010028618", style: "PN45159F61", batch: "B26017923Q", invoice: "H26653961-P8", qty: 87.50, date: "2026-04-17", shades: ["A33", "B33"] },
  { po: "4010028618", style: "PN45159F61", batch: "B26017923Q1", invoice: "H26653961-P8", qty: 58.00, date: "2026-04-17", shades: ["A34", "B34"] },
  { po: "4010027919", style: "PN45159F60", batch: "B26018930", invoice: "H26649153-P8", qty: 152.00, date: "2026-03-18", shades: ["A31", "B31"] },
  { po: "4010028888", style: "PN45159F61", batch: "B26021955", invoice: "H26653961-P8", qty: 242.00, date: "2026-04-17", shades: ["A35", "B35"] },
  { po: "4010029744", style: "PN45159F61", batch: "B26024767", invoice: "H26662644-P8", qty: 657.00, date: "2026-04-22", shades: ["A40", "B40"] },
  { po: "4010029744", style: "PN45159F61", batch: "B26024767Q", invoice: "H26662644-P8", qty: 115.00, date: "2026-04-22", shades: ["A39"] },
  { po: "4010029744", style: "PN45159F61", batch: "B26025504S-1", invoice: "H26662644-P8", qty: 274.50, date: "2026-04-22", shades: ["A38", "B38", "C38"] },
];

// ---- Real cutting docket data, from the uploaded cutting dockets ----
const dockets = [
  { docketId: "188869", layJob: "113805", schedule: "55738", component: "Body", category: "CG1", shades: ["B5", "B13", "A17"], fabCode: "PWFT00359", created: "2026-06-23", consumption: 0.0905 },
  { docketId: "188882", layJob: "113809", schedule: "55738", component: "Body", category: "CG1", shades: ["B18", "A18", "A17"], fabCode: "PWFT00359", created: "2026-06-23", consumption: 0.1052 },
  { docketId: "191946", layJob: "115754", schedule: "55736, 55737", component: "Body", category: "CG1", shades: ["A23", "B22", "A22"], fabCode: "PWFT00359", created: "2026-07-07", consumption: 0.1082 },
  { docketId: "191948", layJob: "115755", schedule: "55736, 55737", component: "Body", category: "CG1", shades: ["C20", "A22", "B20"], fabCode: "PWFT00359", created: "2026-07-07", consumption: 0.1050 },
  { docketId: "178972", layJob: "107807", schedule: "53987, 53988", component: "Body", category: "CG1", shades: ["B5", "A14", "B14"], fabCode: "PWFT00359", created: "2026-05-19", consumption: 0.1274 },
  { docketId: "188866", layJob: "113802", schedule: "55738", component: "Body", category: "CG1", shades: ["A16", "A19"], fabCode: "PWFT00359", created: "2026-06-23", consumption: 0.0905 },
  { docketId: "178928", layJob: "107770", schedule: "53990", component: "Body", category: "CG1", shades: ["B5", "A4", "A8"], fabCode: "PWFT00359", created: "2026-05-18", consumption: 0.0881 },
  { docketId: "177824", layJob: "106967", schedule: "53991", component: "CFL+Binding", category: "CG2", shades: ["A144", "B142", "A145", "A142"], fabCode: "FWRP00018", created: "2026-05-12", consumption: 0.0061 },
  { docketId: "188870", layJob: "113801", schedule: "55738", component: "CFL+Binding", category: "CG2", shades: ["A144", "A1", "B1"], fabCode: "FWRP00018", created: "2026-06-23", consumption: 0.0061 },
  { docketId: "191947", layJob: "115754", schedule: "55736, 55737", component: "CFL+Binding", category: "CG2", shades: ["A7", "A144", "A3", "A5", "A143"], fabCode: "FWRP00018", created: "2026-07-07", consumption: 0.0018 },
];

// ---- MQA + Planning: illustrative, until a real export is provided ----
function hashCode(str) { let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0; return h; }
const testers = ["N. Perera", "S. Fernando", "K. Jayasuriya"];
const allShades = Array.from(new Set([...grnRecords.flatMap((r) => r.shades), ...dockets.flatMap((d) => d.shades)]));
const mqaResults = allShades.map((code) => {
  const de = +(0.25 + (hashCode(code) % 140) / 100).toFixed(2);
  const result = de <= 0.8 ? "Pass" : de <= 1.2 ? "Retest" : "Fail";
  return { shade: code, deltaE: de, result, tester: testers[hashCode(code) % testers.length], date: ["2026-07-14", "2026-07-15", "2026-07-16", "2026-07-17", "2026-07-18"][hashCode(code + "d") % 5] };
});

const scheduleSet = Array.from(new Set(dockets.flatMap((d) => d.schedule.split(",").map((s) => s.trim()))));
const planningRows = scheduleSet.map((sch) => {
  const related = dockets.filter((d) => d.schedule.includes(sch));
  const h = hashCode(sch);
  const required = 800 + (h % 1400);
  const allocatedPct = 55 + (h % 46);
  const allocated = Math.round(required * (allocatedPct / 100));
  const status = allocatedPct >= 95 ? "Fully Allocated" : allocatedPct >= 75 ? "Partial" : "Pending";
  return { schedule: sch, style: "PN45159H60", components: Array.from(new Set(related.map((d) => d.component))).join(", ") || "—", required, allocated, status };
});

async function seed() {
  let uid;
  try {
    const existing = await auth.getUserByEmail(ADMIN_EMAIL);
    uid = existing.uid;
    console.log("Admin account already exists, reusing it.");
  } catch {
    const created = await auth.createUser({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, displayName: "Super Admin" });
    uid = created.uid;
    console.log(`Created admin account: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  }

  await db.ref(`users/${uid}`).set({ name: "Super Admin", email: ADMIN_EMAIL, role: "admin", dept: "ALL" });
  await db.ref("depts/RMWH/grn").set(grnRecords);
  await db.ref("depts/CUTTING/dockets").set(dockets);
  await db.ref("depts/MQA/results").set(mqaResults);
  await db.ref("depts/PLANNING/rows").set(planningRows);

  console.log(`Seed complete. Sign in with ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
