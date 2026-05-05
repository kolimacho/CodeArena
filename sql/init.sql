-- Crear base de datos
CREATE DATABASE IF NOT EXISTS codearena;
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
);

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
);

-- Tabla de casos de prueba
CREATE TABLE IF NOT EXISTS casos_prueba (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reto_id INT,
    input TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    es_ejemplo TINYINT(1) DEFAULT 0,
    orden INT DEFAULT 0,
    FOREIGN KEY (reto_id) REFERENCES retos(id) ON DELETE CASCADE
);

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
);

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
);

-- =====================
-- DATOS INICIALES: RETOS
-- =====================
INSERT INTO retos (titulo, categoria, dificultad, descripcion, puntos, tiempo_estimado) VALUES
('Dos Sumas', 'Arrays', 'easy',
 'Dado un array de enteros `nums` y un entero `target`, devuelve los **índices** de los dos números que sumen el objetivo.\n\nPuedes asumir que cada entrada tiene exactamente una solución, y no puedes usar el mismo elemento dos veces.\n\nPuedes devolver la respuesta en cualquier orden.',
 100, '20 min'),

('Palíndromo válido', 'Strings', 'easy',
 'Una frase es un **palíndromo** si, ignorando mayúsculas/minúsculas y caracteres no alfanuméricos, se lee igual hacia adelante que hacia atrás.\n\nDados los caracteres alfanuméricos de la cadena `s`, devuelve `true` si es palíndromo, o `false` en caso contrario.',
 120, '20 min'),

('FizzBuzz', 'Lógica', 'easy',
 'Dado un número entero `n`, devuelve un array de strings con los números del 1 al n donde:\n- Los múltiplos de 3 se sustituyen por `"Fizz"`\n- Los múltiplos de 5 se sustituyen por `"Buzz"`\n- Los múltiplos de 3 y 5 se sustituyen por `"FizzBuzz"`\n- El resto son el número como string.',
 80, '15 min'),

('Invertir array', 'Arrays', 'easy',
 'Dado un array `nums`, devuelve el array invertido **sin usar** el método `.reverse()` nativo.\n\nDebes implementar la lógica manualmente.',
 70, '10 min'),

('Contar vocales', 'Strings', 'easy',
 'Dada una cadena `s`, cuenta y devuelve el **número de vocales** (a, e, i, o, u) que contiene. La búsqueda debe ser **insensible a mayúsculas**.',
 60, '10 min'),

('Mayor producto de subarray', 'Programación Dinámica', 'medium',
 'Dado un array de enteros `nums`, encuentra el **subarray contiguo** (que contenga al menos un número) que tenga el mayor producto y devuelve ese producto.\n\nEl array puede contener ceros y números negativos.',
 300, '50 min'),

('Número de islas', 'Grafos', 'medium',
 'Dado un grid 2D `grid` de `"1"`s (tierra) y `"0"`s (agua), cuenta el número de **islas**.\n\nUna isla está rodeada por agua y se forma conectando tierras adyacentes horizontal o verticalmente. Puedes asumir que los cuatro bordes del grid están rodeados de agua.',
 280, '40 min'),

('Árbol balanceado', 'Árboles', 'medium',
 'Dado un árbol binario, determina si está **equilibrado en altura**.\n\nUn árbol equilibrado en altura es un árbol binario en el que la profundidad de los dos subárboles de cada nodo nunca difiere en más de 1.',
 250, '45 min'),

('Ciclo en grafo', 'Grafos', 'hard',
 'Dado un grafo dirigido representado como una **lista de adyacencia** (objeto donde las claves son nodos y los valores son arrays de nodos destino), detecta si existe un **ciclo** en el grafo.\n\nDevuelve `true` si hay ciclo, `false` si no.',
 500, '60 min'),

('Buscar en array rotado', 'Arrays', 'hard',
 'Dado un array de enteros `nums` ordenado en orden ascendente que ha sido **rotado** en algún pivote desconocido, y un entero `target`, devuelve el **índice** de `target` si está en el array, o `-1` si no está.\n\nDebes implementar un algoritmo con complejidad de tiempo `O(log n)`.',
 450, '55 min');

-- =====================
-- CASOS DE PRUEBA
-- =====================

-- Reto 1: Dos Sumas
INSERT INTO casos_prueba (reto_id, input, expected_output, es_ejemplo, orden) VALUES
(1, '{"nums":[2,7,11,15],"target":9}', '[0,1]', 1, 1),
(1, '{"nums":[3,2,4],"target":6}', '[1,2]', 1, 2),
(1, '{"nums":[3,3],"target":6}', '[0,1]', 0, 3),
(1, '{"nums":[1,2,3,4,5],"target":9}', '[3,4]', 0, 4);

-- Reto 2: Palíndromo
INSERT INTO casos_prueba (reto_id, input, expected_output, es_ejemplo, orden) VALUES
(2, '{"s":"A man, a plan, a canal: Panama"}', 'true', 1, 1),
(2, '{"s":"race a car"}', 'false', 1, 2),
(2, '{"s":" "}', 'true', 0, 3),
(2, '{"s":"Was it a car or a cat I saw?"}', 'true', 0, 4);

-- Reto 3: FizzBuzz
INSERT INTO casos_prueba (reto_id, input, expected_output, es_ejemplo, orden) VALUES
(3, '{"n":3}', '["1","2","Fizz"]', 1, 1),
(3, '{"n":5}', '["1","2","Fizz","4","Buzz"]', 1, 2),
(3, '{"n":15}', '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]', 0, 3);

-- Reto 4: Invertir array
INSERT INTO casos_prueba (reto_id, input, expected_output, es_ejemplo, orden) VALUES
(4, '{"nums":[1,2,3,4,5]}', '[5,4,3,2,1]', 1, 1),
(4, '{"nums":[1,2]}', '[2,1]', 1, 2),
(4, '{"nums":[1]}', '[1]', 0, 3),
(4, '{"nums":[3,1,4,1,5,9,2,6]}', '[6,2,9,5,1,4,1,3]', 0, 4);

-- Reto 5: Contar vocales
INSERT INTO casos_prueba (reto_id, input, expected_output, es_ejemplo, orden) VALUES
(5, '{"s":"hello"}', '2', 1, 1),
(5, '{"s":"AEIOU"}', '5', 1, 2),
(5, '{"s":"rhythm"}', '0', 0, 3),
(5, '{"s":"OpenAI"}', '4', 0, 4);

-- Reto 6: Mayor producto subarray (sin casos de prueba ejecutables en browser fácilmente)
INSERT INTO casos_prueba (reto_id, input, expected_output, es_ejemplo, orden) VALUES
(6, '{"nums":[2,3,-2,4]}', '6', 1, 1),
(6, '{"nums":[-2,0,-1]}', '0', 1, 2),
(6, '{"nums":[-2,3,-4]}', '24', 0, 3);

-- =====================
-- USUARIOS DE EJEMPLO (admin + jugadores)
-- =====================
INSERT INTO usuarios (username, email, password_hash, puntos_total, is_admin) VALUES
('admin', 'admin@codearena.dev', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 0, 1),
('xKira', 'xkira@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 8420, 0),
('nullPointer', 'null@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 7850, 0),
('bytewitch', 'byte@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 6990, 0);
-- Contraseña para todos: "password"
