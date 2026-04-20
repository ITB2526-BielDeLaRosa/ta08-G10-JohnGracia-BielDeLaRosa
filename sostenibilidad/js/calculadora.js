/**
 * calculadora.js — Motor de càlcul de sostenibilitat escolar
 * ─────────────────────────────────────────────────────────────
 * EXPOSA GLOBALMENT (window.*):
 *   INDICADORS          — objecte de configuració de tots els indicadors
 *   consumMensual()     — consum mensual array per indicador i any
 *   consumAnual()       — consum total anual
 *   consumPeriode()     — consum entre dos mesos
 *   costEuros()         — cost en €
 *   co2Equivalent()     — kg CO₂ equivalent
 *   calcularTots()      — recalcula i actualitza el DOM
 *   calcularMillores()  — genera taula de projecció 3 anys
 *
 * DEPÈN DE: res (mòdul autònom)
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

// ═══════════════════════════════════════════════════════════
//  CONFIGURACIÓ D'INDICADORS
//  10 indicadors: 8 principals + manteniment + escombraries
// ═══════════════════════════════════════════════════════════

const INDICADORS = {
  electricitat: {
    nom: 'Electricitat',
    unitat: 'kWh',
    preu: 0.18,
    baseAnual: 48000,
    co2Factor: 0.27,
    icon: '../img/icon-electric.svg',
    classe: 'electric',
    // Factor mensual (índex 1.0 = mitjana). Hivern alt, estiu baix (vacances)
    mensual: [1.30, 1.25, 1.10, 0.95, 0.90, 0.60, 0.30, 0.30, 0.85, 1.05, 1.20, 1.25]
  },
  aigua: {
    nom: 'Aigua',
    unitat: 'm³',
    preu: 2.10,
    baseAnual: 1200,
    co2Factor: 0.35,
    icon: '../img/icon-water.svg',
    classe: 'water',
    // Estiu lleugerament més alt (reg), hivern més baix
    mensual: [0.80, 0.78, 0.90, 1.00, 1.10, 1.10, 0.40, 0.40, 1.05, 1.10, 0.95, 0.82]
  },
  consumibles: {
    nom: 'Consumibles oficina',
    unitat: 'unitats',
    preu: 0.25,
    baseAnual: 15000,
    co2Factor: 0.15,
    icon: '../img/icon-office.svg',
    classe: 'office',
    // Pics setembre (inici curs) i juny (final), vacances molt baix
    mensual: [0.95, 1.00, 1.05, 1.00, 1.10, 1.25, 0.20, 0.20, 1.30, 1.05, 1.00, 0.90]
  },
  neteja: {
    nom: 'Productes de neteja',
    unitat: 'L',
    preu: 3.50,
    baseAnual: 2400,
    co2Factor: 0.50,
    icon: '../img/icon-clean.svg',
    classe: 'clean',
    // Pics inici i final de curs, vacances baix
    mensual: [0.95, 0.95, 1.00, 1.00, 1.05, 1.20, 0.40, 0.40, 1.25, 1.05, 1.00, 0.95]
  },
  manteniment: {
    nom: 'Manteniment',
    unitat: '€',
    preu: 1.00,
    baseAnual: 8000,
    co2Factor: 0.10,
    icon: '../img/icon-maintenance.svg',
    classe: 'maint',
    // Relativament constant, petit pic estiu (manteniment preventiu vacances)
    mensual: [0.90, 0.90, 0.95, 1.00, 1.00, 1.05, 1.30, 1.25, 1.00, 0.90, 0.90, 0.85]
  },
  escombraries: {
    nom: 'Escombraries',
    unitat: 'kg',
    preu: 0.18,
    baseAnual: 12000,
    co2Factor: 0.60,
    icon: '../img/icon-waste.svg',
    classe: 'waste',
    // Segueix l'activitat escolar: alt curs, baix vacances
    mensual: [1.00, 0.98, 1.02, 1.00, 1.05, 1.10, 0.45, 0.40, 1.10, 1.05, 1.00, 0.85]
  }
};

// Tendència de creixement anual sense millores (+2%/any)
const TENDENCIA = 0.02;

// Noms dels mesos
const MESOS = ['Gen','Feb','Mar','Abr','Mai','Jun','Jul','Ago','Set','Oct','Nov','Des'];
const MESOS_LLARGS = ['Gener','Febrer','Març','Abril','Maig','Juny',
                      'Juliol','Agost','Setembre','Octubre','Novembre','Desembre'];

// ═══════════════════════════════════════════════════════════
//  FUNCIONS DE CÀLCUL — exportades globalment
// ═══════════════════════════════════════════════════════════

/**
 * Retorna array de 12 valors de consum mensual per a un indicador i any.
 * Aplica tendència anual (+2%/any des de 2024).
 */
function consumMensual(ind, any) {
  const cfg = INDICADORS[ind];
  const tendencia = Math.pow(1 + TENDENCIA, any - 2024);
  return cfg.mensual.map(f => Math.round((cfg.baseAnual / 12) * f * tendencia * 10) / 10);
}

/**
 * Consum total anual per a un indicador i any.
 */
function consumAnual(ind, any) {
  return Math.round(consumMensual(ind, any).reduce((a, b) => a + b, 0) * 10) / 10;
}

/**
 * Consum entre dos mesos (0=Gener … 11=Desembre), any inclòs.
 */
function consumPeriode(ind, any, mesInici, mesFi) {
  const vals = consumMensual(ind, any);
  const a = Math.min(mesInici, mesFi);
  const b = Math.max(mesInici, mesFi);
  return Math.round(vals.slice(a, b + 1).reduce((s, v) => s + v, 0) * 10) / 10;
}

/**
 * Cost en euros d'un consum donat per a un indicador.
 */
function costEuros(ind, consum) {
  return Math.round(consum * INDICADORS[ind].preu * 100) / 100;
}

/**
 * Kg de CO₂ equivalent d'un consum donat per a un indicador.
 */
function co2Equivalent(ind, consum) {
  return Math.round(consum * INDICADORS[ind].co2Factor * 10) / 10;
}

// ═══════════════════════════════════════════════════════════
//  FUNCIONS DE RENDERITZAT
// ═══════════════════════════════════════════════════════════

/** Llegeix els paràmetres del formulari */
function llegirParams() {
  return {
    alumnes:  parseInt(document.getElementById('alumnes').value)  || 350,
    any:      parseInt(document.getElementById('any').value)      || 2025,
    mesInici: parseInt(document.getElementById('mes-inici').value),
    mesFi:    parseInt(document.getElementById('mes-fi').value),
    millora:  parseFloat(document.getElementById('millora').value) / 100
  };
}

/** Factor d'escala per nombre d'alumnes (base = 350) */
function escalaAlumnes(alumnes) { return alumnes / 350; }

/**
 * Calcula i retorna els 10 càlculs principals:
 * 2 per cada indicador (anual + període)
 */
function calcular10() {
  const { alumnes, any, mesInici, mesFi, millora } = llegirParams();
  const esc = escalaAlumnes(alumnes);
  const fm  = 1 - millora;

  const res = [];

  Object.entries(INDICADORS).forEach(([key, cfg]) => {
    const vAny = Math.round(consumAnual(key, any) * esc * fm);
    const vPer = Math.round(consumPeriode(key, any, mesInici, mesFi) * esc * fm);

    res.push({
      id: key + '-any',
      classe: cfg.classe,
      icon: cfg.icon,
      nom: `${cfg.nom} — Any complet`,
      desc: `Any ${any} · factor estacional aplicat`,
      valor: vAny,
      unitat: cfg.unitat,
      extra: `Cost est.: ${costEuros(key, vAny).toLocaleString('ca-ES')} €  ·  CO₂: ${co2Equivalent(key, vAny).toLocaleString('ca-ES')} kg`
    });
    res.push({
      id: key + '-per',
      classe: cfg.classe,
      icon: cfg.icon,
      nom: `${cfg.nom} — ${MESOS_LLARGS[mesInici]}–${MESOS_LLARGS[mesFi]}`,
      desc: `Període de ${Math.abs(mesFi - mesInici) + 1} mesos`,
      valor: vPer,
      unitat: cfg.unitat,
      extra: `Cost est.: ${costEuros(key, vPer).toLocaleString('ca-ES')} €  ·  CO₂: ${co2Equivalent(key, vPer).toLocaleString('ca-ES')} kg`
    });
  });

  return res;
}

/** Renderitza les targetes de resultats */
function renderCards(resultats) {
  const cont = document.getElementById('resultats');
  if (!cont) return;
  cont.innerHTML = resultats.map(r => `
    <div class="result-card ${r.classe}">
      <div class="rc-icon"><img src="${r.icon}" alt="${r.nom}"></div>
      <div class="rc-body">
        <h4>${r.nom}</h4>
        <p>${r.desc}</p>
        <p class="rc-extra">${r.extra}</p>
      </div>
      <div class="rc-value">
        <span class="val">${r.valor.toLocaleString('ca-ES')}</span>
        <span class="unit">${r.unitat}</span>
      </div>
    </div>`).join('');
}

/** Renderitza els gràfics de barres mensuals */
function renderGrafics(any, esc, fm) {
  const config = [
    { id: 'chart-elec',   ind: 'electricitat', color: '#f4a261' },
    { id: 'chart-water',  ind: 'aigua',         color: '#4cc9f0' },
    { id: 'chart-office', ind: 'consumibles',   color: '#52b788' },
    { id: 'chart-clean',  ind: 'neteja',        color: '#c77dff' },
    { id: 'chart-maint',  ind: 'manteniment',   color: '#d4a017' },
    { id: 'chart-waste',  ind: 'escombraries',  color: '#8d6e63' }
  ];

  config.forEach(({ id, ind, color }) => {
    const el = document.getElementById(id);
    if (!el) return;
    const vals = consumMensual(ind, any).map(v => Math.round(v * esc * fm));
    const max  = Math.max(...vals);
    el.innerHTML = vals.map((v, i) => `
      <div class="bar-col">
        <div class="bar-fill" style="height:${Math.round(v / max * 64)}px;background:${color};opacity:.85"></div>
        <span class="bar-lbl">${MESOS[i]}</span>
      </div>`).join('');
  });
}

/** Actualitza el KPI banner */
function renderKPIs(any, esc, fm) {
  const elec  = Math.round(consumAnual('electricitat', any) * esc * fm);
  const aigua = Math.round(consumAnual('aigua',        any) * esc * fm);
  const cons  = Math.round(consumAnual('consumibles',  any) * esc * fm);
  const net   = Math.round(consumAnual('neteja',       any) * esc * fm);
  const mant  = Math.round(consumAnual('manteniment',  any) * esc * fm);
  const esc2  = Math.round(consumAnual('escombraries', any) * esc * fm);

  const costTot = Math.round(
    costEuros('electricitat', elec) + costEuros('aigua', aigua) +
    costEuros('consumibles', cons)  + costEuros('neteja', net) +
    costEuros('manteniment', mant)  + costEuros('escombraries', esc2)
  );
  const co2Tot = Math.round(
    co2Equivalent('electricitat', elec) + co2Equivalent('aigua', aigua) +
    co2Equivalent('neteja', net) + co2Equivalent('escombraries', esc2)
  );

  const map = {
    'kpi-elec':  elec,
    'kpi-aigua': aigua,
    'kpi-cons':  cons,
    'kpi-net':   net,
    'kpi-cost':  costTot,
    'kpi-co2':   co2Tot
  };
  Object.entries(map).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val.toLocaleString('ca-ES');
  });
}

/**
 * Renderitza la taula comparativa Abans vs. Després
 * usant els valors sense millores (millora=0) vs. amb millora actual
 */
function renderComparativa() {
  const { alumnes, any, millora } = llegirParams();
  const esc = escalaAlumnes(alumnes);
  const cont = document.getElementById('comparativa');
  if (!cont) return;

  const files = Object.entries(INDICADORS).map(([key, cfg]) => {
    const abans  = Math.round(consumAnual(key, any) * esc);
    const despres= Math.round(consumAnual(key, any) * esc * (1 - millora));
    const estalvi= abans - despres;
    const pct    = millora > 0 ? `-${Math.round(millora * 100)}%` : '—';
    const costAb = Math.round(costEuros(key, abans));
    const costDe = Math.round(costEuros(key, despres));
    return { cfg, key, abans, despres, estalvi, pct, costAb, costDe };
  });

  const totalAb = files.reduce((s, f) => s + f.costAb, 0);
  const totalDe = files.reduce((s, f) => s + f.costDe, 0);

  cont.innerHTML = `
    <table class="compare-table">
      <thead>
        <tr>
          <th>Indicador</th>
          <th>Sense millores (${any})</th>
          <th>Amb millora aplicada</th>
          <th>Estalvi</th>
          <th>Cost sense</th>
          <th>Cost amb</th>
        </tr>
      </thead>
      <tbody>
        ${files.map(f => `
        <tr>
          <td>
            <div class="td-indicator">
              <img src="${f.cfg.icon}" alt="">
              <span>${f.cfg.nom}</span>
            </div>
          </td>
          <td class="td-before">${f.abans.toLocaleString('ca-ES')} ${f.cfg.unitat}</td>
          <td class="td-after">${f.despres.toLocaleString('ca-ES')} ${f.cfg.unitat}</td>
          <td><span class="td-saving">${f.estalvi.toLocaleString('ca-ES')} ${f.cfg.unitat} (${f.pct})</span></td>
          <td class="td-before">${f.costAb.toLocaleString('ca-ES')} €</td>
          <td class="td-after">${f.costDe.toLocaleString('ca-ES')} €</td>
        </tr>`).join('')}
        <tr style="background:rgba(82,183,136,.1)!important">
          <td colspan="4"><strong>TOTAL COST ANUAL ESTIMAT</strong></td>
          <td class="td-before"><strong>${totalAb.toLocaleString('ca-ES')} €</strong></td>
          <td class="td-after"><strong>${totalDe.toLocaleString('ca-ES')} €</strong></td>
        </tr>
      </tbody>
    </table>`;
}

/**
 * Genera la taula de projecció 3 anys amb reduccions escalonades
 */
function calcularMillores() {
  const { alumnes } = llegirParams();
  const esc = escalaAlumnes(alumnes);
  const cont = document.getElementById('taula-millores');
  if (!cont) return;

  const anys    = [2025, 2026, 2027];
  const redPct  = [0.10, 0.20, 0.30];

  const inds = Object.entries(INDICADORS);
  let html = `
    <table class="compare-table">
      <thead>
        <tr>
          <th>Indicador</th>
          <th>2025 base</th>
          ${anys.map((a, i) => `<th>${a} (−${redPct[i] * 100}%)</th>`).join('')}
          <th>Estalvi any 3</th>
        </tr>
      </thead>
      <tbody>`;

  inds.forEach(([key, cfg]) => {
    const base = Math.round(consumAnual(key, 2025) * esc);
    const vals = anys.map((a, i) => Math.round(consumAnual(key, a) * esc * (1 - redPct[i])));
    const estalviAny3 = base - vals[2];
    html += `
      <tr>
        <td><div class="td-indicator"><img src="${cfg.icon}" alt=""><span>${cfg.nom}</span></div></td>
        <td class="td-before">${base.toLocaleString('ca-ES')} ${cfg.unitat}</td>
        ${vals.map(v => `<td class="td-after">${v.toLocaleString('ca-ES')} ${cfg.unitat}</td>`).join('')}
        <td><span class="td-saving">−${estalviAny3.toLocaleString('ca-ES')} ${cfg.unitat}</span></td>
      </tr>`;
  });

  // Fila de costos totals
  const baseCost = inds.reduce((s, [k]) => s + Math.round(costEuros(k, Math.round(consumAnual(k, 2025) * esc))), 0);
  const costAny3 = inds.reduce((s, [k]) => s + Math.round(costEuros(k, Math.round(consumAnual(k, 2027) * esc * 0.70))), 0);

  html += `
      <tr style="background:rgba(82,183,136,.1)!important">
        <td colspan="2"><strong>COST TOTAL (€/any)</strong></td>
        <td class="td-before" colspan="3"><strong>${baseCost.toLocaleString('ca-ES')} €</strong></td>
        <td class="td-after"><strong>${costAny3.toLocaleString('ca-ES')} €</strong></td>
        <td><span class="td-saving">−${(baseCost - costAny3).toLocaleString('ca-ES')} €/any</span></td>
      </tr>
    </tbody></table>`;

  cont.innerHTML = html;
}

/**
 * Funció principal: recalcula tot i actualitza el DOM
 */
function calcularTots() {
  const { any, alumnes, millora } = llegirParams();
  const esc = escalaAlumnes(alumnes);
  const fm  = 1 - millora;

  renderCards(calcular10());
  renderGrafics(any, esc, fm);
  renderKPIs(any, esc, fm);
  renderComparativa();
  calcularMillores();
}

// ═══════════════════════════════════════════════════════════
//  INICIALITZACIÓ
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  calcularTots();
  document.getElementById('btn-calcular')?.addEventListener('click', calcularTots);
});
