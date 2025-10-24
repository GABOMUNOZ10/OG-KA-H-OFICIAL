const API_URL = 'https://TU-DOMINIO-REAL.up.railway.app';
// === REFERENCIAS DEL DOM ===
const screens = {
  auth: document.getElementById('auth-screen'),
  dashboard: document.getElementById('dashboard-screen'),
  income: document.getElementById('income-screen'),
  expense: document.getElementById('expense-screen'),
  budget: document.getElementById('budget-screen'),
  reports: document.getElementById('reports-screen')
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
let dashboardChart = null;
let financeChart = null;

console.log("✅ Script cargado correctamente");
console.log("🌐 API URL:", API_URL);
console.log("🖥️ Hostname:", window.location.hostname);

// === VERIFICACIÓN DE ELEMENTOS DEL DOM ===
console.log("\n🔍 Verificando elementos del DOM:");
Object.entries(screens).forEach(([key, element]) => {
  if (element) {
    console.log(`✅ ${key}-screen encontrado`);
  } else {
    console.error(`❌ ${key}-screen NO encontrado - Verifica tu HTML`);
  }
});

Object.entries(elements).forEach(([key, element]) => {
  if (element) {
    console.log(`✅ ${key} encontrado`);
  } else {
    console.warn(`⚠️ ${key} NO encontrado`);
  }
});
console.log(""); // Línea en blanco

// === FUNCIONES AUXILIARES ===
function navigateTo(screen) {
  if (!screen) {
    console.error("❌ navigateTo: pantalla no encontrada o null");
    console.warn("📋 PANTALLAS DISPONIBLES:", Object.keys(screens));
    return;
  }

  console.log("📍 Navegando a:", screen.id);

  // Ocultar todas las pantallas que existan
  Object.values(screens).forEach(s => {
    if (s && s.classList) {
      s.classList.add('hidden');
    }
  });

  // Mostrar la pantalla seleccionada
  if (screen.classList) {
    screen.classList.remove('hidden');
  } else {
    console.error("⚠️ El elemento destino no tiene classList:", screen);
  }
}

  // Mostrar la pantalla seleccionada
  screen.classList.remove('hidden');


function setTodayDate(inputId) {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById(inputId).value = today;
}

async function loadBalance() {
  try {
    const res = await fetch(`${API_URL}/api/balance/${userId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    
    elements.currentBalance.textContent = `$${data.balance.toFixed(2)}`;
    elements.totalIngresos.textContent = `$${data.ingresos.toFixed(2)}`;
    elements.totalGastos.textContent = `$${data.gastos.toFixed(2)}`;
    
    console.log("💰 Balance cargado:", data);
  } catch (err) {
    console.error("Error al cargar balance:", err);
    alert("⚠️ Error al cargar el balance. Verifica la conexión con el servidor.");
  }
}

async function loadTransactions() {
  try {
    const [ingresosRes, gastosRes] = await Promise.all([
      fetch(`${API_URL}/api/ingresos/${userId}`),
      fetch(`${API_URL}/api/gastos/${userId}`)
    ]);
    
    if (!ingresosRes.ok || !gastosRes.ok) throw new Error('Error en la respuesta');
    
    const ingresos = await ingresosRes.json();
    const gastos = await gastosRes.json();
    
    transactions = [
      ...ingresos.map(i => ({ ...i, type: 'income', id: i.id_ingreso, fecha: i.fecha_ingreso })),
      ...gastos.map(g => ({ ...g, type: 'expense', id: g.id_gasto, fecha: g.fecha_gasto }))
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
        <small>${t.categoria || ''} - ${t.fecha}</small>
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
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const categorias = await res.json();
    const select = document.getElementById(selectId);
    
    select.innerHTML = '<option value="">Selecciona una categoría</option>' +
      categorias.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');
  } catch (err) {
    console.error("Error al cargar categorías:", err);
    alert("⚠️ Error al cargar categorías. Verifica la conexión.");
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
    alert(`⚠️ Error al conectar con el servidor.\n\nURL intentada: ${API_URL}\n\nVerifica que el servidor esté corriendo.`);
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
    alert(`⚠️ Error de conexión.\n\nURL: ${API_URL}\n\nVerifica que el servidor esté corriendo.`);
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

document.getElementById("view-reports").addEventListener('click', () => {
  console.log("📊 Ir a reportes");
  loadReports();
  navigateTo(screens.reports);
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
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
      
      const budgetRes = await fetch(`${API_URL}/api/presupuestos/${userId}`);
      const presupuestos = await budgetRes.json();
      
      const presupuestoAfectado = presupuestos.find(p => 
        p.categoria === gasto.categoria && 
        parseFloat(p.gastado) >= parseFloat(p.monto_limite)
      );
      
      if (presupuestoAfectado) {
        alert(`⚠️ ¡ALERTA! Has alcanzado o superado el presupuesto de ${gasto.categoria}\nLímite: $${presupuestoAfectado.monto_limite}\nGastado: $${presupuestoAfectado.gastado}`);
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
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
  
  const presupuesto = {
    id_usuario: userId,
    categoria: document.getElementById("budget-category").value,
    monto_limite: parseFloat(document.getElementById("budget-amount").value),
    periodo_inicio: document.getElementById("budget-start").value,
    periodo_fin: document.getElementById("budget-end").value
  };

  try {
    const res = await fetch(`${API_URL}/api/presupuestos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(presupuesto)
    });

    if (res.ok) {
      alert("✅ Presupuesto creado exitosamente");
      document.getElementById('budget-form').reset();
      document.getElementById('budget-form').classList.add('hidden');
      await loadBudgets();
    } else {
      const error = await res.json();
      alert(`❌ Error al crear presupuesto: ${error.details || error.error}`);
    }
  } catch (error) {
    console.error(error);
    alert("⚠️ Error de conexión.");
  }
});

async function loadBudgets() {
  try {
    const res = await fetch(`${API_URL}/api/presupuestos/${userId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const presupuestos = await res.json();
    
    const container = document.getElementById('budget-list-items');
    
    if (presupuestos.length === 0) {
      container.innerHTML = '<p>No hay presupuestos creados.</p>';
      return;
    }
    
    container.innerHTML = presupuestos.map(p => {
      const gastado = parseFloat(p.gastado);
      const limite = parseFloat(p.monto_limite);
      const porcentaje = (gastado / limite * 100).toFixed(1);
      const excedido = gastado >= limite;
      
      return `
        <div class="budget-card ${excedido ? 'budget-exceeded' : ''}">
          <div class="budget-header">
            <h4>${p.categoria}</h4>
            <button class="delete-btn" onclick="deleteBudget(${p.id_presupuesto})">🗑️</button>
          </div>
          <div class="budget-info">
            <p><strong>Límite:</strong> $${limite.toFixed(2)}</p>
            <p><strong>Gastado:</strong> $${gastado.toFixed(2)}</p>
            <p><strong>Disponible:</strong> $${(limite - gastado).toFixed(2)}</p>
          </div>
          <div class="budget-bar">
            <div class="budget-progress" style="width: ${Math.min(porcentaje, 100)}%"></div>
          </div>
          <p class="budget-percentage">${porcentaje}% utilizado</p>
          <p class="budget-period">${p.periodo_inicio} → ${p.periodo_fin}</p>
          ${excedido ? '<p class="budget-alert">⚠️ Presupuesto superado</p>' : ''}
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error("Error al cargar presupuestos:", err);
    alert("⚠️ Error al cargar presupuestos");
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

// === REPORTES ===
document.getElementById('back-from-reports').addEventListener('click', () => {
  navigateTo(screens.dashboard);
});

let currentFilter = 'all';

async function loadReports() {
  try {
    const [ingresosRes, gastosRes, balanceRes] = await Promise.all([
      fetch(`${API_URL}/api/ingresos/${userId}`),
      fetch(`${API_URL}/api/gastos/${userId}`),
      fetch(`${API_URL}/api/balance/${userId}`)
    ]);
    
    if (!ingresosRes.ok || !gastosRes.ok || !balanceRes.ok) {
      throw new Error('Error al cargar reportes');
    }
    
    const ingresos = await ingresosRes.json();
    const gastos = await gastosRes.json();
    const balance = await balanceRes.json();
    
    document.getElementById('report-ingresos').textContent = `$${balance.ingresos.toFixed(2)}`;
    document.getElementById('report-gastos').textContent = `$${balance.gastos.toFixed(2)}`;
    document.getElementById('report-balance').textContent = `$${balance.balance.toFixed(2)}`;
    
    transactions = [
      ...ingresos.map(i => ({ ...i, type: 'income', id: i.id_ingreso, fecha: i.fecha_ingreso })),
      ...gastos.map(g => ({ ...g, type: 'expense', id: g.id_gasto, fecha: g.fecha_gasto }))
    ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    renderChart(balance.ingresos, balance.gastos);
    renderReportTransactions(currentFilter);
    
    console.log("📊 Reportes cargados");
  } catch (err) {
    console.error("Error al cargar reportes:", err);
    alert("⚠️ Error al cargar reportes");
  }
}

function renderChart(ingresos, gastos) {
  const ctx = document.getElementById('financeChart');
  
  if (financeChart) {
    financeChart.destroy();
  }
  
  financeChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Ingresos', 'Gastos'],
      datasets: [{
        data: [ingresos, gastos],
        backgroundColor: [
          '#43a047',
          '#e53935'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: {
              size: 14
            },
            padding: 15
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              return `${label}: $${value.toFixed(2)}`;
            }
          }
        }
      }
    }
  });
}

function renderReportTransactions(filter) {
  currentFilter = filter;
  
  let filteredTransactions = transactions;
  let filterLabel = '(Todas)';
  
  if (filter === 'income') {
    filteredTransactions = transactions.filter(t => t.type === 'income');
    filterLabel = '(Solo Ingresos)';
  } else if (filter === 'expense') {
    filteredTransactions = transactions.filter(t => t.type === 'expense');
    filterLabel = '(Solo Gastos)';
  }
  
  const filterLabelElement = document.getElementById('filter-label');
  if (filterLabelElement) {
    filterLabelElement.textContent = filterLabel;
  }
  
  const lista = document.getElementById('report-transaction-list');
  
  if (!lista) return;
  
  if (filteredTransactions.length === 0) {
    lista.innerHTML = '<li>No hay transacciones para mostrar.</li>';
    return;
  }
  
  lista.innerHTML = filteredTransactions.map(t => `
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

// Event listeners para filtros
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.getAttribute('data-filter');
    renderReportTransactions(filter);
  });
});

// Botón de agregar ingreso desde reportes
const reportAddIncomeBtn = document.getElementById('report-add-income');
if (reportAddIncomeBtn) {
  reportAddIncomeBtn.addEventListener('click', () => {
    setTodayDate('income-date');
    loadIncomeList();
    navigateTo(screens.income);
  });
}

// === INICIO ===
console.log("🚀 OG Kash iniciado");
console.log("🔗 Conectando a:", API_URL);

// Verificar que exista la pantalla de autenticación antes de navegar
if (screens.auth) {
  navigateTo(screens.auth);
} else {
  console.error("❌ ERROR CRÍTICO: No se encontró la pantalla de autenticación (auth-screen)");
  console.error("💡 Verifica que tu index.html tenga un elemento con id='auth-screen'");
}

