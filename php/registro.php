<?php
// La ruta es correcta: ambos archivos están en la carpeta 'php/'.
require_once "conexion.php";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $nombre = trim($_POST["nombre"]);
    $correo = trim($_POST["correo"]);
    $contrasena = $_POST["contrasena"];
    $rol_id = $_POST["rol_id"];

    if (empty($nombre) || empty($correo) || empty($contrasena) || empty($rol_id)) {
        echo "❌ Todos los campos son obligatorios.";
        exit;
    }

    // Verificar si el correo ya está registrado
    $sql = "SELECT id FROM usuarios WHERE correo = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$correo]);

    if ($stmt->rowCount() > 0) {
        echo "⚠️ El correo ya está registrado.";
        exit;
    }

    // Hashear contraseña
    $hash = password_hash($contrasena, PASSWORD_DEFAULT);

    // Insertar nuevo usuario
    $sql = "INSERT INTO usuarios (nombre, correo, contrasena, rol_id) VALUES (?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);

    if ($stmt->execute([$nombre, $correo, $hash, $rol_id])) {
        echo "✅ Usuario registrado correctamente.";
    } else {
        echo "❌ Error al registrar el usuario.";
    }
}
?>