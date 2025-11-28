document.addEventListener("DOMContentLoaded", () => {

    // Define la ruta base absoluta, que incluye el directorio raíz del proyecto 'sos'
    const RUTA_BASE = "/sos";
    const RUTA_LOGIN = RUTA_BASE + "/html/login.html";
    const RUTA_INDEX = RUTA_BASE + "/index.html";
    const RUTA_MENU_HTML = RUTA_BASE + "/html/menu.html";

    // Identifica la ubicación del archivo HTML actual.
    const nombreArchivo = window.location.pathname.split("/").pop();
    
    // =====================================================
    // 1. VALIDAR SESIÓN DEL USUARIO
    // =====================================================
    const usuarioData = localStorage.getItem("usuario");

    if (!usuarioData) {
        // Redirigir al login (Ruta absoluta: /sos/html/login.html)
        if (nombreArchivo !== "login.html") {
            // 🟢 CAMBIO A RUTA CON /sos/
            window.location.href = RUTA_LOGIN; 
        }
        return;
    }

    const user = JSON.parse(usuarioData);
    console.log("Usuario logueado:", user.nombre, "Rol:", user.rol_id);

    // Si ya tiene sesión y está en login o registro, redirigir al dashboard
    if (nombreArchivo === "login.html") {
        // Redirigir al index (Ruta absoluta: /sos/index.html)
        // 🟢 CAMBIO A RUTA CON /sos/
        window.location.href = RUTA_INDEX; 
        return;
    }


    // =====================================================
    // 2. Cargar el menú dinámicamente
    // =====================================================
    
    // 🟢 CAMBIO A RUTA CON /sos/
    fetch(RUTA_MENU_HTML) 
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error al cargar menu.html: ${response.statusText}. Ruta usada: ${RUTA_MENU_HTML}`);
            }
            return response.text();
        })
        .then(data => {

            const sidebar = document.getElementById("sidebar-placeholder");
            if (!sidebar) {
                console.warn("❌ No existe #sidebar-placeholder en este HTML");
                return; 
            }

            // Insertar el HTML del menú
            sidebar.innerHTML = data;

            // Mostrar usuario en menú
            mostrarUsuario(user);

            // Activar logout
            activarLogout();

            // Aplicar permisos por rol
            aplicarPermisosPorRol(user.rol_id); 

            // Marcar item activo
            setActiveLink();

            // Activar el menú ocultable (Push Sidebar)
            activarMenuMovil();
            
            // 🟢 LLAMADA CLAVE: Inicializa la lógica de la app actual 🟢
            if (typeof initDashboardApp === 'function') {
                initDashboardApp();
            } else if (typeof initCotizacionesApp === 'function') {
                initCotizacionesApp();
            } else if (typeof initEmpresasApp === 'function') {
                initEmpresasApp();
            } else if (typeof initFacturacionApp === 'function') {
                initFacturacionApp();
            }
        })
        .catch(error => {
            console.error("❌ Error al cargar menú:", error, error.message);
        });
});

// -----------------------------------------------------

// =====================================================
// MOSTRAR NOMBRE DEL USUARIO
// =====================================================
function mostrarUsuario(user) {
    const nameTag = document.getElementById("user-name");
    if (nameTag) nameTag.textContent = user.nombre ?? "Usuario";
}

// -----------------------------------------------------

// =====================================================
// LOGOUT (Usa ruta absoluta /sos/html/login.html)
// =====================================================
function activarLogout() {
    const logoutBtn = document.getElementById("btn-logout");
    if (!logoutBtn) return;

    logoutBtn.addEventListener("click", () => {
        const RUTA_LOGIN = "/sos/html/login.html"; // Redefinida para esta función
        localStorage.removeItem("usuario");
        // 🟢 CAMBIO A RUTA CON /sos/
        window.location.href = RUTA_LOGIN; 
    });
}

// -----------------------------------------------------

// =====================================================
// MARCAR LINK ACTIVO
// =====================================================
function setActiveLink() {
    // Obtiene solo el nombre del archivo
    const currentPage = window.location.pathname.split("/").pop(); 
    const menuLinks = document.querySelectorAll(".sidebar-menu li a");

    menuLinks.forEach(link => {
        // Obtenemos solo el nombre del archivo del href
        const linkPage = link.getAttribute("href").split("/").pop(); 
        
        // Comparamos los nombres de archivo
        if (linkPage === currentPage) {
            link.parentElement.classList.add("active");
        }
    });
}

// -----------------------------------------------------

// =====================================================
// PERMISOS POR ROL (1=Ventas, 2=Facturación, 3=Admin)
// =====================================================
function aplicarPermisosPorRol(rol) {

    const empresas = document.querySelector(".menu-empresas");
    const cotizaciones = document.querySelector(".menu-cotizaciones");
    const facturacion = document.querySelector(".menu-facturacion");
    const registro = document.querySelector(".menu-registro");

    console.log("Aplicando permisos, rol:", rol);

    // ADMIN (3)
    if (rol == 3) return;

    // VENTAS (1)
    if (rol == 1) {
        if (facturacion) facturacion.style.display = "none";
        if (registro) registro.style.display = "none";
        return;
    }

    // FACTURACIÓN (2)
    if (rol == 2) {
        if (empresas) empresas.style.display = "none";
        if (cotizaciones) cotizaciones.style.display = "none";
        if (registro) registro.style.display = "none";
        return;
    }
}

// -----------------------------------------------------

// =====================================================
// MENÚ GLOBAL (Push Sidebar)
// =====================================================
function activarMenuMovil() {
    const toggleBtn = document.getElementById("btn-toggle-menu");
    const body = document.body; 

    if (!toggleBtn) {
        console.warn("⚠ No existe el botón flotante (btn-toggle-menu) después de cargar el menú.");
        return;
    }

    // 1. Lógica del botón (toggle)
    toggleBtn.addEventListener("click", (e) => {
        e.stopPropagation(); 
        body.classList.toggle("sidebar-open");
    });

    // 2. Lógica de cerrar al clickear afuera
    document.addEventListener("click", (e) => {
        const sidebar = document.querySelector(".sidebar"); 

        if (body.classList.contains("sidebar-open") && sidebar && !sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
            body.classList.remove("sidebar-open");
        }
    });

    // 3. Cerrar el menú al hacer clic en un enlace
    const menuLinks = document.querySelectorAll(".sidebar-menu a");
    menuLinks.forEach(link => {
        link.addEventListener("click", () => {
            body.classList.remove("sidebar-open");
        });
    });
}