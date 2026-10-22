import pandas as pd

# Lê o CSV (separador ponto e vírgula)
df = pd.read_csv("metricas.csv", sep=";")

# Converte a coluna timestamp (ISO 8601 com fuso -03:00) para datetime
df["timestamp"] = pd.to_datetime(df["timestamp"], format="ISO8601")

# Colunas separadas de data e hora
df["data"] = df["timestamp"].dt.date
df["hora"] = df["timestamp"].dt.time

# Formato brasileiro em texto (dd/mm/aaaa HH:MM:SS)
df["data_hora_br"] = df["timestamp"].dt.strftime("%d/%m/%Y %H:%M:%S")

# Opcional: converte a coluna de núcleos de string para lista
# import ast
# df["cpu_por_nucleo"] = df["cpu_por_nucleo"].apply(ast.literal_eval)

print(df[["timestamp", "data", "hora", "data_hora_br"]].head())
print(df.dtypes["timestamp"])

# Salva o resultado
df.to_csv("metricas_convertido.csv", sep=";", index=False)