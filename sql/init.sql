-- Forzar UTF-8 desde el inicio
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS codearena
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
USE codearena;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    puntos_total INT DEFAULT 0,
    is_admin TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    avatar VARCHAR(10) DEFAULT '👤'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de retos
CREATE TABLE IF NOT EXISTS retos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(100) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    dificultad ENUM('easy', 'medium', 'hard') NOT NULL,
    descripcion TEXT NOT NULL,
    puntos INT NOT NULL,
    tiempo_estimado VARCHAR(20),
    completados INT DEFAULT 0,
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de casos de prueba
CREATE TABLE IF NOT EXISTS casos_prueba (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reto_id INT,
    input TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    es_ejemplo TINYINT(1) DEFAULT 0,
    orden INT DEFAULT 0,
    FOREIGN KEY (reto_id) REFERENCES retos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de envíos de soluciones
CREATE TABLE IF NOT EXISTS envios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    reto_id INT,
    codigo TEXT NOT NULL,
    lenguaje VARCHAR(20) DEFAULT 'javascript',
    resultado ENUM('pending', 'success', 'failed') DEFAULT 'pending',
    puntos_obtenidos INT DEFAULT 0,
    tiempo_ejecucion FLOAT,
    tests_pasados INT DEFAULT 0,
    tests_total INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (reto_id) REFERENCES retos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de soluciones resueltas por usuarios
CREATE TABLE IF NOT EXISTS soluciones_usuario (
    usuario_id INT,
    reto_id INT,
    resuelto BOOLEAN DEFAULT FALSE,
    intentos INT DEFAULT 0,
    completado_at TIMESTAMP NULL,
    PRIMARY KEY (usuario_id, reto_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (reto_id) REFERENCES retos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- DATOS INICIALES: RETOS (2 fácil · 1 medio · 1 difícil)
-- =====================
INSERT INTO retos (titulo, categoria, dificultad, descripcion, puntos, tiempo_estimado) VALUES

-- Fácil 1
('FizzBuzz', 'Lógica', 'easy',
 'Dado un número entero `n`, devuelve un array de strings con los números del 1 al n donde:\n- Los múltiplos de 3 se sustituyen por `"Fizz"`\n- Los múltiplos de 5 se sustituyen por `"Buzz"`\n- Los múltiplos de 3 y 5 se sustituyen por `"FizzBuzz"`\n- El resto son el número como string.',
 80, '15 min'),

-- Fácil 2
('Contar vocales', 'Strings', 'easy',
 'Dada una cadena `s`, cuenta y devuelve el **número de vocales** (a, e, i, o, u) que contiene. La búsqueda debe ser **insensible a mayúsculas**.',
 60, '10 min'),

-- Medio
('Mayor producto de subarray', 'Programación Dinámica', 'medium',
 'Dado un array de enteros `nums`, encuentra el **subarray contiguo** (que contenga al menos un número) que tenga el mayor producto y devuelve ese producto.\n\nEl array puede contener ceros y números negativos.',
 300, '50 min'),

-- Difícil
('Buscar en array rotado', 'Arrays', 'hard',
 'Dado un array de enteros `nums` ordenado en orden ascendente que ha sido **rotado** en algún pivote desconocido, y un entero `target`, devuelve el **índice** de `target` si está en el array, o `-1` si no está.\n\nDebes implementar un algoritmo con complejidad de tiempo `O(log n)`.',
 450, '55 min');

-- =====================
-- CASOS DE PRUEBA
-- =====================

-- Reto 1: FizzBuzz
INSERT INTO casos_prueba (reto_id, input, expected_output, es_ejemplo, orden) VALUES
(1, '{"n":3}',  '["1","2","Fizz"]',                                                                        1, 1),
(1, '{"n":5}',  '["1","2","Fizz","4","Buzz"]',                                                             1, 2),
(1, '{"n":15}', '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]',0, 3),
(1, '{"n":1}',  '["1"]',                                                                                   0, 4);

-- Reto 2: Contar vocales
INSERT INTO casos_prueba (reto_id, input, expected_output, es_ejemplo, orden) VALUES
(2, '{"s":"hello"}',  '2', 1, 1),
(2, '{"s":"AEIOU"}',  '5', 1, 2),
(2, '{"s":"rhythm"}', '0', 0, 3),
(2, '{"s":"OpenAI"}', '4', 0, 4);

-- Reto 3: Mayor producto de subarray
INSERT INTO casos_prueba (reto_id, input, expected_output, es_ejemplo, orden) VALUES
(3, '{"nums":[2,3,-2,4]}',  '6',  1, 1),
(3, '{"nums":[-2,0,-1]}',   '0',  1, 2),
(3, '{"nums":[-2,3,-4]}',   '24', 0, 3),
(3, '{"nums":[0,2]}',       '2',  0, 4);

-- Reto 4: Buscar en array rotado
INSERT INTO casos_prueba (reto_id, input, expected_output, es_ejemplo, orden) VALUES
(4, '{"nums":[4,5,6,7,0,1,2],"target":0}', '4',  1, 1),
(4, '{"nums":[4,5,6,7,0,1,2],"target":3}', '-1', 1, 2),
(4, '{"nums":[1],"target":0}',             '-1', 0, 3),
(4, '{"nums":[1,3],"target":3}',           '1',  0, 4);

-- =====================
-- USUARIOS DE EJEMPLO (admin + jugadores)
-- =====================
INSERT INTO usuarios (username, email, password_hash, puntos_total, is_admin) VALUES
('admin', 'admin@codearena.dev', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 0, 1),
('javier', 'javier@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 8420, 0),
('pepe', 'pepe@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 7850, 0),
('carlos', 'carlos@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 6990, 0);
-- Contraseña para todos: "password"
