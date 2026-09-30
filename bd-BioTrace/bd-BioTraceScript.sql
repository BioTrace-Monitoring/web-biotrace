CREATE DATABASE IF NOT EXISTS biotrace;
USE biotrace;

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
    logradouro VARCHAR(100),
    numero VARCHAR(10),
    bairro VARCHAR(60),
    cidade VARCHAR(60),
    uf CHAR(2)
);

CREATE TABLE hospital (
    id_hospital INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nome_hospital VARCHAR(100) NOT NULL,
    cnpj CHAR(14) NOT NULL UNIQUE,
    cep CHAR(8),
    logradouro VARCHAR(100),
    numero VARCHAR(10),
    bairro VARCHAR(60),
    cidade VARCHAR(60),
    uf CHAR(2)
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