// ═══════════════════════════════════════════════════════
//  CALCULADORA DE SOSTENIBILITAT ESCOLAR
//  Factors estacionals, tendències i projeccions
// ═══════════════════════════════════════════════════════

// ── Dades base (valors mensuals índex, 1.0 = mitjana)
const FACTORS = {
  electricitat: {
    // Hivern alt (calefacció+llum), estiu baix (vacances)
    mensual: [1.30, 1.25, 1.10, 0.95, 0.90, 0.60, 0.30, 0.30, 0.85, 1.05, 1.20, 1.25],
    unitat: 'kWh',
    preu: 0.18,       // €/kWh
    baseAnual: 48000, // kWh base escola mitja
    emoji: '⚡',
    nom: 'Electricitat'
  },
  aigua: {
    // Estiu alt (reg, calor), hivern baix
    mensual: [0.80, 0.78, 0.90, 1.00, 1.10, 1.10, 0.40, 0.40, 1.05, 1.10, 0.95, 0.82],
    unitat: 'm³',
    preu: 2.10,
    baseAnual: 1200,
    emoji: '💧',
    nom: 'Aigua'
  },
  consumibles: {
    // Pics al setembre (inici curs) i juny (final), baixa vacances
    mensual: [0.95, 1.00, 1.05, 1.00, 1.10, 1.25, 0.20, 0.20, 1.30, 1.05, 1.00, 0.90],
    unitat: 'unitats',
    preu: 0.25,
    baseAnual: 15000,
    emoji: '📋',
    nom: 'Consumibles oficina'
  },
  neteja: {
    // Pics inici i final curs, vacances baix
    mensual: [0.95, 0.95, 1.00, 1.00, 1.05, 1.20, 0.40, 0.40, 1.25, 1.05, 1.00, 0.95],
    unitat: 'L/kg',
    preu: 3.50,
    baseAnual: 2400,
    emoji: '🧹',
    nom: 'Productes neteja'
  }
};

// Tendència anual de creixement (sense millores)
const TENDENCIA_ANUAL = 0.02; // +2% per any sense millores

// ── Noms dels mesos
const MESOS = ['Gen','Feb','Mar','Abr','Mai','Jun','Jul','Ago','Set','Oct','Nov','Des'];
const MESOS_COMPLETS = ['Gener','Febrer','Març','Abril','Maig','Juny','Juliol','Agost','Setembre','Octubre','Novembre','Desembre'];

// ═══ FUNCIONS PRINCIPALS ═══════════════════════════════

/**
 * Calcular consum mensual real amb variabilitat aleatòria ±5%
 */
function consumMensual(indicador, any, ambVariabilitat = false) {
  const f = FACTORS[indicador];
  const tendencia = Math.pow(1 + TENDENCIA_ANUAL, any - 2024);
  return f.mensual.map(factor => {
    const base = f.baseAnual * factor / 12;
    const var_ = ambVariabilitat ? (0.95 + Math.random() * 0.10) : 1.0;
    return Math.round(base * tendencia * var_ * 10) / 10;
  });
}

/**
 * Calcular consum anual total
 */
function consumAnual(indicador, any) {
  return consumMensual(indicador, any).reduce((a, b) => a + b, 0);
}

/**
 * Calcular consum per període (mesos 0-11)
 */
function consumPeriode(indicador, any, mesInici, mesFi) {
  const mensuals = consumMensual(indicador, any);
  let total = 0;
  const inici = Math.min(mesInici, mesFi);
  const fi = Math.max(mesInici, mesFi);
  for (let m = inici; m <= fi; m++) total += mensuals[m];
  return Math.round(total * 10) / 10;
}

/**
 * Cost en euros
 */
function costEuros(indicador, consum) {
  return Math.round(consum * FACTORS[indicador].preu * 100) / 100;
}

/**
 * CO₂ equivalent (electricitat: 0.27 kg CO₂/kWh, aigua: 0.35 kg/m³)
 */
function co2Equivalent(indicador, consum) {
  const factors = { electricitat: 0.27, aigua: 0.35, consumibles: 0.15, neteja: 0.50 };
  return Math.round(consum * factors[indicador] * 10) / 10;
}

// ═══ CÀLCULS DETALLATS ═════════════════════════════════

function calcularTots() {
  const alumnes   = parseInt(document.getElementById('alumnes').value) || 350;
  const any       = parseInt(document.getElementById('any').value) || 2025;
  const mesIniciEl = parseInt(document.getElementById('mes-inici').value);
  const mesFiEl   = parseInt(document.getElementById('mes-fi').value);
  const millora   = parseFloat(document.getElementById('millora').value) / 100;

  const factor_mill = 1 - millora;
  const esc = alumnes / 350; // factor escala per mida escola

  // ── 8 CÀLCULS ──────────────────────────────────────
  const resultats = [
    {
      id: 'elec-any',
      classe: 'electric',
      emoji: '⚡',
      nom: 'Electricitat – Pròxim any',
      desc: `Any ${any} · amb tendència estacional`,
      valor: Math.round(consumAnual('electricitat', any) * esc * factor_mill),
      unitat: 'kWh',
      extra: () => `Cost est.: ${costEuros('electricitat', Math.round(consumAnual('electricitat', any)*esc*factor_mill)).toLocaleString('ca-ES')} €`
    },
    {
      id: 'elec-curs',
      classe: 'electric',
      emoji: '⚡',
      nom: 'Electricitat – Setembre–Juny',
      desc: 'Curs escolar complet (10 mesos)',
      valor: Math.round(consumPeriode('electricitat', any, mesIniciEl, 9) * esc * factor_mill),
      unitat: 'kWh',
      extra: () => `CO₂ eq.: ${co2Equivalent('electricitat', Math.round(consumPeriode('electricitat',any,mesIniciEl,9)*esc*factor_mill)).toLocaleString('ca-ES')} kg`
    },
    {
      id: 'aigua-any',
      classe: 'water',
      emoji: '💧',
      nom: 'Aigua – Pròxim any',
      desc: `Any ${any} · pics a estiu i tardor`,
      valor: Math.round(consumAnual('aigua', any) * esc * factor_mill),
      unitat: 'm³',
      extra: () => `Cost est.: ${costEuros('aigua', Math.round(consumAnual('aigua',any)*esc*factor_mill)).toLocaleString('ca-ES')} €`
    },
    {
      id: 'aigua-periode',
      classe: 'water',
      emoji: '💧',
      nom: 'Aigua – Període seleccionat',
      desc: `${MESOS_COMPLETS[mesIniciEl]} a ${MESOS_COMPLETS[mesFiEl]} ${any}`,
      valor: Math.round(consumPeriode('aigua', any, mesIniciEl, mesFiEl) * esc * factor_mill),
      unitat: 'm³',
      extra: () => `CO₂ eq.: ${co2Equivalent('aigua', Math.round(consumPeriode('aigua',any,mesIniciEl,mesFiEl)*esc*factor_mill)).toLocaleString('ca-ES')} kg`
    },
    {
      id: 'consum-any',
      classe: 'office',
      emoji: '📋',
      nom: 'Consumibles – Pròxim any',
      desc: `Any ${any} · pics setembre i juny`,
      valor: Math.round(consumAnual('consumibles', any) * esc * factor_mill),
      unitat: 'unitats',
      extra: () => `Cost est.: ${costEuros('consumibles', Math.round(consumAnual('consumibles',any)*esc*factor_mill)).toLocaleString('ca-ES')} €`
    },
    {
      id: 'consum-periode',
      classe: 'office',
      emoji: '📋',
      nom: 'Consumibles – Període seleccionat',
      desc: `${MESOS_COMPLETS[mesIniciEl]} a ${MESOS_COMPLETS[mesFiEl]} ${any}`,
      valor: Math.round(consumPeriode('consumibles', any, mesIniciEl, mesFiEl) * esc * factor_mill),
      unitat: 'unitats',
      extra: () => `Cost est.: ${costEuros('consumibles', Math.round(consumPeriode('consumibles',any,mesIniciEl,mesFiEl)*esc*factor_mill)).toLocaleString('ca-ES')} €`
    },
    {
      id: 'neteja-any',
      classe: 'clean',
      emoji: '🧹',
      nom: 'Productes neteja – Pròxim any',
      desc: `Any ${any} · pics inici/final curs`,
      valor: Math.round(consumAnual('neteja', any) * esc * factor_mill),
      unitat: 'L/kg',
      extra: () => `Cost est.: ${costEuros('neteja', Math.round(consumAnual('neteja',any)*esc*factor_mill)).toLocaleString('ca-ES')} €`
    },
    {
      id: 'neteja-periode',
      classe: 'clean',
      emoji: '🧹',
      nom: 'Productes neteja – Període sel.',
      desc: `${MESOS_COMPLETS[mesIniciEl]} a ${MESOS_COMPLETS[mesFiEl]} ${any}`,
      valor: Math.round(consumPeriode('neteja', any, mesIniciEl, mesFiEl) * esc * factor_mill),
      unitat: 'L/kg',
      extra: () => `Cost est.: ${costEuros('neteja', Math.round(consumPeriode('neteja',any,mesIniciEl,mesFiEl)*esc*factor_mill)).toLocaleString('ca-ES')} €`
    }
  ];

  renderResultats(resultats);
  renderGrafics(any, esc, factor_mill);
  actualitzarKPIs(any, esc, factor_mill);
}

function renderResultats(resultats) {
  const cont = document.getElementById('resultats');
  cont.innerHTML = resultats.map(r => `
    <div class="result-card ${r.classe}" style="animation: fadeUp 0.5s ease both">
      <div class="result-icon">${r.emoji}</div>
      <div class="result-info">
        <h4>${r.nom}</h4>
        <p>${r.desc}</p>
        <p style="color:#52b788;font-size:0.8rem;margin-top:2px">${r.extra()}</p>
      </div>
      <div class="result-value">
        <span class="val">${r.valor.toLocaleString('ca-ES')}</span>
        <span class="unit">${r.unitat}</span>
      </div>
    </div>
  `).join('');
}

function renderGrafics(any, esc, factor_mill) {
  // Gràfic electricitat mensual
  renderBarChart('chart-elec', consumMensual('electricitat', any).map(v => Math.round(v * esc * factor_mill)), '#f4a261', MESOS);
  // Gràfic aigua mensual
  renderBarChart('chart-aigua', consumMensual('aigua', any).map(v => Math.round(v * esc * factor_mill)), '#4cc9f0', MESOS);
  // Consumibles
  renderBarChart('chart-consum', consumMensual('consumibles', any).map(v => Math.round(v * esc * factor_mill)), '#a8dadc', MESOS);
  // Neteja
  renderBarChart('chart-neteja', consumMensual('neteja', any).map(v => Math.round(v * esc * factor_mill)), '#90be6d', MESOS);
}

function renderBarChart(id, valors, color, etiquetes) {
  const cont = document.getElementById(id);
  if (!cont) return;
  const max = Math.max(...valors);
  cont.innerHTML = valors.map((v, i) => `
    <div class="bar-wrap">
      <div class="bar" style="height:${Math.round(v/max*68)}px;background:${color};opacity:0.85"></div>
      <span class="bar-label">${etiquetes[i]}</span>
    </div>
  `).join('');
}

function actualitzarKPIs(any, esc, factor_mill) {
  const totalElec = Math.round(consumAnual('electricitat', any) * esc * factor_mill);
  const totalAigua = Math.round(consumAnual('aigua', any) * esc * factor_mill);
  const totalCost = Math.round(
    costEuros('electricitat', totalElec) +
    costEuros('aigua', totalAigua) +
    costEuros('consumibles', Math.round(consumAnual('consumibles', any)*esc*factor_mill)) +
    costEuros('neteja', Math.round(consumAnual('neteja', any)*esc*factor_mill))
  );
  const totalCO2 = Math.round(co2Equivalent('electricitat', totalElec) + co2Equivalent('aigua', totalAigua));

  const els = { elec: totalElec, aigua: totalAigua, cost: totalCost, co2: totalCO2 };
  Object.entries(els).forEach(([k, v]) => {
    const el = document.getElementById('kpi-' + k);
    if (el) el.textContent = v.toLocaleString('ca-ES');
  });
}

// ═══ CÀLCUL MILLORES 30% ══════════════════════════════

function calcularMillores() {
  const alumnes = parseInt(document.getElementById('alumnes').value) || 350;
  const esc = alumnes / 350;

  const anys = [2025, 2026, 2027];
  const millores = [0.10, 0.20, 0.30]; // reducció acumulada

  const indicadors = ['electricitat', 'aigua', 'consumibles', 'neteja'];
  const cont = document.getElementById('taula-millores');
  if (!cont) return;

  let html = `<table style="width:100%;border-collapse:collapse;font-size:0.88rem">
    <thead>
      <tr style="background:rgba(82,183,136,0.15)">
        <th style="padding:0.75rem;text-align:left;color:var(--verd-fosc)">Indicador</th>
        ${anys.map((a, i) => `<th style="padding:0.75rem;text-align:center;color:var(--verd-fosc)">Any ${a}<br><small style="color:var(--verd-clar)">−${millores[i]*100}%</small></th>`).join('')}
      </tr>
    </thead><tbody>`;

  indicadors.forEach(ind => {
    const f = FACTORS[ind];
    html += `<tr style="border-bottom:1px solid rgba(26,61,43,0.08)">
      <td style="padding:0.75rem;font-weight:600">${f.emoji} ${f.nom}</td>
      ${anys.map((a, i) => {
        const val = Math.round(consumAnual(ind, a) * esc * (1 - millores[i]));
        return `<td style="padding:0.75rem;text-align:center">${val.toLocaleString('ca-ES')} ${f.unitat}</td>`;
      }).join('')}
    </tr>`;
  });

  html += '</tbody></table>';
  cont.innerHTML = html;
}

// ═══ INICIALITZACIÓ ════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  calcularTots();
  calcularMillores();

  document.getElementById('btn-calcular')?.addEventListener('click', () => {
    calcularTots();
    calcularMillores();
  });

  // Any actual al selector
  const anyInput = document.getElementById('any');
  if (anyInput) anyInput.value = 2025;
});