import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: "postgresql://postgres:ErMgAfoTewGrcfRebkisKqLWvloIyniA@shortline.proxy.rlwy.net:37919/railway",
  ssl: {
    rejectUnauthorized: false
  }
});

async function renameColumn() {
  try {
    console.log("🔧 Renombrando columna de id_ahorro a id_presupuesto...\n");

    // 1. Ver estructura actual
    console.log("1️⃣ Estructura actual:");
    const beforeColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'presupuestos'
      ORDER BY ordinal_position
    `);
    
    beforeColumns.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    console.log("");

    // 2. Renombrar columna
    console.log("2️⃣ Renombrando id_ahorro → id_presupuesto...");
    await pool.query(`ALTER TABLE presupuestos RENAME COLUMN id_ahorro TO id_presupuesto`);
    console.log("✅ Columna renombrada");
    console.log("");

    // 3. Eliminar columnas que no necesitas (opcional)
    console.log("3️⃣ Eliminando columnas innecesarias...");
    try {
      await pool.query(`ALTER TABLE presupuestos DROP COLUMN IF EXISTS monto_objetivo`);
      await pool.query(`ALTER TABLE presupuestos DROP COLUMN IF EXISTS monto_actual`);
      await pool.query(`ALTER TABLE presupuestos DROP COLUMN IF EXISTS bloqueado`);
      console.log("✅ Columnas eliminadas");
    } catch (err) {
      console.log("⚠️ No se pudieron eliminar algunas columnas:", err.message);
    }
    console.log("");

    // 4. Agregar columna monto_limite si no existe
    console.log("4️⃣ Agregando columna monto_limite...");
    try {
      await pool.query(`
        ALTER TABLE presupuestos 
        ADD COLUMN IF NOT EXISTS monto_limite DECIMAL(12, 2) DEFAULT 0 CHECK (monto_limite > 0)
      `);
      console.log("✅ Columna monto_limite agregada");
    } catch (err) {
      console.log("⚠️", err.message);
    }
    console.log("");

    // 5. Verificar nueva estructura
    console.log("5️⃣ Nueva estructura:");
    const afterColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'presupuestos'
      ORDER BY ordinal_position
    `);
    
    afterColumns.rows.forEach(col => {
      console.log(`   ✅ ${col.column_name} (${col.data_type})`);
    });
    console.log("");

    console.log("🎉 ¡TABLA ACTUALIZADA CORRECTAMENTE!");
    console.log("");
    console.log("📋 Próximos pasos:");
    console.log("   1. Reinicia tu servidor: npm start");
    console.log("   2. Prueba crear presupuestos en la app");

  } catch (error) {
    console.error("❌ ERROR:", error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
    process.exit();
  }
}

renameColumn();