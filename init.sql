-- Crear base de datos (por si acaso, pero docker-compose ya la crea)
CREATE DATABASE IF NOT EXISTS incidencias_db;
USE incidencias_db;

-- Tabla roles
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

-- Tabla usuarios (incluye correo de Google)
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    correo VARCHAR(100) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    rol_id INT NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- Tabla edificios
CREATE TABLE IF NOT EXISTS edificios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

-- Tabla salones
CREATE TABLE IF NOT EXISTS salones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    edificio_id INT NOT NULL,
    FOREIGN KEY (edificio_id) REFERENCES edificios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_salon_edificio (nombre, edificio_id)
);

-- Tabla incidencias
CREATE TABLE IF NOT EXISTS incidencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    descripcion TEXT NOT NULL,
    usuario_id INT NOT NULL,
    salon_id INT NOT NULL,
    estado ENUM('Pendiente', 'En Proceso', 'Resuelto') DEFAULT 'Pendiente',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (salon_id) REFERENCES salones(id) ON DELETE CASCADE
);

-- Insertar roles
INSERT INTO roles (nombre) VALUES ('Admin'), ('Revisor'), ('Usuario');

-- Insertar edificios (FES Aragón)
INSERT INTO edificios (nombre) VALUES 
('Edificio 100'), ('Edificio 200'), ('Edificio 300'), ('Edificio 400'),
('Edificio 500'), ('Edificio 600'), ('Edificio 700'), ('Edificio 800'),
('Edificio 900'), ('Posgrado A-12'), ('Centro Tecnológico');

-- Insertar salones (3 o 4 por edificio)
INSERT INTO salones (nombre, edificio_id) VALUES
-- Edificio 100 (id=1)
('101',1), ('102',1), ('103',1), ('104',1),
-- Edificio 200 (id=2)
('201',2), ('202',2), ('203',2),
-- Edificio 300 (id=3)
('301',3), ('302',3), ('303',3), ('304',3),
-- Edificio 400 (id=4)
('401',4), ('402',4), ('403',4),
-- Edificio 500 (id=5)
('501',5), ('502',5), ('503',5), ('504',5),
-- Edificio 600 (id=6)
('601',6), ('602',6), ('603',6),
-- Edificio 700 (id=7)
('701',7), ('702',7), ('703',7),
-- Edificio 800 (id=8)
('801',8), ('802',8), ('803',8), ('804',8),
-- Edificio 900 (id=9)
('901',9), ('902',9), ('903',9),
-- Posgrado A-12 (id=10)
('A-101',10), ('A-102',10), ('A-103',10),
-- Centro Tecnológico (id=11)
('Lab Redes',11), ('Lab Electrónica',11), ('Aula Virtual',11);

-- Insertar usuarios de ejemplo (contraseña no usada, solo correo y rol)
-- Admin: admin@fes.aragon.unam.mx, Revisor: revisor@fes.aragon.unam.mx, Usuario: usuario@ejemplo.com
INSERT INTO usuarios (correo, nombre, rol_id) VALUES
('admin@fes.aragon.unam.mx', 'Administrador', 1),
('revisor@fes.aragon.unam.mx', 'Juan Pérez', 2),
('usuario@ejemplo.com', 'María López', 3);

-- Insertar incidencias de prueba
INSERT INTO incidencias (descripcion, usuario_id, salon_id, estado) VALUES
('Basura en el piso', 3, 1, 'Pendiente'),
('Baño sucio', 3, 5, 'En Proceso'),
('Pintarrón sin borrar', 3, 10, 'Resuelto'),
('Ventanas rotas', 3, 15, 'Pendiente'),
('Focos fundidos', 3, 20, 'En Proceso');