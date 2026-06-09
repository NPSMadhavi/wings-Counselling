import express from "express";
import { db } from "../config/db.js";

const router = express.Router();

async function ensureCounsellingSchema() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS counselling_types (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      description LONGTEXT NULL,
      is_active BOOLEAN DEFAULT true,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS counselling_sub_types (
      id INT AUTO_INCREMENT PRIMARY KEY,
      counselling_type_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      description LONGTEXT NULL,
      is_active BOOLEAN DEFAULT true,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_counselling_sub_type_parent
        FOREIGN KEY (counselling_type_id) REFERENCES counselling_types(id)
        ON DELETE CASCADE,
      UNIQUE KEY uq_counselling_sub_type_name (counselling_type_id, name)
    )
  `);
}

ensureCounsellingSchema().catch((err) => {
  console.error("Failed to ensure counselling schema:", err.message);
});

/* ================= GET ================= */
/* ================= GET ================= */
router.get("/", async (_req, res) => {

  try {

    console.log("GET COUNSELLING TYPES API HIT");

    /* MAIN TYPES */
    const [types] = await db.query(`
      SELECT
        id,
        name,
        description,
        is_active
      FROM counselling_types
      ORDER BY id DESC
    `);

    console.log("MAIN TYPES:", types);

    /* SUB TYPES */
    const [subTypes] = await db.query(`
      SELECT
        id,
        counselling_type_id,
        name,
        description,
        is_active
      FROM counselling_sub_types
      ORDER BY id DESC
    `);

    console.log("SUB TYPES:", subTypes);

    /* GROUP SUB TYPES */
    const groupedSubTypes = {};

    subTypes.forEach((sub) => {

      const parentId = sub.counselling_type_id;

      if (!groupedSubTypes[parentId]) {
        groupedSubTypes[parentId] = [];
      }

      groupedSubTypes[parentId].push({
        id: sub.id,
        name: sub.name,
        description: sub.description,
        is_active: Boolean(sub.is_active),
      });
    });

    /* FINAL DATA */
    const finalData = types.map((type) => ({
      id: type.id,
      name: type.name,
      description: type.description,
      is_active: Boolean(type.is_active),

      sub_types:
        groupedSubTypes[type.id] || []
    }));

    console.log("FINAL DATA:", finalData);

    return res.status(200).json({
      success: true,
      data: finalData,
    });

  } catch (error) {

    console.log(
      "GET COUNSELLING TYPES ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/* ================= CREATE ================= */

router.post("/create", async (req, res) => {
  try {
    const { name, description, counselling_type_id } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({
        message: "Counselling type name is required",
      });
    }

    if (counselling_type_id) {
      const [parents] = await db.query(
        "SELECT id FROM counselling_types WHERE id = ?",
        [counselling_type_id]
      );
      if (!parents.length) {
        return res.status(404).json({ message: "Main counselling type not found" });
      }

      const [result] = await db.query(
        `INSERT INTO counselling_sub_types
         (counselling_type_id, name, description)
         VALUES (?, ?, ?)`,
        [counselling_type_id, name.trim(), description || null]
      );

      return res.status(201).json({
        message: "Sub counselling type added successfully",
        data: {
          id: result.insertId,
          counselling_type_id: Number(counselling_type_id),
          name: name.trim(),
          description: description || null,
        },
      });
    }

    const [result] = await db.query(
      `INSERT INTO counselling_types (name, description) VALUES (?, ?)`,
      [name.trim(), description || null]
    );

    res.status(201).json({
      message: "Main counselling type added successfully",
      data: { id: result.insertId, name: name.trim(), description: description || null },
    });
  } catch (error) {
    if (error?.errno === 1062) {
      return res.status(409).json({ message: "Type already exists" });
    }
    res.status(500).json({
      message: "Server Error",
    });
  }
});

/* ================= UPDATE ================= */

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, counselling_type_id } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ message: "Name is required" });
    }

    if (counselling_type_id) {
      await db.query(
        `UPDATE counselling_sub_types
         SET counselling_type_id=?, name=?, description=?
         WHERE id=?`,
        [counselling_type_id, name.trim(), description || null, id]
      );
      return res.json({ message: "Sub counselling type updated successfully" });
    }

    await db.query(
      `UPDATE counselling_types SET name=?, description=? WHERE id=?`,
      [name.trim(), description || null, id]
    );

    res.json({
      message: "Main counselling type updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
    });
  }
});

/* ================= DELETE ================= */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { is_sub_type } = req.query;

    if (String(is_sub_type) === "true") {
      await db.query("DELETE FROM counselling_sub_types WHERE id=?", [id]);
      return res.json({ message: "Sub counselling type deleted successfully" });
    }

    await db.query("DELETE FROM counselling_types WHERE id=?", [id]);

    res.json({
      message: "Main counselling type deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
    });
  }
});

export default router;