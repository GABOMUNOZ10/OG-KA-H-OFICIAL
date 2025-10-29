import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: "postgresql://postgres:ErMgAfoTewGrcfRebkisKqLWvloIyniA@shortline.proxy.rlwy.net:37919/railway",
  ssl: {
    rejectUnauthorized: false
  }
});

console.log("🔍 Probando conexión a PostgreSQL...\n");

async function testPresupuestos() {
  try {
    // 1. Probar conexión
    console.log("1️⃣ Probando conexión...");
    const testConn = await pool.query("SELECT NOW()");
    console.log("✅ Conexión exitosa:", testConn.rows[0].now);
    console.log("");

    // 2. Verificar que existe la tabla presupuestos
    console.log("2️⃣ Verificando tabla presupuestos...");
    const tableCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'presupuestos'
      ORDER BY ordinal_position
    `);
    console.log("✅ Columnas de presupuestos:");
    tableCheck.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    console.log("");

    // 3. Verificar usuarios
    console.log("3️⃣ Verificando usuarios...");
    const usuarios = await pool.query("SELECT id_usuario, nombre, correo FROM usuarios");
    console.log(`✅ Usuarios encontrados: ${usuarios.rows.length}`);
    usuarios.rows.forEach(u => {
      console.log(`   - ID: ${u.id_usuario}, Nombre: ${u.nombre}, Correo: ${u.correo}`);
    });
    console.log("");

    // 4. Probar la consulta problemática (ajusta el ID)
    const userId = usuarios.rows[0]?.id_usuario || 1;
    console.log(`4️⃣ Probando consulta de presupuestos para usuario ID: ${userId}...`);
    
    const presupuestos = await pool.query(`
      SELECT 
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
      ORDER BY p.periodo_inicio DESC
    `, [userId]);

    console.log(`✅ Presupuestos encontrados: ${presupuestos.rows.length}`);
    if (presupuestos.rows.length > 0) {
      console.log("📋 Presupuestos:");
      presupuestos.rows.forEach(p => {
        console.log(`   - ${p.categoria}: $${p.monto_limite} (Gastado: $${p.gastado})`);
      });
    } else {
      console.log("ℹ️ No hay presupuestos para este usuario");
    }
    console.log("");

    console.log("✅ TODAS LAS PRUEBAS PASARON CORRECTAMENTE");
    
  } catch (error) {
    console.error("❌ ERROR:", error.message);
    console.error("📋 Stack:", error.stack);
  } finally {
    await pool.end();
    process.exit();
  }
}

testPresupuestos();