import random

# Factors estacionals per mesos
FACTORS_ELECTRICITAT = [1.3,1.2,1.0,0.9,0.8,0.9,0.7,0.6,0.9,1.0,1.2,1.3]
FACTORS_AIGUA =        [0.8,0.8,0.9,1.0,1.1,1.2,1.3,1.3,1.1,1.0,0.9,0.8]
FACTORS_OFICINA =      [1.0,1.0,1.1,1.1,1.2,1.2,0.5,0.3,1.2,1.2,1.1,1.0]
FACTORS_NETEJA =       [1.1,1.1,1.0,1.0,1.0,1.1,0.7,0.6,1.2,1.1,1.1,1.2]

MESOS_ESCOLARS = [8,9,10,11,0,1,2,3,4,5]  # setembre a juny

def variacio():
    return random.uniform(0.9, 1.1)

def calcular_any(consum_base, factors, creixement=0.02):
    total = 0
    for i in range(12):
        total += consum_base * factors[i] * variacio()
    return total * (1 + creixement)

def calcular_periode(consum_base, factors, mesos):
    total = 0
    for i in mesos:
        total += consum_base * factors[i] * variacio()
    return total

# --- DADES BASE ---
electricitat_base = 1000   # kWh/mes
aigua_base = 50            # m3/mes
oficina_base = 200         # unitats/mes
neteja_base = 100          # unitats/mes

# --- CÀLCULS ---

# 1. Electricitat any
elec_any = calcular_any(electricitat_base, FACTORS_ELECTRICITAT)

# 2. Electricitat període escolar
elec_periode = calcular_periode(electricitat_base, FACTORS_ELECTRICITAT, MESOS_ESCOLARS)

# 3. Aigua any
aigua_any = calcular_any(aigua_base, FACTORS_AIGUA)

# 4. Aigua període
aigua_periode = calcular_periode(aigua_base, FACTORS_AIGUA, MESOS_ESCOLARS)

# 5. Oficina any
oficina_any = calcular_any(oficina_base, FACTORS_OFICINA)

# 6. Oficina període
oficina_periode = calcular_periode(oficina_base, FACTORS_OFICINA, MESOS_ESCOLARS)

# 7. Neteja any
neteja_any = calcular_any(neteja_base, FACTORS_NETEJA)

# 8. Neteja període
neteja_periode = calcular_periode(neteja_base, FACTORS_NETEJA, MESOS_ESCOLARS)

# --- RESULTATS ---
print("📊 RESULTATS DE CONSUM\n")

print(f"⚡ Electricitat (any): {elec_any:.2f} kWh")
print(f"⚡ Electricitat (setembre-juny): {elec_periode:.2f} kWh\n")

print(f"🚰 Aigua (any): {aigua_any:.2f} m3")
print(f"🚰 Aigua (setembre-juny): {aigua_periode:.2f} m3\n")

print(f"📄 Oficina (any): {oficina_any:.2f} unitats")
print(f"📄 Oficina (setembre-juny): {oficina_periode:.2f} unitats\n")

print(f"🧴 Neteja (any): {neteja_any:.2f} unitats")
print(f"🧴 Neteja (setembre-juny): {neteja_periode:.2f} unitats\n")