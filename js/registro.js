document.getElementById("formRegistro").addEventListener("submit", async (e) => {
    e.preventDefault();

    const datos = new FormData(e.target);

    // 🟢 CORRECCIÓN DE RUTA: Sube de 'js/' (../) y entra a 'php/'
    const respuesta = await fetch("../php/registro.php", {
        method: "POST",
        body: datos
    });

    const resultado = await respuesta.text();
    // NOTA: Usar alert() es una práctica desaconsejada en web modernas. 
    // Si tienes un div de mensaje en registro.html, úsalo para mostrar el resultado.
    alert(resultado); 
    e.target.reset();
});