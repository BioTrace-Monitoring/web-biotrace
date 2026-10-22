#!/usr/bin/env python3
"""
Conversão Bronze -> Silver das métricas de servidores/UTI.

- Converte o timestamp para o horário de Brasília (America/Sao_Paulo)
- Trata valores nulos, não numéricos e fora de faixa
- Aplica limites (ex.: percentuais entre 0 e 100)
- Remove duplicatas e linhas sem chave (timestamp / numero_serie)

Uso:
    python bronze_para_silver.py entrada.csv saida.parquet
    python bronze_para_silver.py entrada.csv saida.csv
"""
import argparse
import json
import logging
import sys

import numpy as np
import pandas as pd

FUSO_BR = "America/Sao_Paulo"

# Regras por coluna: (minimo, maximo, acao)
#   "clip"  -> valor fora da faixa é ajustado para o limite mais próximo
#   "nulo"  -> valor fora da faixa vira nulo (não faz sentido "corrigir")
# None em minimo/maximo = sem limite naquele lado.
REGRAS = {
    "cpu_percent": (0, 100, "clip"),
    "memoria_percent": (0, 100, "clip"),
    "disco_percent": (0, 100, "clip"),
    "memoria_disponivel_gb": (0, None, "nulo"),
    "disco_livre_gb": (0, None, "nulo"),
    "rede_bytes_enviados": (0, None, "nulo"),
    "rede_bytes_recebidos": (0, None, "nulo"),
    "rede_erros_entrada": (0, None, "nulo"),
    "rede_erros_saida": (0, None, "nulo"),
    "uptime_horas": (0, None, "nulo"),
    "processos_ativos": (0, None, "nulo"),
    "temperatura_cpu": (-20, 120, "nulo"),  # faixa plausível de sensor
}

COLUNAS_INTEIRAS = [
    "rede_bytes_enviados",
    "rede_bytes_recebidos",
    "rede_erros_entrada",
    "rede_erros_saida",
    "processos_ativos",
]

NOTA_NUCLEO = (0, 100)

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
log = logging.getLogger("silver")


def para_numero(serie: pd.Series) -> pd.Series:
    """Converte para número; aceita vírgula decimal. Inválidos viram NaN."""
    if serie.dtype == object:
        serie = serie.astype(str).str.strip().str.replace(",", ".", regex=False)
        serie = serie.replace({"": np.nan, "nan": np.nan, "None": np.nan,
                               "null": np.nan, "NULL": np.nan, "NaN": np.nan})
    num = pd.to_numeric(serie, errors="coerce")
    return num.replace([np.inf, -np.inf], np.nan)


def aplicar_limites(serie: pd.Series, minimo, maximo, acao: str) -> pd.Series:
    fora = pd.Series(False, index=serie.index)
    if minimo is not None:
        fora |= serie < minimo
    if maximo is not None:
        fora |= serie > maximo
    qtd = int(fora.sum())
    if qtd:
        log.warning("%s: %d valor(es) fora da faixa [%s, %s] -> %s",
                    serie.name, qtd, minimo, maximo, acao)
    if acao == "clip":
        return serie.clip(lower=minimo, upper=maximo)
    return serie.mask(fora)


def tratar_cpu_por_nucleo(valor):
    """Lê a lista de núcleos ('[40.1, 50.3]'), limita cada item a 0-100.
    Itens inválidos viram None. Retorna string JSON ou None."""
    if valor is None or (isinstance(valor, float) and np.isnan(valor)):
        return None
    try:
        lista = json.loads(valor) if isinstance(valor, str) else list(valor)
        if not isinstance(lista, list) or not lista:
            return None
    except (ValueError, TypeError):
        return None

    limpa = []
    for item in lista:
        try:
            n = float(item)
            if np.isnan(n) or np.isinf(n):
                raise ValueError
            n = min(max(n, NOTA_NUCLEO[0]), NOTA_NUCLEO[1])
            limpa.append(round(n, 2))
        except (ValueError, TypeError):
            limpa.append(None)
    return json.dumps(limpa)


def transformar(df: pd.DataFrame) -> pd.DataFrame:
    total_inicial = len(df)
    df.columns = [c.strip().lower() for c in df.columns]

    # --- Timestamp -> horário de Brasília ---------------------------------
    # utc=True normaliza qualquer offset; depois converte para São Paulo.
    ts = pd.to_datetime(df["timestamp"], errors="coerce", utc=True)
    df["data_hora"] = ts.dt.tz_convert(FUSO_BR)

    # --- Chaves -----------------------------------------------------------
    df["numero_serie"] = (
        df["numero_serie"].astype("string").str.strip().replace("", pd.NA)
    )
    sem_chave = df["data_hora"].isna() | df["numero_serie"].isna()
    if sem_chave.any():
        log.warning("%d linha(s) removida(s) por timestamp/numero_serie inválido",
                    int(sem_chave.sum()))
    df = df[~sem_chave].copy()

    # --- Colunas numéricas ------------------------------------------------
    for col, (minimo, maximo, acao) in REGRAS.items():
        if col not in df.columns:
            log.warning("Coluna ausente na entrada: %s", col)
            df[col] = np.nan
        num = para_numero(df[col])
        nulos_antes = int(num.isna().sum())
        num = aplicar_limites(num.rename(col), minimo, maximo, acao)
        if nulos_antes:
            log.info("%s: %d valor(es) nulo(s)/inválido(s)", col, nulos_antes)
        df[col] = num

    for col in COLUNAS_INTEIRAS:
        df[col] = df[col].round().astype("Int64")

    # --- CPU por núcleo ---------------------------------------------------
    df["cpu_por_nucleo"] = df["cpu_por_nucleo"].map(tratar_cpu_por_nucleo)

    # --- Duplicatas e ordenação -------------------------------------------
    antes = len(df)
    df = df.drop_duplicates(subset=["numero_serie", "data_hora"], keep="last")
    if antes - len(df):
        log.warning("%d duplicata(s) removida(s)", antes - len(df))
    df = df.sort_values(["numero_serie", "data_hora"]).reset_index(drop=True)

    # --- Colunas finais ---------------------------------------------------
    df["data_hora_br"] = df["data_hora"].dt.strftime("%d/%m/%Y %H:%M:%S")
    df["data"] = df["data_hora"].dt.date
    df["ingestao_silver"] = pd.Timestamp.now(tz=FUSO_BR)

    ordem = ["data_hora_br", "numero_serie",
             "cpu_percent", "cpu_por_nucleo", "memoria_percent",
             "memoria_disponivel_gb", "disco_percent", "disco_livre_gb",
             "rede_bytes_enviados", "rede_bytes_recebidos",
             "rede_erros_entrada", "rede_erros_saida", "uptime_horas",
             "processos_ativos", "temperatura_cpu", "ingestao_silver"]
    df = df[ordem]

    log.info("Linhas: %d entrada -> %d saída", total_inicial, len(df))
    return df


def main():
    p = argparse.ArgumentParser(description="CSV bronze -> silver")
    p.add_argument("entrada", help="CSV de entrada (separador ';')")
    p.add_argument("saida", help="Arquivo de saída (.parquet ou .csv)")
    p.add_argument("--sep", default=";", help="Separador do CSV (padrão ';')")
    args = p.parse_args()

    try:
        df = pd.read_csv(args.entrada, sep=args.sep, dtype=str,
                         keep_default_na=True, encoding="utf-8-sig")
    except Exception as e:
        log.error("Falha ao ler %s: %s", args.entrada, e)
        sys.exit(1)

    silver = transformar(df)

    if args.saida.lower().endswith(".parquet"):
        silver.to_parquet(args.saida, index=False)
    else:
        silver.to_csv(args.saida, sep=args.sep, index=False, encoding="utf-8")
    log.info("Arquivo silver gerado: %s", args.saida)


if __name__ == "__main__":
    main()