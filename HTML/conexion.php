<?php
// --- Variables de Conexión ---
// Reemplaza 'nombre_de_tu_bd' con el nombre que creaste en phpMyAdmin
$db_host = 'localhost';
$tu_puerto = 33065;
$db_name = 'paginasos'; 
$db_user = 'root';
$db_pass = ''; // XAMPP por defecto no tiene contraseña
$charset = 'utf8mb4'; // Buena codificación para acentos y emojis

/**
 * --- Opciones de PDO ---
 * ATTR_ERRMODE: Le dice a PDO que lance "excepciones" (errores)
 * ATTR_DEFAULT_FETCH_MODE: Le dice a PDO que devuelva los resultados como arreglos asociativos (ej: ['nombre' => 'Juan'])
 */
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

// DSN (Data Source Name): La "dirección" completa de la BD
$dsn = "mysql:host=$db_host;port=$tu_puerto;dbname=$db_name;charset=$charset";

try {
    // --- ¡AQUÍ SE CREA LA CONEXIÓN! ---
    // Guardamos la conexión en la variable $pdo
    $pdo = new PDO($dsn, $db_user, $db_pass, $options);

    // (Opcional: Puedes descomentar la siguiente línea para probar
    // y asegurarte de que conectó. Luego vuelve a comentarla.)
    // echo "¡Conexión a la base de datos '$db_name' exitosa!";

} catch (PDOException $e) {
    // --- MANEJO DE ERRORES ---
    // Si la conexión falla, el 'catch' atrapa el error
    // y detiene el script mostrando un mensaje.
    // NUNCA muestres el error detallado ($e->getMessage()) en un sitio en producción.
    die("¡Error de conexión! No se pudo conectar a la base de datos. " . $e->getMessage());
}
?>