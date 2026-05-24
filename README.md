# CodeArena

> Plataforma web de retos de programacion - Trabajo de Final de Grado - 2 DAW

CodeArena es una aplicacion web SPA (Single Page Application) que permite a los usuarios resolver retos de algoritmia, ganar puntos y competir en un ranking global. Incluye un editor de codigo integrado (Monaco Editor), ejecucion real de JavaScript en el navegador y un panel de administracion completo.

---

## Indice

1. [Descripcion del proyecto](#1-descripcion-del-proyecto)
2. [Caracteristicas principales](#2-caracteristicas-principales)
3. [Stack tecnologico](#3-stack-tecnologico)
4. [Arquitectura del sistema](#4-arquitectura-del-sistema)
5. [Estructura de ficheros](#5-estructura-de-ficheros)
6. [Base de datos](#6-base-de-datos)
7. [API REST](#7-api-rest)
8. [Frontend](#8-frontend)
9. [Panel de administracion](#9-panel-de-administracion)
10. [Sistema de evaluacion de codigo](#10-sistema-de-evaluacion-de-codigo)
11. [Despliegue con Docker](#11-despliegue-con-docker)
12. [Manual de usuario](#12-manual-de-usuario)
13. [Manual de administrador](#13-manual-de-administrador)
14. [Credenciales por defecto](#14-credenciales-por-defecto)
15. [Posibles mejoras futuras](#15-posibles-mejoras-futuras)

---

## 1. Descripcion del proyecto

CodeArena nace como respuesta a la necesidad de una plataforma de practica de programacion en castellano, orientada a estudiantes de ciclos de informatica y desarrollo de software. El objetivo es ofrecer un entorno donde los usuarios puedan:

- Resolver retos de programacion de distintas dificultades (facil, medio, dificil).
- Escribir y ejecutar codigo directamente en el navegador sin instalar nada.
- Comparar su progreso con otros usuarios a traves de un ranking de puntos.
- Recibir retroalimentacion inmediata sobre que tests han pasado y cuales no.

El proyecto se despliega con Docker, lo que permite un arranque rapido y un entorno reproducible en cualquier maquina.

---

## 2. Caracteristicas principales

| Area | Funcionalidad |
|------|---------------|
| **Autenticacion** | Registro, login y logout con sesiones PHP. Contrasenas hasheadas con bcrypt. |
| **Retos** | Listado con filtro por dificultad. Tarjetas con categoria, descripcion, tiempo estimado y puntos. |
| **Editor de codigo** | Monaco Editor (el mismo motor que VS Code) integrado via CDN con tema oscuro personalizado. |
| **Ejecucion JS** | El codigo JavaScript del usuario se ejecuta en el navegador contra los casos de prueba reales. |
| **Feedback de tests** | Muestra input, output esperado y output obtenido para cada test case. |
| **Ranking** | Top 20 usuarios ordenados por puntos totales. Medallas para el top 3. |
| **Panel Admin** | Gestion de envios (ver codigo), usuarios (toggle admin) y retos (CRUD completo). |
| **Sistema de puntos** | Los puntos se conceden una sola vez por reto resuelto. Se previene la doble puntuacion. |
| **Responsive** | Diseno adaptado a movil, tablet y escritorio. |

---

## 3. Stack tecnologico

### Backend

| Tecnologia | Version | Uso |
|------------|---------|-----|
| PHP | 8.2 | Logica de servidor, API REST |
| MySQL | 8.0 | Base de datos relacional |
| Apache | 2.4 | Servidor web con mod_rewrite |
| PDO | - | Abstraccion de base de datos, prepared statements |

### Frontend

| Tecnologia | Version | Uso |
|------------|---------|-----|
| HTML5 | - | Estructura semantica de la SPA |
| CSS3 | - | Estilos, variables CSS, grid, flexbox, animaciones |
| JavaScript Vanilla | ES2022 | Logica frontend, Fetch API, async/await |
| Monaco Editor | 0.45.0 | Editor de codigo integrado via CDN |

### DevOps

| Tecnologia | Uso |
|------------|-----|
| Docker | Contenorizacion de la aplicacion |
| Docker Compose | Orquestacion de servicios (web + base de datos) |

> Sin frameworks ni dependencias npm. Todo el frontend es Vanilla JS y CSS puro, lo que facilita la comprension del codigo y el despliegue.

---

## 4. Arquitectura del sistema

La aplicacion se divide en tres capas: el navegador del usuario, el servidor web PHP dentro de Docker y la base de datos MySQL en otro contenedor Docker.

```
[NAVEGADOR]
  index.html + app.js + style.css
  Monaco Editor (cargado desde CDN)
        |
        | HTTP/JSON (fetch API)
        v
[DOCKER - Contenedor Web]
  Apache 2.4 + PHP 8.2
  Endpoints disponibles:
    /api/login.php
    /api/register.php
    /api/logout.php
    /api/check_auth.php
    /api/get_retos.php
    /api/get_reto.php
    /api/get_ranking.php
    /api/get_stats.php
    /api/submit_soluciones.php
    /api/admin_submissions.php
    /api/admin_users.php
    /api/admin_retos.php
        |
        | PDO - MySQL protocol
        v
[DOCKER - Contenedor Base de Datos]
  MySQL 8.0
  Base de datos: codearena
    Tablas: usuarios, retos, casos_prueba, envios, soluciones_usuario
```

### Flujo de una solicitud tipica

```
1. Usuario hace clic en un reto
2. app.js llama a GET /api/get_reto.php?id=1
3. PHP consulta retos + casos_prueba en MySQL
4. JSON devuelto al navegador
5. Monaco Editor se inicializa con la plantilla de inicio
6. Usuario escribe su funcion solution() y pulsa "Ejecutar"
7. JavaScript se ejecuta en el navegador (new Function)
8. Resultado comparado con expected_output de cada test
9. Usuario pulsa "Enviar solucion"
10. POST /api/submit_soluciones.php
    - Guarda envio en tabla envios
    - Actualiza soluciones_usuario
    - Si es primera vez que lo resuelve: suma puntos al usuario
```

---

## 5. Estructura de ficheros

```
CodeArena/
|
+-- docker-compose.yml        Orquestacion de contenedores
+-- Dockerfile                Imagen PHP 8.2 + Apache + Node.js
+-- apache-config.conf        VirtualHost de Apache
+-- .env                      Variables de entorno
+-- README.md                 Documentacion del proyecto
|
+-- sql/
|   +-- init.sql              Esquema de BD + datos de ejemplo
|
+-- src/                      Raiz del servidor web
    |
    +-- index.html            SPA - unica pagina HTML
    |
    +-- css/
    |   +-- style.css         Estilos globales (tema oscuro CodeArena)
    |
    +-- js/
    |   +-- app.js            Toda la logica frontend
    |
    +-- api/
        +-- config.php              Conexion PDO, funciones auth
        +-- login.php               POST - autenticacion
        +-- register.php            POST - registro de usuario
        +-- logout.php              POST - cerrar sesion
        +-- check_auth.php          GET  - verificar sesion activa
        +-- get_retos.php           GET  - listar retos con filtro
        +-- get_reto.php            GET  - detalle de un reto
        +-- get_ranking.php         GET  - top 20 usuarios
        +-- get_stats.php           GET  - estadisticas globales
        +-- submit_soluciones.php   POST - enviar solucion
        +-- admin_submissions.php   GET  - envios (solo admin)
        +-- admin_users.php         GET/POST - gestion usuarios (solo admin)
        +-- admin_retos.php         GET/POST/PUT/DELETE - gestion retos (solo admin)
```

---

## 6. Base de datos

### Diagrama de relaciones

```
usuarios ------< soluciones_usuario >------ retos
    |                                          |
    +----------< envios >---------------------+
                                               |
                                          casos_prueba
```

### Tabla: usuarios

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | INT PK AUTO_INCREMENT | Identificador unico |
| username | VARCHAR(50) UNIQUE | Nombre de usuario |
| email | VARCHAR(100) UNIQUE | Correo electronico |
| password_hash | VARCHAR(255) | Hash bcrypt de la contrasena |
| puntos_total | INT DEFAULT 0 | Puntuacion acumulada |
| is_admin | TINYINT(1) DEFAULT 0 | 1 = administrador |
| created_at | TIMESTAMP | Fecha de registro |
| last_login | TIMESTAMP NULL | Ultimo acceso |
| avatar | VARCHAR(10) | Emoji de avatar |

### Tabla: retos

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | INT PK AUTO_INCREMENT | Identificador unico |
| titulo | VARCHAR(100) | Nombre del reto |
| categoria | VARCHAR(50) | Arrays, Strings, Grafos... |
| dificultad | ENUM('easy','medium','hard') | Nivel de dificultad |
| descripcion | TEXT | Enunciado del reto |
| puntos | INT | Puntos que otorga al resolverlo |
| tiempo_estimado | VARCHAR(20) | Ejemplo: "30 min" |
| completados | INT DEFAULT 0 | Veces que ha sido resuelto |
| activo | TINYINT(1) DEFAULT 1 | Soft-delete: 0 = oculto |
| created_at | TIMESTAMP | Fecha de creacion |

### Tabla: casos_prueba

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | INT PK AUTO_INCREMENT | Identificador unico |
| reto_id | INT FK | Reto al que pertenece |
| input | TEXT | JSON con los argumentos de entrada |
| expected_output | TEXT | JSON con la salida esperada |
| es_ejemplo | TINYINT(1) DEFAULT 0 | 1 = visible al usuario como ejemplo |
| orden | INT DEFAULT 0 | Orden de ejecucion |

Ejemplo de input para el reto "Dos Sumas":
```json
{ "nums": [2, 7, 11, 15], "target": 9 }
```
Expected output:
```json
[0, 1]
```

### Tabla: envios

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | INT PK AUTO_INCREMENT | Identificador unico |
| usuario_id | INT FK | Usuario que envia |
| reto_id | INT FK | Reto que se intenta |
| codigo | TEXT | Codigo fuente enviado |
| lenguaje | VARCHAR(20) | Lenguaje de programacion |
| resultado | ENUM('pending','success','failed') | Estado del envio |
| puntos_obtenidos | INT DEFAULT 0 | Puntos concedidos |
| tests_pasados | INT DEFAULT 0 | Numero de tests superados |
| tests_total | INT DEFAULT 0 | Total de tests del reto |
| tiempo_ejecucion | FLOAT | Tiempo en segundos |
| created_at | TIMESTAMP | Fecha del envio |

### Tabla: soluciones_usuario

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| usuario_id | INT FK PK | Usuario |
| reto_id | INT FK PK | Reto |
| resuelto | BOOLEAN DEFAULT FALSE | Si ha resuelto el reto alguna vez |
| intentos | INT DEFAULT 0 | Numero de envios totales |
| completado_at | TIMESTAMP NULL | Cuando lo resolvio por primera vez |

### Logica de puntuacion

```
Usuario envia solucion
  |
  +-- Todos los tests pasan?
      |
      +-- NO  --> resultado = 'failed'
      |          intentos++
      |          puntos_obtenidos = 0
      |          NO se suman puntos al usuario
      |
      +-- SI  --> resultado = 'success'
                  intentos++
                  |
                  +-- Ya lo habia resuelto antes?
                      |
                      +-- SI --> puntos_obtenidos = 0 (sin doble puntuacion)
                      |
                      +-- NO --> puntos_obtenidos = reto.puntos
                                 usuarios.puntos_total += reto.puntos
                                 retos.completados++
                                 soluciones_usuario.resuelto = TRUE
```

---

## 7. API REST

Todos los endpoints devuelven `Content-Type: application/json`.

### Endpoints publicos

#### GET /api/get_stats.php
Estadisticas globales para la pantalla de inicio.

Respuesta:
```json
{
  "retos": 10,
  "usuarios": 42,
  "envios": 187
}
```

#### GET /api/get_retos.php
Lista los retos activos. Acepta filtro por dificultad mediante el parametro `dificultad` (valores: `easy`, `medium`, `hard`, `all`).

Respuesta:
```json
[
  {
    "id": 1,
    "titulo": "Dos Sumas",
    "categoria": "Arrays",
    "dificultad": "easy",
    "puntos": 100,
    "tiempo_estimado": "20 min",
    "completados": 5,
    "resuelto": false
  }
]
```

#### GET /api/get_reto.php?id={id}
Devuelve el detalle completo de un reto incluyendo sus casos de prueba.

Respuesta:
```json
{
  "id": 1,
  "titulo": "Dos Sumas",
  "dificultad": "easy",
  "puntos": 100,
  "descripcion": "...",
  "resuelto": false,
  "casos_prueba": [
    {
      "id": 1,
      "input": "{\"nums\":[2,7,11,15],\"target\":9}",
      "expected_output": "[0,1]",
      "es_ejemplo": 1,
      "orden": 1
    }
  ]
}
```

#### GET /api/get_ranking.php
Devuelve el top 20 de usuarios ordenados por puntuacion.

Respuesta:
```json
{
  "success": true,
  "ranking": [
    {
      "id": 2,
      "username": "xKira",
      "puntos_total": 8420,
      "resueltos": 12,
      "iniciales": "XK",
      "medalla": "primer puesto"
    }
  ],
  "total_usuarios": 42
}
```

#### POST /api/login.php
Autentica al usuario y crea sesion PHP.

Body:
```json
{ "username": "xKira", "password": "mi_contrasena" }
```

Respuesta correcta:
```json
{
  "success": true,
  "user": {
    "id": 2,
    "username": "xKira",
    "email": "xkira@example.com",
    "puntos_total": 8420,
    "is_admin": false
  }
}
```

Respuesta de error:
```json
{ "error": "Usuario o contrasena incorrectos" }
```

#### POST /api/register.php
Registra un nuevo usuario. Campos obligatorios: `username`, `email`, `password` (minimo 6 caracteres).

Validaciones del servidor:
- Todos los campos son obligatorios
- La contrasena debe tener al menos 6 caracteres
- El email debe tener formato valido
- El username y el email deben ser unicos en la base de datos

#### GET /api/check_auth.php
Verifica si hay una sesion activa y refresca los datos del usuario desde la base de datos.

#### POST /api/logout.php
Destruye la sesion PHP del usuario.

### Endpoints protegidos (requieren sesion activa)

#### POST /api/submit_soluciones.php
Registra el envio de una solucion y calcula el resultado.

Body:
```json
{
  "reto_id": 1,
  "codigo": "function solution(nums, target) { ... }",
  "lenguaje": "javascript",
  "resultados_cliente": [
    { "passed": true, "error": null },
    { "passed": true, "error": null }
  ]
}
```

El campo `resultados_cliente` contiene los resultados de ejecutar el codigo en el navegador. Solo se usa cuando el lenguaje es JavaScript.

Respuesta:
```json
{
  "success": true,
  "passed": true,
  "tests_pasados": 4,
  "tests_total": 4,
  "puntos_ganados": 100,
  "ya_resuelto": false,
  "time": "0.002s"
}
```

### Endpoints de administracion (requieren is_admin = 1)

#### GET /api/admin_submissions.php
Lista todos los envios del sistema. Parametros opcionales: `resultado` (filtro por estado), `limit` (maximo de resultados), `id` (detalle de un envio concreto con el codigo fuente).

#### GET /api/admin_users.php
Lista todos los usuarios con estadisticas completas.

#### POST /api/admin_users.php
Actualiza el rol de un usuario.

Body:
```json
{ "user_id": 3, "is_admin": 1 }
```

#### GET /api/admin_retos.php
Lista todos los retos incluyendo los desactivados.

#### POST /api/admin_retos.php
Crea un nuevo reto. Campos: `titulo`, `categoria`, `dificultad`, `puntos`, `tiempo_estimado`, `descripcion`.

#### PUT /api/admin_retos.php
Actualiza un reto existente. El body debe incluir el campo `id`.

#### DELETE /api/admin_retos.php?id={id}
Desactiva un reto (soft-delete: pone `activo = 0`). Los envios historicos se conservan.

---

## 8. Frontend

### Estructura de la SPA

La aplicacion es una SPA donde todas las secciones coexisten en el mismo `index.html`. La navegacion se gestiona con JavaScript mostrando y ocultando secciones mediante `display: none / block`.

```
index.html
  nav                  --> barra de navegacion fija en la parte superior
  section#section-hero --> pantalla de inicio con estadisticas
  section#section-retos --> grid de tarjetas de retos
  section#section-ranking --> tabla de clasificacion
  section#section-admin --> panel de administracion (solo admins)
  div#loginModal       --> modal de autenticacion
  div#registerModal    --> modal de registro
  div#retoModal        --> editor fullscreen del reto
  div#codigoModal      --> visor de codigo del admin
  div#retoAdminModal   --> formulario CRUD de retos para el admin
```

### Organizacion del archivo app.js

```
app.js
  Estado global       --> currentUser, currentRetos, monacoEditor...
  Init                --> DOMContentLoaded: auth + seccion inicial
  Monaco Editor       --> initMonaco(), getStarterTemplate(), changeEditorLanguage()
  Autenticacion       --> checkAuth(), login(), register(), logout()
  Navegacion          --> showSection()
  Retos               --> loadRetos(), renderRetos(), filtrarRetos()
  Ranking             --> loadRanking(), renderRanking()
  Modal editor        --> abrirReto(), renderRetoPanel(), closeRetoModal()
  Ejecucion JS        --> runTests(), runSingleTest(), renderTestResults()
  Enviar solucion     --> enviarSolucion()
  Admin - Envios      --> loadAdminSubmissions(), verCodigo()
  Admin - Usuarios    --> loadAdminUsers(), toggleAdmin()
  Admin - Retos       --> loadAdminRetos(), guardarReto(), eliminarReto()
  Admin - Tabs        --> switchAdminTab()
  Modales             --> showLoginModal(), showRegisterModal(), closeModal()
  Notificaciones      --> showToast()
  Event listeners     --> setupEventListeners()
  Helpers             --> escapeHtml(), formatDate(), difLabel()...
```

### Variables CSS del tema

El tema visual se define mediante variables CSS en `:root`. Cambiarlas actualiza toda la apariencia de la aplicacion:

```css
:root {
    --bg:      #0f0f13;   /* Fondo principal */
    --card:    #1a1a22;   /* Tarjetas y modales */
    --border:  #2a2a38;   /* Bordes */
    --green:   #00e87a;   /* Color de acento principal */
    --yellow:  #f5c542;   /* Dificultad media / admin */
    --red:     #ff5a72;   /* Dificultad dificil / errores */
    --blue:    #4fa3e0;   /* Badges de lenguaje */
    --text:    #e0e0ec;   /* Texto principal */
    --muted:   #666680;   /* Texto secundario */
}
```

---

## 9. Panel de administracion

El panel de admin es accesible desde la barra de navegacion cuando el usuario tiene `is_admin = 1`. Esta organizado en tres pestanas:

### Pestana: Envios

- Tabla con todos los envios del sistema
- Columnas: usuario, reto, lenguaje, resultado, tests pasados/total, puntos, fecha
- Filtro por resultado: todos / aprobados / fallidos / pendientes
- Boton "Ver codigo" que abre el codigo fuente del envio en un visor de texto

### Pestana: Usuarios

- Tabla con todos los usuarios registrados y sus estadisticas
- Columnas: username, email, puntos, retos resueltos, rol, fecha de registro, ultimo acceso
- Boton "Hacer admin" o "Quitar admin" con confirmacion previa
- Un admin no puede quitarse sus propios permisos (validado en el backend)

### Pestana: Retos

- Tabla con todos los retos (activos e inactivos)
- Columnas: titulo, categoria, dificultad, puntos, resueltos, estado
- Boton "+ Nuevo reto" que abre un formulario modal con todos los campos
- Boton "Editar" que precarga el formulario con los datos del reto seleccionado
- Boton "Eliminar" que realiza un soft-delete (activo = 0)

---

## 10. Sistema de evaluacion de codigo

### JavaScript: ejecucion en el navegador

Para JavaScript, el codigo del usuario se ejecuta directamente en el navegador mediante `new Function()`. Esto permite retroalimentacion instantanea sin necesidad de un servidor de ejecucion.

Como funciona:

```javascript
// 1. Se obtiene el input del caso de prueba
const input = JSON.parse('{"nums":[2,7,11,15],"target":9}');
// input = { nums: [2,7,11,15], target: 9 }

// 2. Se crea una funcion dinamica con el codigo del usuario
const fn = new Function(
    'nums', 'target',          // nombres de los parametros
    '"use strict";' +
    userCode +                 // codigo escrito por el usuario
    'return solution(nums, target);'
);

// 3. Se ejecuta con los valores del caso de prueba
const actual = fn([2,7,11,15], 9);

// 4. Se compara con el output esperado
const passed = JSON.stringify(actual) === JSON.stringify([0,1]);
// "[0,1]" === "[0,1]" --> true
```

Los nombres de los parametros se extraen automaticamente de las claves del JSON del caso de prueba, y se usan para generar la plantilla inicial que ve el usuario en el editor:

```javascript
function solution(nums, target) {
    // Escribe tu codigo aqui

}
```

### Otros lenguajes

Para Python, Java y C++, la evaluacion es simulada en el servidor. En un entorno de produccion se integraria con Judge0, que es una API open-source para ejecutar codigo en un entorno aislado (sandbox).

```php
function simularEvaluacion($codigo, $input, $expected): bool {
    // TODO: Integrar con Judge0 en produccion
    return rand(0, 100) > 30;
}
```

---

## 11. Despliegue con Docker

### Requisitos previos

- Docker Desktop instalado y en ejecucion
- Git instalado

### Pasos para desplegar

```bash
# 1. Clonar el repositorio
git clone https://github.com/kolimacho/CodeArena.git
cd CodeArena

# 2. Construir y arrancar los contenedores
docker-compose up --build -d

# 3. Abrir la aplicacion en el navegador
# http://localhost:8080
```

La primera vez tarda entre 2 y 3 minutos porque Docker descarga las imagenes base y compila las extensiones de PHP.

### Comandos utiles

```bash
# Ver logs en tiempo real
docker-compose logs -f web

# Parar los contenedores
docker-compose down

# Parar y borrar la base de datos (reinicio completo)
docker-compose down -v
docker-compose up --build -d

# Ver el estado de los contenedores
docker-compose ps
```

### Conectar a la base de datos con un cliente externo (DBeaver, TablePlus...)

```
Host:     localhost
Puerto:   3306
Usuario:  codearena_user
Contrasena: codearena_pass
Base de datos: codearena
```

### Descripcion del Dockerfile

```dockerfile
FROM php:8.2-apache

# Extensiones PHP necesarias para MySQL
RUN docker-php-ext-install mysqli pdo pdo_mysql

# Activar mod_rewrite de Apache
RUN a2enmod rewrite

# Node.js (disponible para uso futuro: compilacion, Judge0...)
RUN apt-get update && apt-get install -y nodejs npm

# Configuracion del VirtualHost de Apache
COPY apache-config.conf /etc/apache2/sites-available/000-default.conf
```

---

## 12. Manual de usuario

### Registro e inicio de sesion

1. Pulsar el boton "Registro" en la barra de navegacion superior.
2. Introducir nombre de usuario, email y contrasena (minimo 6 caracteres).
3. Pulsar "Crear cuenta". La sesion se inicia automaticamente.

Para iniciar sesion en una cuenta existente: pulsar "Login" e introducir el usuario o email junto con la contrasena.

### Resolver un reto

1. Entrar en la seccion "Retos" (se carga por defecto al abrir la web).
2. Filtrar por dificultad si se desea: Facil, Medio o Dificil.
3. Hacer clic en la tarjeta del reto que se quiera resolver.
4. Se abre el editor a pantalla completa:
   - Panel izquierdo: enunciado del problema y ejemplos de entrada/salida.
   - Panel derecho: editor Monaco con resaltado de sintaxis.
5. Seleccionar el lenguaje de programacion en el desplegable superior.
6. Escribir la funcion `solution(...)` en el editor.
7. Pulsar el boton "Ejecutar" para probar el codigo contra los casos de prueba.
8. El panel inferior muestra el resultado de cada test (input, esperado, obtenido).
9. Cuando el codigo sea correcto, pulsar "Enviar solucion".
10. Si todos los tests pasan, se suman los puntos al perfil (solo la primera vez).

Nota: pulsar la tecla Escape o el boton de cerrar cierra el editor sin enviar.

### Ver el ranking

Acceder a la seccion "Ranking" desde la barra de navegacion. Se muestran los 20 mejores usuarios ordenados por puntos totales. El usuario autenticado aparece resaltado en verde.

---

## 13. Manual de administrador

El enlace "Admin" aparece en la barra de navegacion solo para usuarios con `is_admin = 1`.

### Gestion de envios

1. Abrir el panel de administracion. La pestana "Envios" se carga por defecto.
2. Usar el desplegable para filtrar por resultado.
3. Pulsar "Ver codigo" en cualquier fila para ver el codigo fuente del envio.

### Gestion de usuarios

1. Ir a la pestana "Usuarios".
2. Se muestra la lista completa de usuarios con sus estadisticas.
3. Pulsar "Hacer admin" para conceder permisos de administrador.
4. Pulsar "Quitar admin" para retirar los permisos (no aplica sobre uno mismo).

### Gestion de retos

1. Ir a la pestana "Retos".
2. Pulsar "+ Nuevo reto" para crear un reto con el formulario.
3. Pulsar "Editar" para modificar un reto existente.
4. Pulsar "Eliminar" para desactivar un reto (permanece en la base de datos pero no se muestra a los usuarios).

---

## 14. Credenciales por defecto

Estos usuarios se crean automaticamente al levantar Docker por primera vez mediante el archivo `sql/init.sql`.

| Usuario | Email | Contrasena | Rol |
|---------|-------|------------|-----|
| admin | admin@codearena.dev | password | Administrador |
| xKira | xkira@example.com | password | Usuario |
| nullPointer | null@example.com | password | Usuario |
| bytewitch | byte@example.com | password | Usuario |

**Importante:** cambiar las contrasenas antes de cualquier despliegue en produccion.

---

## 15. Posibles mejoras futuras

| Prioridad | Mejora |
|-----------|--------|
| Alta | Integracion con Judge0 para ejecucion segura de Python, Java y C++ en el servidor |
| Alta | Gestion de casos de prueba desde el panel admin (actualmente se hace directamente en la BD) |
| Alta | Uso de Web Worker para ejecutar el JS del usuario con timeout real sin bloquear el navegador |
| Media | Pagina de perfil de usuario con historial de retos resueltos y envios |
| Media | Sistema de rachas (dias consecutivos resolviendo retos) |
| Media | Paginacion en la tabla de envios del panel admin |
| Baja | Notificaciones en tiempo real cuando alguien sube posiciones en el ranking |
| Baja | Soporte para Markdown completo en las descripciones de retos |
| Baja | Opcion de exportar el codigo escrito en el editor a un fichero |
| Baja | Historial de intentos anteriores para cada reto |

---

## Licencia

Proyecto academico desarrollado como Trabajo de Final de Grado del ciclo formativo de Desarrollo de Aplicaciones Web (DAW).

CodeArena 2025 - 2 DAW
