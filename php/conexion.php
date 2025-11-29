<?php
// --- Variables de Conexión ---
$db_host = 'localhost';
$db_name = 'sos'; // Basado en tu archivo SQL [cite: 1, 2]
$db_user = 'root';
$db_pass = ''; 

// ⚠️ IMPORTANTE: Verifica tu puerto en XAMPP.
// Si en el panel de XAMPP dice "Port: 3306", cambia esto a 3306.
$tu_puerto = 3308; 

$charset = 'utf8mb4';

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

$dsn = "mysql:host=$db_host;port=$tu_puerto;dbname=$db_name;charset=$charset";

try {
    $pdo = new PDO($dsn, $db_user, $db_pass, $options);
    
    // NO descomentes el echo en producción, rompe el JSON.
    // echo "Conectado"; 

} catch (PDOException $e) {
    // Si falla, detenemos todo y enviamos un error JSON para que JS lo detecte
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Error de Conexión: ' . $e->getMessage()]);
    exit;
}
?>