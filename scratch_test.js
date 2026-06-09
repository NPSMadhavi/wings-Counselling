import { db } from "./apps/api/src/config/db.js";

function parseJsonArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normaliseMember(row, storage) {
  return {
    id: row.id,
    name: row.name ?? "",
    title: storage.title ? row[storage.title] ?? "" : "",
    role: storage.role ? row[storage.role] ?? "counsellor" : "counsellor",
    bio: storage.bio ? row[storage.bio] ?? "" : "",
    credentials: storage.credentials ? parseJsonArray(row[storage.credentials]) : [],
    specialisations: storage.specialisations ? parseJsonArray(row[storage.specialisations]) : [],
    photoUrl: storage.photoUrl ? row[storage.photoUrl] ?? "" : "",
    email: storage.email ? row[storage.email] ?? "" : "",
    displayOrder: storage.displayOrder ? Number(row[storage.displayOrder] ?? 0) : 0,
    isVisible: storage.isVisible ? Boolean(row[storage.isVisible]) : true,
    createdAt: storage.createdAt ? row[storage.createdAt] : undefined,
    updatedAt: storage.updatedAt ? row[storage.updatedAt] : undefined,
  };
}

async function main() {
  try {
    const [camelTables] = await db.promise().query("SHOW TABLES LIKE 'teamMembers'");
    const tableName = camelTables.length ? "teamMembers" : "team_members";
    console.log("Table name:", tableName);

    const [columns] = await db.promise().query(`SHOW COLUMNS FROM ${tableName}`);
    const names = new Set(columns.map((column) => column.Field));
    console.log("Columns:", Array.from(names));

    const storage = {
      tableName,
      title: names.has("title") ? "title" : null,
      role: names.has("role") ? "role" : null,
      bio: names.has("bio") ? "bio" : null,
      credentials: names.has("credentials") ? "credentials" : null,
      specialisations: names.has("specialisations") ? "specialisations" : null,
      photoUrl: names.has("photoUrl") ? "photoUrl" : "photo_url",
      email: names.has("email") ? "email" : null,
      displayOrder: names.has("displayOrder") ? "displayOrder" : "display_order",
      isVisible: names.has("isVisible") ? "isVisible" : "is_visible",
      createdAt: names.has("createdAt") ? "createdAt" : "created_at",
      updatedAt: names.has("updatedAt") ? "updatedAt" : "updated_at",
    };

    const displayOrder = storage.displayOrder;

    const [rows] = await db.promise().query(
      `SELECT * FROM ${tableName} ORDER BY ${displayOrder} ASC, id ASC`
    );
    console.log("Rows count:", rows.length);

    const mapped = rows.map((row) => normaliseMember(row, storage));
    console.log("Successfully normalized");
    console.log(JSON.stringify(mapped[0], null, 2));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

main();
