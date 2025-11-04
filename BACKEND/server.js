import express from "express";
import cors from "cors";
import pkg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Cargar variables de entorno
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pkg;
const app = express();
const PORT = process.env.PORT || 5500;

console.log("\n🔧 Configuración Inicial:");
console.log("   Directorio actual:", process.cwd());
console.log("   NODE_ENV:", process.env.NODE_ENV || "development");
console.log("   PORT:", PORT);

// ✅ CORS CONFIGURADO PARA GABOMUNOZ10
const allowedOrigins = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'https://gabomunoz10.github.io',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (como Postman, Thunder Client)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('github.io')) {
      callback(null, true);
    } else {
      callback(null, true); // En producción considera restringir esto
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Servir archivos estáticos desde la carpeta public
const publicPath = path.join(process.cwd(), '..', 'public');
console.log("   Carpeta public:", publicPath);
app.use(express.static(publicPath));

// ✅ CONEXIÓN A BASE DE DATOS - Funciona local Y en Railway
const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_PUBLIC_URL;

let dbConfig;

if (isProduction) {
  // Railway PostgreSQL
  dbConfig = {
    connectionString: process.env.DATABASE_PUBLIC_URL,
    ssl: {
      rejectUnauthorized: false
    }
  };
  console.log("   Base de datos: Railway PostgreSQL (Producción)");
} else {
  // PostgreSQL Local
  dbConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'ogkash',
    password: process.env.DB_PASSWORD || 'tu_password_local',
    port: process.env.DB_PORT || 5432
  };
  console.log("   Base de datos: PostgreSQL Local (Desarrollo)");
}

const pool = new Pool(dbConfig);
console.log("");

// Verificar conexión
pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ Error conectar PostgreSQL:");
    console.error("   ", err.message);
    process.exit(1); // Terminar si no hay DB
  } else {
    console.log("✅ Conectado a PostgreSQL");
    console.log("   Host:", client.host);
    console.log("   Database:", client.database);
    console.log("");
    release();
  }
});

// Crear tablas
async function crearTablas() {
  const client = await pool.connect();
  try {
    console.log("🔧 Verificando tablas...\n");
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id_usuario SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        correo VARCHAR(150) UNIQUE NOT NULL,
        contrasena VARCHAR(255) NOT NULL,
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS categorias (
        id_categoria SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ingreso', 'gasto')),
        UNIQUE(nombre, tipo)
      )
    `);

    await client.query(`
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

    await client.query(`
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

    await client.query(`
      CREATE TABLE IF NOT EXISTS presupuestos (
        id_presupuesto SERIAL PRIMARY KEY,
        id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
        descripcion TEXT,
        monto_limite DECIMAL(12, 2) NOT NULL CHECK (monto_limite > 0),
        categoria VARCHAR(100) NOT NULL,
        periodo_inicio DATE NOT NULL,
        periodo_fin DATE NOT NULL,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CHECK (periodo_fin > periodo_inicio)
      )
    `);

    // ✅ NUEVA TABLA: Descripciones
    await client.query(`
      CREATE TABLE IF NOT EXISTS descripciones (
        id_descripcion SERIAL PRIMARY KEY,
        id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
        tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ingreso', 'gasto')),
        texto TEXT NOT NULL,
        categoria VARCHAR(100),
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
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

    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' ORDER BY table_name
    `);

    console.log(`✅ Tablas verificadas: ${tables.rows.length}`);
    tables.rows.forEach(r => console.log("   -", r.table_name));
    console.log("");
    
  } catch (err) {
    console.error("⚠️ Error crear tablas:", err.message);
  } finally {
    client.release();
  }
}

crearTablas();

// ====== RUTAS API ======

app.get("/", (req, res) => {
  res.json({ 
    status: "online",
    message: "OG Kash API funcionando correctamente",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "online",
    message: "OG Kash API funcionando",
    timestamp: new Date().toISOString()
  });
});

// USUARIOS
app.post("/api/usuarios", async (req, res) => {
  const { nombre, correo, contrasena } = req.body;
  
  if (!nombre || !correo || !contrasena) {
    return res.status(400).json({ error: "Campos requeridos faltantes" });
  }
  
  try {
    const result = await pool.query(
      "INSERT INTO usuarios (nombre, correo, contrasena) VALUES ($1, $2, $3) RETURNING id_usuario, nombre, correo",
      [nombre.trim(), correo.trim(), contrasena]
    );
    
    console.log("✅ Usuario registrado:", result.rows[0].nombre);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error registro:", error.message);
    if (error.code === '23505') {
      return res.status(400).json({ error: "Usuario ya existe" });
    }
    res.status(500).json({ error: "Error al registrar" });
  }
});

app.post("/api/login", async (req, res) => {
  const { correo, contrasena } = req.body;
  
  if (!correo || !contrasena) {
    return res.status(400).json({ error: "Correo y contraseña requeridos" });
  }
  
  try {
    const result = await pool.query(
      "SELECT id_usuario, nombre, correo FROM usuarios WHERE correo = $1 AND contrasena = $2",
      [correo.trim(), contrasena]
    );
    
    if (result.rows.length > 0) {
      console.log("✅ Login:", result.rows[0].nombre);
      res.json({ usuario: result.rows[0] });
    } else {
      res.status(401).json({ error: "Credenciales incorrectas" });
    }
  } catch (err) {
    console.error("❌ Error login:", err.message);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// INGRESOS
app.post("/api/ingresos", async (req, res) => {
  const { id_usuario, monto, descripcion, fecha, categoria, metodo_pago } = req.body;
  
  if (!id_usuario || !monto || !descripcion || !fecha || !categoria || !metodo_pago) {
    return res.status(400).json({ error: "Campos requeridos faltantes" });
  }
  
  try {
    const result = await pool.query(
      "INSERT INTO ingresos (id_usuario, monto, descripcion, fecha_ingreso, categoria, metodo_pago) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [id_usuario, monto, descripcion, fecha, categoria, metodo_pago]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error ingreso:", err.message);
    res.status(500).json({ error: "Error al guardar" });
  }
});

app.get("/api/ingresos/:id_usuario", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM ingresos WHERE id_usuario = $1 ORDER BY fecha_ingreso DESC",
      [req.params.id_usuario]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al obtener ingresos:", err.message);
    res.status(500).json({ error: "Error al obtener ingresos" });
  }
});

app.delete("/api/ingresos/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM ingresos WHERE id_ingreso = $1", [req.params.id]);
    res.json({ message: "Eliminado" });
  } catch (err) {
    console.error("❌ Error al eliminar ingreso:", err.message);
    res.status(500).json({ error: "Error al eliminar" });
  }
});

// GASTOS
app.post("/api/gastos", async (req, res) => {
  const { id_usuario, monto, descripcion, fecha, categoria, metodo_pago } = req.body;
  
  if (!id_usuario || !monto || !descripcion || !fecha || !categoria || !metodo_pago) {
    return res.status(400).json({ error: "Campos requeridos faltantes" });
  }
  
  try {
    const result = await pool.query(
      "INSERT INTO gastos (id_usuario, monto, descripcion, fecha_gasto, categoria, metodo_pago) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [id_usuario, monto, descripcion, fecha, categoria, metodo_pago]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error gasto:", err.message);
    res.status(500).json({ error: "Error al guardar" });
  }
});

app.get("/api/gastos/:id_usuario", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM gastos WHERE id_usuario = $1 ORDER BY fecha_gasto DESC",
      [req.params.id_usuario]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al obtener gastos:", err.message);
    res.status(500).json({ error: "Error al obtener gastos" });
  }
});

app.delete("/api/gastos/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM gastos WHERE id_gasto = $1", [req.params.id]);
    res.json({ message: "Eliminado" });
  } catch (err) {
    console.error("❌ Error al eliminar gasto:", err.message);
    res.status(500).json({ error: "Error al eliminar" });
  }
});

// CATEGORÍAS
app.get("/api/categorias/:tipo", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM categorias WHERE tipo = $1 ORDER BY nombre",
      [req.params.tipo]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al obtener categorías:", err.message);
    res.status(500).json({ error: "Error al obtener categorías" });
  }
});

// PRESUPUESTOS
app.post("/api/presupuestos", async (req, res) => {
  const { id_usuario, categoria, monto_limite, periodo_inicio, periodo_fin } = req.body;
  
  if (!id_usuario || !categoria || !monto_limite || !periodo_inicio || !periodo_fin) {
    return res.status(400).json({ error: "Campos requeridos faltantes" });
  }
  
  try {
    const result = await pool.query(
      "INSERT INTO presupuestos (id_usuario, descripcion, monto_limite, categoria, periodo_inicio, periodo_fin) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [id_usuario, `Presupuesto ${categoria}`, parseFloat(monto_limite), categoria, periodo_inicio, periodo_fin]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error presupuesto:", err.message);
    res.status(500).json({ error: "Error al crear presupuesto" });
  }
});

app.get("/api/presupuestos/:id_usuario", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
         p.id_presupuesto,
         p.id_usuario,
         p.descripcion,
         p.monto_limite,
         p.categoria,
         p.periodo_inicio,
         p.periodo_fin,
         p.fecha_creacion,
         COALESCE(SUM(g.monto), 0) as gastado
       FROM presupuestos p
       LEFT JOIN gastos g ON g.id_usuario = p.id_usuario 
         AND g.categoria = p.categoria
         AND g.fecha_gasto BETWEEN p.periodo_inicio AND p.periodo_fin
       WHERE p.id_usuario = $1
       GROUP BY p.id_presupuesto, p.id_usuario, p.descripcion, p.monto_limite, 
                p.categoria, p.periodo_inicio, p.periodo_fin, p.fecha_creacion
       ORDER BY p.periodo_inicio DESC`,
      [req.params.id_usuario]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al obtener presupuestos:", err.message);
    res.status(500).json({ error: "Error al obtener presupuestos" });
  }
});

app.delete("/api/presupuestos/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM presupuestos WHERE id_presupuesto = $1", [req.params.id]);
    res.json({ message: "Eliminado" });
  } catch (err) {
    console.error("❌ Error al eliminar presupuesto:", err.message);
    res.status(500).json({ error: "Error al eliminar" });
  }
});

// DESCRIPCIONES
app.post("/api/descripciones", async (req, res) => {
  const { id_usuario, tipo, texto, categoria } = req.body;
  
  if (!id_usuario || !tipo || !texto) {
    return res.status(400).json({ error: "Campos requeridos faltantes" });
  }
  
  try {
    const result = await pool.query(
      "INSERT INTO descripciones (id_usuario, tipo, texto, categoria) VALUES ($1, $2, $3, $4) RETURNING *",
      [id_usuario, tipo, texto, categoria]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error descripción:", err.message);
    res.status(500).json({ error: "Error al guardar descripción" });
  }
});

app.get("/api/descripciones/:id_usuario", async (req, res) => {
  try {
    const tipo = req.query.tipo || 'gasto';
    const result = await pool.query(
      "SELECT * FROM descripciones WHERE id_usuario = $1 AND tipo = $2 ORDER BY fecha_creacion DESC",
      [req.params.id_usuario, tipo]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al obtener descripciones:", err.message);
    res.status(500).json({ error: "Error al obtener descripciones" });
  }
});

app.delete("/api/descripciones/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM descripciones WHERE id_descripcion = $1", [req.params.id]);
    res.json({ message: "Eliminado" });
  } catch (err) {
    console.error("❌ Error al eliminar descripción:", err.message);
    res.status(500).json({ error: "Error al eliminar" });
  }
});

// BALANCE
app.get("/api/balance/:id_usuario", async (req, res) => {
  try {
    const ingresos = await pool.query(
      "SELECT COALESCE(SUM(monto), 0) as total FROM ingresos WHERE id_usuario = $1",
      [req.params.id_usuario]
    );
    const gastos = await pool.query(
      "SELECT COALESCE(SUM(monto), 0) as total FROM gastos WHERE id_usuario = $1",
      [req.params.id_usuario]
    );
    
    const balance = parseFloat(ingresos.rows[0].total) - parseFloat(gastos.rows[0].total);
    
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

// CATCH-ALL - Servir index.html para todas las rutas no API
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(publicPath, "index.html"));
  } else {
    res.status(404).json({ error: "API endpoint not found" });
  }
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error("💥 Error no manejado:", err);
  res.status(500).json({ 
    error: "Error interno del servidor",
    message: err.message 
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("=".repeat(50));
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
  console.log(`🌐 http://localhost:${PORT}`);
  if (process.env.RAILWAY_STATIC_URL) {
    console.log(`🚀 Railway URL: https://${process.env.RAILWAY_STATIC_URL}`);
  }
  console.log("=".repeat(50) + "\n");
});