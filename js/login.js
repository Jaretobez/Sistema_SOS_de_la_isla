document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formLogin");
    const mensaje = document.getElementById("mensaje");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const datos = new FormData(form);

        try {
            // La ruta es correcta: sube de 'js/' (../) y entra a 'php/login.php'
            const response = await fetch("../php/login.php", {
                method: "POST",
                body: datos
            });

            const result = await response.json();

            if (result.status === "ok") {

                // Guardar sesión del usuario
                localStorage.setItem("usuario", JSON.stringify({
                    id: result.usuario_id,
                    nombre: result.nombre,
                    rol_id: result.rol_id
                }));

                mensaje.style.color = "green";
                mensaje.textContent = `Bienvenido ${result.nombre}`;

                setTimeout(() => {
                    // La ruta es correcta: sube de 'js/' (../) a 'index.html' en la raíz
                    window.location.href = "../index.html"; 
                }, 1500);
            } else {
                mensaje.style.color = "red";
                mensaje.textContent = result.message;
            }

        } catch (error) {
            mensaje.style.color = "red";
            mensaje.textContent = "Error al conectar con el servidor.";
            console.error(error);
        }
    });
});