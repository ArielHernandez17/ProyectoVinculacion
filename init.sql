CREATE DATABASE IF NOT EXISTS incidencias_db;
USE incidencias_db;

CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    correo VARCHAR(100) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    rol_id INT NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS edificios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS salones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    edificio_id INT NOT NULL,
    FOREIGN KEY (edificio_id) REFERENCES edificios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_salon_edificio (nombre, edificio_id)
);

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

INSERT INTO roles (nombre) VALUES ('Admin'), ('Revisor'), ('Usuario');

INSERT INTO edificios (nombre) VALUES 
('A1'), ('A2'), ('A3'), ('A4'), ('A5'), ('A6'), ('A7'), ('A8'), ('A9'), ('A10'), ('A11'), ('A12'),
('Lab1'), ('Lab2'), ('Lab3'), ('Lab4');

-- A1
INSERT INTO salones (nombre, edificio_id) VALUES
('A110',1),('A111',1),('A112',1),('A113',1),('A114',1),
('A210',1),('A211',1),('A212',1),('A213',1),('A214',1),
('A310',1),('A311',1),('A312',1),('A313',1),('A314',1);
-- A2
INSERT INTO salones (nombre, edificio_id) VALUES
('A120',2),('A121',2),('A122',2),('A123',2),('A124',2),
('A220',2),('A221',2),('A222',2),('A223',2),('A224',2),
('A320',2),('A321',2),('A322',2),('A323',2),('A324',2);
-- A3
INSERT INTO salones (nombre, edificio_id) VALUES
('A130',3),('A131',3),('A132',3),('A133',3),('A134',3),
('A230',3),('A231',3),('A232',3),('A233',3),('A234',3),
('A330',3),('A331',3),('A332',3),('A333',3),('A334',3);
-- A4
INSERT INTO salones (nombre, edificio_id) VALUES
('A140',4),('A141',4),('A142',4),('A143',4),('A144',4),
('A240',4),('A241',4),('A242',4),('A243',4),('A244',4),
('A340',4),('A341',4),('A342',4),('A343',4),('A344',4);
-- A5
INSERT INTO salones (nombre, edificio_id) VALUES
('A150',5),('A151',5),('A152',5),('A153',5),('A154',5),
('A250',5),('A251',5),('A252',5),('A253',5),('A254',5),
('A350',5),('A351',5),('A352',5),('A353',5),('A354',5);
-- A6
INSERT INTO salones (nombre, edificio_id) VALUES
('A160',6),('A161',6),('A162',6),('A163',6),('A164',6),
('A260',6),('A261',6),('A262',6),('A263',6),('A264',6),
('A360',6),('A361',6),('A362',6),('A363',6),('A364',6);
-- A7
INSERT INTO salones (nombre, edificio_id) VALUES
('A170',7),('A171',7),('A172',7),('A173',7),('A174',7),
('A270',7),('A271',7),('A272',7),('A273',7),('A274',7),
('A370',7),('A371',7),('A372',7),('A373',7),('A374',7);
-- A8
INSERT INTO salones (nombre, edificio_id) VALUES
('A180',8),('A181',8),('A182',8),('A183',8),('A184',8),
('A280',8),('A281',8),('A282',8),('A283',8),('A284',8),
('A380',8),('A381',8),('A382',8),('A383',8),('A384',8);
-- A9
INSERT INTO salones (nombre, edificio_id) VALUES
('A190',9),('A191',9),('A192',9),('A193',9),('A194',9),
('A290',9),('A291',9),('A292',9),('A293',9),('A294',9),
('A390',9),('A391',9),('A392',9),('A393',9),('A394',9);
-- A10
INSERT INTO salones (nombre, edificio_id) VALUES
('A1100',10),('A1101',10),('A1102',10),('A1103',10),('A1104',10),
('A2100',10),('A2101',10),('A2102',10),('A2103',10),('A2104',10),
('A3100',10),('A3101',10),('A3102',10),('A3103',10),('A3104',10);
-- A11
INSERT INTO salones (nombre, edificio_id) VALUES
('A1110',11),('A1111',11),('A1112',11),('A1113',11),('A1114',11),
('A2110',11),('A2111',11),('A2112',11),('A2113',11),('A2114',11),
('A3110',11),('A3111',11),('A3112',11),('A3113',11),('A3114',11);
-- A12
INSERT INTO salones (nombre, edificio_id) VALUES
('A1120',12),('A1121',12),('A1122',12),('A1123',12),('A1124',12),
('A2120',12),('A2121',12),('A2122',12),('A2123',12),('A2124',12),
('A3120',12),('A3121',12),('A3122',12),('A3123',12),('A3124',12);

INSERT INTO usuarios (correo, nombre, rol_id) VALUES
('admin@fes.aragon.unam.mx', 'Administrador', 1),
('revisor@fes.aragon.unam.mx', 'Juan Pérez', 2),
('usuario@ejemplo.com', 'María López', 3);

INSERT INTO incidencias (descripcion, usuario_id, salon_id, estado) VALUES
('Basura en el piso', 3, 1, 'Pendiente'),
('Baño sucio', 3, 6, 'En Proceso'),
('Pintarrón sin borrar', 3, 11, 'Resuelto');