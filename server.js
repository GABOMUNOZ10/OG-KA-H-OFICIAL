import express from "express";
import cors from "cors";
import pkg from "pg";

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

// --- Configuración del servidor ---
const app = express();
const PORT = 3000;

// --- Middleware ---
app.use(cors({
  origin: "http://localhost:5500", // tu Live Server
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());

// --- Conexión a PostgreSQL ---
const pool = new Pool({
  user: "postgres",           // 👈 tu usuario de PostgreSQL
  host: "localhost",
  database: "OG_KA$H",         // 👈 tu base de datos (cambia el nombre si es distinto)
  password: "123456789*",  // 👈 pon tu contraseña real aquí
  port: 5432,
});

// --- Ruta raíz (de prueba) ---
app.get("/", (req, res) => {
  res.send(" Servidor funcionando correctamente en /");
});

// --- Ruta para registrar usuario ---
app.post("/api/usuarios", async (req, res) => {
  try {
    const { nombre, correo, contrasena } = req.body;

    if (!nombre || !correo || !contrasena) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    const query = `
      INSERT INTO usuarios (nombre, correo, contrasena)
      VALUES ($1, $2, $3)
      RETURNING id, nombre, correo;
    `;
    const values = [nombre, correo, contrasena];
    const result = await pool.query(query, values);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error en /api/usuarios:", err);
    res.status(500).json({ error: "Error al registrar usuario" });
  }
});

// --- Iniciar servidor ---
app.listen(PORT, () => {
  console.log(` Servidor corriendo en http://localhost:${PORT}`);
});

