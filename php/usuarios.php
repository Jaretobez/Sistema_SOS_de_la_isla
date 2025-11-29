<?php
// php/usuarios.php
header('Content-Type: application/json');
require_once 'conexion.php';

// Detectar qué quiere hacer el usuario (listar o guardar)
$accion = $_GET['accion'] ?? $_POST['accion'] ?? '';

try {
    if ($accion === 'listar') {
        // --- MOSTRAR USUARIOS ---
        // Usamos 'Usuarios' con mayúscula porque así está en tu SQL.txt
        $stmt = $pdo->query("SELECT id, nombre, correo, rol_id FROM Usuarios ORDER BY id DESC");
        echo json_encode($stmt->fetchAll());

    } elseif ($accion === 'guardar') {
        // --- GUARDAR O EDITAR USUARIO ---
        $id = $_POST['id_usuario'] ?? ''; // Si viene ID, es edición
        $nombre = $_POST['nombre'] ?? '';
        $correo = $_POST['correo'] ?? '';
        $pass   = $_POST['contrasena'] ?? '';
        $rol    = $_POST['rol_id'] ?? '';

        if (empty($nombre) || empty($correo) || empty($rol)) {
            echo json_encode(['ok' => false, 'msg' => 'Faltan datos obligatorios']);
            exit;
        }

        if ($id == '') {
            // INSERTAR NUEVO
            if(empty($pass)) {
                echo json_encode(['ok' => false, 'msg' => 'La contraseña es obligatoria']);
                exit;
            }
            $hash = password_hash($pass, PASSWORD_DEFAULT);
            $sql = "INSERT INTO Usuarios (nombre, correo, contrasena, rol_id, fecha_registro) VALUES (?, ?, ?, ?, NOW())";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$nombre, $correo, $hash, $rol]);
            echo json_encode(['ok' => true, 'msg' => 'Usuario registrado con éxito']);

        } else {
            // EDITAR EXISTENTE
            // Solo actualizamos contraseña si el usuario escribió una nueva
            if (!empty($pass)) {
                $hash = password_hash($pass, PASSWORD_DEFAULT);
                $sql = "UPDATE Usuarios SET nombre=?, correo=?, rol_id=?, contrasena=? WHERE id=?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$nombre, $correo, $rol, $hash, $id]);
            } else {
                $sql = "UPDATE Usuarios SET nombre=?, correo=?, rol_id=? WHERE id=?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$nombre, $correo, $rol, $id]);
            }
            echo json_encode(['ok' => true, 'msg' => 'Usuario actualizado con éxito']);
        }
    } elseif ($accion === 'eliminar') {
         // --- ELIMINAR USUARIO ---
         $id = $_POST['id'] ?? '';
         $stmt = $pdo->prepare("DELETE FROM Usuarios WHERE id = ?");
         $stmt->execute([$id]);
         echo json_encode(['ok' => true, 'msg' => 'Usuario eliminado']);
    }

} catch (Exception $e) {
    echo json_encode(['ok' => false, 'msg' => 'Error SQL: ' . $e->getMessage()]);
}
?>