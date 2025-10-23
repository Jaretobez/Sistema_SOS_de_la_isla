
# 🧩 Guía básica de comandos Git

> **Objetivo:** Este documento resume los comandos más usados de Git para actualizar, subir, descargar y manejar versiones de un proyecto.

---

## 🧱 1. Configuración inicial

Antes de usar Git por primera vez en tu computadora:

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tuemail@example.com"
```

Verifica la configuración:
```bash
git config --list
```

---

## 📂 2. Crear o vincular un repositorio

### Crear un nuevo repositorio local
```bash
git init
```

### Clonar el repositorio desde GitHub
```bash
git clone https://github.com/Jaretobez/Sistema_SOS_de_la_isla.git
```

---

## 📦 3. Estado actual del proyecto

Ver qué archivos cambiaron:
```bash
git status
```

Ver las diferencias antes de guardar los cambios:
```bash
git diff
```

---

## 🧩 4. Guardar cambios

Agregar todos los archivos modificados:
```bash
git add .
```

Guardar los cambios en el historial (commit):
```bash
git commit -m "Descripción breve de los cambios"
```

Agregar un archivo específico (OPCIONAL):
```bash
git add nombre_archivo.ext
```

---

## 🔁 5. Subir y bajar cambios con GitHub

### Subir (enviar) cambios al repositorio remoto:
```bash
git push origin main
```

> 💡 Si es la primera vez:
> ```bash
> git push -u origin main
> ```

### Bajar (obtener) los cambios más recientes del repositorio remoto:
```bash
git pull origin main
```

---

## 🌿 6. Ramas (branches)

### Crear una nueva rama:
```bash
git branch nombre-rama
```

### Cambiar de rama:
```bash
git checkout nombre-rama
```

### Crear y cambiar al mismo tiempo:
```bash
git checkout -b nombre-rama
```

### Ver todas las ramas:
```bash
git branch
```

### Fusionar una rama con `main`:
```bash
git merge nombre-rama
```

---

## 🧹 7. Deshacer o revertir cambios

### Quitar un archivo del área de preparación (antes del commit):
```bash
git restore --staged nombre_archivo
```

### Restaurar un archivo a su versión anterior:
```bash
git restore nombre_archivo
```

### Revertir un commit específico:
```bash
git revert ID_DEL_COMMIT
```

### Borrar cambios locales no guardados:
```bash
git checkout -- .
```

---

## 🧭 8. Ver historial de cambios

### Ver todos los commits:
```bash
git log
```

### Ver historial resumido:
```bash
git log --oneline --graph --decorate
```

---

## ⚙️ 9. Sincronizar ramas

Traer todas las actualizaciones del remoto:
```bash
git fetch
```

Ver diferencias entre remoto y local:
```bash
git diff origin/main
```

---

## 🧰 10. Otros comandos útiles

### Ver el repositorio remoto vinculado:
```bash
git remote -v
```

### Cambiar el repositorio remoto:
```bash
git remote set-url origin https://github.com/usuario/nuevo-repo.git
```

### Limpiar archivos no rastreados:
```bash
git clean -f
```

---

## 🧾 Recomendación general de flujo de trabajo

1. **Actualizar tu repositorio local:**
   ```bash
   git pull origin main
   ```

2. **Agregar y confirmar cambios:**
   ```bash
   git add .
   git commit -m "Mensaje claro del cambio"
   ```

3. **Subir los cambios al remoto:**
   ```bash
   git push origin main
   ```

---

> ✍️ **Autor:** Guía básica para trabajar con Git y GitHub de manera colaborativa.
>  
> 💡 *Consejo:* Realiza `git pull` siempre antes de comenzar a trabajar para evitar conflictos.
