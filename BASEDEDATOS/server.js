import express from "express";
import cors from "cors";
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;
const app = express();
const PORT = process.env.PORT || 5500;

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ Error al conectar a PostgreSQL:", err.stack);
  } else {
    console.log("✅ Conectado a PostgreSQL");
    release();
  }
});

// ====== CREAR TABLAS AUTOMÁTICAMENTE ======
async function crearTablas() {
  try {
    console.log("🔧 Verificando/creando tablas...");
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id_usuario SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        correo VARCHAR(150) UNIQUE NOT NULL,
        contrasena VARCHAR(255) NOT NULL,
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS categorias (
        id_categoria SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ingreso', 'gasto')),
        UNIQUE(nombre, tipo)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ingresos (
        id_ingreso SERIAL PRIMARY KEY,
        id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
        monto DECIMAL(12, 2) NOT NULL CHECK (monto > 0),
        descripcion TEXT NOT NULL,
        fecha_ingreso DATE NOT NULL,
        categoria VARCHAR(100),
        metodo_pago VARCHAR(50),
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS gastos (
        id_gasto SERIAL PRIMARY KEY,
        id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
        monto DECIMAL(12, 2) NOT NULL CHECK (monto > 0),
        descripcion TEXT NOT NULL,
        fecha_gasto DATE NOT NULL,
        categoria VARCHAR(100),
        metodo_pago VARCHAR(50),
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS presupuestos (
        id_ahorro SERIAL PRIMARY KEY,
        id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
        descripcion TEXT,
        monto_objetivo DECIMAL(12, 2) NOT NULL CHECK (monto_objetivo > 0),
        monto_actual DECIMAL(12, 2) DEFAULT 0,
        bloqueado BOOLEAN DEFAULT FALSE,
        categoria VARCHAR(100) NOT NULL,
        periodo_inicio DATE NOT NULL,
        periodo_fin DATE NOT NULL,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CHECK (periodo_fin > periodo_inicio)
      )
    `);

    await pool.query(`
      INSERT INTO categorias (nombre, tipo) VALUES
        ('Salario', 'ingreso'), ('Freelance', 'ingreso'), ('Negocio', 'ingreso'),
        ('Inversiones', 'ingreso'), ('Ventas', 'ingreso'), ('Bonos', 'ingreso'),
        ('Regalos', 'ingreso'), ('Alquiler', 'ingreso'), ('Otros Ingresos', 'ingreso'),
        ('Alimentación', 'gasto'), ('Transporte', 'gasto'), ('Vivienda', 'gasto'),
        ('Servicios', 'gasto'), ('Salud', 'gasto'), ('Educación', 'gasto'),
        ('Entretenimiento', 'gasto'), ('Ropa', 'gasto'), ('Tecnología', 'gasto'),
        ('Restaurantes', 'gasto'), ('Otros Gastos', 'gasto')
      ON CONFLICT (nombre, tipo) DO NOTHING
    `);

    console.log("✅✅✅ Tablas creadas/verificadas exitosamente ✅✅✅");
  } catch (err) {
    console.log("⚠️ Error al crear tablas:", err.message);
  }
}

crearTablas();
// ====== FIN CÓDIGO AUTOMÁTICO ======

// --- USUARIOS ---
app.post("/api/usuarios", async (req, res) => {
  try {
    console.log("📝 Intentando registrar usuario:", req.body);
    const { nombre, correo, contrasena } = req.body;
    
    if (!nombre || !correo || !contrasena) {
      return res.status(400).json({ error: "Campos requeridos faltantes" });
    }
    
    const result = await pool.query(
      "INSERT INTO usuarios (nombre, correo, contrasena) VALUES ($1, $2, $3) RETURNING *",
      [nombre, correo, contrasena]
    );
    console.log("✅ Usuario registrado:", result.rows[0].nombre);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error al registrar usuario:", error.message);
    res.status(500).json({ error: "Error al registrar usuario", details: error.message });
  }
});

app.post("/api/login", async (req, res) => {
  const { correo, contrasena } = req.body;
  console.log("🔐 Intento de login:", correo);
  try {
    const result = await pool.query(
      "SELECT id_usuario, nombre, correo FROM usuarios WHERE correo = $1 AND contrasena = $2",
      [correo, contrasena]
    );
    if (result.rows.length > 0) {
      console.log("✅ Login exitoso:", result.rows[0].nombre);
      res.json({ usuario: result.rows[0] });
    } else {
      console.warn("❌ Credenciales incorrectas para:", correo);
      res.status(401).json({ error: "Credenciales incorrectas" });
    }
  } catch (err) {
    console.error("❌ Error en login:", err.message);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// --- INGRESOS ---
app.post("/api/ingresos", async (req, res) => {
  console.log("💰 Intentando guardar ingreso:", req.body);
  const { id_usuario, monto, descripcion, fecha, categoria, metodo_pago } = req.body;
  
  if (!id_usuario || !monto || !descripcion || !fecha || !categoria || !metodo_pago) {
    console.error("❌ Datos incompletos:", req.body);
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }
  
  try {
    const result = await pool.query(
      "INSERT INTO ingresos (id_usuario, monto, descripcion, fecha_ingreso, categoria, metodo_pago) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [id_usuario, monto, descripcion, fecha, categoria, metodo_pago]
    );
    console.log("✅ Ingreso guardado exitosamente:", result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error al guardar ingreso:", err.message);
    res.status(500).json({ error: "Error al guardar ingreso", details: err.message });
  }
});

app.get("/api/ingresos/:id_usuario", async (req, res) => {
  const { id_usuario } = req.params;
  console.log("📥 Obteniendo ingresos para usuario:", id_usuario);
  try {
    const result = await pool.query(
      "SELECT * FROM ingresos WHERE id_usuario = $1 ORDER BY fecha_ingreso DESC",
      [id_usuario]
    );
    console.log(`✅ ${result.rows.length} ingresos encontrados`);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al obtener ingresos:", err.message);
    res.status(500).json({ error: "Error al obtener ingresos" });
  }
});

app.delete("/api/ingresos/:id", async (req, res) => {
  const { id } = req.params;
  console.log("🗑️ Eliminando ingreso:", id);
  try {
    await pool.query("DELETE FROM ingresos WHERE id_ingreso = $1", [id]);
    console.log("✅ Ingreso eliminado");
    res.json({ message: "Ingreso eliminado exitosamente" });
  } catch (err) {
    console.error("❌ Error al eliminar ingreso:", err.message);
    res.status(500).json({ error: "Error al eliminar ingreso" });
  }
});

// --- GASTOS ---
app.post("/api/gastos", async (req, res) => {
  console.log("💸 Intentando guardar gasto:", req.body);
  const { id_usuario, monto, descripcion, fecha, categoria, metodo_pago } = req.body;
  
  if (!id_usuario || !monto || !descripcion || !fecha || !categoria || !metodo_pago) {
    console.error("❌ Datos incompletos:", req.body);
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }
  
  try {
    const result = await pool.query(
      "INSERT INTO gastos (id_usuario, monto, descripcion, fecha_gasto, categoria, metodo_pago) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [id_usuario, monto, descripcion, fecha, categoria, metodo_pago]
    );
    console.log("✅ Gasto guardado exitosamente:", result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error al guardar gasto:", err.message);
    res.status(500).json({ error: "Error al guardar gasto", details: err.message });
  }
});

app.get("/api/gastos/:id_usuario", async (req, res) => {
  const { id_usuario } = req.params;
  console.log("📥 Obteniendo gastos para usuario:", id_usuario);
  try {
    const result = await pool.query(
      "SELECT * FROM gastos WHERE id_usuario = $1 ORDER BY fecha_gasto DESC",
      [id_usuario]
    );
    console.log(`✅ ${result.rows.length} gastos encontrados`);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al obtener gastos:", err.message);
    res.status(500).json({ error: "Error al obtener gastos" });
  }
});

app.delete("/api/gastos/:id", async (req, res) => {
  const { id } = req.params;
  console.log("🗑️ Eliminando gasto:", id);
  try {
    await pool.query("DELETE FROM gastos WHERE id_gasto = $1", [id]);
    console.log("✅ Gasto eliminado");
    res.json({ message: "Gasto eliminado exitosamente" });
  } catch (err) {
    console.error("❌ Error al eliminar gasto:", err.message);
    res.status(500).json({ error: "Error al eliminar gasto" });
  }
});

// --- CATEGORÍAS ---
app.get("/api/categorias/:tipo", async (req, res) => {
  const { tipo } = req.params;
  console.log("📋 Obteniendo categorías tipo:", tipo);
  try {
    const result = await pool.query(
      "SELECT * FROM categorias WHERE tipo = $1 ORDER BY nombre",
      [tipo]
    );
    console.log(`✅ ${result.rows.length} categorías encontradas`);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al obtener categorías:", err.message);
    res.status(500).json({ error: "Error al obtener categorías" });
  }
});

// --- PRESUPUESTOS/METAS DE AHORRO ---
app.post("/api/presupuestos", async (req, res) => {
  console.log("💰 Intentando crear presupuesto:", req.body);
  const { id_usuario, categoria, monto_limite, periodo_inicio, periodo_fin } = req.body;
  
  if (id_usuario === undefined || categoria === undefined || monto_limite === undefined ||
      periodo_inicio === undefined || periodo_fin === undefined) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }
  
  if (parseFloat(monto_limite) <= 0) {
    return res.status(400).json({ error: "El monto debe ser mayor a 0" });
  }
  
  const inicio = new Date(periodo_inicio);
  const fin = new Date(periodo_fin);
  if (inicio >= fin) {
    return res.status(400).json({ error: "La fecha de inicio debe ser anterior a la fecha de fin" });
  }
  
  try {
    const result = await pool.query(
      "INSERT INTO presupuestos (id_usuario, descripcion, monto_objetivo, monto_actual, bloqueado, categoria, periodo_inicio, periodo_fin) VALUES ($1, $2, $3, $4, false, $5, $6, $7) RETURNING *",
      [id_usuario, `Presupuesto ${categoria}`, parseFloat(monto_limite), 0, categoria, periodo_inicio, periodo_fin]
    );
    console.log("✅ Presupuesto creado exitosamente:", result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error al crear presupuesto:", err.message);
    res.status(500).json({ error: "Error al crear presupuesto", details: err.message });
  }
});

app.get("/api/presupuestos/:id_usuario", async (req, res) => {
  const { id_usuario } = req.params;
  console.log("📥 Obteniendo presupuestos para usuario:", id_usuario);
  try {
    const result = await pool.query(
      `SELECT p.*, 
        COALESCE(SUM(g.monto), 0) as gastos_actuales
       FROM presupuestos p
       LEFT JOIN gastos g ON 
         g.id_usuario = p.id_usuario 
         AND g.categoria = p.categoria
         AND g.fecha_gasto BETWEEN p.periodo_inicio AND p.periodo_fin
       WHERE p.id_usuario = $1
       GROUP BY p.id_ahorro
       ORDER BY p.periodo_inicio DESC`,
      [id_usuario]
    );
    console.log(`✅ ${result.rows.length} presupuestos encontrados`);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al obtener presupuestos:", err.message);
    res.status(500).json({ error: "Error al obtener presupuestos", details: err.message });
  }
});

app.delete("/api/presupuestos/:id", async (req, res) => {
  const { id } = req.params;
  console.log("🗑️ Eliminando meta de ahorro:", id);
  try {
    await pool.query("DELETE FROM presupuestos WHERE id_ahorro = $1", [id]);
    console.log("✅ Meta eliminada");
    res.json({ message: "Meta de ahorro eliminada exitosamente" });
  } catch (err) {
    console.error("❌ Error al eliminar meta:", err.message);
    res.status(500).json({ error: "Error al eliminar meta de ahorro" });
  }
});

// --- BALANCE ---
app.get("/api/balance/:id_usuario", async (req, res) => {
  const { id_usuario } = req.params;
  console.log("💵 Calculando balance para usuario:", id_usuario);
  try {
    const ingresos = await pool.query(
      "SELECT COALESCE(SUM(monto), 0) as total FROM ingresos WHERE id_usuario = $1",
      [id_usuario]
    );
    const gastos = await pool.query(
      "SELECT COALESCE(SUM(monto), 0) as total FROM gastos WHERE id_usuario = $1",
      [id_usuario]
    );
    
    const balance = parseFloat(ingresos.rows[0].total) - parseFloat(gastos.rows[0].total);
    
    console.log(`✅ Balance calculado - Ingresos: ${ingresos.rows[0].total}, Gastos: ${gastos.rows[0].total}, Balance: ${balance}`);
    
    res.json({
      ingresos: parseFloat(ingresos.rows[0].total),
      gastos: parseFloat(gastos.rows[0].total),
      balance: balance
    });
  } catch (err) {
    console.error("❌ Error al calcular balance:", err.message);
    res.status(500).json({ error: "Error al calcular balance" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📡 Endpoints disponibles:`);
  console.log(`   - POST /api/usuarios`);
  console.log(`   - POST /api/login`);
  console.log(`   - POST /api/ingresos`);
  console.log(`   - GET  /api/ingresos/:id_usuario`);
  console.log(`   - POST /api/gastos`);
  console.log(`   - GET  /api/gastos/:id_usuario`);
  console.log(`   - POST /api/presupuestos`);
  console.log(`   - GET  /api/balance/:id_usuario`);
});