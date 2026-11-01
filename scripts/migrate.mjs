import fs from "node:fs";
import path from "node:path";
import dns from "node:dns";
import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

// Fallback DNS resolver for cloud databases
const origLookup = dns.lookup;
const fallbackResolver = new dns.Resolver();
fallbackResolver.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);

dns.lookup = function (hostname, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = {};
  }
  origLookup(hostname, options, (err, address, family) => {
    if (!err && address) {
      return callback(null, address, family);
    }
    fallbackResolver.resolve4(hostname, (resErr, addrs) => {
      if (!resErr && addrs && addrs.length > 0) {
        if (options && typeof options === "object" && options.all) {
          return callback(null, addrs.map((a) => ({ address: a, family: 4 })));
        }
        return callback(null, addrs[0], 4);
      }
      callback(err || resErr);
    });
  });
};

async function runMigration() {
  console.log("Connecting to database:", process.env.DATABASE_URL?.split("@")[1]);
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 15000,
  });

  const client = await pool.connect();
  console.log("Connected to database successfully!");

  try {
    const sqlPath = path.join(process.cwd(), "drizzle", "0000_third_omega_flight.sql");
    const sqlContent = fs.readFileSync(sqlPath, "utf-8");
    const statements = sqlContent
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    console.log(`Executing ${statements.length} migration statements...`);

    await client.query("BEGIN");
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        await client.query(stmt);
      } catch (err) {
        // Ignore "already exists" errors if re-run
        if (err.code === "42P07" || err.code === "42710" || err.code === "42701") {
          console.log(`Notice at stmt ${i + 1}: ${err.message}`);
        } else {
          console.error(`Error executing stmt ${i + 1}:`, stmt);
          throw err;
        }
      }
    }
    await client.query("COMMIT");
    console.log("All migration statements executed successfully!");

    // Verify tables
    const res = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    console.log(`Created ${res.rows.length} tables:`, res.rows.map((r) => r.table_name).join(", "));
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(console.error);

