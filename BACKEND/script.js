// === CONFIGURACIÓN ===
const API_URL = 'https://og-ka-h-oficial-production.up.railway.app';

// === REFERENCIAS DEL DOM ===
const screens = {
  auth: document.getElementById('auth-screen'),
  dashboard: document.getElementById('dashboard-screen'),
  income: document.getElementById('income-screen'),
  expense: document.getElementById('expense-screen'),
  budget: document.getElementById('budget-screen'),
  descriptions: document.getElementById('descriptions-screen')
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
    alert("⚠️ Error al conectar con el servidor.");
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
    alert("⚠️ Error de conexión. Verifica que el servidor esté corriendo.");
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

document.getElementById("logout-btn").addEventListener