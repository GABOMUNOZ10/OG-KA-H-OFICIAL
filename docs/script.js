const API_URL = window.location.hostname.includes('github.io')
  ? 'https://og-ka-h-oficial-production.up.railway.app'
  : window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'https://og-ka-h-oficial-production.up.railway.app'
  : 'https://og-ka-h-oficial-production.up.railway.app';
  
console.log("🌐 Entorno detectado:", window.location.hostname);
console.log("🔗 API URL configurada:", API_URL);

// === FUNCIÓN PARA FORMATEAR NÚMEROS AL ESTILO COLOMBIANO ===
function formatearPesos(valor) {
  if (isNaN(valor) || valor === null || valor === undefined) {
    valor = 0;
  }
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valor);
}

// === FUNCIÓN PARA PARSEAR NÚMEROS EN FORMATO COLOMBIANO ===
function parsearPesos(texto) {
  if (!texto) return 0;
  // Eliminar todo excepto números, comas y puntos
  texto = texto.toString().trim();
  // Eliminar puntos (separadores de miles)
  texto = texto.replace(/\./g, '');
  // Reemplazar coma por punto (decimal)
  texto = texto.replace(',', '.');
  return parseFloat(texto) || 0;
}

// === FUNCIÓN PARA FORMATEAR INPUT EN TIEMPO REAL ===
function formatearInputPesos(input) {
  input.addEventListener('input', function(e) {
    let valor = e.target.value;
    
    // Eliminar todo excepto números y coma
    valor = valor.replace(/[^\d,]/g, '');
    
    // Permitir solo una coma
    const partes = valor.split(',');
    if (partes.length > 2) {
      valor = partes[0] + ',' + partes.slice(1).join('');
    }
    
    // Limitar decimales a 2
    if (partes.length === 2 && partes[1].length > 2) {
      valor = partes[0] + ',' + partes[1].substring(0, 2);
    }
    
    e.target.value = valor;
  });
  
  input.addEventListener('blur', function(e) {
    let valor = e.target.value;
    if (!valor) {
      e.target.value = '0,00';
      return;
    }
    
    const numero = parsearPesos(valor);
    e.target.value = formatearPesos(numero);
  });
  
  input.addEventListener('focus', function(e) {
    let valor = e.target.value;
    if (valor === '0,00') {
      e.target.value = '';
    }
  });
}

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
console.log("");

// === FUNCIONES AUXILIARES ===
function navigateTo(screen) {
  if (!screen) {
    console.error("❌ navigateTo: pantalla no encontrada o null");
    console.warn("📋 PANTALLAS DISPONIBLES:", Object.keys(screens));
    return;
  }

  console.log("🔀 Navegando a:", screen.id);

  Object.values(screens).forEach(s => {
    if (s && s.classList) {
      s.classList.add('hidden');
    }
  });

  if (screen && screen.classList) {
    screen.classList.remove('hidden');
    console.log("✅ Pantalla mostrada:", screen.id);
  } else {
    console.error("⚠️ El elemento destino no tiene classList:", screen);
  }
}

function setTodayDate(inputId) {
  const input = document.getElementById(inputId);
  if (input) {
    const today = new Date().toISOString().split('T')[0];
    input.value = today;
  }
}

async function fetchAPI(endpoint, options = {}) {
  try {
    const url = `${API_URL}${endpoint}`;
    console.log(`🌐 Fetch → ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    console.log(`📥 Response status: ${response.status} ${response.statusText}`);

    const contentType = response.headers.get("content-type");
    let data = null;
    
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.warn("⚠️ Respuesta no es JSON:", text);
      data = { error: text || "Respuesta inválida del servidor" };
    }

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error("❌ Error en fetchAPI:", error);
    throw error;
  }
}

async function loadBalance() {
  try {
    console.log("💰 Cargando balance...");
    const data = await fetchAPI(`/api/balance/${userId}`);
    
    if (elements.currentBalance) {
      elements.currentBalance.textContent = `$${formatearPesos(data.balance)}`;
    }
    if (elements.totalIngresos) {
      elements.totalIngresos.textContent = `$${formatearPesos(data.ingresos)}`;
    }
    if (elements.totalGastos) {
      elements.totalGastos.textContent = `$${formatearPesos(data.gastos)}`;
    }
    
    console.log("✅ Balance cargado:", data);
  } catch (err) {
    console.error("❌ Error al cargar balance:", err);
    alert("⚠️ Error al cargar el balance. Verifica la conexión con el servidor.");
  }
}

async function loadTransactions() {
  try {
    console.log("📋 Cargando transacciones...");
    const [ingresos, gastos] = await Promise.all([
      fetchAPI(`/api/ingresos/${userId}`),
      fetchAPI(`/api/gastos/${userId}`)
    ]);
    
    transactions = [
      ...ingresos.map(i => ({ ...i, type: 'income', id: i.id_ingreso, fecha: i.fecha_ingreso })),
      ...gastos.map(g => ({ ...g, type: 'expense', id: g.id_gasto, fecha: g.fecha_gasto }))
    ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    console.log("✅ Transacciones cargadas:", transactions.length);
    renderTransactions();
  } catch (err) {
    console.error("❌ Error al cargar transacciones:", err);
  }
}

function renderTransactions() {
  if (!elements.transactionList) {
    console.warn("⚠️ transaction-list no encontrado en el DOM");
    return;
  }

  if (transactions.length === 0) {
    elements.transactionList.innerHTML = '<li>No transactions yet.</li>';
    return;
  }
  
  elements.transactionList.innerHTML = transactions.slice(0, 10).map(t => `
    <li>
      <div>
        <strong>${t.descripcion}</strong>
        <small>${t.categoria || ''} - ${t.fecha}</small>
      </div>
      <span class="${t.type === 'expense' ? 'transaction-expense' : 'transaction-income'}">
        ${t.type === 'income' ? '+' : '-'}$${formatearPesos(parseFloat(t.monto))}
      </span>
    </li>
  `).join('');
}

async function loadCategories(tipo, selectId) {
  try {
    console.log(`📋 Cargando categorías tipo: ${tipo}`);
    const categorias = await fetchAPI(`/api/categorias/${tipo}`);
    const select = document.getElementById(selectId);
    
    if (!select) {
      console.warn(`⚠️ Select ${selectId} no encontrado`);
      return;
    }
    
    select.innerHTML = '<option value="">Selecciona una categoría</option>' +
      categorias.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');
    
    console.log(`✅ ${categorias.length} categorías cargadas en ${selectId}`);
  } catch (err) {
    console.error("❌ Error al cargar categorías:", err);
    alert("⚠️ Error al cargar categorías. Verifica la conexión.");
  }
}

// === AUTENTICACIÓN ===
document.getElementById('show-signup')?.addEventListener('click', () => {
  console.log("👆 Clic en Sign up");
  elements.loginForm?.classList.add('hidden');
  elements.signupForm?.classList.remove('hidden');
});

document.getElementById('show-login')?.addEventListener('click', () => {
  console.log("👆 Clic en Volver a Login");
  elements.signupForm?.classList.add('hidden');
  elements.loginForm?.classList.remove('hidden');
});
document.querySelector('.forgot-password')?.addEventListener('click', () => {
  alert('🔒 Password recovery feature coming soon!\n\nPlease contact support at:\nsupport@ogkash.com');
});
elements.signupForm?.addEventListener("submit", async e => {
  e.preventDefault();
  console.log("📝 Registro iniciado");
  
  const nombre = document.getElementById("signup-user")?.value.trim();
  const contrasena = document.getElementById("signup-password")?.value.trim();
  
  if (!nombre || !contrasena) {
    alert("⚠️ Please complete all fields");
    return;
  }
  
  const correo = `${nombre.toLowerCase()}@ogkash.com`;

  try {
    const data = await fetchAPI('/api/usuarios', {
      method: "POST",
      body: JSON.stringify({ nombre, correo, contrasena })
    });
    
    alert(`✅ ${data.nombre} Registered. You can now log in.`);
    elements.signupForm.reset();
    elements.signupForm.classList.add('hidden');
    elements.loginForm.classList.remove('hidden');
  } catch (err) {
    console.error("❌ Error registering:", err);
    alert(`❌ ${err.message}`);
  }
});

elements.loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  console.log("🔐 Login successful");
  
  const nombre = document.getElementById("login-user")?.value.trim();
  const contrasena = document.getElementById("login-password")?.value.trim();
  
  if (!nombre || !contrasena) {
    alert("Please fill in all fields.");
    return;
  }
  
  const correo = `${nombre.toLowerCase()}@ogkash.com`;
  console.log("📧 Correo:", correo);

  try {
    const data = await fetchAPI('/api/login', {
      method: "POST",
      body: JSON.stringify({ correo, contrasena })
    });

    console.log("📥 Respuesta del servidor:", data);

    if (data.usuario) {
      console.log("✅ Login successful");
      alert(`✅ Welcome ${data.usuario.nombre}! You have successfully logged in.`);
      user = data.usuario.nombre;
      userId = data.usuario.id_usuario;
      
      if (elements.currentUser) {
        elements.currentUser.textContent = user;
      }
      
      console.log("📊 Cargando datos del usuario...");
      
      await Promise.all([
        loadBalance(),
        loadTransactions(),
        loadCategories('ingreso', 'income-category'),
        loadCategories('gasto', 'expense-category'),
        loadCategories('gasto', 'budget-category')
      ]);
      
      console.log("✅ Todos los datos cargados");
      
      elements.loginForm.reset();
      
      console.log("🚀 Navegando al dashboard...");
      navigateTo(screens.dashboard);
      
      console.log("✅ Login completado exitosamente");
    } else {
      throw new Error("Respuesta inválida del servidor");
    }
  } catch (error) {
    console.error("🚨 Error en login:", error);
    alert(`❌ ${error.message || "Error al iniciar sesión"}`);
  }
});

// === NAVEGACIÓN DASHBOARD ===
document.getElementById("quick-add-income")?.addEventListener('click', () => {
  console.log("➕ Ir a ingresos");
  setTodayDate('income-date');
  loadIncomeList();
  navigateTo(screens.income);
});

document.getElementById("quick-add-expense")?.addEventListener('click', () => {
  console.log("➖ Ir a gastos");
  setTodayDate('expense-date');
  loadExpenseList();
  navigateTo(screens.expense);
});

document.getElementById("manage-budgets")?.addEventListener('click', () => {
  console.log("💰 Ir a presupuestos");
  loadBudgets();
  navigateTo(screens.budget);
});

document.getElementById("view-reports")?.addEventListener('click', () => {
  console.log("📊 Ir a reportes");
  loadReports();
  navigateTo(screens.reports);
});

document.getElementById("logout-btn")?.addEventListener('click', () => {
  console.log("👋 Cerrando sesión");
  user = null;
  userId = null;
  transactions = [];
  elements.loginForm?.reset();
  navigateTo(screens.auth);
  elements.signupForm?.classList.add('hidden');
  elements.loginForm?.classList.remove('hidden');
});

// === INGRESOS ===
document.getElementById('back-from-income')?.addEventListener('click', () => {
  navigateTo(screens.dashboard);
});

// Formatear input de ingresos
const incomeAmountInput = document.getElementById('income-amount');
if (incomeAmountInput) {
  formatearInputPesos(incomeAmountInput);
}

document.getElementById('income-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  
  const montoTexto = document.getElementById("income-amount")?.value;
  
  const ingreso = {
    id_usuario: userId,
    monto: parsearPesos(montoTexto),
    descripcion: document.getElementById("income-description")?.value.trim(),
    fecha: document.getElementById("income-date")?.value,
    categoria: document.getElementById("income-category")?.value,
    metodo_pago: document.getElementById("income-method")?.value
  };

  try {
    await fetchAPI('/api/ingresos', {
      method: "POST",
      body: JSON.stringify(ingreso)
    });

    alert("✅ Income registered successfully");
    document.getElementById("income-form").reset();
    document.getElementById("income-amount").value = '0,00';
    setTodayDate('income-date');
    await Promise.all([loadBalance(), loadTransactions(), loadIncomeList()]);
  } catch (error) {
    console.error("❌ Error al guardar ingreso:", error);
    alert(`❌ ${error.message}`);
  }
});

async function loadIncomeList() {
  try {
    const ingresos = await fetchAPI(`/api/ingresos/${userId}`);
    const lista = document.getElementById('income-list-items');
    
    if (!lista) return;
    
    if (ingresos.length === 0) {
      lista.innerHTML = '<li>No income registered.</li>';
      return;
    }
    
    lista.innerHTML = ingresos.map(i => `
      <li class="transaction-item">
        <div>
          <strong>${i.descripcion}</strong><br>
          <small>${i.categoria || 'Uncategorized'} - ${i.metodo_pago || 'N/A'} - ${i.fecha_ingreso}</small>
        </div>
        <div>
          <span class="transaction-income">+$${formatearPesos(parseFloat(i.monto))}</span>
          <button class="delete-btn" onclick="deleteIncome(${i.id_ingreso})">🗑️</button>
        </div>
      </li>
    `).join('');
  } catch (err) {
    console.error("❌ Error al cargar ingresos:", err);
  }
}

async function deleteIncome(id) {
  if (!confirm("Delete this income?")) return;
  
  try {
    await fetchAPI(`/api/ingresos/${id}`, { method: "DELETE" });
    alert("✅ Income deleted");
    await Promise.all([loadBalance(), loadTransactions(), loadIncomeList()]);
  } catch (err) {
    console.error("❌ Error al eliminar:", err);
    alert(`❌ ${err.message}`);
  }
}

// === GASTOS ===
document.getElementById('back-from-expense')?.addEventListener('click', () => {
  navigateTo(screens.dashboard);
});

// Formatear input de gastos
const expenseAmountInput = document.getElementById('expense-amount');
if (expenseAmountInput) {
  formatearInputPesos(expenseAmountInput);
}

document.getElementById('expense-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  
  const montoTexto = document.getElementById("expense-amount")?.value;
  
  const gasto = {
    id_usuario: userId,
    monto: parsearPesos(montoTexto),
    descripcion: document.getElementById("expense-description")?.value.trim(),
    fecha: document.getElementById("expense-date")?.value,
    categoria: document.getElementById("expense-category")?.value,
    metodo_pago: document.getElementById("expense-method")?.value
  };

  try {
    await fetchAPI('/api/gastos', {
      method: "POST",
      body: JSON.stringify(gasto)
    });

    alert("✅ Expense registered successfully");
    
    const presupuestos = await fetchAPI(`/api/presupuestos/${userId}`);
    const presupuestoAfectado = presupuestos.find(p => 
      p.categoria === gasto.categoria && 
      parseFloat(p.gastado) >= parseFloat(p.monto_limite)
    );
    
    if (presupuestoAfectado) {
      alert(`⚠️ ¡ALERTA! Has alcanzado o superado el presupuesto de ${gasto.categoria}\nLimit: $${formatearPesos(presupuestoAfectado.monto_limite)}\nGastado: $${formatearPesos(presupuestoAfectado.gastado)}`);
    }
    
    document.getElementById("expense-form").reset();
    document.getElementById("expense-amount").value = '0,00';
    setTodayDate('expense-date');
    await Promise.all([loadBalance(), loadTransactions(), loadExpenseList()]);
  } catch (error) {
    console.error("❌ Error al guardar gasto:", error);
    alert(`❌ ${error.message}`);
  }
});

async function loadExpenseList() {
  try {
    const gastos = await fetchAPI(`/api/gastos/${userId}`);
    const lista = document.getElementById('expense-list-items');
    
    if (!lista) return;
    
    if (gastos.length === 0) {
      lista.innerHTML = '<li>No expenses registered.</li>';
      return;
    }
    
    lista.innerHTML = gastos.map(g => `
      <li class="transaction-item">
        <div>
          <strong>${g.descripcion}</strong><br>
          <small>${g.categoria || 'Uncategorized'} - ${g.metodo_pago || 'N/A'} - ${g.fecha_gasto}</small>
        </div>
        <div>
          <span class="transaction-expense">-$${formatearPesos(parseFloat(g.monto))}</span>
          <button class="delete-btn" onclick="deleteExpense(${g.id_gasto})">🗑️</button>
        </div>
      </li>
    `).join('');
  } catch (err) {
    console.error("❌ Error al cargar gastos:", err);
  }
}

async function deleteExpense(id) {
  if (!confirm("Delete this expense?")) return;
  
  try {
    await fetchAPI(`/api/gastos/${id}`, { method: "DELETE" });
    alert("✅ Expense deleted");
    await Promise.all([loadBalance(), loadTransactions(), loadExpenseList()]);
  } catch (err) {
    console.error("❌ Error al eliminar:", err);
    alert(`❌ ${err.message}`);
  }
}

// === PRESUPUESTOS ===
document.getElementById('back-from-budget')?.addEventListener('click', () => {
  navigateTo(screens.dashboard);
});

document.getElementById('show-budget-form')?.addEventListener('click', () => {
  const form = document.getElementById('budget-form');
  if (form) {
    form.classList.remove('hidden');
    setTodayDate('budget-start');
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    const endInput = document.getElementById('budget-end');
    if (endInput) {
      endInput.value = endDate.toISOString().split('T')[0];
    }
  }
});

document.getElementById('cancel-budget')?.addEventListener('click', () => {
  const form = document.getElementById('budget-form');
  if (form) {
    form.classList.add('hidden');
    form.reset();
  }
});

// Formatear input de presupuestos
const budgetAmountInput = document.getElementById('budget-amount');
if (budgetAmountInput) {
  formatearInputPesos(budgetAmountInput);
}

document.getElementById('budget-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  
  const montoTexto = document.getElementById("budget-amount")?.value;
  
  const presupuesto = {
    id_usuario: userId,
    categoria: document.getElementById("budget-category")?.value,
    monto_limite: parsearPesos(montoTexto),
    periodo_inicio: document.getElementById("budget-start")?.value,
    periodo_fin: document.getElementById("budget-end")?.value
  };

  try {
    await fetchAPI('/api/presupuestos', {
      method: "POST",
      body: JSON.stringify(presupuesto)
    });

    alert("✅ Budget created successfully");
    const form = document.getElementById('budget-form');
    if (form) {
      form.reset();
      document.getElementById("budget-amount").value = '0,00';
      form.classList.add('hidden');
    }
    await loadBudgets();
  } catch (error) {
    console.error("❌ Error al crear presupuesto:", error);
    alert(`❌ ${error.message}`);
  }
});

async function loadBudgets() {
  try {
    const presupuestos = await fetchAPI(`/api/presupuestos/${userId}`);
    const container = document.getElementById('budget-list-items');
    
    if (!container) return;
    
    if (presupuestos.length === 0) {
      container.innerHTML = '<p>No budgets created.</p>';
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
            <p><strong>Limit:</strong> $${formatearPesos(limite)}</p>
            <p><strong>Spent:</strong> $${formatearPesos(gastado)}</p>
            <p><strong>Available:</strong> $${formatearPesos(limite - gastado)}</p>
          </div>
          <div class="budget-bar">
            <div class="budget-progress" style="width: ${Math.min(porcentaje, 100)}%"></div>
          </div>
          <p class="budget-percentage">${porcentaje}% utilizado</p>
          <p class="budget-period">${p.periodo_inicio} → ${p.periodo_fin}</p>
          ${excedido ? '<p class="budget-alert">⚠️ Budget exceeded</p>' : ''}
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error("❌ Error al cargar presupuestos:", err);
    alert(`❌ ${err.message}`);
  }
}

async function deleteBudget(id) {
  if (!confirm("Delete this budget?")) return;
  
  try {
    await fetchAPI(`/api/presupuestos/${id}`, { method: "DELETE" });
    alert("✅ Budget deleted");
    await loadBudgets();
  } catch (err) {
    console.error("❌ Error al eliminar:", err);
    alert(`❌ ${err.message}`);
  }
}

// Funciones globales
window.deleteIncome = deleteIncome;
window.deleteExpense = deleteExpense;
window.deleteBudget = deleteBudget;

// === REPORTES ===
document.getElementById('back-from-reports')?.addEventListener('click', () => {
  navigateTo(screens.dashboard);
});

let currentFilter = 'all';

async function loadReports() {
  try {
    const [ingresos, gastos, balance] = await Promise.all([
      fetchAPI(`/api/ingresos/${userId}`),
      fetchAPI(`/api/gastos/${userId}`),
      fetchAPI(`/api/balance/${userId}`)
    ]);
    
    const reportIngresos = document.getElementById('report-ingresos');
    const reportGastos = document.getElementById('report-gastos');
    const reportBalance = document.getElementById('report-balance');
    
    if (reportIngresos) reportIngresos.textContent = `$${formatearPesos(balance.ingresos)}`;
    if (reportGastos) reportGastos.textContent = `$${formatearPesos(balance.gastos)}`;
    if (reportBalance) reportBalance.textContent = `$${formatearPesos(balance.balance)}`;
    
    transactions = [
      ...ingresos.map(i => ({ ...i, type: 'income', id: i.id_ingreso, fecha: i.fecha_ingreso })),
      ...gastos.map(g => ({ ...g, type: 'expense', id: g.id_gasto, fecha: g.fecha_gasto }))
    ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    renderChart(balance.ingresos, balance.gastos);
    renderReportTransactions(currentFilter);
    
    console.log("✅ Reportes cargados");
  } catch (err) {
    console.error("❌ Error al cargar reportes:", err);
    alert(`❌ ${err.message}`);
  }
}

function renderChart(ingresos, gastos) {
  const ctx = document.getElementById('financeChart');
  if (!ctx) return;
  
  if (financeChart) {
    financeChart.destroy();
  }
  
  financeChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Income', 'Expenses'],
      datasets: [{
        data: [ingresos, gastos],
        backgroundColor: ['#43a047', '#e53935'],
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
            font: { size: 14 },
            padding: 15
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              return `${label}: $${formatearPesos(value)}`;
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
  let filterLabel = '(ALL)';
  
  if (filter === 'income') {
    filteredTransactions = transactions.filter(t => t.type === 'income');
    filterLabel = '(Only Income)';
  } else if (filter === 'expense') {
    filteredTransactions = transactions.filter(t => t.type === 'expense');
    filterLabel = '(Only Expenses)';
  }
  
  const filterLabelElement = document.getElementById('filter-label');
  if (filterLabelElement) {
    filterLabelElement.textContent = filterLabel;
  }
  
  const lista = document.getElementById('report-transaction-list');
  
  if (!lista) return;
  
  if (filteredTransactions.length === 0) {
    lista.innerHTML = '<li>No transactions to show.</li>';
    return;
  }
  
  lista.innerHTML = filteredTransactions.map(t => `
    <li>
      <div>
        <strong>${t.descripcion}</strong>
        <small>${t.categoria || 'Uncategorized'} - ${t.fecha}</small>
      </div>
      <span class="${t.type === 'expense' ? 'transaction-expense' : 'transaction-income'}">
        ${t.type === 'income' ? '+' : '-'}${formatearPesos(parseFloat(t.monto))}
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

// === DESCRIPCIONES ===
screens.descriptions = document.getElementById('descriptions-screen');

document.getElementById("manage-descriptions")?.addEventListener('click', () => {
  console.log("📝 Ir a descripciones");
  loadDescriptions();
  navigateTo(screens.descriptions);
});

document.getElementById('back-from-descriptions')?.addEventListener('click', () => {
  navigateTo(screens.dashboard);
});

document.getElementById('show-description-form')?.addEventListener('click', () => {
  const formContainer = document.getElementById('description-form-container');
  if (formContainer) {
    formContainer.classList.remove('hidden');
    document.getElementById('description-text')?.focus();
  }
});

document.getElementById('cancel-description')?.addEventListener('click', () => {
  const formContainer = document.getElementById('description-form-container');
  const form = document.getElementById('description-form');
  if (formContainer && form) {
    formContainer.classList.add('hidden');
    form.reset();
  }
});

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const type = btn.getAttribute('data-type');
    document.getElementById('description-type').value = type;
    loadCategories(type, 'description-category');
  });
});

document.getElementById('description-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const descripcion = {
    id_usuario: userId,
    tipo: document.getElementById('description-type')?.value,
    texto: document.getElementById('description-text')?.value.trim(),
    categoria: document.getElementById('description-category')?.value || null
  };

  try {
    await fetchAPI('/api/descripciones', {
      method: "POST",
      body: JSON.stringify(descripcion)
    });

    alert("✅ Description saved successfully");
    const form = document.getElementById('description-form');
    const formContainer = document.getElementById('description-form-container');
    
    if (form && formContainer) {
      form.reset();
      formContainer.classList.add('hidden');
    }
    
    await loadDescriptions();
  } catch (error) {
    console.error("❌ Error al guardar descripción:", error);
    alert(`❌ ${error.message}`);
  }
});

async function loadDescriptions() {
  try {
    const tipo = document.querySelector('.tab-btn.active')?.getAttribute('data-type') || 'gasto';
    const descripciones = await fetchAPI(`/api/descripciones/${userId}?tipo=${tipo}`);
    
    const lista = document.getElementById('descriptions-list-items');
    
    if (!lista) return;
    
    if (descripciones.length === 0) {
      lista.innerHTML = '<li class="no-data">No descriptions registered</li>';
      return;
    }
    
    lista.innerHTML = descripciones.map(d => `
      <li>
        <div>
          <strong>${d.texto}</strong>
          ${d.categoria ? `<br><small>${d.categoria}</small>` : ''}
        </div>
        <button class="delete-btn" onclick="deleteDescription(${d.id_descripcion})">🗑️</button>
      </li>
    `).join('');
  } catch (err) {
    console.error("❌ Error al cargar descripciones:", err);
  }
}

async function deleteDescription(id) {
  if (!confirm("Delete this description?")) return;
  
  try {
    await fetchAPI(`/api/descripciones/${id}`, { method: "DELETE" });
    alert("✅ Description deleted");
    await loadDescriptions();
  } catch (err) {
    console.error("❌ Error al eliminar:", err);
    alert(`❌ ${err.message}`);
  }
}

document.getElementById('search-descriptions')?.addEventListener('input', (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const items = document.querySelectorAll('#descriptions-list-items li:not(.no-data)');
  
  items.forEach(item => {
    const text = item.textContent.toLowerCase();
    if (text.includes(searchTerm)) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
});

window.deleteDescription = deleteDescription;

// === INICIO DE LA APLICACIÓN ===
console.log("🚀 OG Kash iniciado");
console.log("🔗 Conectando a:", API_URL);

if (screens.auth) {
  navigateTo(screens.auth);
  console.log("✅ Aplicación lista");
} else {
  console.error("❌ ERROR CRÍTICO: No se encontró la pantalla de autenticación (auth-screen)");
  console.error("💡 Verifica que tu index.html tenga un elemento con id='auth-screen'");
}