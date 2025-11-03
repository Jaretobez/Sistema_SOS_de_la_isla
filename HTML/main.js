document.addEventListener("DOMContentLoaded", () => {
    // 1. Cargar el menú
    fetch("menu.html")
        .then(response => {
            if (!response.ok) {
                throw new Error("No se pudo cargar el menú.");
            }
            return response.text();
        })
        .then(data => {
            // Inyecta el HTML del menú en el placeholder
            const sidebar = document.getElementById("sidebar-placeholder");
            if (sidebar) {
                sidebar.innerHTML = data;
                // 2. Después de cargar, marcar el enlace activo
                setActiveLink();
            }
        })
        .catch(error => {
            console.error("Error al cargar el menú:", error);
            // Opcional: Muestra un error en lugar del menú
            const sidebar = document.getElementById("sidebar-placeholder");
            if(sidebar) sidebar.innerHTML = "<p style='color:red; padding:1rem;'>Error cargando menú.</p>";
        });
});

function setActiveLink() {
    // Obtiene el nombre del archivo actual (ej. "cotizaciones.html")
    const currentPage = window.location.pathname.split("/").pop();
    
    // Si no hay nombre (es la raíz), usa "index.html"
    const pageName = currentPage === "" ? "index.html" : currentPage;

    // Busca todos los enlaces del menú
    const menuLinks = document.querySelectorAll(".sidebar-menu li a");

    menuLinks.forEach(link => {
        // Obtiene el nombre del archivo del enlace
        const linkPage = link.getAttribute("href").split("/").pop();

        if (linkPage === pageName) {
            // Si coincide, añade la clase 'active' al <li> padre
            link.parentElement.classList.add("active");
        }
    });
}