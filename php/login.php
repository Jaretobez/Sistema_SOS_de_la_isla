<?php
// login.php
header('Content-Type: application/json');
// CORRECCIÓN CLAVE: Ambos archivos están en la carpeta 'php/', usar ruta directa.
require_once 'conexion.php'; 

// Verificar conexión
if (!isset($pdo) && !isset($conn)) {
    echo json_encode(['status' => 'error', 'message' => 'Error: no se encontró la conexión a la base de datos.']);
    exit;
}

// Obtener datos del formulario
$correo = $_POST['correo'] ?? '';
$contrasena = $_POST['contrasena'] ?? '';

if (empty($correo) || empty($contrasena)) {
    echo json_encode(['status' => 'error', 'message' => 'Faltan datos.']);
    exit;
}

try {
    // Soporte para PDO o mysqli
    if (isset($pdo)) {
        $stmt = $pdo->prepare("SELECT id, nombre, rol_id, contrasena FROM usuarios WHERE correo = ?");
        $stmt->execute([$correo]);
        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
    } else {
        $stmt = $conn->prepare("SELECT id, nombre, rol_id, contrasena FROM usuarios WHERE correo = ?");
        $stmt->bind_param("s", $correo);
        $stmt->execute();
        $usuario = $stmt->get_result()->fetch_assoc();
    }

    // Verificar credenciales
    if ($usuario && password_verify($contrasena, $usuario['contrasena'])) {

        // NO usamos session_start() ni $_SESSION
        // Solo devolvemos los datos, porque JS usará localStorage

        echo json_encode([
            'status' => 'ok',
            'message' => 'Inicio de sesión correcto',
            'nombre'  => $usuario['nombre'],
            'rol_id'  => $usuario['rol_id'],
            'user_id' => $usuario['id']
        ]);

    } else {
        echo json_encode(['status' => 'error', 'message' => 'Usuario o contraseña incorrectos']);
    }

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Error en el servidor: ' . $e->getMessage()]);
}
?>