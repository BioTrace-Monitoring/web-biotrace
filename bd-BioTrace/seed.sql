USE biotrace;

-- CARGOS
INSERT INTO cargo (nome) VALUES
('BioTrace'),
('Administrador'),
('Gestor'),
('Analista');

-- EMPRESAS
INSERT INTO empresa (razao_social, cnpj, telefone_comercial, cep, numero) VALUES
('BioTrace Tecnologia Ltda',          '12345678000101', '1133334444', '01310100', '1000'),
('BioMed Sistemas Hospitalares Ltda', '23456789000102', '1144445555', '04538132', '1500'),
('HealthTech Equipamentos Ltda',      '34567890000103', '1155556666', '04037000', '2000');

-- HOSPITAIS
INSERT INTO hospital (nome_hospital, cnpj, cep, numero) VALUES
('Hospital São Lucas',       '45678901000104', '04037000', '500'),
('Hospital Vida Paulista',   '56789012000105', '01310100', '750'),
('Hospital Regional do ABC', '67890123000106', '09715000', '1200');

-- USUÁRIOS
INSERT INTO usuario (nome_usuario, dt_nasc_usuario, telefone_usuario, cpf_usuario, email_usuario, senha_usuario, fk_empresa, fk_cargo) VALUES
-- BioTrace (empresa 1, cargo 1)
('Ana Clara',        '1995-03-12', '11987654321', '12345678901', 'ana.clara@biotrace.com',         SHA2('ana123', 256),      1, 1),
('Bruno Rafael',     '1996-07-25', '11987654322', '23456789012', 'bruno.rafael@biotrace.com',      SHA2('bruno123', 256),    1, 1),
('Eduardo Lupianez', '1994-11-08', '11987654323', '34567890123', 'eduardo.lupianez@biotrace.com',  SHA2('eduardo123', 256),  1, 1),
('Pedro Ludovic',    '1997-02-19', '11987654324', '45678901234', 'pedro.ludovic@biotrace.com',     SHA2('pedro123', 256),    1, 1),
('Jonatas Teles',    '1993-09-14', '11987654325', '56789012345', 'jonatas.teles@biotrace.com',     SHA2('jonatas123', 256),  1, 1),
('Miguel Soares',    '1998-05-30', '11987654326', '67890123456', 'miguel.soares@biotrace.com',     SHA2('miguel123', 256),   1, 1),
-- BioMed (empresa 2)
('Marcos Oliveira',  '1988-07-22', '11976543210', '89012345678', 'marcos@biomed.com',              SHA2('marcos123', 256),   2, 2),
('Carlos Santos',    '1992-11-03', '11965432109', '90123456789', 'carlos@biomed.com',              SHA2('carlos123', 256),   2, 3),
('Ana Souza',        '1995-02-18', '11954321098', '01234567890', 'ana@biomed.com',                 SHA2('ana123', 256),      2, 4),
-- HealthTech (empresa 3)
('Ricardo Alves',    '1985-09-10', '11943210987', '11122233344', 'ricardo@healthtech.com',         SHA2('ricardo123', 256),  3, 2),
('Juliana Costa',    '1990-06-25', '11932109876', '22233344455', 'juliana@healthtech.com',         SHA2('juliana123', 256),  3, 3),
('Felipe Martins',   '1997-01-30', '11921098765', '78901234567', 'felipe@healthtech.com',          SHA2('felipe123', 256),   3, 4);

-- MODELOS DE EQUIPAMENTO
INSERT INTO modelo_equipamento (nome_modelo) VALUES
('BioTrace Monitor X100'),
('BioTrace Monitor X200'),
('BioTrace Monitor Pro');

-- LOTES DE EQUIPAMENTO (numero_lote, fk_empresa, fk_modelo_equipamento)
INSERT INTO lote_equipamento (numero_lote, fk_empresa, fk_modelo_equipamento) VALUES
('LOTE-2026-001', 2, 1),
('LOTE-2026-002', 2, 2),
('LOTE-2026-003', 3, 3),
('LOTE-2026-004', 3, 1);

-- EQUIPAMENTOS (numero_serie, fk_hospital, fk_lote)
INSERT INTO equipamento (numero_serie, fk_hospital, fk_lote) VALUES
('BTX100-00001', 1, 1),
('BTX100-00002', 1, 1),
('BTX200-00001', 2, 2),
('BTX200-00002', 2, 2),
('BTPRO-00001',  3, 3),
('BTX100-00003', 3, 4);

-- TIPOS DE COMPONENTE
INSERT INTO tipo_componente (nome_componente) VALUES
('CPU'),
('RAM'),
('DISCO');

-- COMPONENTES (fk_equipamento, fk_tipo_componente)
INSERT INTO componente (fk_equipamento, fk_tipo_componente) VALUES
(1, 1), (1, 2), (1, 3),
(2, 1), (2, 2), (2, 3),
(3, 1), (3, 2), (3, 3),
(4, 1), (4, 2), (4, 3),
(5, 1), (5, 2), (5, 3),
(6, 1), (6, 2), (6, 3);

-- TIPOS DE MÉTRICA
INSERT INTO tipo_metrica (tipo_metrica, unidade) VALUES
('Uso da CPU',       '%'),
('Uso da RAM',       '%'),
('Uso do Disco',     '%'),
('Leitura do Disco', 'MB/s'),
('Escrita do Disco', 'MB/s');

-- MÉTRICAS (fk_tipo_metrica, fk_componente)
INSERT INTO metrica (fk_tipo_metrica, fk_componente) VALUES
-- Equipamento 1
(1, 1), (2, 2), (3, 3), (4, 3), (5, 3),
-- Equipamento 2
(1, 4), (2, 5), (3, 6), (4, 6), (5, 6),
-- Equipamento 3
(1, 7), (2, 8), (3, 9), (4, 9), (5, 9),
-- Equipamento 4
(1, 10), (2, 11), (3, 12), (4, 12), (5, 12),
-- Equipamento 5
(1, 13), (2, 14), (3, 15), (4, 15), (5, 15),
-- Equipamento 6
(1, 16), (2, 17), (3, 18), (4, 18), (5, 18);

-- PARÂMETROS DAS MÉTRICAS (limite_uso, limite_ociosidade, habilitado, fk_metrica)
INSERT INTO parametro_metrica (limite_uso, limite_ociosidade, habilitado, fk_metrica) VALUES
-- Equipamento 1
(80.00, 20.00, TRUE, 1), (80.00, 20.00, TRUE, 2), (90.00, 10.00, TRUE, 3), (NULL, NULL, TRUE, 4), (NULL, NULL, TRUE, 5),
-- Equipamento 2
(80.00, 20.00, TRUE, 6), (80.00, 20.00, TRUE, 7), (90.00, 10.00, TRUE, 8), (NULL, NULL, TRUE, 9), (NULL, NULL, TRUE, 10),
-- Equipamento 3
(80.00, 20.00, TRUE, 11), (80.00, 20.00, TRUE, 12), (90.00, 10.00, TRUE, 13), (NULL, NULL, TRUE, 14), (NULL, NULL, TRUE, 15),
-- Equipamento 4
(80.00, 20.00, TRUE, 16), (80.00, 20.00, TRUE, 17), (90.00, 10.00, TRUE, 18), (NULL, NULL, TRUE, 19), (NULL, NULL, TRUE, 20),
-- Equipamento 5
(80.00, 20.00, TRUE, 21), (80.00, 20.00, TRUE, 22), (90.00, 10.00, TRUE, 23), (NULL, NULL, TRUE, 24), (NULL, NULL, TRUE, 25),
-- Equipamento 6
(80.00, 20.00, TRUE, 26), (80.00, 20.00, TRUE, 27), (90.00, 10.00, TRUE, 28), (NULL, NULL, TRUE, 29), (NULL, NULL, TRUE, 30);