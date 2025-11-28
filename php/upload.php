<?php
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $documentName = $_POST['document_name'];
    $targetDir = "uploads/";
    $targetFile = $targetDir . basename($_FILES["document"]["name"]);
    
    // Check if the file is a valid PDF or image
    $fileType = strtolower(pathinfo($targetFile, PATHINFO_EXTENSION));
    if (in_array($fileType, ['pdf', 'jpg', 'jpeg', 'png', 'gif'])) {
        if (move_uploaded_file($_FILES["document"]["tmp_name"], $targetFile)) {
            echo "El archivo " . htmlspecialchars(basename($_FILES["document"]["name"])) . " ha sido subido exitosamente.";
        } else {
            echo "Hubo un error al subir el archivo.";
        }
    } else {
        echo "Solo se permiten archivos PDF o imágenes.";
    }
}
?>
