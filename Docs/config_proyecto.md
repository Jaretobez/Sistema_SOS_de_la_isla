
# Guía de Configuración del Proyecto

## 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/tu-repositorio.git
cd tu-repositorio
```

## 2. Crear y configurar el archivo `.env`

1. Copiar el archivo `.env.example` a `.env`:

   ```bash
   cp .env.example .env
   ```

2. Editar el archivo `.env` con los valores correspondientes a tu entorno local (por ejemplo, base de datos, claves de API, etc.).

## 3. Instalar las dependencias

### 3.1 Dependencias de PHP

1. Instalar las dependencias de PHP usando Composer:

   ```bash
   composer install
   ```

### 3.2 Dependencias de JavaScript

1. Instalar las dependencias de Node.js:

   ```bash
   npm install
   ```

## 4. Generar la clave de la aplicación

1. Ejecutar el siguiente comando para generar la clave de la aplicación:

   ```bash
   php artisan key:generate
   ```

## 5. Crear la base de datos

1. Crear la base de datos localmente con el nombre configurado en `.env`.

2. Ejecutar las migraciones para crear las tablas necesarias:

   ```bash
   php artisan migrate
   ```

3. (Opcional) Ejecutar los seeds para agregar datos de ejemplo:

   ```bash
   php artisan db:seed
   ```

## 6. Compilar los archivos de frontend

1. Compilar los archivos de frontend (CSS, JS, imágenes, etc.):

   ```bash
   npm run dev
   ```

2. Para producción, ejecutar:

   ```bash
   npm run prod
   ```

## 7. Crear enlaces simbólicos de almacenamiento

1. Crear el enlace simbólico para el almacenamiento de archivos:

   ```bash
   php artisan storage:link
   ```

## 8. (Opcional) Ejecutar las pruebas

1. Si deseas ejecutar las pruebas, usa el siguiente comando:

   ```bash
   php artisan test
   ```

## 9. ¡Listo!

Tu entorno de desarrollo está listo para usar. Ahora puedes empezar a trabajar en el proyecto.

---

### Notas

- Asegúrate de que el archivo `.env` esté configurado correctamente antes de ejecutar las migraciones o probar la conexión a la base de datos.
- Si alguna vez agregas nuevas dependencias de PHP o JavaScript, tu equipo debe ejecutar nuevamente `composer install` o `npm install` para mantener todo actualizado.

