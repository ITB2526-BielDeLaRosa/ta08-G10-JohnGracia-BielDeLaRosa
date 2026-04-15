// Dades de consum base mensual per defecte
const consumBase = {
    elec: 2500,   // kWh mitjans
    aigua: 45,    // m3 mitjans
    oficina: 150, // unitats (folis, tòner...)
    neteja: 85    // litres de producte
};

// Coeficients d'estacionalitat (Gener a Desembre)
// 1.0 és la mitjana. >1.0 és pic de consum, <1.0 és consum baix.
const estacionalitat = {
    elec: [1.5, 1.4, 1.2, 0.9, 0.8, 0.7, 0.6, 0.6, 0.9, 1.1, 1.3, 1.5], // Pics hivern (calefacció)
    aigua: [0.7, 0.7, 0.8, 1.0, 1.2, 1.4, 1.5, 1.5, 1.2, 1.0, 0.8, 0.7], // Pics estiu (reg/calor)
    oficina: [1.1, 1.0, 1.0, 1.0, 1.0, 0.6, 0.1, 0.1, 1.8, 1.3, 1.2, 1.0], // Pic setembre (inici curs)
    neteja: [1.0, 1.2, 1.0, 1.0, 1.0, 0.8, 0.4, 0.4, 1.0, 1.0, 1.1, 1.0]  // Baixa a l'estiu (escola tancada)
};

/**
 * Funció per calcular el consum total d'un array de mesos
 * @param {string} tipus - elec, aigua, oficina, neteja
 * @param {Array} mesos - Índexs dels mesos (0-11)
 */
function calcularConsum(tipus, mesos) {
    let total = 0;
    mesos.forEach(mes => {
        // Apliquem variabilitat mensual aleatòria (+/- 10%)
        const variabilitat = 0.9 + (Math.random() * 0.2);
        total += consumBase[tipus] * estacionalitat[tipus][mes] * variabilitat;
    });
    return total.toLocaleString('ca-ES', { maximumFractionDigits: 1 });
}

function generarCalculs() {
    const totsElsMesos = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const cursEscolar = [8, 9, 10, 11, 0, 1, 2, 3, 4, 5]; // Setembre a Juny

    // Actualitzem els 8 valors de l'HTML
    document.getElementById('elec-any').innerText = calcularConsum('elec', totsElsMesos) + " kWh";
    document.getElementById('elec-curs').innerText = calcularConsum('elec', cursEscolar) + " kWh";

    document.getElementById('aigua-any').innerText = calcularConsum('aigua', totsElsMesos) + " m³";
    document.getElementById('aigua-curs').innerText = calcularConsum('aigua', cursEscolar) + " m³";

    document.getElementById('cons-any').innerText = calcularConsum('oficina', totsElsMesos) + " ud.";
    document.getElementById('cons-curs').innerText = calcularConsum('oficina', cursEscolar) + " ud.";

    document.getElementById('net-any').innerText = calcularConsum('neteja', totsElsMesos) + " L";
    document.getElementById('net-curs').innerText = calcularConsum('neteja', cursEscolar) + " L";

    console.log("Càlculs actualitzats amb èxit.");
}

// Executem en carregar la pàgina
window.onload = generarCalculs;