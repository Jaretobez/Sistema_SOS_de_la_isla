function uploadFile(documentType) {
    const fileInput = document.getElementById(documentType);
    const formData = new FormData();
    
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        formData.append('document', file);
        formData.append('document_name', documentType);

        fetch('upload.php', {
            method: 'POST',
            body: formData,
        })
        .then(response => response.text())
        .then(data => {
            alert(data);
        })
        .catch(error => {
            console.error('Error:', error);
        });
    } else {
        alert("Por favor, selecciona un archivo.");
    }
}
