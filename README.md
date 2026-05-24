# CodeArena 🏆

> Plataforma web de retos de programación — Trabajo de Final de Grado · 2º DAW

CodeArena es una aplicación web SPA (Single Page Application) que permite a los usuarios resolver retos de algoritmia, ganar puntos y competir en un ranking global. Incluye un editor de código integrado (Monaco Editor), ejecución real de JavaScript en el navegador y un panel de administración completo.

---

## Índice

1. [Descripción del proyecto](#1-descripción-del-proyecto)
2. [Características principales](#2-características-principales)
3. [Stack tecnológico](#3-stack-tecnológico)
4. [Arquitectura del sistema](#4-arquitectura-del-sistema)
5. [Estructura de ficheros](#5-estructura-de-ficheros)
6. [Base de datos](#6-base-de-datos)
7. [API REST](#7-api-rest)
8. [Frontend](#8-frontend)
9. [Panel de administración](#9-panel-de-administración)
10. [Sistema de evaluación de código](#10-sistema-de-evaluación-de-código)
11. [Despliegue con Docker](#11-despliegue-con-docker)
12. [Manual de usuario](#12-manual-de-usuario)
13. [Manual de administrador](#13-manual-de-administrador)
14. [Credenciales por defecto](#14-credenciales-por-defecto)
15. [Posibles mejoras futuras](#15-posibles-mejoras-futuras)

---

## 1. Descripción del proyecto

CodeArena nace como respuesta a la necesidad de una plataforma de práctica de programación en castellano, orientada a estudiantes de ciclos de informática y desarrollo de software. El objetivo es ofrecer un entorno donde los usuarios puedan:

- Resolver retos de programación de distintas dificultades (fácil, medio, difícil).
- Escribir y ejecutar código directamente en el navegador sin instalar nada.
- Comparar su progreso con otros usuarios a través de un ranking de puntos.
- Recibir retroalimentación inmediata sobre qué tests han pasado y cuáles no.

El proyecto está desplegado con Docker, lo que permite un arranque rápido y un entorno reproducible.

---

## 2. Características principales

| Área | Funcionalidad |
|------|---------------|
| **Autenticación** | Registro, login y logout con sesiones PHP. Contraseñas hasheadas con bcrypt. |
| **Retos** | Listado con filtro por dificultad. Tarjetas con categoría, descripción, tiempo estimado y puntos. |
| **Editor de código** | Monaco Editor (el mismo motor que VS Code) integrado via CDN con tema oscuro personalizado. |
| **Ejecución JS** | El código JavaScript del usuario se ejecuta en el navegador contra los casos de prueba reales. |
| **Feedback de tests** | Muestra input, output esperado y output obtenido para cada test case. |
| **Ranking** | Top 20 usuarios ordenados por puntos totales. Medallas para el top 3. |
| **Panel Admin** | Gestión de envíos (ver código), usuarios (toggle admin) y retos (CRUD completo). |
| **Sistema de puntos** | Los puntos se conceden una sola vez por reto resuelto. Se previene la doble puntuación. |
| **Stats globales** | Hero section con contador de retos, usuarios y envíos totales. |
| **Responsive** | Diseño adaptado a móvil, tablet y escritorio. |

---

## 3. Stack tecnológico

### Backend
| Tecnología | Versión | Uso |
|---|---|---|
| PHP | 8.2 | Lógica de servidor, API REST |
| MySQL | 8.0 | Base de datos relacional |
| Apache | 2.4 | Servidor web (módulo mod_rewrite) |
| PDO | — | Abstracción de base de datos con prepared statements |

### Frontend
| Tecnología | Versión | Uso |
|---|---|---|
| HTML5 | — | Estructura semántica de la SPA |
| CSS3 | — | Estilos, variables CSS, grid, flexbox, animaciones |
| JavaScript (Vanilla) | ES2022 | Lógica frontend, fetch API, async/await |
| Monaco Editor | 0.45.0 | Editor de código integrado (CDN) |

### DevOps
| Tecnología | Uso |
|---|---|
| Docker | Contenerización de la aplicación |
| Docker Compose | Orquestación de servicios (web + db) |

> **Sin frameworks ni dependencias npm.** Todo el frontend es Vanilla JS + CSS puro, lo que facilita la comprensión del código y el despliegue.

---

## 4. Arquitectura del sistema

```
┌─────────────────────────────────────────────────────┐
│                     NAVEGADOR                       │
│                                                     │
│   index.html ──► app.js ──► style.css               │
│        │              │                             │
│        │         Monaco Editor (CDN)                │
│        │              │                             │
│        └──── fetch() ─┘                             │
└──────────────────┬──────────────────────────────────┘
                   │ HTTP (JSON)
                   ▼
┌─────────────────────────────────────────────────────┐
│               DOCKER: Contenedor Web                │
│                                                     │
│   Apache 2.4 + PHP 8.2                              │
│   ├── /api/login.php                                │
│   ├── /api/register.php                             │
│   ├── /api/get_retos.php                            │
│   ├── /api/get_reto.php                             │
│   ├── /api/get_ranking.php                          │
│   ├── /api/get_stats.php                            │
│   ├── /api/submit_soluciones.php                    │
│   ├── /api/admin_submissions.php                    │
│   ├── /api/admin_users.php                          │
│   └── /api/admin_retos.php                          │
└──────────────────┬──────────────────────────────────┘
                   │ PDO / MySQL protocol
                   ▼
┌─────────────────────────────────────────────────────┐
│               DOCKER: Contenedor DB                 │
│                                                     │
│   MySQL 8.0                                         │
│   └── codearena                                     │
│       ├── usuarios                                  │
│       ├── retos                                     │
│       ├── casos_prueba                              │
│       ├── envios                                    │
│       └── soluciones_usuario                        │
└─────────────────────────────────────────────────────┘
```

### Flujo de una solicitud típica

```
Usuario hace click en un reto
        │
        ▼
app.js: abrirReto(id)
        │
        ▼
GET /api/get_reto.php?id=1
        │
        ▼
PHP consulta retos + casos_prueba en MySQL
        │
        ▼
JSON devuelto al cliente
        │
        ▼
Monaco Editor se inicializa con template de inicio
        │
        ▼
Usuario escribe código y pulsa "Ejecutar"
        │
        ▼
JavaScript se ejecuta en el navegador (new Function)
Resultado comparado con expected_output
        │
        ▼
Usuario pulsa "Enviar solución"
        │
        ▼
POST /api/submit_soluciones.php
        │
        ├── Guarda envío en tabla `envios`
        ├── Actualiza `soluciones_usuario`
        └── Si es primera vez → suma puntos en `usuarios`
```

---

## 5. Estructura de ficheros

```
CodeArena/
│
├── docker-compose.yml          # Orquestación de contenedores
├── Dockerfile                  # Imagen PHP 8.2 + Apache + Node.js
├── apache-config.conf          # VirtualHost de Apache
├── .env                        # Variables de entorno (no subir a producción)
├── desplegar.txt               # Instrucciones de despliegue rápido
│
├── sql/
│   └── init.sql                # Esquema de BD + datos de ejemplo
│
└── src/                        # Raíz del servidor web
    │
    ├── index.html              # SPA — única página HTML
    │
    ├── css/
    │   └── style.css           # Estilos globales (tema oscuro CodeArena)
    │
    ├── js/
    │   └── app.js              # Toda la lógica frontend
    │
    └── api/                    # Endpoints PHP
        ├── config.php          # Conexión PDO, funciones de autenticación
        ├── login.php           # POST — autenticación de usuario
        ├── register.php        # POST — registro de nuevo usuario
        ├── logout.php          # POST — destruir sesión
        ├── check_auth.php      # GET  — verificar sesión activa
        ├── get_retos.php       # GET  — listar retos (con filtro)
        ├── get_reto.php        # GET  — detalle de un reto + casos de prueba
        ├── get_ranking.php     # GET  — top 20 usuarios
        ├── get_stats.php       # GET  — estadísticas globales (hero)
        ├── submit_soluciones.php # POST — enviar solución de un reto
        ├── admin_submissions.php # GET  — envíos (solo admin)
        ├── admin_users.php     # GET/POST — gestión de usuarios (solo admin)
        ├── admin_retos.php     # GET/POST/PUT/DELETE — gestión de retos (solo admin)
        └── submit_ranking.php  # (reservado para uso futuro)
```

---

## 6. Base de datos

### Diagrama E-R (simplificado)

```
usuarios ──────< soluciones_usuario >────── retos
    │                                          │
    └──────────< envios >───────────────────── ┘
                                               │
                                          casos_prueba
```

### Tabla: `usuarios`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | INT PK AUTO_INCREMENT | Identificador único |
| `username` | VARCHAR(50) UNIQUE | Nombre de usuario |
| `email` | VARCHAR(100) UNIQUE | Correo electrónico |
| `password_hash` | VARCHAR(255) | Hash bcrypt de la contraseña |
| `puntos_total` | INT DEFAULT 0 | Puntuación acumulada |
| `is_admin` | TINYINT(1) DEFAULT 0 | 1 = administrador |
| `created_at` | TIMESTAMP | Fecha de registro |
| `last_login` | TIMESTAMP NULL | Último acceso |
| `avatar` | VARCHAR(10) DEFAULT '👤' | Emoji de avatar |

### Tabla: `retos`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | INT PK AUTO_INCREMENT | Identificador único |
| `titulo` | VARCHAR(100) | Nombre del reto |
| `categoria` | VARCHAR(50) | Arrays, Strings, Grafos... |
| `dificultad` | ENUM('easy','medium','hard') | Nivel de dificultad |
| `descripcion` | TEXT | Enunciado (acepta Markdown básico) |
| `puntos` | INT | Puntos que otorga al resolverlo |
| `tiempo_estimado` | VARCHAR(20) | Ej: "30 min" |
| `completados` | INT DEFAULT 0 | Veces que se ha resuelto |
| `activo` | TINYINT(1) DEFAULT 1 | Soft-delete: 0 = oculto |
| `created_at` | TIMESTAMP | Fecha de creación |

### Tabla: `casos_prueba`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | INT PK AUTO_INCREMENT | Identificador único |
| `reto_id` | INT FK → retos | Reto al que pertenece |
| `input` | TEXT | JSON con los argumentos: `{"nums":[2,7],"target":9}` |
| `expected_output` | TEXT | JSON con la salida esperada: `[0,1]` |
| `es_ejemplo` | TINYINT(1) DEFAULT 0 | 1 = visible al usuario como ejemplo |
| `orden` | INT DEFAULT 0 | Orden de ejecución |

### Tabla: `envios`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | INT PK AUTO_INCREMENT | Identificador único |
| `usuario_id` | INT FK → usuarios | Usuario que envía |
| `reto_id` | INT FK → retos | Reto que se intenta |
| `codigo` | TEXT | Código fuente enviado |
| `lenguaje` | VARCHAR(20) DEFAULT 'javascript' | Lenguaje de programación |
| `resultado` | ENUM('pending','success','failed') | Estado del envío |
| `puntos_obtenidos` | INT DEFAULT 0 | Puntos concedidos |
| `tiempo_ejecucion` | FLOAT | Tiempo en segundos |
| `tests_pasados` | INT DEFAULT 0 | Número de tests superados |
| `tests_total` | INT DEFAULT 0 | Total de tests |
| `created_at` | TIMESTAMP | Fecha del envío |

### Tabla: `soluciones_usuario`

| Campo | Tipo | Descripción |
|---|---|---|
| `usuario_id` | INT FK PK | Usuario |
| `reto_id` | INT FK PK | Reto |
| `resuelto` | BOOLEAN DEFAULT FALSE | Si ha resuelto el reto alguna vez |
| `intentos` | INT DEFAULT 0 | Número de envíos totales |
| `completado_at` | TIMESTAMP NULL | Cuándo lo resolvió por primera vez |

### Lógica de puntuación

```
┌─ Usuario envía solución
│
├─ ¿Todos los tests pasan?
│   ├─ NO  → resultado = 'failed', puntos_obtenidos = 0
│   │         intentos++, NO se suman puntos al usuario
│   └─ SÍ  → resultado = 'success'
│             ├─ ¿Ya lo había resuelto antes?
│             │   ├─ SÍ → intentos++, puntos_obtenidos = 0 (sin doble puntuación)
│             │   └─ NO → intentos++, puntos_obtenidos = reto.puntos
│             │            usuarios.puntos_total += reto.puntos
│             │            retos.completados++
│             └─ soluciones_usuario.resuelto = TRUE
```

---

## 7. API REST

Todos los endpoints devuelven `Content-Type: application/json`.

### Endpoints públicos

#### `GET /api/get_stats.php`
Estadísticas globales para la pantalla de inicio.

**Respuesta:**
```json
{
  "retos": 10,
  "usuarios": 42,
  "envios": 187
}
```

---

#### `GET /api/get_retos.php`
Lista los retos activos. Acepta filtro por dificultad.

**Parámetros de query:**
| Parámetro | Tipo | Ejemplo |
|---|---|---|
| `dificultad` | string | `easy`, `medium`, `hard`, `all` (por defecto) |

**Respuesta:**
```json
[
  {
    "id": 1,
    "titulo": "Dos Sumas",
    "categoria": "Arrays",
    "dificultad": "easy",
    "descripcion": "Dado un array...",
    "puntos": 100,
    "tiempo_estimado": "20 min",
    "completados": 5,
    "resuelto": false
  }
]
```
> Si el usuario tiene sesión activa, se incluye el campo `resuelto`.

---

#### `GET /api/get_reto.php?id={id}`
Devuelve el detalle completo de un reto, incluyendo sus casos de prueba.

**Respuesta:**
```json
{
  "id": 1,
  "titulo": "Dos Sumas",
  "dificultad": "easy",
  "puntos": 100,
  "descripcion": "...",
  "completados": 5,
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

---

#### `GET /api/get_ranking.php`
Devuelve el top 20 de usuarios ordenados por puntuación.

**Respuesta:**
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
      "medalla": "🥇"
    }
  ],
  "total_usuarios": 42
}
```

---

#### `POST /api/login.php`
Autentica al usuario y crea sesión PHP.

**Body:**
```json
{ "username": "xKira", "password": "mi_contraseña" }
```

**Respuesta (éxito):**
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

**Respuesta (error):**
```json
{ "error": "Usuario o contraseña incorrectos" }
```

---

#### `POST /api/register.php`
Registra un nuevo usuario.

**Body:**
```json
{ "username": "nuevo", "email": "nuevo@email.com", "password": "min6chars" }
```

**Validaciones:**
- Todos los campos son obligatorios
- Password mínimo 6 caracteres
- Email con formato válido
- Username y email deben ser únicos

---

#### `GET /api/check_auth.php`
Verifica si hay una sesión activa y refresca los datos del usuario desde la BD.

**Respuesta (autenticado):**
```json
{
  "authenticated": true,
  "user": { "id": 2, "username": "xKira", "puntos_total": 8420, "is_admin": false }
}
```

---

#### `POST /api/logout.php`
Destruye la sesión PHP.

---

### Endpoints protegidos (requieren sesión)

#### `POST /api/submit_soluciones.php`
Registra el envío de una solución y calcula el resultado.

**Body:**
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

> `resultados_cliente`: array con los resultados de ejecutar el código en el navegador (solo para JavaScript). Para otros lenguajes este campo se ignora y se usa la evaluación simulada del servidor.

**Respuesta:**
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

---

### Endpoints de administración (requieren `is_admin = 1`)

#### `GET /api/admin_submissions.php`
Lista todos los envíos del sistema.

**Parámetros opcionales:**
| Parámetro | Descripción |
|---|---|
| `resultado` | Filtrar por `success`, `failed` o `pending` |
| `limit` | Máximo de resultados (default 100, max 500) |
| `id` | Si se especifica, devuelve el detalle de ese envío concreto (incluye el código fuente) |

---

#### `GET /api/admin_users.php`
Lista todos los usuarios con estadísticas.

#### `POST /api/admin_users.php`
Actualiza el rol de un usuario.

**Body:**
```json
{ "user_id": 3, "is_admin": 1 }
```

---

#### `GET /api/admin_retos.php`
Lista todos los retos (activos e inactivos).

#### `POST /api/admin_retos.php`
Crea un nuevo reto.

**Body:**
```json
{
  "titulo": "Mi reto",
  "categoria": "Arrays",
  "dificultad": "easy",
  "puntos": 100,
  "tiempo_estimado": "20 min",
  "descripcion": "Enunciado del reto..."
}
```

#### `PUT /api/admin_retos.php`
Actualiza un reto existente. El body debe incluir `id`.

#### `DELETE /api/admin_retos.php?id={id}`
Soft-delete: pone `activo = 0` en lugar de borrar físicamente. Los envíos históricos se conservan.

---

## 8. Frontend

### SPA (Single Page Application)

La aplicación es una SPA donde todas las secciones están dentro del mismo `index.html`. La navegación se gestiona con JavaScript ocultando/mostrando secciones mediante `display: none / block`.

```
index.html
├── <nav>               → barra de navegación sticky
├── #section-hero       → pantalla de inicio con stats
├── #section-retos      → grid de tarjetas de retos
├── #section-ranking    → tabla de clasificación
├── #section-admin      → panel de administración (solo admins)
├── #loginModal         → modal de autenticación
├── #registerModal      → modal de registro
├── #retoModal          → editor fullscreen de reto
├── #codigoModal        → visor de código (admin)
└── #retoAdminModal     → formulario CRUD de retos (admin)
```

### app.js — Organización del código

```
app.js
├── ESTADO GLOBAL           → currentUser, currentRetos, monacoEditor...
├── INIT                    → DOMContentLoaded: auth + stats + sección inicial
├── MONACO EDITOR           → initMonaco(), getStarterTemplate(), changeEditorLanguage()
├── AUTH                    → checkAuth(), login(), register(), logout()
├── NAVEGACIÓN              → showSection()
├── STATS                   → loadStats()
├── RETOS                   → loadRetos(), renderRetos(), filtrarRetos()
├── RANKING                 → loadRanking(), renderRanking()
├── MODAL EDITOR            → abrirReto(), renderRetoPanel(), closeRetoModal()
├── EJECUCIÓN JS            → runTests(), runSingleTest(), renderTestResults()
├── ENVIAR SOLUCIÓN         → enviarSolucion()
├── ADMIN — ENVÍOS          → loadAdminSubmissions(), renderAdminSubmissions(), verCodigo()
├── ADMIN — USUARIOS        → loadAdminUsers(), renderAdminUsers(), toggleAdmin()
├── ADMIN — RETOS           → loadAdminRetos(), renderAdminRetos(), guardarReto(), eliminarReto()
├── ADMIN — TABS            → switchAdminTab()
├── MODALS                  → showLoginModal(), showRegisterModal(), closeModal()
├── TOASTS                  → showToast()
├── EVENT LISTENERS         → setupEventListeners()
└── HELPERS                 → escapeHtml(), formatDate(), difLabel(), markdownBasico()...
```

### Sistema de variables CSS

El tema visual se define mediante variables CSS en `:root`:

```css
:root {
    --bg:      #0f0f13;   /* Fondo principal */
    --card:    #1a1a22;   /* Tarjetas y modales */
    --border:  #2a2a38;   /* Bordes */
    --green:   #00e87a;   /* Color de acento principal */
    --yellow:  #f5c542;   /* Dificultad media / admin */
    --red:     #ff5a72;   /* Dificultad difícil / errores */
    --blue:    #4fa3e0;   /* Badges de lenguaje */
    --text:    #e0e0ec;   /* Texto principal */
    --muted:   #666680;   /* Texto secundario */
}
```

Cambiar estos valores en `style.css` actualiza todo el tema de la aplicación.

---

## 9. Panel de administración

El panel de admin es accesible desde la barra de navegación cuando el usuario tiene `is_admin = 1`. Está organizado en tres pestañas:

### Pestaña: Envíos

- Tabla con todos los envíos del sistema
- Columnas: usuario, reto, lenguaje, resultado (badge), tests pasados/total, puntos, fecha
- Filtro por resultado (todos / aprobados / fallidos / pendientes)
- Búsqueda por usuario o nombre de reto
- Botón **"Ver código"** → abre un modal con el código fuente en Monaco Editor (solo lectura)

### Pestaña: Usuarios

- Tabla con todos los usuarios registrados
- Columnas: username, email, puntos, retos resueltos, rol, fecha de registro, último acceso
- Búsqueda por usuario o email
- Botón **"Hacer admin"** / **"Quitar admin"** con confirmación
- El admin no puede quitarse sus propios permisos (validado en backend)

### Pestaña: Retos

- Tabla con todos los retos (activos e inactivos)
- Columnas: título, categoría, dificultad, puntos, resueltos, estado (activo/inactivo)
- Botón **"+ Nuevo reto"** → abre formulario modal con todos los campos
- Botón **"Editar"** → precarga el formulario con los datos del reto
- Botón **"Eliminar"** → soft-delete (activo = 0), no borra el historial de envíos

---

## 10. Sistema de evaluación de código

### JavaScript (ejecución en el navegador)

Para JavaScript, el código se ejecuta directamente en el navegador del usuario usando `new Function()`. Este enfoque permite retroalimentación instantánea sin necesidad de servidor.

**Flujo:**

```javascript
// 1. Se crea una función dinámica con los parámetros del test case
const fn = new Function(
    ...Object.keys(input),          // ["nums", "target"]
    `"use strict";
     ${userCode}                    // código del usuario
     return solution(...args);`
);

// 2. Se ejecuta con los valores del test case
const actual = fn(...Object.values(input));  // fn([2,7,11,15], 9)

// 3. Se compara con el output esperado
const passed = JSON.stringify(actual) === JSON.stringify(expected);
// "[0,1]" === "[0,1]"  → true
```

**Formato de casos de prueba:**

Los casos de prueba se almacenan en JSON en la BD. Las claves del objeto son los nombres de los parámetros de la función `solution`:

```json
{ "nums": [2, 7, 11, 15], "target": 9 }
```

El sistema extrae automáticamente los nombres de parámetros para generar la plantilla de código:

```javascript
function solution(nums, target) {
    // Escribe tu código aquí
}
```

**Limitaciones conocidas:**
- No hay sandboxing real: código malicioso podría usar `setTimeout` o bucles infinitos
- Solo funciona para JavaScript
- No hay límite de tiempo de ejecución (para una solución completa se usaría un Web Worker)

### Otros lenguajes (Python, Java, C++)

Para lenguajes distintos a JavaScript, el servidor usa una función de evaluación simulada (`simularEvaluacion()`). En un entorno de producción real se integraría con **Judge0** (API open-source de ejecución de código en sandbox).

```php
function simularEvaluacion(string $codigo, string $input, string $expected): bool {
    // TODO: Integrar con Judge0 o similar
    return rand(0, 100) > 30;  // Simulación con 70% de éxito
}
```

---

## 11. Despliegue con Docker

### Requisitos previos

- Docker Desktop instalado y en ejecución
- Git (para clonar el repositorio)

### Pasos de despliegue

```bash
# 1. Clonar el repositorio
git clone https://github.com/kolimacho/CodeArena.git
cd CodeArena

# 2. Construir y arrancar los contenedores
docker-compose up --build -d

# 3. La aplicación estará disponible en:
#    http://localhost:8080
```

### Parar la aplicación

```bash
docker-compose down          # Para los contenedores
docker-compose down -v       # Para los contenedores Y borra la BD
```

### Reiniciar solo la BD (para reimportar el SQL)

```bash
docker-compose down -v
docker-compose up --build -d
```

### Configuración de Docker Compose

```yaml
services:
  web:                          # Contenedor PHP + Apache
    build: .                    # Usa el Dockerfile del proyecto
    ports:
      - "8080:80"               # Puerto local → puerto del contenedor
    volumes:
      - ./src:/var/www/html     # El código se monta en vivo (hot reload)
    environment:
      - DB_HOST=db
      - DB_NAME=codearena
      - DB_USER=codearena_user
      - DB_PASSWORD=codearena_pass

  db:                           # Contenedor MySQL 8.0
    image: mysql:8.0
    ports:
      - "3306:3306"             # Permite conexión con clientes externos (DBeaver, etc.)
    volumes:
      - db_data:/var/lib/mysql  # Persistencia de datos
      - ./sql:/docker-entrypoint-initdb.d  # SQL se ejecuta al arrancar
```

### Conectar a la BD con un cliente externo

```
Host:     localhost
Puerto:   3306
Usuario:  codearena_user
Password: codearena_pass
BD:       codearena
```

---

## 12. Manual de usuario

### Registro e inicio de sesión

1. Pulsar **"Registro"** en la barra de navegación
2. Introducir nombre de usuario, email y contraseña (mínimo 6 caracteres)
3. Pulsar **"Crear cuenta"** → sesión iniciada automáticamente

Para iniciar sesión en una cuenta existente, pulsar **"Login"** e introducir usuario o email y contraseña.

### Resolver un reto

1. Ir a la sección **"Retos"** (se carga por defecto al entrar)
2. Filtrar por dificultad si se desea: Fácil / Medio / Difícil
3. Hacer clic en cualquier tarjeta de reto
4. Se abre el editor fullscreen:
   - **Panel izquierdo:** enunciado del problema, ejemplos de entrada/salida, información adicional
   - **Panel derecho:** editor Monaco con resaltado de sintaxis
5. Seleccionar el lenguaje de programación en el desplegable
6. Escribir la función `solution(...)` en el editor
7. Pulsar **"▶ Ejecutar"** para probar contra los casos de prueba visibles
8. El panel inferior muestra el resultado de cada test (input, esperado, obtenido)
9. Cuando el código sea correcto, pulsar **"Enviar solución"**
10. Si todos los tests pasan → se ganan los puntos del reto (una sola vez)

### Notas importantes sobre el editor

- El código debe definir una función llamada **`solution`**
- Los parámetros se extraen automáticamente de los casos de prueba
- La ejecución es inmediata en el navegador para JavaScript
- Para Python, Java y C++ la ejecución es simulada (en desarrollo)
- Pulsar `ESC` o el botón `✕` para cerrar el editor

### Ver el ranking

Ir a la sección **"Ranking"** para ver el top 20 de usuarios. El puesto actual del usuario autenticado se resalta en verde.

---

## 13. Manual de administrador

El panel de administración está disponible en la barra de navegación como **"Admin"** para los usuarios con `is_admin = 1`.

### Acceder al panel

Iniciar sesión con una cuenta de administrador → aparece el enlace "Admin" en la barra de navegación → hacer clic.

### Gestionar envíos

1. La pestaña **"📋 Envíos"** se carga por defecto al entrar al panel
2. Filtrar por resultado con el desplegable
3. Buscar por nombre de usuario o reto en el campo de búsqueda
4. Pulsar **"Ver código"** en cualquier fila para abrir el código en Monaco Editor (solo lectura)

### Gestionar usuarios

1. Ir a la pestaña **"👥 Usuarios"**
2. Ver la lista completa de usuarios registrados con sus estadísticas
3. Pulsar **"Hacer admin"** para conceder permisos de administrador a un usuario
4. Pulsar **"Quitar admin"** para retirar los permisos (no se puede aplicar a uno mismo)

### Gestionar retos

1. Ir a la pestaña **"🏆 Retos"**
2. Pulsar **"+ Nuevo reto"** para crear un reto nuevo con el formulario
3. Pulsar **"Editar"** para modificar un reto existente
4. Pulsar **"Eliminar"** para desactivar un reto (soft-delete: queda guardado en BD pero no se muestra a los usuarios)
5. Para añadir casos de prueba a un reto nuevo, hacerlo directamente en la BD o con un cliente MySQL

> **Nota:** Los casos de prueba actualmente se gestionan directamente en la base de datos. Una mejora futura sería añadir una interfaz en el panel admin para ello.

---

## 14. Credenciales por defecto

Estas credenciales se crean automáticamente al levantar Docker por primera vez:

| Usuario | Email | Contraseña | Rol |
|---|---|---|---|
| `admin` | admin@codearena.dev | `password` | Administrador |
| `xKira` | xkira@example.com | `password` | Usuario |
| `nullPointer` | null@example.com | `password` | Usuario |
| `bytewitch` | byte@example.com | `password` | Usuario |

> ⚠️ **Cambiar las contraseñas antes de un despliegue en producción.**

---

## 15. Posibles mejoras futuras

| Prioridad | Mejora |
|---|---|
| Alta | Integración con **Judge0** para ejecución segura de Python, Java y C++ en servidor |
| Alta | Gestión de casos de prueba desde el panel admin (actualmente requiere acceso directo a BD) |
| Alta | **Web Worker** para ejecutar el JS del usuario con timeout real y sin bloquear el hilo principal |
| Media | Página de perfil de usuario con historial de retos resueltos y envíos |
| Media | Sistema de **rachas** (días consecutivos resolviendo retos) |
| Media | **Modo oscuro / claro** configurable por el usuario |
| Media | Paginación en la tabla de envíos del panel admin |
| Baja | Notificaciones en tiempo real con WebSockets cuando alguien sube al ranking |
| Baja | Soporte para **Markdown completo** en las descripciones de retos |
| Baja | Exportar el código a un fichero desde el editor |
| Baja | Historial de envíos para cada reto (ver intentos anteriores) |

---

## Licencia

Proyecto académico desarrollado para el **Trabajo de Final de Grado** del ciclo formativo de **Desarrollo de Aplicaciones Web (DAW)**.

---

*CodeArena &copy; 2026 — 2º DAW*
