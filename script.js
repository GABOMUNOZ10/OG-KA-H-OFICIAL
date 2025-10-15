// --- Variables del DOM ---
const authScreen = document.getElementById('auth-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const transactionScreen = document.getElementById('transaction-screen');

const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const showSignupBtn = document.getElementById('show-signup');
const showLoginBtn = document.getElementById('show-login');
const logoutBtn = document.getElementById('logout-btn');

const currentUserSpan = document.getElementById('current-user');
const currentBalanceElement = document.getElementById('current-balance');
const transactionListElement = document.getElementById('transaction-list');

const addTransactionBtn = document.getElementById('add-transaction-btn');
const backToDashboardBtn = document.getElementById('back-to-dashboard');
const transactionForm = document.getElementById('transaction-form');

// --- Estado de la Aplicación (Simulación de Base de Datos/Sesión) ---
let users = JSON.parse(localStorage.getItem('ogkash_users')) || {};
let transactions = JSON.parse(localStorage.getItem('ogkash_transactions')) || [];
let loggedInUser = null;

// --- Funciones de Utilidad ---

/**
 * Guarda el estado de usuarios y transacciones en Local Storage.
 */
function saveState() {
    localStorage.setItem('ogkash_users', JSON.stringify(users));
    localStorage.setItem('ogkash_transactions', JSON.stringify(transactions));
}

/**
 * Muestra la pantalla solicitada y oculta las demás.
 * @param {HTMLElement} screenToShow - El elemento de la pantalla a mostrar.
 */
function navigateTo(screenToShow) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
        screen.classList.remove('active');
    });
    screenToShow.classList.remove('hidden');
    screenToShow.classList.add('active');
}

/**
 * Calcula el saldo total a partir de las transacciones.
 * @returns {number} El saldo actual.
 */
function calculateBalance() {
    return transactions.reduce((balance, t) => {
        const amount = parseFloat(t.amount);
        return t.type === 'income' ? balance + amount : balance - amount;
    }, 0);
}

/**u
 * Actualiza la lista de transacciones en el Dashboard.
 */
function renderTransactions() {
    const balance = calculateBalance();
    currentBalanceElement.textContent = `$${balance.toFixed(2)}`;

    transactionListElement.innerHTML = ''; // Limpiar la lista actual

    if (transactions.length === 0) {
        transactionListElement.innerHTML = '<li>No hay transacciones aún.</li>';
        return;
    }

    // Mostrar solo las últimas 5 transacciones
    const recentTransactions = transactions.slice(-5).reverse(); 

    recentTransactions.forEach(t => {
        const listItem = document.createElement('li');
        const amountClass = t.type === 'expense' ? 'transaction-expense' : 'transaction-income';
        const sign = t.type === 'income' ? '+' : '-';

        listItem.innerHTML = `
            <span>${t.description}</span>
            <span class="${amountClass}">${sign}$${parseFloat(t.amount).toFixed(2)}</span>
        `;
        transactionListElement.appendChild(listItem);
    });
}

// --- Lógica de Autenticación ---

// Alternar entre Login y Sign Up
showSignupBtn.addEventListener('click', () => {
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
});

showLoginBtn.addEventListener('click', () => {
    signupForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
});

// Registrar Nuevo Usuario
//signupForm.addEventListener('submit', (e) => {
   // e.preventDefault();
    //const user = document.getElementById('signup-user').value;
    //const pass = document.getElementById('signup-password').value;

   // if (users[user]) {
     //   alert('El usuario ya existe. Por favor, inicia sesión.');
    //    return;
   // }

   // users[user] = { password: pass, transactions: [] };
   // saveState();
   //alert(`¡Registro exitoso! Ya puedes iniciar sesión como ${user}.`);

    // Limpiar y volver a Login
    //signupForm.reset();
    //showLoginBtn.click();
//});//
//*
// Iniciar Sesión
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-password').value;

    if (users[user] && users[user].password === pass) {
        loggedInUser = user;
        // Cargar transacciones del usuario (aunque por ahora todas están en 'transactions')
        // En un futuro, deberías cargar solo las transacciones asociadas al 'loggedInUser'
        
        currentUserSpan.textContent = user;
        renderTransactions();
        navigateTo(dashboardScreen);
        loginForm.reset();
    } else {
        alert('Usuario o contraseña incorrectos.');
    }
});

// Cerrar Sesión
logoutBtn.addEventListener('click', () => {
    loggedInUser = null;
    transactions = JSON.parse(localStorage.getItem('ogkash_transactions')) || []; // Opcional: limpiar transacciones si no se asocian al usuario
    navigateTo(authScreen);
});


// --- Lógica de Transacciones ---

// Botones de navegación
addTransactionBtn.addEventListener('click', () => {
    navigateTo(transactionScreen);
});

backToDashboardBtn.addEventListener('click', () => {
    navigateTo(dashboardScreen);
    transactionForm.reset(); // Limpiar formulario al volver
});

// Guardar Transacción
transactionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const type = document.getElementById('transaction-type').value;
    const amount = document.getElementById('transaction-amount').value;
    const description = document.getElementById('transaction-description').value;

    const newTransaction = {
        id: Date.now(), // ID simple basado en el tiempo
        type: type, // 'income' o 'expense'
        amount: parseFloat(amount).toFixed(2),
        description: description,
        date: new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    };

    transactions.push(newTransaction);
    saveState(); // Guardar en Local Storage
    renderTransactions(); // Actualizar el Dashboard

    alert(`Transacción de ${type === 'income' ? 'Ingreso' : 'Gasto'} de $${amount} guardada.`);
    
    // Volver al Dashboard
    navigateTo(dashboardScreen);
    transactionForm.reset();
});

// --- Inicialización ---

/**
 * Función para verificar la sesión al cargar la página.
 */
function init() {
    // Si hay un usuario logueado (implementación futura con sesiones)
    // Por ahora, siempre empezamos en la pantalla de autenticación.
    navigateTo(authScreen);

    // Si tuvieras que inicializar el dashboard si un usuario estuviera logueado, lo harías aquí:
    // if (loggedInUser) { ... }
}

init();
// --- Registro de usuario ---
document.getElementById("signup-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = document.getElementById("signup-user").value.trim();
  const contrasena = document.getElementById("signup-password").value.trim();

  // Generar un correo falso (temporal) si no lo pides aún
  const correo = nombre.toLowerCase().replace(/\s+/g, '') + "@ogkash.com";

  try {
    const response = await fetch("http://localhost:3000/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, correo, contrasena })
    });

    const data = await response.json();

    if (response.ok) {
      alert(`✅ Usuario ${data.nombre} registrado con éxito`);
      // Cambia de nuevo al login
      document.getElementById("signup-form").classList.add("hidden");
      document.getElementById("login-form").classList.remove("hidden");
    } else {
      alert(`❌ Error: ${data.error}`);
    }
  } catch (error) {
    console.error("Error en el registro:", error);
    alert("⚠️ No se pudo conectar con el servidor.");
  }
});
// --- Registro de usuario con PostgreSQL ---
document.getElementById("signup-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = document.getElementById("signup-user").value.trim();
  const contrasena = document.getElementById("signup-password").value.trim();
  const correo = nombre.toLowerCase().replace(/\s+/g, '') + "@ogkash.com";

  try {
    const response = await fetch("http://localhost:3000/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, correo, contrasena })
    });

    const data = await response.json();

    if (response.ok) {
      alert(`✅ Usuario ${data.nombre} registrado con éxito`);
      document.getElementById("signup-form").classList.add("hidden");
      document.getElementById("login-form").classList.remove("hidden");
      document.getElementById("signup-form").reset();
    } else {
      alert(`❌ Error: ${data.error}`);
    }
  } catch (error) {
    console.error("Error en el registro:", error);
    alert("⚠️ No se pudo conectar con el servidor.");
  }
});
