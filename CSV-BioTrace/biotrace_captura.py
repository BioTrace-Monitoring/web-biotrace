import csv
import os
import socket
import time
from datetime import datetime

import psutil


ARQUIVO_METRICAS = "metricas_maquina.csv"
ARQUIVO_PROCESSOS = "processos.csv"

INTERVALO_CAPTURA = 5


def obter_identificador_maquina():
    return socket.gethostname()


def obter_timestamp():
    return datetime.now().astimezone().isoformat(timespec="seconds")


def bytes_para_gb(valor):
    return round(valor / (1024 ** 3), 2)


def salvar_csv(arquivo, dados, campos):
    arquivo_existe = os.path.exists(arquivo)

    with open(arquivo, "a", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=campos)

        if not arquivo_existe:
            writer.writeheader()

        writer.writerow(dados)


def coletar_metricas_maquina():
    machine_id = obter_identificador_maquina()
    timestamp = obter_timestamp()

    cpu_percent = psutil.cpu_percent(interval=1)
    cpu_por_nucleo = psutil.cpu_percent(interval=None, percpu=True)

    memoria = psutil.virtual_memory()
    swap = psutil.swap_memory()

    disco = psutil.disk_usage(os.path.abspath(os.sep))
    disk_io = psutil.disk_io_counters()

    rede = psutil.net_io_counters()

    dados = {
        "timestamp": timestamp,
        "machine_id": machine_id,

        "cpu_percent": cpu_percent,
        "cpu_nucleos_fisicos": psutil.cpu_count(logical=False),
        "cpu_nucleos_logicos": psutil.cpu_count(logical=True),
        "cpu_por_nucleo": "|".join(map(str, cpu_por_nucleo)),

        "ram_total_gb": bytes_para_gb(memoria.total),
        "ram_usada_gb": bytes_para_gb(memoria.used),
        "ram_disponivel_gb": bytes_para_gb(memoria.available),
        "ram_percent": memoria.percent,

        "swap_total_gb": bytes_para_gb(swap.total),
        "swap_usada_gb": bytes_para_gb(swap.used),
        "swap_percent": swap.percent,

        "disco_total_gb": bytes_para_gb(disco.total),
        "disco_usado_gb": bytes_para_gb(disco.used),
        "disco_livre_gb": bytes_para_gb(disco.free),
        "disco_percent": disco.percent,

        "disco_leitura_bytes": disk_io.read_bytes if disk_io else 0,
        "disco_escrita_bytes": disk_io.write_bytes if disk_io else 0,

        "rede_bytes_enviados": rede.bytes_sent,
        "rede_bytes_recebidos": rede.bytes_recv,
        "rede_pacotes_enviados": rede.packets_sent,
        "rede_pacotes_recebidos": rede.packets_recv,
        "rede_erros_entrada": rede.errin,
        "rede_erros_saida": rede.errout,
        "rede_pacotes_descartados_entrada": rede.dropin,
        "rede_pacotes_descartados_saida": rede.dropout
    }

    salvar_csv(
        ARQUIVO_METRICAS,
        dados,
        dados.keys()
    )


def coletar_processos():
    machine_id = obter_identificador_maquina()
    timestamp = obter_timestamp()

    campos = [
        "timestamp",
        "machine_id",
        "pid",
        "nome",
        "status",
        "usuario",
        "cpu_percent",
        "memoria_percent",
        "memoria_rss_mb",
        "threads"
    ]

    arquivo_existe = os.path.exists(ARQUIVO_PROCESSOS)

    with open(
        ARQUIVO_PROCESSOS,
        "a",
        newline="",
        encoding="utf-8"
    ) as csvfile:

        writer = csv.DictWriter(csvfile, fieldnames=campos)

        if not arquivo_existe:
            writer.writeheader()

        for processo in psutil.process_iter([
            "pid",
            "name",
            "status",
            "username",
            "cpu_percent",
            "memory_percent",
            "memory_info",
            "num_threads"
        ]):
            try:
                info = processo.info

                memoria_rss = info["memory_info"]

                if memoria_rss:
                    memoria_rss_mb = round(
                        memoria_rss.rss / (1024 ** 2),
                        2
                    )
                else:
                    memoria_rss_mb = 0

                dados = {
                    "timestamp": timestamp,
                    "machine_id": machine_id,
                    "pid": info["pid"],
                    "nome": info["name"],
                    "status": info["status"],
                    "usuario": info["username"],
                    "cpu_percent": info["cpu_percent"],
                    "memoria_percent": round(
                        info["memory_percent"] or 0,
                        2
                    ),
                    "memoria_rss_mb": memoria_rss_mb,
                    "threads": info["num_threads"]
                }

                writer.writerow(dados)

            except (
                psutil.NoSuchProcess,
                psutil.AccessDenied,
                psutil.ZombieProcess
            ):
                continue


def realizar_captura():
    coletar_metricas_maquina()
    coletar_processos()


def main():
    print("Monitoramento iniciado.")
    print(f"Capturando dados a cada {INTERVALO_CAPTURA} segundos.")
    print("Pressione Ctrl+C para encerrar.\n")

    try:
        while True:
            inicio = time.time()

            realizar_captura()

            timestamp = obter_timestamp()
            print(f"[{timestamp}] Captura realizada.")

            tempo_execucao = time.time() - inicio
            tempo_espera = max(0, INTERVALO_CAPTURA - tempo_execucao)

            time.sleep(tempo_espera)

    except KeyboardInterrupt:
        print("\nMonitoramento encerrado.")


if __name__ == "__main__":
    main()