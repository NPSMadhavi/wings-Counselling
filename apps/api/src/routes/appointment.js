// src/routes/appointment.js

import express from "express";
import { db } from "../config/db.js";
import { sendAppointmentConfirmationEmail } from "../lib/email.js";
import { broadcastToAdmin } from "../lib/sse.js";

const router = express.Router();

async function ensureAppointmentColumns() {
    try {
        const [cols] = await db.execute(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = 'appointments'
               AND COLUMN_NAME = 'sub_counselling_types'`
        );
        if (cols.length === 0) {
            await db.execute(
                `ALTER TABLE appointments
                 ADD COLUMN sub_counselling_types TEXT NULL
                 AFTER counselling_type`
            );
            console.log("[Appointments] Added sub_counselling_types column");
        }
    } catch (error) {
        console.error("[Appointments] Schema check failed:", error.message);
    }
}

ensureAppointmentColumns();

/* =========================================================
   CREATE APPOINTMENT
========================================================= */

router.post("/", async (req, res) => {
    try {
        const {
            nric_fin_number,
            name,
            age,
            gender,
            nationality,
            email,
            phone,
            counselling_type,
            sub_counselling_types,
            description,
            remarks
        } = req.body;

        const missingFields = [];
        if (!nric_fin_number) missingFields.push("nric_fin_number");
        if (!name) missingFields.push("name");
        if (!age) missingFields.push("age");
        if (!gender) missingFields.push("gender");
        if (!nationality) missingFields.push("nationality");
        if (!email) missingFields.push("email");
        if (!phone) missingFields.push("phone");
        if (!counselling_type) missingFields.push("counselling_type");

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(", ")}`
            });
        }

        const parsedAge = parseInt(age, 10);
        if (Number.isNaN(parsedAge) || parsedAge <= 0) {
            return res.status(400).json({
                success: false,
                message: "Age must be a valid positive number"
            });
        }

        const sql = `
      INSERT INTO appointments (
        nric_fin_number,
        name,
        age,
        gender,
        nationality,
        email,
        phone,
        counselling_type,
        sub_counselling_types,
        description,
        remarks
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

        const values = [
            nric_fin_number,
            name,
            parsedAge,
            gender,
            nationality,
            email,
            phone,
            counselling_type,
            sub_counselling_types || null,
            description || null,
            remarks || null
        ];

        const [result] = await db.execute(sql, values);

        const appointment = {
            id: result.insertId,
            nric_fin_number,
            name,
            age: parsedAge,
            gender,
            nationality,
            email,
            phone,
            counselling_type,
            sub_counselling_types: sub_counselling_types || "",
            description: description || "",
            remarks: remarks || ""
        };

        const emailSent = await sendAppointmentConfirmationEmail(appointment);
        if (!emailSent) {
            console.error("Appointment email send failed for appointment id:", result.insertId, "recipients:", email, "and counselling center");
            broadcastToAdmin("email_failed", {
              context: "appointment_confirmation",
              appointmentId: result.insertId,
              email,
              reason: "Failed to send appointment confirmation email"
            });
        } else {
            console.log("Appointment email sent successfully for appointment id:", result.insertId);
            broadcastToAdmin("email_sent", {
              context: "appointment_confirmation",
              appointmentId: result.insertId,
              email,
              subject: "Appointment confirmation delivered"
            });
        }

        broadcastToAdmin("new_form_submission", {
          formType: "Appointment",
          id: result.insertId,
          name,
          email,
          counsellingType: counselling_type
        });

        broadcastToAdmin("new_appointment", {
          id: result.insertId,
          name,
          email,
          counsellingType: counselling_type,
        });

        res.status(201).json({
            success: true,
            message: "Appointment created successfully",
            appointment,
            emailSent
        });

    } catch (error) {
        console.error("Appointment creation failed:", error);

        res.status(500).json({
            success: false,
            message: error.message || "Server error"
        });
    }
});

/* =========================================================
   GET ALL APPOINTMENTS
========================================================= */

router.get("/", async (req, res) => {
    try {

        const sql = `
      SELECT *
      FROM appointments
      ORDER BY created_at DESC
    `;

        const [rows] = await db.execute(sql);

        res.status(200).json({
            success: true,
            appointments: rows
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

/* =========================================================
   GET SINGLE APPOINTMENT
========================================================= */

router.get("/:id", async (req, res) => {
    try {

        const { id } = req.params;

        const sql = `
      SELECT *
      FROM appointments
      WHERE id = ?
    `;

        const [rows] = await db.execute(sql, [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found"
            });
        }

        res.status(200).json({
            success: true,
            appointment: rows[0]
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

/* =========================================================
   UPDATE APPOINTMENT
========================================================= */

router.put("/:id", async (req, res) => {
    try {

        const { id } = req.params;

        const {
            nric_fin_number,
            name,
            age,
            gender,
            nationality,
            email,
            phone,
            counselling_type,
            sub_counselling_types,
            description,
            remarks
        } = req.body;

        const sql = `
      UPDATE appointments
      SET
        nric_fin_number = ?,
        name = ?,
        age = ?,
        gender = ?,
        nationality = ?,
        email = ?,
        phone = ?,
        counselling_type = ?,
        sub_counselling_types = ?,
        description = ?,
        remarks = ?
      WHERE id = ?
    `;

        const values = [
            nric_fin_number,
            name,
            age,
            gender,
            nationality,
            email,
            phone,
            counselling_type,
            sub_counselling_types ?? null,
            description,
            remarks,
            id
        ];

        await db.execute(sql, values);

        res.status(200).json({
            success: true,
            message: "Appointment updated successfully"
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

/* =========================================================
   DELETE APPOINTMENT
========================================================= */

router.delete("/:id", async (req, res) => {
    try {

        const { id } = req.params;

        const sql = `
      DELETE FROM appointments
      WHERE id = ?
    `;

        await db.execute(sql, [id]);

        res.status(200).json({
            success: true,
            message: "Appointment deleted successfully"
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

export default router;