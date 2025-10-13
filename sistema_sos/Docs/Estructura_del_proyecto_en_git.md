# 📁 Estructura del proyecto en Git (Monorepo)

## 🧱 Estructura general

```
/siatema_sos
  /.env.example
  /docs
  /frontend
    /public
      /images
    /src
      /modules
        /contactos
        /cotizaciones
        /documentos
        /dashboard
        /inicio
      /shared
        /components
        /hooks
        /utils
        /styles
    index.html
  /backend                 # Laravel API (PHP)
    /app
      /Http
        /Controllers
          /Api
            /V1
              AuthController.php
              ContactosController.php
              CotizacionesController.php
              DocumentosController.php
    /bootstrap /config /resources /routes /storage /tests
    /database
    /public
      /storage
    routes/api.php
    composer.json
    .env.example
```

---

## 🖥️ Frontend

| Carpeta / Archivo | Función |
|--------------------|----------|
| `/public` | Archivos públicos que se sirven directamente sin compilar: `favicon.ico`, imágenes, `manifest.json`, etc. |
| `/src` | Código fuente principal del frontend. Aquí vive todo el JS, TS, HTML y CSS de la app. |
| `/modules` | División por módulos o funcionalidades. Cada módulo tiene su propio conjunto de archivos (páginas, controladores, estilos, APIs, etc.). Ejemplo: `/modules/auth`, `/modules/contactos`, `/modules/documentos`. |
| `/shared` | Contiene elementos reutilizables que se comparten entre módulos. |

**Subcarpetas dentro de `/shared`:**

- `/components`: Componentes visuales globales (Navbar, Sidebar, Modal, Button, Table, etc.)
- `/hooks`: Hooks personalizados o lógica reutilizable (ej. `useAuth()`, `useFetch()`).
- `/utils`: Funciones utilitarias o *helpers* (`http.ts`, validadores, formateadores de texto o fecha).
- `/styles`: Variables globales de diseño (colores, tipografía, `variables.css`, `theme.css`).

---

## ⚙️ Backend (Laravel API)

| Carpeta / Archivo | Función |
|--------------------|----------|
| `/app` | Contiene la lógica principal del backend (MVC y más). |
| `/Http/Controllers` | Controladores que gestionan las peticiones. Se agrupan por versión de API y módulo (`AuthController.php`, `ContactosController.php`, etc.). |
| `/Http/Middleware` | Código que se ejecuta antes o después de una petición (autenticación, logs o CORS). |
| `/Http/Requests` | Clases *FormRequest* que validan datos de entrada. |
| `/Http/Resources` | Transformadores que definen cómo se devuelve la información en formato JSON. |
| `/Models` | Modelos de Eloquent ORM. Representan tablas de la base de datos y definen relaciones. |
| `/Services` | Lógica de negocio compleja separada del controlador. |
| `/Policies` | Reglas de autorización (quién puede hacer qué). |
| `/Repositories` | (Opcional) Manejo del acceso a datos si separas los modelos de la lógica de consultas. |
| `/Jobs`, `/Events`, `/Notifications` | Código para tareas asincrónicas, eventos del sistema o notificaciones por correo. |
| `/bootstrap` | Configuración del arranque de Laravel. |
| `/config` | Archivos de configuración (base de datos, mail, cache, CORS, etc.). |
| `/resources` | Archivos de vistas, traducciones y plantillas (si usas Blade). |
| `/routes` | Define todas las rutas (`api.php`, `web.php`). |
| `/storage` | Archivos generados por la app (logs, uploads, cache). |
| `/tests` | Pruebas automáticas. |
| `/database` | Migraciones, seeders y factories. |

**Subcarpetas importantes dentro de `/database`:**
- `/migrations`: Scripts que crean o modifican tablas.
- `/seeders`: Datos iniciales de prueba o configuración.
- `/factories`: Plantillas para generar datos falsos.

**Otros archivos clave:**
- `/public`: Carpeta pública que expone el contenido del backend (`index.php`, assets).
- `/public/storage`: Enlace simbólico (creado con `php artisan storage:link`) que muestra archivos subidos.
- `routes/api.php`: Define las rutas API REST.
- `composer.json`: Lista de librerías y dependencias PHP.
- `.env.example`: Variables de entorno de ejemplo.

---

## 🌐 Visibilidad y rol de carpetas

| Carpeta / Archivo | Qué hace | Visible al público | Importancia |
|--------------------|----------|--------------------|--------------|
| `/public` | Carpeta visible desde Internet (HTML, CSS, JS, `index.php`) | ✅ Sí | Punto de entrada del sitio |
| `/public/storage` | Enlace a `/storage/app/public` para mostrar archivos subidos | ✅ Parcial | Permite ver imágenes o documentos |
| `/routes/api.php` | Define las URLs de tus APIs | ❌ No | Conecta backend con frontend |
| `composer.json` | Lista dependencias PHP | ❌ No | Reinstala todo el proyecto |
| `.env.example` | Variables de entorno de ejemplo | ✅ (solo ejemplo) | Muestra qué variables necesita la app |

---

## 🚀 En resumen

| Zona | Rol principal |
|------|----------------|
| **Frontend** (`/frontend/...`) | Interfaz de usuario: pantallas, estilos, componentes. |
| **Backend** (`/app`, `/routes`, `/database`) | Lógica, APIs, base de datos, seguridad. |
| **Infraestructura y Configuración** (`/scripts`, `/infrastructure`, `.env.example`, `composer.json`, `package.json`) | Automatización, dependencias y entorno. |

---

## 🧩 ¿Qué es el archivo `.env`?

El archivo `.env` (de *environment*, “ambiente” o “entorno”) guarda **variables de configuración privadas** del proyecto.

Son datos que no deben estar escritos directamente en el código, porque cambian entre tu computadora y el servidor, o son secretos (como contraseñas o claves de API).

**Ejemplo:**
```env
APP_NAME=MiProyecto
APP_ENV=local
APP_KEY=base64:ABC123XYZ...
APP_DEBUG=true
APP_URL=http://localhost

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=miproyecto_db
DB_USERNAME=appuser
DB_PASSWORD=SuperSegura123!

MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=micorreo@gmail.com
MAIL_PASSWORD=clave-del-correo
MAIL_ENCRYPTION=tls
```

---

✅ **Recomendación:**  
Nunca subas el archivo `.env` a GitHub o repositorios públicos. Usa `.env.example` como plantilla segura.
