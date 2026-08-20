import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);

async function resetDb() {
  console.log("Dropping old schema...");

  await sql`
    DROP TABLE IF EXISTS
      checkpoint_responses,
      defense_files,
      verdicts,
      governance_manifests,
      investigations,
      workflows,
      engagements
    CASCADE
  `;

  await sql`DROP TYPE IF EXISTS verdict CASCADE`;
  await sql`DROP TYPE IF EXISTS engagement_stage CASCADE`;
  await sql`DROP TYPE IF EXISTS evidence_type CASCADE`;
  await sql`DROP TYPE IF EXISTS evidence_strength CASCADE`;
  await sql`DROP TYPE IF EXISTS alternative_type CASCADE`;
  await sql`DROP TYPE IF EXISTS risk_category CASCADE`;
  await sql`DROP TYPE IF EXISTS risk_severity CASCADE`;
  await sql`DROP TYPE IF EXISTS defense_file_status CASCADE`;

  // Also drop new tables in case of partial prior push
  await sql`
    DROP TABLE IF EXISTS
      checkpoint_responses,
      defense_files,
      governance_postures,
      governance_manifests,
      investigations,
      registered_agents,
      engagements
    CASCADE
  `;

  await sql`DROP TYPE IF EXISTS posture CASCADE`;
  await sql`DROP TYPE IF EXISTS manifest_status CASCADE`;
  await sql`DROP TYPE IF EXISTS registration_status CASCADE`;
  await sql`DROP TYPE IF EXISTS posture_lock_status CASCADE`;

  console.log("Old schema dropped. Running migration...");
}

resetDb()
  .then(() => {
    console.log("Reset complete. Now run: npm run db:migrate");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Reset failed:", err);
    process.exit(1);
  });
