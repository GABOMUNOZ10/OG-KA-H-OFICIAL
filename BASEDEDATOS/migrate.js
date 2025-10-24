import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

// USAR EL HOST PÚBLICO DE RAILWAY
const pool = new Pool({
  user: "postgres",
  host: "postgres-tgex.railway.app",
  database: "railway",
  password: "ErMgAfoTewGrcfRebkisKqLWvIoIyniA",
  port: 37919,
  ssl: {
    rejectUnauthorized: false
  }
});

async function migrateDatabase() {
  console.log("🚀 Iniciando migración de base de datos...");
  console.log("📡 Conectando a: postgres-tgex.railway.app:37919");
  
  let client;
  
  try {
    client = await pool.connect();
    console.log("✅ Conectado a PostgreSQL en Railway");

    console.log("\n📋 Creando tabla usuarios...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id_usuario SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        correo VARCHAR(150) UNIQUE NOT NULL,
        contrasena VARCHAR(255) NOT NULL,
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Tabla usuarios creada");

    console.log("\n📋 Creando tabla categorias...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS categorias (
        id_categoria SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ingreso', 'gasto')),
        UNIQUE(nombre, tipo)
      )
    `);
    console.log("✅ Tabla categorias creada");

    console.log("\n📋 Creando tabla ingresos...");
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
    console.log("✅ Tabla ingresos creada");

    console.log("\n📋 Creando tabla gastos...");
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
    console.log("✅ Tabla gastos creada");

    console.log("\n📋 Creando tabla presupuestos...");
    await client.query(`
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
    console.log("✅ Tabla presupuestos creada");

    console.log("\n📋 Insertando categorías de ingresos...");
    await client.query(`
      INSERT INTO categorias (nombre, tipo) VALUES
        ('Salario', 'ingreso'),
        ('Freelance', 'ingreso'),
        ('Negocio', 'ingreso'),
        ('Inversiones', 'ingreso'),
        ('Ventas', 'ingreso'),
        ('Bonos', 'ingreso'),
        ('Regalos', 'ingreso'),
        ('Alquiler', 'ingreso'),
        ('Intereses', 'ingreso'),
        ('Otros Ingresos', 'ingreso')
      ON CONFLICT (nombre, tipo) DO NOTHING
    `);
    console.log("✅ Categorías de ingresos insertadas");

    console.log("\n📋 Insertando categorías de gastos...");
    await client.query(`
      INSERT INTO categorias (nombre, tipo) VALUES
        ('Alimentación', 'gasto'),
        ('Transporte', 'gasto'),
        ('Vivienda', 'gasto'),
        ('Servicios', 'gasto'),
        ('Salud', 'gasto'),
        ('Educación', 'gasto'),
        ('Entretenimiento', 'gasto'),
        ('Ropa', 'gasto'),
        ('Tecnología', 'gasto'),
        ('Mascotas', 'gasto'),
        ('Gimnasio', 'gasto'),
        ('Restaurantes', 'gasto'),
        ('Viajes', 'gasto'),
        ('Regalos', 'gasto'),
        ('Seguros', 'gasto'),
        ('Impuestos', 'gasto'),
        ('Otros Gastos', 'gasto')
      ON CONFLICT (nombre, tipo) DO NOTHING
    `);
    console.log("✅ Categorías de gastos insertadas");

    console.log("\n📋 Creando índices...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_ingresos_usuario ON ingresos(id_usuario);
      CREATE INDEX IF NOT EXISTS idx_ingresos_fecha ON ingresos(fecha_ingreso);
      CREATE INDEX IF NOT EXISTS idx_gastos_usuario ON gastos(id_usuario);
      CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON gastos(fecha_gasto);
      CREATE INDEX IF NOT EXISTS idx_presupuestos_usuario ON presupuestos(id_usuario);
    `);
    console.log("✅ Índices creados");

    console.log("\n📊 Verificando tablas creadas...");
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log("\n✅ Tablas en Railway:");
    result.rows.forEach(row => {
      console.log("   -", row.table_name);
    });

    const catCount = await client.query(`
      SELECT tipo, COUNT(*) as cantidad
      FROM categorias
      GROUP BY tipo
      ORDER BY tipo
    `);
    
    console.log("\n✅ Categorías insertadas:");
    catCount.rows.forEach(row => {
      console.log(`   - ${row.tipo}: ${row.cantidad} categorías`);
    });

    console.log("\n🎉 ¡Migración completada exitosamente!");
    
  } catch (error) {
    console.error("\n❌ Error durante la migración:");
    console.error("Mensaje:", error.message);
    console.error("\n💡 Verifica que:");
    console.error("   1. La contraseña sea correcta");
    console.error("   2. El dominio público esté activo en Railway");
    console.error("   3. Tengas conexión a internet");
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

migrateDatabase();