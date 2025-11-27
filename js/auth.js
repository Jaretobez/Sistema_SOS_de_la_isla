// ===========================
// VERIFICAR SESIÓN
// ===========================
function verificarSesion(nombreArchivoActual) {
    const sesion = localStorage.getItem("usuario");

    // 1. Si NO hay sesión
    if (!sesion) {
        // Si no estoy en login.html, redirijo a login.html
        if (nombreArchivoActual !== "login.html") {
            // Asumo que login.html está en ../html/
            window.location.href = "../html/login.html"; 
        }
        return;
    }

    const usuario = JSON.parse(sesion);

    // 2. Si SI hay sesión y estoy en login.html
    if (nombreArchivoActual === "login.html" || nombreArchivoActual === "registro.html") {
        // Redirigir al dashboard (que está en la raíz: ../index.html)
        window.location.href = "../index.html"; 
        return;
    }

    // 3. Mostrar nombre del usuario (Solo si no es login/registro)
    const spanNombre = document.getElementById("user-name");
    if (spanNombre) {
        spanNombre.textContent = usuario.usuario;
    }

    // 4. Control de roles
    // NOTA: La lógica de control de roles la hemos dejado en main.js 
    // para que se ejecute después de que el menú se haya cargado por fetch.
    // Si necesitas el control aquí, debes asegurarte de que el menú exista.
    // Aquí solo se deja la función por si se usa en otro lugar, pero la llamada en este
    // script se omite para evitar el error de DOM que tuvimos anteriormente.
    // aplicarControlDeRoles(usuario.rol_id); 
}

// ===========================
// CONTROL DE ROLES (OCULTA MENÚS)
// Esta función fue movida a main.js para funcionar con el fetch del menú.
// Se deja aquí si se requiere en otras partes del JS.
// ===========================
function aplicarControlDeRoles(rol) {
    // Esta función se mantiene, pero la recomendación es usar la versión en main.js
    // ya que verifica que el menú esté cargado antes de ocultar elementos.
    const menuEmpresas = document.querySelector(".menu-empresas");
    const menuCotizaciones = document.querySelector(".menu-cotizaciones");
    const menuFacturacion = document.querySelector(".menu-facturacion");

    rol = Number(rol);

    if (rol === 3) return;

    if (rol === 1) {
        if (menuFacturacion) menuFacturacion.style.display = "none";
        return;
    }

    if (rol === 2) {
        if (menuEmpresas) menuEmpresas.style.display = "none";
        if (menuCotizaciones) menuCotizaciones.style.display = "none";
        return;
    }
}


// ===========================
// CERRAR SESIÓN
// ===========================
function prepararLogout() {
    // Esta función ya no es necesaria aquí si el logout se maneja en main.js.
    // Se deja para completar el archivo, pero debe ser llamada solo si se requiere.
    const btnLogout = document.getElementById("btn-logout");
    if (!btnLogout) return;

    btnLogout.addEventListener("click", () => {
        localStorage.removeItem("usuario");
        // Redirigir al login (../html/login.html)
        window.location.href = "../html/login.html"; 
    });
}

// ===========================
// INICIO AUTOMÁTICO
// ===========================
document.addEventListener("DOMContentLoaded", () => {
    // Obtiene solo el nombre del archivo (ej: 'login.html')
    const nombreArchivo = window.location.pathname.split("/").pop(); 
    
    // Inicia la verificación de sesión
    verificarSesion(nombreArchivo);
    
    // Prepara el botón de logout, si existe en la página actual
    prepararLogout();
});