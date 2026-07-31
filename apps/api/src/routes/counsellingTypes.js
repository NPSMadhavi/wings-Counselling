import express from "express";
import { db, columnExists } from "../config/db.js";
import { isUniqueViolation } from "../config/pg-helpers.js";
import {
  ensureCounsellingLanguageTables,
  localizeCounsellingTree,
  localizeSubTypeDetail,
  saveTypeLocalization,
  saveSubTypeLocalization,
} from "../services/counsellingTranslate.js";

const router = express.Router();

function normalizeLangCode(value) {
  return String(value || "en")
    .toLowerCase()
    .split("-")[0];
}

async function getLanguageIdByCode(code) {
  const [rows] = await db.query(
    `SELECT id FROM languages WHERE LOWER(code) = ? LIMIT 1`,
    [normalizeLangCode(code)]
  );
  return rows[0]?.id || null;
}

function parseTeamMemberIds(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0);
  }
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0);
  } catch {
    return [];
  }
}

function normalizeSubTypeRow(sub) {
  return {
    id: sub.id,
    name: sub.name,
    description: sub.description,
    heading: sub.heading || null,
    image_url: sub.image_url || null,
    team_member_ids: parseTeamMemberIds(sub.team_member_ids),
    is_active: Boolean(sub.is_active),
  };
}

async function ensureCounsellingSchema() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS counselling_types (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      description TEXT NULL,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS counselling_sub_types (
      id SERIAL PRIMARY KEY,
      counselling_type_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT NULL,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_counselling_sub_type_parent
        FOREIGN KEY (counselling_type_id) REFERENCES counselling_types(id)
        ON DELETE CASCADE,
      CONSTRAINT uq_counselling_sub_type_name UNIQUE (counselling_type_id, name)
    )
  `);

  if (!(await columnExists("counselling_sub_types", "image_url"))) {
    await db.query(`ALTER TABLE counselling_sub_types ADD COLUMN image_url TEXT`);
  }
  if (!(await columnExists("counselling_sub_types", "heading"))) {
    await db.query(`ALTER TABLE counselling_sub_types ADD COLUMN heading VARCHAR(500)`);
  }
  if (!(await columnExists("counselling_sub_types", "team_member_ids"))) {
    await db.query(`ALTER TABLE counselling_sub_types ADD COLUMN team_member_ids TEXT`);
  }

  try {
    await ensureCounsellingLanguageTables();
  } catch (err) {
    console.warn("[counselling] language tables:", err?.message);
  }
}

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

async function fetchTeamMembersByIds(ids) {
  const uniqueIds = [...new Set(parseTeamMemberIds(ids))];
  if (!uniqueIds.length) return [];

  const placeholders = uniqueIds.map(() => "?").join(", ");
  const [rows] = await db.query(
    `SELECT id, name, title, role, bio, credentials, specialisations, experience, photo_url, email, display_order, is_visible
     FROM team_members
     WHERE id IN (${placeholders}) AND is_visible = true`,
    uniqueIds
  );

  const byId = new Map(
    rows.map((row) => [
      row.id,
      {
        id: row.id,
        name: row.name ?? "",
        title: row.title ?? "",
        role: row.role ?? "counsellor",
        bio: row.bio ?? "",
        credentials: parseJsonArray(row.credentials),
        specialisations: parseJsonArray(row.specialisations),
        experience: row.experience ?? "",
        photoUrl: row.photo_url ?? "",
        email: row.email ?? "",
        displayOrder: Number(row.display_order ?? 0),
        isVisible: Boolean(row.is_visible),
      },
    ])
  );

  return uniqueIds.map((id) => byId.get(id)).filter(Boolean);
}

ensureCounsellingSchema().catch((err) => {
  console.error("Failed to ensure counselling schema:", err.message);
});

/* ================= GET ================= */
router.get("/", async (req, res) => {
  try {
    await ensureCounsellingSchema();

    const lang = normalizeLangCode(req.query.lang);

    const [types] = await db.query(`
      SELECT
        id,
        name,
        description,
        is_active
      FROM counselling_types
      ORDER BY id DESC
    `);

    const [subTypes] = await db.query(`
      SELECT
        id,
        counselling_type_id,
        name,
        description,
        heading,
        image_url,
        team_member_ids,
        is_active
      FROM counselling_sub_types
      ORDER BY id DESC
    `);

    const groupedSubTypes = {};
    subTypes.forEach((sub) => {
      const parentId = sub.counselling_type_id;
      if (!groupedSubTypes[parentId]) groupedSubTypes[parentId] = [];
      groupedSubTypes[parentId].push(normalizeSubTypeRow(sub));
    });

    let finalData = types.map((type) => ({
      id: type.id,
      name: type.name,
      description: type.description,
      is_active: Boolean(type.is_active),
      sub_types: groupedSubTypes[type.id] || [],
    }));

    if (lang && lang !== "en") {
      finalData = await localizeCounsellingTree(finalData, lang);
    }

    return res.status(200).json({
      success: true,
      data: finalData,
      lang,
    });
  } catch (error) {
    console.log("GET COUNSELLING TYPES ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/* ================= GET SUB TYPE DETAIL ================= */
router.get("/sub/:id", async (req, res) => {
  try {
    await ensureCounsellingSchema();

    const { id } = req.params;
    const lang = normalizeLangCode(req.query.lang);
    const [rows] = await db.query(
      `SELECT
        st.id,
        st.counselling_type_id,
        st.name,
        st.description,
        st.heading,
        st.image_url,
        st.team_member_ids,
        st.is_active,
        ct.name AS parent_name,
        ct.description AS parent_description
       FROM counselling_sub_types st
       JOIN counselling_types ct ON ct.id = st.counselling_type_id
       WHERE st.id = ?`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Sub service not found" });
    }

    const row = rows[0];
    const team_member_ids = parseTeamMemberIds(row.team_member_ids);
    const team_members = await fetchTeamMembersByIds(team_member_ids);

    let data = {
      ...normalizeSubTypeRow(row),
      counselling_type_id: row.counselling_type_id,
      parent_type: {
        id: row.counselling_type_id,
        name: row.parent_name,
        description: row.parent_description,
      },
      team_members,
    };

    if (lang && lang !== "en") {
      data = await localizeSubTypeDetail(data, lang);
    }

    return res.status(200).json({
      success: true,
      data,
      lang,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/* ================= CREATE ================= */

router.post("/create", async (req, res) => {
  try {
    await ensureCounsellingSchema();

    const {
      name,
      description,
      counselling_type_id,
      heading,
      image_url,
      team_member_ids,
      language_id: bodyLanguageId,
      language_code: bodyLanguageCode,
    } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({
        message: "Counselling type name is required",
      });
    }

    let languageId = bodyLanguageId ? Number(bodyLanguageId) : null;
    if (!languageId && bodyLanguageCode) {
      languageId = await getLanguageIdByCode(bodyLanguageCode);
    }
    if (!languageId) {
      languageId = await getLanguageIdByCode("en");
    }

    if (counselling_type_id) {
      const [parents] = await db.query(
        "SELECT id FROM counselling_types WHERE id = ?",
        [counselling_type_id]
      );
      if (!parents.length) {
        return res.status(404).json({ message: "Main counselling type not found" });
      }

      const teamIdsJson = JSON.stringify(parseTeamMemberIds(team_member_ids));

      const [result] = await db.query(
        `INSERT INTO counselling_sub_types
         (counselling_type_id, name, description, heading, image_url, team_member_ids)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          counselling_type_id,
          name.trim(),
          description || null,
          heading?.trim() || null,
          image_url?.trim() || null,
          teamIdsJson,
        ]
      );

      if (languageId) {
        try {
          await ensureCounsellingLanguageTables();
          await saveSubTypeLocalization(result.insertId, languageId, {
            name: name.trim(),
            description: description || "",
            heading: heading?.trim() || "",
          });
        } catch (err) {
          console.warn("[counselling] save sub localization:", err?.message);
        }
      }

      return res.status(201).json({
        message: "Sub counselling type added successfully",
        data: {
          id: result.insertId,
          counselling_type_id: Number(counselling_type_id),
          name: name.trim(),
          description: description || null,
          heading: heading?.trim() || null,
          image_url: image_url?.trim() || null,
          team_member_ids: parseTeamMemberIds(team_member_ids),
        },
      });
    }

    const [result] = await db.query(
      `INSERT INTO counselling_types (name, description) VALUES (?, ?)`,
      [name.trim(), description || null]
    );

    if (languageId) {
      try {
        await ensureCounsellingLanguageTables();
        await saveTypeLocalization(result.insertId, languageId, {
          name: name.trim(),
          description: description || "",
        });
      } catch (err) {
        console.warn("[counselling] save type localization:", err?.message);
      }
    }

    res.status(201).json({
      message: "Main counselling type added successfully",
      data: { id: result.insertId, name: name.trim(), description: description || null },
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
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
    await ensureCounsellingSchema();

    const { id } = req.params;
    const {
      name,
      description,
      counselling_type_id,
      heading,
      image_url,
      team_member_ids,
      language_id: bodyLanguageId,
      language_code: bodyLanguageCode,
    } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ message: "Name is required" });
    }

    let languageId = bodyLanguageId ? Number(bodyLanguageId) : null;
    if (!languageId && bodyLanguageCode) {
      languageId = await getLanguageIdByCode(bodyLanguageCode);
    }
    const langCode = bodyLanguageCode
      ? normalizeLangCode(bodyLanguageCode)
      : languageId
        ? null
        : "en";

    let resolvedLangCode = langCode;
    if (languageId && !resolvedLangCode) {
      const [langRows] = await db.query(
        `SELECT code FROM languages WHERE id = ? LIMIT 1`,
        [languageId]
      );
      resolvedLangCode = normalizeLangCode(langRows[0]?.code || "en");
    }
    if (!resolvedLangCode) resolvedLangCode = "en";
    if (!languageId) {
      languageId = await getLanguageIdByCode(resolvedLangCode);
    }

    const isEnglish = resolvedLangCode === "en";

    if (counselling_type_id || String(req.query.is_sub_type) === "true") {
      const teamIdsJson = JSON.stringify(parseTeamMemberIds(team_member_ids));

      if (isEnglish) {
        await db.query(
          `UPDATE counselling_sub_types
           SET counselling_type_id=COALESCE(?, counselling_type_id),
               name=?, description=?, heading=?, image_url=?, team_member_ids=?
           WHERE id=?`,
          [
            counselling_type_id || null,
            name.trim(),
            description || null,
            heading?.trim() || null,
            image_url?.trim() || null,
            teamIdsJson,
            id,
          ]
        );
      } else if (image_url !== undefined || team_member_ids !== undefined || counselling_type_id) {
        // Non-text fields stay shared across languages
        await db.query(
          `UPDATE counselling_sub_types
           SET counselling_type_id=COALESCE(?, counselling_type_id),
               image_url=COALESCE(?, image_url),
               team_member_ids=COALESCE(?, team_member_ids)
           WHERE id=?`,
          [
            counselling_type_id || null,
            image_url?.trim() || null,
            team_member_ids != null ? teamIdsJson : null,
            id,
          ]
        );
      }

      if (languageId) {
        try {
          await ensureCounsellingLanguageTables();
          await saveSubTypeLocalization(Number(id), languageId, {
            name: name.trim(),
            description: description || "",
            heading: heading?.trim() || "",
          });
        } catch (err) {
          console.warn("[counselling] update sub localization:", err?.message);
        }
      }

      return res.json({ message: "Sub counselling type updated successfully" });
    }

    if (isEnglish) {
      await db.query(
        `UPDATE counselling_types SET name=?, description=? WHERE id=?`,
        [name.trim(), description || null, id]
      );
    }

    if (languageId) {
      try {
        await ensureCounsellingLanguageTables();
        await saveTypeLocalization(Number(id), languageId, {
          name: name.trim(),
          description: description || "",
        });
      } catch (err) {
        console.warn("[counselling] update type localization:", err?.message);
      }
    }

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