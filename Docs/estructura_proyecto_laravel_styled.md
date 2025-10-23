# Estructura del Proyecto en Laravel - Explicación Detallada

Este documento explica la estructura de carpetas y archivos de un proyecto creado con Laravel, un framework PHP popular para desarrollar aplicaciones web. Cada carpeta tiene un propósito específico, y se detallan los comandos que pueden generar o modificar archivos dentro de ellas, especialmente para un equipo de desarrollo que está empezando.

## 📦 Carpetas Principales
---

## 📁 Carpeta `app`

---
Esta es el corazón de tu aplicación Laravel. Aquí es donde escribes la lógica principal, como las reglas de negocio y cómo interactúan los datos.

### 📂 Subcarpeta `Http`
- **Qué hace**: Contiene todo lo relacionado con cómo tu aplicación responde a las peticiones que llegan desde el navegador (como cuando clicas un botón o visitas una página).
- **Detalles para novatos**: Piensa en esto como el "recepcionista" de tu app. Aquí están los controladores, que son como instrucciones que dicen qué hacer cuando alguien visita una URL. Por ejemplo, si visitas `/inicio`, un controlador decide qué mostrar.
- **Archivos importantes**: 
  - `Controllers/`: Aquí creas archivos como `HomeController.php` con `php artisan make:controller HomeController`.
  - `Middleware/`: Filtros de seguridad, como verificar si estás logueado.
- **Qué hacer**: Usa `php artisan make:controller NombreController` para crear un nuevo controlador.

### 📂 Subcarpeta `Models`
- **Qué hace**: Define cómo se ven y funcionan los datos de tu base de datos (como tablas de usuarios o productos).
- **Detalles para novatos**: Imagina que un modelo es como un plano de una mesa. Por ejemplo, el modelo `User` describe qué columnas tiene la tabla de usuarios (nombre, email, etc.). Laravel usa un sistema llamado Eloquent para esto.
- **Archivos importantes**: Archivos como `User.php` (creado con `php artisan make:model User`).
- **Qué hacer**: Crea un modelo con `php artisan make:model NombreModelo` si necesitas una nueva tabla.

### 📂 Subcarpeta `Providers`
- **Qué hace**: Configura servicios y funcionalidades extras que tu app necesita, como autenticación o conexión a bases de datos.
- **Detalles para novatos**: Piensa en esto como los "asistentes" que preparan las herramientas antes de que empieces a cocinar. Por ejemplo, `AppServiceProvider.php` inicializa cosas importantes.
- **Archivos importantes**: `AppServiceProvider.php`, `AuthServiceProvider.php`.
- **Qué hacer**: Normalmente no creas nuevos archivos aquí a menos que personalices algo avanzado con `php artisan make:provider NombreProvider`.

---

## ⚙️ Carpeta `bootstrap`

---
- **Propósito**: Contiene archivos de inicialización y configuración inicial del framework.
- **Detalles**: Aquí se configura cómo Laravel arranca y carga los servicios básicos. No necesitas modificar esto a menos que estés personalizando el arranque.
- **Comandos y Archivos**:
  - Principal archivo: `app.php` (configuración de carga de aplicaciones).
  - No se crean nuevos archivos aquí con comandos; es generado automáticamente al crear el proyecto con `composer create-project laravel/laravel nombre-proyecto`.

## ⚙️ Carpeta `config`

---
- **Qué hace**: Guarda todas las configuraciones de tu aplicación, como datos de conexión a la base de datos o claves de APIs.
- **Detalles para novatos**: Es como el manual de instrucciones de tu app. Aquí pones cosas como el nombre de tu base de datos o si usas correo electrónico. Edita estos archivos para ajustar cómo funciona tu app.
- **Archivos importantes**:
  - `app.php`: Configuración general.
  - `database.php`: Detalles de tu base de datos.
  - `mail.php`: Configuración de correo.
- **Qué hacer**: Edita estos archivos manualmente o usa `php artisan config:cache` para guardar las configuraciones y hacer que tu app vaya más rápido.

---

## 🗄️ Carpeta `database`

---
- **Qué hace**: Maneja todo lo relacionado con la base de datos, como crear tablas o llenarlas con datos de prueba.
- **Detalles para novatos**: Piensa en esto como el "taller" donde construyes y pruebas tu base de datos. Las migraciones son como planos para crear tablas, y los seeders son como recetas para llenarlas.

### 📂 Subcarpeta `factories`
- **Qué hace**: Crea datos falsos para probar tu aplicación.
- **Detalles para novatos**: Si quieres simular 100 usuarios para probar, aquí defines cómo se ven (nombre, email, etc.). Usa `php artisan make:factory NombreFactory` para crear uno.
- **Archivos importantes**: `UserFactory.php`.

### 📂 Subcarpeta `migrations`
- **Qué hace**: Contiene los "planos" para crear o cambiar tablas en la base de datos.
- **Detalles para novatos**: Cada archivo aquí (como `2025_10_13_093300_create_users_table.php`) dice cómo debe ser una tabla. Usa `php artisan migrate` para aplicar estos cambios.
- **Qué hacer**: Crea una migración con `php artisan make:migration create_nombre_table`.

### 📂 Subcarpeta `seeders`
- **Qué hace**: Llena la base de datos con datos iniciales o de prueba.
- **Detalles para novatos**: Es como llenar tu base de datos con "ingredientes" de muestra. Por ejemplo, `DatabaseSeeder.php` puede agregar usuarios de prueba.
- **Qué hacer**: Crea un seeder con `php artisan make:seeder NombreSeeder` y ejecuta `php artisan db:seed`.

### 📄 Archivo `.gitignore`
- **Qué hace**: Dice a Git qué archivos ignorar (no subir a control de versiones).
- **Detalles para novatos**: Incluye cosas como contraseñas o archivos temporales. No lo edites a menos que sepas qué haces.

---

## 📝 Carpeta `Docs`

---
- **Propósito**: Almacena documentación del proyecto.
- **Detalles**: Es un lugar para guardar manuales, guías o notas internas. No es gestionado por Laravel directamente.
- **Comandos y Archivos**:
  - No hay comandos específicos; puedes crear manualmente archivos como `README.md` o `docs/guide.md`.

## 📦 Carpeta `node_modules`

---
- **Propósito**: Contiene las dependencias de JavaScript y herramientas de construcción instaladas vía npm o yarn.
- **Detalles**: Se genera automáticamente al instalar dependencias con `npm install` o `yarn install` después de configurar `package.json`.
- **Comandos y Archivos**:
  - Usa `npm install` para instalar dependencias listadas en `package.json`.
  - No edites esta carpeta manualmente; se regenera con los comandos.

---

## 🌐 Carpeta `public`

---
- **Qué hace**: Es la carpeta que el mundo ve cuando visita tu sitio web.
- **Detalles para novatos**: Aquí van los archivos que se muestran en el navegador, como el logo, el CSS o la página principal. Es como la vitrina de tu tienda.

### 📂 Subcarpeta `build`
- **Qué hace**: Almacena archivos compilados, como CSS o JavaScript procesados.
- **Detalles para novatos**: Se llena automáticamente cuando compilas assets con `npm run build`.

### 📂 Subcarpeta `css`
- **Qué hace**: Contiene los estilos de tu sitio (cómo se ve).
- **Detalles para novatos**: Aquí van archivos como `app.css`. Se generan con `npm run dev` o `npm run build`.

### 📄 Archivo `.htaccess`
- **Qué hace**: Configura cómo el servidor web (como Apache) maneja las URLs.
- **Detalles para novatos**: No lo toques a menos que sepas de servidores. Laravel lo usa para rutas amigables.

### 📄 Archivo `favicon.ico`
- **Qué hace**: Es el icono pequeño que aparece en la pestaña del navegador.
- **Detalles para novatos**: Puedes reemplazarlo con tu propio logo si quieres.

### 📄 Archivo `index.php`
- **Qué hace**: Es el punto de entrada de tu aplicación.
- **Detalles para novatos**: Cuando visitas tu sitio, todo empieza aquí. No lo edites a menos que sea necesario.

### 📄 Archivo `robots.txt`
- **Qué hace**: Indica a los motores de búsqueda qué pueden o no indexar.
- **Detalles para novatos**: Puedes editarlo para controlar qué partes de tu sitio ven Google o Bing.

---


## 🎨 Carpeta `resources`

---
- **Propósito**: Contiene recursos no compilados como vistas, archivos de idioma y assets sin procesar.
- **Detalles**: Las vistas son plantillas HTML, y los assets (CSS, JS) se compilan desde aquí.
- **Comandos y Archivos**:
  - Usa `php artisan make:view nombre-vista` (aunque no es un comando oficial, puedes crear manualmente en `resources/views`).
  - Usa `npm run dev` para compilar assets desde `resources/css` y `resources/js`.
  - Archivos típicos: `views/welcome.blade.php`, `lang/en/messages.php`.

## 🛣️ Carpeta `routes`

---
- **Qué hace**: Define las rutas, es decir, qué pasa cuando visitas una URL específica.
- **Detalles para novatos**: Es como un mapa que dice: "Si vas a `/inicio`, muestra la página de inicio". Aquí conectas URLs con controladores.

### 📄 Archivo `console.php`
- **Qué hace**: Define comandos personalizados que puedes ejecutar desde la terminal.
- **Detalles para novatos**: Úsalo para crear tareas como enviar correos masivos con `php artisan`.

### 📄 Archivo `web.php`
- **Qué hace**: Contiene las rutas para páginas web normales.
- **Detalles para novatos**: Aquí defines rutas como `Route::get('/inicio', [HomeController::class, 'index']);`.

---

## 💾 Carpeta `storage`

---
- **Qué hace**: Guarda archivos generados por la aplicación, como logs o archivos subidos por usuarios.
- **Detalles para novatos**: Es como un archivo donde guardas cosas que tu app crea, como diarios o fotos.

### 📂 Subcarpeta `app`
- **Qué hace**: Almacena archivos que tu app genera, como imágenes subidas.
- **Detalles para novatos**: Usa `php artisan storage:link` para hacer estos archivos accesibles desde `public`.

### 📂 Subcarpeta `framework`
- **Qué hace**: Guarda datos temporales como caché y sesiones.
- **Detalles para novatos**: Laravel lo usa para ir más rápido; no lo toques.

### 📂 Subcarpeta `logs`
- **Qué hace**: Registra errores y eventos de tu app.
- **Detalles para novatos**: Mira `laravel.log` si algo falla para ver qué pasó.

---

## 🧪 Carpeta `tests`

---
- **Propósito**: Contiene pruebas unitarias y de funcionalidad.
- **Detalles**: Laravel usa PHPUnit para pruebas; aquí defines casos de prueba.
- **Comandos y Archivos**:
  - Usa `php artisan make:test NombreTest` para crear una prueba (genera en `tests/Feature` o `tests/Unit`).
  - Archivos típicos: `Feature/ExampleTest.php`, `Unit/ExampleTest.php`.

## 🧰 Carpeta `vendor`

---
- **Propósito**: Almacena las dependencias de PHP instaladas vía Composer.
- **Detalles**: Incluye el código de Laravel y otras bibliotecas. No edites manualmente.
- **Comandos y Archivos**:
  - Usa `composer install` o `composer update` para gestionar dependencias.
  - Archivos generados automáticamente.

## 📄 Archivos en la raíz

---
### 📄 Archivo `.editorconfig`
- **Propósito**: Define reglas de estilo de código para editores.
- **Detalles**: Ayuda a mantener consistencia (por ejemplo, indentación, codificación).
- **Comandos**: No se genera con comandos; edita manualmente.

### 📄 Archivo `.env`
- **Propósito**: Archivo de entorno con variables de configuración sensibles.
- **Detalles**: Contiene claves de API, nombres de bases de datos, etc. Copia de `.env.example`.
- **Comandos**: Usa `cp .env.example .env` para crear una copia editable.

### 📄 Archivo `.env.example`
- **Propósito**: Plantilla del archivo `.env` para compartir configuraciones de ejemplo.
- **Detalles**: No incluye datos sensibles; sirve como guía.
- **Comandos**: Generado al crear el proyecto.

### 📄 Archivo `.gitattributes`
- **Propósito**: Define atributos para el control de versiones Git.
- **Detalles**: Asegura consistencia en archivos de línea (por ejemplo, LF vs CRLF).
- **Comandos**: Edita manualmente.

### 📄 Archivo `.gitignore`
- **Propósito**: Especifica archivos y carpetas que Git debe ignorar.
- **Detalles**: Incluye `.env`, `node_modules`, y `vendor` para evitar subir datos sensibles.
- **Comandos**: Edita manualmente.

### 📄 Archivo `styleci`
- **Propósito**: Configuración para StyleCI, una herramienta de estilo de código.
- **Detalles**: Personaliza reglas de formato automático.
- **Comandos**: Edita manualmente.

### ⚙️ Archivo `artisan`
- **Propósito**: Archivo de comandos de Laravel.
- **Detalles**: Permite ejecutar comandos como `php artisan migrate`.
- **Comandos**: Generado al crear el proyecto.

### 📄 Archivo `CHANGELOG`
- **Propósito**: Registro de cambios en el proyecto.
- **Detalles**: Documenta versiones y actualizaciones.
- **Comandos**: Edita manualmente.

### 📄 Archivos `composer.json` y `composer.lock`
- **Propósito**: Gestionan dependencias de PHP.
- **Detalles**: `composer.json` lista las dependencias; `composer.lock` fija versiones.
- **Comandos**: Usa `composer install` o `composer update`.