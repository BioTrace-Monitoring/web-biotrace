CREATE DATABASE IF NOT EXISTS biotrace;
USE biotrace;

CREATE USER 'webdataviz'@'localhost' IDENTIFIED BY 'web123';


GRANT SELECT, INSERT, DELETE, UPDATE ON biotrace.* TO 'webdataviz'@'localhost';


-- ACESSO -----------------------------------------------------

CREATE TABLE cargo (
    id_cargo INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(45) NOT NULL
);

-- ORGANIZAÇÕES -------------------------------------------------

CREATE TABLE empresa (
    id_empresa INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    razao_social VARCHAR(100) NOT NULL,
    cnpj CHAR(14) NOT NULL UNIQUE,
    telefone_comercial VARCHAR(11),
    cep CHAR(8),
    numero VARCHAR(10),
    ativo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE hospital (
    id_hospital INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nome_hospital VARCHAR(100) NOT NULL,
    cnpj CHAR(14) NOT NULL UNIQUE,
    cep CHAR(8),
    numero VARCHAR(10)
);

-- USUÁRIOS -------------------------------------------------------

CREATE TABLE usuario (
    id_usuario INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nome_usuario VARCHAR(45) NOT NULL,
    dt_nasc_usuario DATE,
    telefone_usuario VARCHAR(11),
    cpf_usuario CHAR(11) NOT NULL UNIQUE,
    email_usuario VARCHAR(100) NOT NULL UNIQUE,
    senha_usuario VARCHAR(255) NOT NULL,
    fk_empresa INT NOT NULL,
    fk_cargo INT NOT NULL,
    CONSTRAINT fk_usuario_cargo FOREIGN KEY (fk_cargo) REFERENCES cargo (id_cargo),
    CONSTRAINT fk_usuario_empresa FOREIGN KEY (fk_empresa) REFERENCES empresa (id_empresa)
);

-- EQUIPAMENTOS -----------------------------------------------------

CREATE TABLE modelo_equipamento (
    id_modelo_equipamento INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nome_modelo VARCHAR(60) NOT NULL
);

CREATE TABLE lote_equipamento (
    id_lote_equipamento INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    numero_lote VARCHAR(60) NOT NULL,
    fk_empresa INT NOT NULL,
    fk_modelo_equipamento INT NOT NULL,
    CONSTRAINT fk_lote_empresa FOREIGN KEY (fk_empresa) REFERENCES empresa (id_empresa),
    CONSTRAINT fk_lote_modelo FOREIGN KEY (fk_modelo_equipamento) REFERENCES modelo_equipamento (id_modelo_equipamento)
);

CREATE TABLE equipamento (
    id_equipamento INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    numero_serie VARCHAR(60) NOT NULL UNIQUE,
    fk_hospital INT NOT NULL,
    fk_lote INT NOT NULL,
    CONSTRAINT fk_equipamento_hospital FOREIGN KEY (fk_hospital) REFERENCES hospital (id_hospital),
    CONSTRAINT fk_equipamento_lote FOREIGN KEY (fk_lote) REFERENCES lote_equipamento (id_lote_equipamento)
);

-- COMPONENTES E MÉTRICAS -------------------------------------------

CREATE TABLE tipo_componente (
    id_tipo_componente INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nome_componente VARCHAR(45) NOT NULL
);

CREATE TABLE componente (
    id_componente INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    fk_equipamento INT NOT NULL,
    fk_tipo_componente INT NOT NULL,
    CONSTRAINT fk_componente_equipamento FOREIGN KEY (fk_equipamento) REFERENCES equipamento (id_equipamento),
    CONSTRAINT fk_componente_tipo FOREIGN KEY (fk_tipo_componente) REFERENCES tipo_componente (id_tipo_componente)
);

CREATE TABLE tipo_metrica (
    id_tipo_metrica INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tipo_metrica VARCHAR(45) NOT NULL,
    unidade VARCHAR(10)
);

CREATE TABLE metrica (
    id_metrica INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    fk_tipo_metrica INT NOT NULL,
    fk_componente INT NOT NULL,
    CONSTRAINT fk_metrica_tipo FOREIGN KEY (fk_tipo_metrica) REFERENCES tipo_metrica (id_tipo_metrica),
    CONSTRAINT fk_metrica_componente FOREIGN KEY (fk_componente) REFERENCES componente (id_componente)
);

CREATE TABLE parametro_metrica (
    id_parametro_metrica INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    limite_uso DECIMAL(5,2),
    limite_ociosidade DECIMAL(5,2),
    habilitado BOOLEAN NOT NULL DEFAULT TRUE,
    fk_metrica INT NOT NULL,
    CONSTRAINT fk_parametro_metrica FOREIGN KEY (fk_metrica) REFERENCES metrica (id_metrica)
);

INSERT INTO empresa (razao_social, cnpj, telefone_comercial, cep, numero) VALUES
('BioTrace Tecnologia Ltda','12345678000101', '1133334444', '01310100', '1000');


INSERT INTO cargo (nome) VALUES
('BioTrace'),
('Administrador'),
('Gestor'),
('Analista');

INSERT INTO usuario (nome_usuario, dt_nasc_usuario, telefone_usuario, cpf_usuario, email_usuario, senha_usuario, fk_empresa, fk_cargo) VALUES
-- BioTrace (empresa 1, cargo 1)
('Ana Clara',        '1995-03-12', '11987654321', '12345678901', 'ana.clara@biotrace.com',         SHA2('ana123', 256),      1, 1),
('Bruno Rafael',     '1996-07-25', '11987654322', '23456789012', 'bruno.rafael@biotrace.com',      SHA2('bruno123', 256),    1, 1),
('Eduardo Lupianez', '1994-11-08', '11987654323', '34567890123', 'eduardo.lupianez@biotrace.com',  SHA2('eduardo123', 256),  1, 1),
('Pedro Ludovic',    '1997-02-19', '11987654324', '45678901234', 'pedro.ludovic@biotrace.com',     SHA2('pedro123', 256),    1, 1),
('Jonatas Teles',    '1993-09-14', '11987654325', '56789012345', 'jonatas.teles@biotrace.com',     SHA2('jonatas123', 256),  1, 1),
('Miguel Soares',    '1998-05-30', '11987654326', '67890123456', 'miguel.soares@biotrace.com',     SHA2('miguel123', 256),   1, 1);