// === CONFIGURACIÓN ===
const API_URL = process.env.API_URL || 'http://localhost:5500';

// === REFERENCIAS DEL DOM ===
const screens = {
  auth: document.getElementById('auth-screen'),
  dashboard: document.getElementById('dashboard-screen'),
  income: document.getElementById('income-screen'),
  expense: document.getElementById('expense-screen'),
  budget: document.getElementById('budget-screen')
};

const elements = {
  loginForm: document.getElementById('login-form'),
  signupForm: document.getElementById('signup-form'),
  currentUser: document.getElementById('current-user'),
  currentBalance: document.getElementById('current-balance'),
  totalIngresos: document.getElementById('total-ingresos'),
  totalGastos: document.getElementById('total-gastos'),
  transactionList: document.getElementById('transaction-list')
};

// === ESTADO GLOBAL ===
let user = null;
let userId = null;
let transactions = [];

console.log("✅ Script cargado correctamente");
console.log("🌐 API URL:", API_URL);

// === FUNCIONES AUXILIARES ===
function navigateTo(screen) {
  console.log("📍 Navegando a:", screen.id);
  Object.values(screens).forEach(s => s.classList.add('hidden'));
  screen.classList.remove('hidden');
}

function setTodayDate(inputId) {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById(inputId).value = today;
}

async function loadBalance() {
  try {
    const res = await fetch(`${API_URL}/api/balance/${userId}`);
    const data = await res.json();
    
    elements.currentBalance.textContent = `$${data.balance.toFixed(2)}`;
    elements.totalIngresos.textContent = `$${data.ingresos.toFixed(2)}`;
    elements.totalGastos.textContent = `$${data.gastos.toFixed(2)}`;
    
    console.log("💰 Balance cargado:", data);
  } catch (err) {
    console.error("Error al cargar balance:", err);
  }
}

async function loadTransactions() {
  try {
    const [ingresosRes, gastosRes] = await Promise.all([
      fetch(`${API_URL}/api/ingresos/${userId}`),
      fetch(`${API_URL}/api/gastos/${userId}`)
    ]);
    
    const ingresos = await ingresosRes.json();
    const gastos = await gastosRes.json();
    
    transactions = [
      ...ingresos.map(i => ({ ...i, type: 'income', id: i.id_ingreso, fecha: i.fecha_ingreso, monto: i.monto, descripcion: i.descripcion, categoria: i.categoria })),
      ...gastos.map(g => ({ ...g, type: 'expense', id: g.id_gasto, fecha: g.fecha_gasto, monto: g.monto, descripcion: g.descripcion, categoria: g.categoria }))
    ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    console.log("📋 Transacciones cargadas:", transactions.length);
    renderTransactions();
  } catch (err) {
    console.error("Error al cargar transacciones:", err);
  }
}

function renderTransactions() {
  if (transactions.length === 0) {
    elements.transactionList.innerHTML = '<li>No hay transacciones aún.</li>';
    return;
  }
  
  elements.transactionList.innerHTML = transactions.slice(0, 10).map(t => `
    <li>
      <div>
        <strong>${t.descripcion}</strong>
        <small>${t.categoria || 'Sin categoría'} - ${t.fecha}</small>
      </div>
      <span class="${t.type === 'expense' ? 'transaction-expense' : 'transaction-income'}">
        ${t.type === 'income' ? '+' : '-'}$${parseFloat(t.monto).toFixed(2)}
      </span>
    </li>
  `).join('');
}

async function loadCategories(tipo, selectId) {
  try {
    const res = await fetch(`${API_URL}/api/categorias/${tipo}`);
    const categorias = await res.json();
    const select = document.getElementById(selectId);
    
    select.innerHTML = '<option value="">Selecciona una categoría</option>' +
      categorias.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');
  } catch (err) {
    console.error("Error al cargar categorías:", err);
  }
}

// === AUTENTICACIÓN ===
document.getElementById('show-signup').addEventListener('click', () => {
  console.log("👆 Clic en Sign up");
  elements.loginForm.classList.add('hidden');
  elements.signupForm.classList.remove('hidden');
});

document.getElementById('show-login').addEventListener('click', () => {
  console.log("👆 Clic en Volver a Login");
  elements.signupForm.classList.add('hidden');
  elements.loginForm.classList.remove('hidden');
});

elements.signupForm.addEventListener("submit", async e => {
  e.preventDefault();
  console.log("📝 Registro iniciado");
  
  const nombre = document.getElementById("signup-user").value.trim();
  const contrasena = document.getElementById("signup-password").value.trim();
  const correo = `${nombre.toLowerCase()}@ogkash.com`;

  try {
    const r = await fetch(`${API_URL}/api/usuarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, correo, contrasena })
    });
    
    const data = await r.json();
    
    if (r.ok) {
      alert(`✅ ${data.nombre} registrado. Ya puedes iniciar sesión.`);
      elements.signupForm.reset();
      elements.signupForm.classList.add('hidden');
      elements.loginForm.classList.remove('hidden');
    } else {
      alert(`❌ ${data.error || 'Error al registrar'}`);
    }
  } catch (err) {
    console.error("Error de conexión:", err);
    alert("⚠️ Error al conectar con el servidor. Asegúrate de que el servidor esté corriendo en http://localhost:5500");
  }
});

elements.loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  console.log("🔐 Login iniciado");
  
  const nombre = document.getElementById("login-user").value.trim();
  const contrasena = document.getElementById("login-password").value.trim();
  const correo = `${nombre.toLowerCase()}@ogkash.com`;

  console.log("📧 Correo:", correo);

  try {
    const response = await fetch(`${API_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo, contrasena }),
    });

    const data = await response.json();
    console.log("📥 Respuesta del servidor:", data);

    if (response.ok && data.usuario) {
      console.log("✅ Login exitoso");
      user = data.usuario.nombre;
      userId = data.usuario.id_usuario;
      elements.currentUser.textContent = user;
      
      console.log("📊 Cargando datos...");
      await Promise.all([
        loadBalance(),
        loadTransactions(),
        loadCategories('ingreso', 'income-category'),
        loadCategories('gasto', 'expense-category'),
        loadCategories('gasto', 'budget-category')
      ]);
      
      console.log("🚀 Navegando al dashboard");
      elements.loginForm.reset();
      navigateTo(screens.dashboard);
    } else {
      console.warn("❌ Login fallido:", data);
      alert(`❌ ${data.error || "Credenciales incorrectas"}`);
    }
  } catch (error) {
    console.error("🚨 Error de conexión:", error);
    alert("⚠️ Error de conexión. Verifica que el servidor esté corriendo en http://localhost:5500");
  }
});

// === NAVEGACIÓN DASHBOARD ===
document.getElementById("quick-add-income").addEventListener('click', () => {
  console.log("➕ Ir a ingresos");
  setTodayDate('income-date');
  loadIncomeList();
  navigateTo(screens.income);
});

document.getElementById("quick-add-expense").addEventListener('click', () => {
  console.log("➖ Ir a gastos");
  setTodayDate('expense-date');
  loadExpenseList();
  navigateTo(screens.expense);
});

document.getElementById("manage-budgets").addEventListener('click', () => {
  console.log("💰 Ir a presupuestos");
  loadBudgets();
  navigateTo(screens.budget);
});

document.getElementById("logout-btn").addEventListener('click', () => {
  console.log("👋 Cerrando sesión");
  user = null;
  userId = null;
  transactions = [];
  elements.loginForm.reset();
  navigateTo(screens.auth);
  elements.signupForm.classList.add('hidden');
  elements.loginForm.classList.remove('hidden');
});

// === INGRESOS ===
document.getElementById('back-from-income').addEventListener('click', () => {
  navigateTo(screens.dashboard);
});

document.getElementById('income-form').addEventListener('submit', async e => {
  e.preventDefault();
  
  const ingreso = {
    id_usuario: userId,
    monto: parseFloat(document.getElementById("income-amount").value),
    descripcion: document.getElementById("income-description").value.trim(),
    fecha: document.getElementById("income-date").value,
    categoria: document.getElementById("income-category").value,
    metodo_pago: document.getElementById("income-method").value
  };

  try {
    const res = await fetch(`${API_URL}/api/ingresos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ingreso)
    });

    if (res.ok) {
      alert("✅ Ingreso registrado exitosamente");
      document.getElementById("income-form").reset();
      setTodayDate('income-date');
      await Promise.all([loadBalance(), loadTransactions(), loadIncomeList()]);
    } else {
      const error = await res.json();
      alert(`❌ Error al guardar ingreso: ${error.details || error.error}`);
    }
  } catch (error) {
    console.error(error);
    alert("⚠️ Error de conexión.");
  }
});

async function loadIncomeList() {
  try {
    const res = await fetch(`${API_URL}/api/ingresos/${userId}`);
    const ingresos = await res.json();
    
    const lista = document.getElementById('income-list-items');
    
    if (ingresos.length === 0) {
      lista.innerHTML = '<li>No hay ingresos registrados.</li>';
      return;
    }
    
    lista.innerHTML = ingresos.map(i => `
      <li class="transaction-item">
        <div>
          <strong>${i.descripcion}</strong><br>
          <small>${i.categoria || 'Sin categoría'} - ${i.metodo_pago || 'N/A'} - ${i.fecha_ingreso}</small>
        </div>
        <div>
          <span class="transaction-income">+$${parseFloat(i.monto).toFixed(2)}</span>
          <button class="delete-btn" onclick="deleteIncome(${i.id_ingreso})">🗑️</button>
        </div>
      </li>
    `).join('');
  } catch (err) {
    console.error("Error al cargar ingresos:", err);
  }
}

async function deleteIncome(id) {
  if (!confirm("¿Eliminar este ingreso?")) return;
  
  try {
    const res = await fetch(`${API_URL}/api/ingresos/${id}`, { method: "DELETE" });
    if (res.ok) {
      alert("✅ Ingreso eliminado");
      await Promise.all([loadBalance(), loadTransactions(), loadIncomeList()]);
    }
  } catch (err) {
    console.error(err);
    alert("⚠️ Error al eliminar");
  }
}

// === GASTOS ===
document.getElementById('back-from-expense').addEventListener('click', () => {
  navigateTo(screens.dashboard);
});

document.getElementById('expense-form').addEventListener('submit', async e => {
  e.preventDefault();
  
  const gasto = {
    id_usuario: userId,
    monto: parseFloat(document.getElementById("expense-amount").value),
    descripcion: document.getElementById("expense-description").value.trim(),
    fecha: document.getElementById("expense-date").value,
    categoria: document.getElementById("expense-category").value,
    metodo_pago: document.getElementById("expense-method").value
  };

  try {
    const res = await fetch(`${API_URL}/api/gastos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(gasto)
    });

    const data = await res.json();

    if (res.ok) {
      alert("✅ Gasto registrado exitosamente");
      
      // Cargar presupuestos para comparar
      const budgetRes = await fetch(`${API_URL}/api/presupuestos/${userId}`);
      const presupuestos = await budgetRes.json();
      
      // Buscar presupuestos de la misma categoría y período que incluya la fecha del gasto
      const presupuestosAfectados = presupuestos.filter(p => {
        const mismaCategoria = p.categoria === gasto.categoria;
        const dentroPeriodo = gasto.fecha >= p.periodo_inicio && gasto.fecha <= p.periodo_fin;
        const superado = parseFloat(p.gastos_actuales) >= parseFloat(p.monto_objetivo);
        return mismaCategoria && dentroPeriodo && superado;
      });
      
      // Mostrar notificación si se supera algún presupuesto
      if (presupuestosAfectados.length > 0) {
        presupuestosAfectados.forEach(p => {
          const limite = parseFloat(p.monto_objetivo);
          const gastado = parseFloat(p.gastos_actuales);
          const exceso = (gastado - limite).toFixed(2);
          alert(`⚠️ ALERTA DE PRESUPUESTO SUPERADO\n\nCategoría: ${gasto.categoria}\nLímite: ${limite.toFixed(2)}\nGastado: ${gastado.toFixed(2)}\nExceso: ${exceso}\n\nPeriodo: ${p.periodo_inicio} a ${p.periodo_fin}`);
        });
      } else {
        // Mostrar advertencia si se aproxima al límite (80%)
        const presupuestosProximos = presupuestos.filter(p => {
          const mismaCategoria = p.categoria === gasto.categoria;
          const dentroPeriodo = gasto.fecha >= p.periodo_inicio && gasto.fecha <= p.periodo_fin;
          const gastado = parseFloat(p.gastos_actuales);
          const limite = parseFloat(p.monto_objetivo);
          const porcentaje = (gastado / limite) * 100;
          return mismaCategoria && dentroPeriodo && porcentaje >= 80 && porcentaje < 100;
        });
        
        if (presupuestosProximos.length > 0) {
          presupuestosProximos.forEach(p => {
            const limite = parseFloat(p.monto_objetivo);
            const gastado = parseFloat(p.gastos_actuales);
            const porcentaje = ((gastado / limite) * 100).toFixed(1);
            alert(`⚠️ ADVERTENCIA: Presupuesto próximo a superarse\n\nCategoría: ${gasto.categoria}\nUtilizado: ${porcentaje}% (${gastado.toFixed(2)} de ${limite.toFixed(2)})\n\nPeriodo: ${p.periodo_inicio} a ${p.periodo_fin}`);
          });
        }
      }
      
      document.getElementById("expense-form").reset();
      setTodayDate('expense-date');
      await Promise.all([loadBalance(), loadTransactions(), loadExpenseList()]);
    } else {
      alert(`❌ Error al guardar gasto: ${data.details || data.error}`);
    }
  } catch (error) {
    console.error(error);
    alert("⚠️ Error de conexión.");
  }
});

async function loadExpenseList() {
  try {
    const res = await fetch(`${API_URL}/api/gastos/${userId}`);
    const gastos = await res.json();
    
    const lista = document.getElementById('expense-list-items');
    
    if (gastos.length === 0) {
      lista.innerHTML = '<li>No hay gastos registrados.</li>';
      return;
    }
    
    lista.innerHTML = gastos.map(g => `
      <li class="transaction-item">
        <div>
          <strong>${g.descripcion}</strong><br>
          <small>${g.categoria || 'Sin categoría'} - ${g.metodo_pago || 'N/A'} - ${g.fecha_gasto}</small>
        </div>
        <div>
          <span class="transaction-expense">-$${parseFloat(g.monto).toFixed(2)}</span>
          <button class="delete-btn" onclick="deleteExpense(${g.id_gasto})">🗑️</button>
        </div>
      </li>
    `).join('');
  } catch (err) {
    console.error("Error al cargar gastos:", err);
  }
}

async function deleteExpense(id) {
  if (!confirm("¿Eliminar este gasto?")) return;
  
  try {
    const res = await fetch(`${API_URL}/api/gastos/${id}`, { method: "DELETE" });
    if (res.ok) {
      alert("✅ Gasto eliminado");
      await Promise.all([loadBalance(), loadTransactions(), loadExpenseList()]);
    }
  } catch (err) {
    console.error(err);
    alert("⚠️ Error al eliminar");
  }
}

// === PRESUPUESTOS ===
document.getElementById('back-from-budget').addEventListener('click', () => {
  navigateTo(screens.dashboard);
});

document.getElementById('show-budget-form').addEventListener('click', () => {
  document.getElementById('budget-form').classList.remove('hidden');
  setTodayDate('budget-start');
  
  // Establecer fecha fin como 30 días después
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);
  document.getElementById('budget-end').value = endDate.toISOString().split('T')[0];
});

document.getElementById('cancel-budget').addEventListener('click', () => {
  document.getElementById('budget-form').classList.add('hidden');
  document.getElementById('budget-form').reset();
});

document.getElementById('budget-form').addEventListener('submit', async e => {
  e.preventDefault();
  console.log("📝 Formulario de presupuesto enviado");
  
  const categoriaEl = document.getElementById("budget-category");
  const montoEl = document.getElementById("budget-amount");
  const inicioEl = document.getElementById("budget-start");
  const finEl = document.getElementById("budget-end");
  
  const categoria = categoriaEl ? categoriaEl.value.trim() : null;
  const monto = montoEl ? montoEl.value : null;
  const inicio = inicioEl ? inicioEl.value : null;
  const fin = finEl ? finEl.value : null;
  
  console.log("Elementos del DOM encontrados:");
  console.log("- budget-category:", categoriaEl, "Valor:", categoria);
  console.log("- budget-amount:", montoEl, "Valor:", monto);
  console.log("- budget-start:", inicioEl, "Valor:", inicio);
  console.log("- budget-end:", finEl, "Valor:", fin);
  
  if (!categoria || !monto || !inicio || !fin) {
    alert("❌ Por favor completa todos los campos\n\nVerifica que tengas:\n- Categoría\n- Monto\n- Fecha Inicio\n- Fecha Fin");
    return;
  }
  
  const presupuesto = {
    id_usuario: userId,
    categoria: categoria,
    monto_limite: parseFloat(monto),
    periodo_inicio: inicio,
    periodo_fin: fin
  };

  console.log("📤 Enviando presupuesto:", presupuesto);

  try {
    const res = await fetch(`${API_URL}/api/presupuestos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(presupuesto)
    });

    console.log("Respuesta del servidor - Status:", res.status);
    const data = await res.json();
    console.log("Datos de respuesta:", data);

    if (res.ok) {
      alert("✅ Presupuesto creado exitosamente");
      document.getElementById('budget-form').reset();
      document.getElementById('budget-form').classList.add('hidden');
      await loadBudgets();
    } else {
      alert(`❌ Error al crear presupuesto: ${data.details || data.error}`);
    }
  } catch (error) {
    console.error("🚨 Error de conexión:", error);
    alert("⚠️ Error de conexión. Verifica que el servidor esté corriendo en http://localhost:5500");
  }
});

async function loadBudgets() {
  try {
    const res = await fetch(`${API_URL}/api/presupuestos/${userId}`);
    const presupuestos = await res.json();
    
    const container = document.getElementById('budget-list-items');
    
    if (presupuestos.length === 0) {
      container.innerHTML = '<p>No hay metas de ahorro creadas.</p>';
      return;
    }
    
    container.innerHTML = presupuestos.map(p => {
      const ahorrado = parseFloat(p.monto_actual);
      const objetivo = parseFloat(p.monto_objetivo);
      const porcentaje = (ahorrado / objetivo * 100).toFixed(1);
      const completado = ahorrado >= objetivo;
      
      return `
        <div class="budget-card ${completado ? 'budget-exceeded' : ''}">
          <div class="budget-header">
            <h4>${p.descripcion}</h4>
            <button class="delete-btn" onclick="deleteBudget(${p.id_ahorro})">🗑️</button>
          </div>
          <div class="budget-info">
            <p><strong>Objetivo:</strong> ${objetivo.toFixed(2)}</p>
            <p><strong>Ahorrado:</strong> ${ahorrado.toFixed(2)}</p>
            <p><strong>Falta:</strong> ${(objetivo - ahorrado).toFixed(2)}</p>
          </div>
          <div class="budget-bar">
            <div class="budget-progress" style="width: ${Math.min(porcentaje, 100)}%"></div>
          </div>
          <p class="budget-percentage">${porcentaje}% completado</p>
          ${completado ? '<p class="budget-alert">✅ ¡Meta alcanzada!</p>' : ''}
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error("Error al cargar metas de ahorro:", err);
  }
}

async function deleteBudget(id) {
  if (!confirm("¿Eliminar este presupuesto?")) return;
  
  try {
    const res = await fetch(`${API_URL}/api/presupuestos/${id}`, { method: "DELETE" });
    if (res.ok) {
      alert("✅ Presupuesto eliminado");
      await loadBudgets();
    }
  } catch (err) {
    console.error(err);
    alert("⚠️ Error al eliminar");
  }
}

// Funciones globales
window.deleteIncome = deleteIncome;
window.deleteExpense = deleteExpense;
window.deleteBudget = deleteBudget;

// === INICIO ===
console.log("🚀 OG Kash iniciado");
navigateTo(screens.auth);