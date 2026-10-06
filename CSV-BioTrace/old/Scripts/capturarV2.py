import psutil
import csv
from datetime import datetime
import time
import json
import os
from getpass import getpass

CAMINHO_CSV = './CSV-BioTrace/arquivo.csv'
CAMINHO_PROCESSOS = './CSV-BioTrace/processos.csv'

LOGO = """
    █████             ████
    █████           ██   █
    █████          ██    █
    █████          ████████████
    █████ █████    ██████████  █
    █████████████  ████████████
    █████████████  ███████
    █████████████  ███████
    █████ █████   ████████
                █████████
            █████     ██
            █       ██
            ████████
"""


def limpar_tela():
    os.system('cls' if os.name == 'nt' else 'clear')


with open('./CSV-BioTrace/dados/empresas.json', 'r', encoding='utf-8') as jsonfile:
    empresas = json.load(jsonfile)

with open('./CSV-BioTrace/dados/funcionarios.json', 'r', encoding='utf-8') as jsonfile:
    funcionarios = json.load(jsonfile)

with open('./CSV-BioTrace/dados/equipamentos.json', 'r', encoding='utf-8') as jsonfile:
    equipamentos = json.load(jsonfile)

with open('./CSV-BioTrace/dados/componentes.json', 'r', encoding='utf-8') as jsonfile:
    componentes = json.load(jsonfile)

with open('./CSV-BioTrace/dados/equip-comp.json', 'r', encoding='utf-8') as jsonfile:
    equip_comp = json.load(jsonfile)

limpar_tela()
equipamento_atual = str(input("Digite o código de série do seu equipamento:"))
equipamento_cadastrado = False
for i in range(len(equipamentos)):
    if equipamento_atual == equipamentos[i]["codigo"]:
        equipamento_cadastrado = True

if not equipamento_cadastrado:
    print("Equipamento não encontrado no sistema! =[")

else:
    print(LOGO)
    print("""Olá usuário.
Bem-vindo à configuração do seu ambiente BioTrace!
Para continuar, por favor insira suas credenciais:
    """)

    time.sleep(1)

    ipt_usuario = input("Insira seu usuário:")
    ipt_senha = getpass("Insira sua senha:")

    limpar_tela()

    print("""
Carregando script...""")

    acesso = False
    for i in range(len(funcionarios)):
        if ipt_usuario == funcionarios[i]["usuario"] and ipt_senha == funcionarios[i]["senha"]:
            acesso = True
            usuario = funcionarios[i]["usuario"]

    if not acesso:
        print("Você não pode acessar nosso serviço =[")
        os._exit(0)

    print(f"Olá {usuario}! As informações da sua máquina serão coletadas automaticamente.")

    continuar = input("Deseja continuar? (s/n)")

    capturar_comp = []
    for i in range(len(equip_comp)):
        if equip_comp[i]['fk_equipamento'] == equipamento_atual:
            capturar_comp.append(equip_comp[i]['fk_componente'])

    if continuar == 's':
        print('')
        titulo_executados = 'id;data_hora'
        medida_executados = 'id;timestamp'
        for i in range(len(capturar_comp)):
            for j in range(len(componentes)):
                if capturar_comp[i] == componentes[j]['id_componente']:
                    titulo_executados += ';' + componentes[j]['nome']
                    medida_executados += ';' + componentes[j]['medida']

        with open(CAMINHO_CSV, 'w', newline='', encoding="utf-8") as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow([titulo_executados])

        with open(CAMINHO_PROCESSOS, 'w', newline='', encoding="utf-8") as csvfile:
            writer = csv.writer(csvfile, delimiter=';')
            writer.writerow(['id', 'data_hora', 'pid', 'processo'])

        qtd = 0

        for leitura in range(10):

            executados = ''

            for i in range(len(capturar_comp)):
                for j in range(len(componentes)):
                    if capturar_comp[i] == componentes[j]['id_componente']:
                        executados += ';' + str(eval(componentes[j]['codigo']))

            data_hora = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            with open(CAMINHO_CSV, 'a', newline='', encoding="utf-8") as csvfile:
                writer = csv.writer(csvfile)
                writer.writerow([f"{equipamento_atual};{data_hora}{executados}"])

            with open(CAMINHO_PROCESSOS, 'a', newline='', encoding="utf-8") as csvfile:
                writer = csv.writer(csvfile, delimiter=';')
                for proc in psutil.process_iter(['pid', 'name']):
                    writer.writerow([
                        equipamento_atual,
                        data_hora,
                        proc.info['pid'],
                        proc.info['name'] or ''
                    ])

            limpar_tela()
            qtd += 1
            carregamento = ""
            for j in range(1, 10):
                if qtd <= j:
                    carregamento += "--"
                else:
                    carregamento += "◻◻"

            print(LOGO)
            print("""Executando simulação de captura.
Capturando dados

""")
            print("[", carregamento, "]      ", (qtd * 10), "%")

            time.sleep(10)

        print("Finalizando a captura. Obrigada por escolher a BioTrace! =]")

    elif continuar == 'n':
        print("Fechando script...")
        os._exit(0)