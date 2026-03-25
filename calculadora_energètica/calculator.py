# Factors de correcció estacional (Exemple)
hivern = 1.4  # +40% consum (calefacció/llum)
primavera_tardor = 1.0
estiu_agost = 0.2  # Centre gairebé tancat


def calcular_projeccio(dades_base, tipus_indicador, periode):
    # 1. Consum Elèctric (Any/Curs)
    # 2. Consum Aigua (Any/Curs)
    # 3. Consumibles Oficina (Any/Curs)
    # 4. Productes Neteja (Any/Curs)

    if periode == "curs":
        mesos = 10  # Setembre a Juny
    else:
        mesos = 12

    # Aplicar tendència: L'electricitat puja a l'hivern, l'aigua a l'estiu
    # Els consumibles d'oficina pugen al setembre (inici) i juny (exàmens)
    return consum_estimat