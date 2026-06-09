import { db } from "./src/config/db.js";
import dotenv from "dotenv";

dotenv.config();

async function seedCounsellingTypes() {
  try {
    console.log("Starting seed...");

    // Check if data exists
    const [existing] = await db.query("SELECT COUNT(*) as count FROM counselling_types");
    const count = existing[0]?.count || 0;

    console.log(`Existing records: ${count}`);

    if (count === 0) {
      console.log("Table is empty. Inserting sample data...");

      const sampleData = [
        { name: "Individual Counselling", description: "One-on-one counselling sessions" },
        { name: "Group Counselling", description: "Counselling sessions in small groups" },
        { name: "Couples Counselling", description: "Relationship and couples therapy" },
        { name: "Family Counselling", description: "Family therapy and mediation" },
        { name: "Crisis Intervention", description: "Immediate support during crisis" },
      ];

      for (const item of sampleData) {
        await db.query(
          "INSERT INTO counselling_types (name, description, is_active) VALUES (?, ?, true)",
          [item.name, item.description]
        );
      }

      console.log("✅ Sample data inserted successfully!");
    } else {
      console.log("✅ Table already has data. No need to seed.");
    }

    const [allData] = await db.query("SELECT * FROM counselling_types");
    console.log("Current data in counselling_types:");
    console.table(allData);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

seedCounsellingTypes();
