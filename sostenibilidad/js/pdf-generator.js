/**
 * pdf-generator.js — Generador d'informe PDF de 4 pàgines
 * ─────────────────────────────────────────────────────────────
 * EXPOSA GLOBALMENT:
 *   generarPDF()  ← cridada des del botó #btn-pdf del HTML
 *
 * DEPÈN DE (han d'estar carregats ABANS en el HTML):
 *   1. jsPDF CDN  → window.jspdf  (carregat al <head>)
 *   2. calculadora.js → INDICADORS, consumAnual, consumPeriode,
 *                       consumMensual, costEuros, co2Equivalent,
 *                       MESOS_LLARGS, llegirParams, escalaAlumnes
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

function generarPDF() {
  // Verificar que jsPDF estigui disponible
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert('Error: La llibreria jsPDF no s\'ha carregat. Comprova la connexió a internet i torna a intentar-ho.');
    return;
  }

  const btn = document.getElementById('btn-pdf');
  if (btn) { btn.textContent = '⏳ Generant PDF…'; btn.disabled = true; }

  try {
    _generarPDFIntern();
  } catch (e) {
    console.error('Error generant PDF:', e);
    alert('Error generant el PDF: ' + e.message);
  } finally {
    if (btn) { btn.textContent = '📄 Descarregar informe PDF'; btn.disabled = false; }
  }
}

function _generarPDFIntern() {
  // ── Paràmetres del formulari ──────────────────────────
  const { alumnes, any, mesInici, mesFi, millora } = llegirParams();
  const esc  = escalaAlumnes(alumnes);
  const fm   = 1 - millora;
  const ML   = typeof MESOS_LLARGS !== 'undefined' ? MESOS_LLARGS
             : ['Gener','Febrer','Març','Abril','Maig','Juny',
                'Juliol','Agost','Setembre','Octubre','Novembre','Desembre'];

  // ── Valors calculats ──────────────────────────────────
  function v(ind)    { return Math.round(consumAnual(ind, any)              * esc * fm); }
  function vP(ind)   { return Math.round(consumPeriode(ind, any, mesInici, mesFi) * esc * fm); }
  function vBase(ind){ return Math.round(consumAnual(ind, 2025)             * esc); }

  const dades = {
    elecAny:  v('electricitat'), elecPer:  vP('electricitat'),
    aiguaAny: v('aigua'),        aiguaPer: vP('aigua'),
    consAny:  v('consumibles'),  consPer:  vP('consumibles'),
    netAny:   v('neteja'),       netPer:   vP('neteja'),
    mantAny:  v('manteniment'),  mantPer:  vP('manteniment'),
    escAny:   v('escombraries'), escPer:   vP('escombraries'),
  };

  const costTotal = Math.round(
    costEuros('electricitat', dades.elecAny) + costEuros('aigua',       dades.aiguaAny) +
    costEuros('consumibles',  dades.consAny)  + costEuros('neteja',      dades.netAny) +
    costEuros('manteniment',  dades.mantAny)  + costEuros('escombraries',dades.escAny)
  );
  const co2Total = Math.round(
    co2Equivalent('electricitat', dades.elecAny) + co2Equivalent('aigua',      dades.aiguaAny) +
    co2Equivalent('neteja',       dades.netAny)  + co2Equivalent('escombraries',dades.escAny)
  );

  // Projecció 3 anys
  const proj = [2025, 2026, 2027].map((a, i) => {
    const red = [0.10, 0.20, 0.30][i];
    const f   = 1 - red;
    return {
      any: a, red,
      elec:  Math.round(consumAnual('electricitat', a) * esc * f),
      aigua: Math.round(consumAnual('aigua',        a) * esc * f),
      cons:  Math.round(consumAnual('consumibles',  a) * esc * f),
      net:   Math.round(consumAnual('neteja',       a) * esc * f),
      mant:  Math.round(consumAnual('manteniment',  a) * esc * f),
      esc2:  Math.round(consumAnual('escombraries', a) * esc * f),
    };
  });

  // ── Helpers PDF ───────────────────────────────────────
  const { jsPDF } = window.jspdf;
  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W    = 210;
  const MAR  = 16;
  const COL  = W - MAR * 2;
  let y      = 0;

  const VF = [26,61,43], VM = [45,106,79], VC = [82,183,136];
  const CR = [248,244,232], BL = [255,255,255], GR = [240,237,228];
  const TX = [28,28,28],   TM = [100,100,100];

  const sf = (style, size, color) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(...(color || TX));
  };
  const rc = (x, yy, w, h, col, r = 0) => {
    doc.setFillColor(...col);
    r > 0 ? doc.roundedRect(x, yy, w, h, r, r, 'F') : doc.rect(x, yy, w, h, 'F');
  };
  const ln = (yy, col) => {
    doc.setDrawColor(...(col || GR));
    doc.setLineWidth(.3);
    doc.line(MAR, yy, W - MAR, yy);
  };
  const tx = (s, x, yy, o) => doc.text(String(s), x, yy, o || {});
  const n  = v => Number(v).toLocaleString('ca-ES');

  function capTaula(etq, yy) {
    rc(MAR, yy, COL, 7, VF, 2);
    sf('bold', 9, BL);
    tx(etq, MAR + 4, yy + 5);
    return yy + 11;
  }

  function filaTaula(cols, yy, rowH, impar) {
    rc(MAR, yy, COL, rowH, impar ? GR : BL);
    return yy;
  }

  function row2(col1, col2, yy, impar, bold2) {
    const rh = 7;
    rc(MAR, yy, COL, rh, impar ? GR : BL);
    sf('normal', 9, TX); tx(col1, MAR + 3, yy + 5);
    sf(bold2 ? 'bold' : 'normal', 9, bold2 ? VM : TM);
    tx(col2, MAR + 115, yy + 5);
    return yy + rh;
  }

  // ══════════════════════════════════════════════════════
  // PÀG 1 — PORTADA
  // ══════════════════════════════════════════════════════
  rc(0, 0, W, 297, VF);
  doc.setFillColor(45,106,79); doc.circle(W+5, 25, 55, 'F');
  doc.setFillColor(26,80,55);  doc.circle(-5, 265, 45, 'F');

  sf('bold', 32, BL); tx('EcoEscola', W/2, 78, { align:'center' });
  sf('italic', 14, [183,228,199]); tx('Informe de Sostenibilitat · Fase 3', W/2, 91, { align:'center' });

  doc.setDrawColor(...VC); doc.setLineWidth(1);
  doc.line(MAR+25, 100, W-MAR-25, 100);

  rc(MAR, 112, COL, 62, [45,106,79], 5);
  sf('bold', 10, [183,228,199]); tx('DADES DEL CENTRE', W/2, 124, { align:'center' });
  sf('normal', 12, BL);
  tx(`Alumnes: ${alumnes}`,                              W/2, 136, { align:'center' });
  tx(`Any de projecció: ${any}`,                         W/2, 147, { align:'center' });
  tx(`Període: ${ML[mesInici]} – ${ML[mesFi]}`,          W/2, 158, { align:'center' });
  tx(`Millora aplicada: ${Math.round(millora*100)}%`,    W/2, 169, { align:'center' });

  // KPIs portada
  const kW = (COL - 9) / 4, kY = 188;
  const kpis = [
    { label:'Electricitat/any', val: n(dades.elecAny)+' kWh', col:[255,243,224] },
    { label:'Aigua/any',        val: n(dades.aiguaAny)+' m³', col:[227,246,253] },
    { label:'Cost total/any',   val: n(costTotal)+' €',       col:[232,245,233] },
    { label:'CO₂ eq./any',      val: n(co2Total)+' kg',       col:[243,229,245] },
  ];
  kpis.forEach((k, i) => {
    const kx = MAR + i*(kW+3);
    rc(kx, kY, kW, 30, k.col, 4);
    sf('bold', 10, VF); tx(k.val,   kx+kW/2, kY+13, { align:'center' });
    sf('normal', 7, TM); tx(k.label,kx+kW/2, kY+21, { align:'center' });
  });

  sf('normal', 8, [100,160,120]);
  const ara = new Date();
  tx(`Generat el ${ara.toLocaleDateString('ca-ES')} a les ${ara.toLocaleTimeString('ca-ES',{hour:'2-digit',minute:'2-digit'})}`,
    W/2, 258, { align:'center' });
  tx('Calculadora de Sostenibilitat Escolar — Fase 3', W/2, 265, { align:'center' });

  // ══════════════════════════════════════════════════════
  // PÀG 2 — 12 CÀLCULS (10 principals + 2 totals)
  // ══════════════════════════════════════════════════════
  doc.addPage();
  rc(0, 0, W, 14, VF);
  sf('bold', 8, BL); tx('EcoEscola · Informe de Sostenibilitat', MAR, 9);
  tx('Pàg. 2 / 4', W-MAR, 9, { align:'right' });
  y = 22;

  sf('bold', 15, VF); tx('Càlculs de Consum per Indicador', MAR, y); y+=9;
  ln(y); y+=6;

  const seccions = [
    { etq: 'ELECTRICITAT',          files: [
        [`Any complet (${any})`, n(dades.elecAny)+' kWh'],
        [`Període ${ML[mesInici]}–${ML[mesFi]}`, n(dades.elecPer)+' kWh'],
        ['Cost anual estimat', n(Math.round(costEuros('electricitat',dades.elecAny)))+' €'],
        ['CO₂ equivalent anual', n(co2Equivalent('electricitat',dades.elecAny))+' kg'],
    ]},
    { etq: 'AIGUA', files: [
        [`Any complet (${any})`, n(dades.aiguaAny)+' m³'],
        [`Període ${ML[mesInici]}–${ML[mesFi]}`, n(dades.aiguaPer)+' m³'],
        ['Cost anual estimat', n(Math.round(costEuros('aigua',dades.aiguaAny)))+' €'],
        ['CO₂ equivalent anual', n(co2Equivalent('aigua',dades.aiguaAny))+' kg'],
    ]},
    { etq: 'CONSUMIBLES D\'OFICINA', files: [
        [`Any complet (${any})`, n(dades.consAny)+' unitats'],
        [`Període ${ML[mesInici]}–${ML[mesFi]}`, n(dades.consPer)+' unitats'],
        ['Cost anual estimat', n(Math.round(costEuros('consumibles',dades.consAny)))+' €'],
    ]},
    { etq: 'PRODUCTES DE NETEJA', files: [
        [`Any complet (${any})`, n(dades.netAny)+' L'],
        [`Període ${ML[mesInici]}–${ML[mesFi]}`, n(dades.netPer)+' L'],
        ['Cost anual estimat', n(Math.round(costEuros('neteja',dades.netAny)))+' €'],
    ]},
    { etq: 'MANTENIMENT', files: [
        [`Any complet (${any})`, n(dades.mantAny)+' €'],
        [`Període ${ML[mesInici]}–${ML[mesFi]}`, n(dades.mantPer)+' €'],
    ]},
    { etq: 'ESCOMBRARIES', files: [
        [`Any complet (${any})`, n(dades.escAny)+' kg'],
        [`Període ${ML[mesInici]}–${ML[mesFi]}`, n(dades.escPer)+' kg'],
        ['Cost gestió anual', n(Math.round(costEuros('escombraries',dades.escAny)))+' €'],
    ]},
  ];

  seccions.forEach(s => {
    y = capTaula(s.etq, y);
    s.files.forEach((f, i) => { y = row2(f[0], f[1], y, i%2===1, true) + 0; });
    y += 4;
  });

  // Resum final
  rc(MAR, y, COL, 20, CR, 3);
  sf('bold', 10, VF); tx('RESUM TOTAL ANUAL', MAR+4, y+7);
  sf('normal', 9, TX);
  tx(`Cost total estimat: ${n(costTotal)} €   ·   CO₂ equivalent: ${n(co2Total)} kg`, MAR+4, y+15);

  // ══════════════════════════════════════════════════════
  // PÀG 3 — COMPARATIVA ABANS/DESPRÉS + GRÀFIC ESTACIONAL
  // ══════════════════════════════════════════════════════
  doc.addPage();
  rc(0, 0, W, 14, VF);
  sf('bold', 8, BL); tx('EcoEscola · Informe de Sostenibilitat', MAR, 9);
  tx('Pàg. 3 / 4', W-MAR, 9, { align:'right' });
  y = 22;

  sf('bold', 15, VF); tx('Comparativa: Sense Millores vs. Amb Millores', MAR, y); y+=9;
  ln(y); y+=5;

  sf('normal', 8, TM);
  tx(`Millora aplicada: ${Math.round(millora*100)}% · Centre de ${alumnes} alumnes · Any ${any}`, MAR, y); y+=7;

  // Capçalera taula comparativa
  rc(MAR, y, COL, 8, VF);
  sf('bold', 8, BL);
  const cx = [MAR, MAR+52, MAR+98, MAR+134, MAR+158];
  ['Indicador','Sense millores','Amb millora','Estalvi','Cost estalviat'].forEach((h,i)=>{
    tx(h, cx[i]+2, y+5.5);
  });
  y += 8;

  Object.entries(INDICADORS).forEach(([key, cfg], ri) => {
    const abns = Math.round(consumAnual(key, any) * esc);
    const desp = Math.round(consumAnual(key, any) * esc * fm);
    const est  = abns - desp;
    const costEst = Math.round(costEuros(key, est));
    rc(MAR, y, COL, 7, ri%2===0 ? BL : GR);
    sf('normal', 8, TX); tx(cfg.nom,    cx[0]+2, y+5);
    sf('normal', 8, TM); tx(n(abns)+' '+cfg.unitat, cx[1]+2, y+5);
    sf('bold',   8, VM); tx(n(desp)+' '+cfg.unitat, cx[2]+2, y+5);
    doc.setFillColor(...VC); doc.roundedRect(cx[3], y+1, 28, 5, 2, 2, 'F');
    sf('bold', 7, VF); tx('-'+n(est),    cx[3]+14, y+4.8, { align:'center' });
    sf('normal', 8, VM); tx('-'+n(costEst)+' €', cx[4]+2, y+5);
    y += 7;
  });
  y += 6;

  // Gràfic estacional electricitat
  y = capTaula('PERFIL ESTACIONAL MENSUAL — ELECTRICITAT (factors)', y);
  const fElec = [1.30,1.25,1.10,0.95,0.90,0.60,0.30,0.30,0.85,1.05,1.20,1.25];
  const MES_C = ['G','F','M','A','M','J','J','A','S','O','N','D'];
  const bW2 = COL/12, bMaxH = 28, bBase = y + bMaxH + 3;
  fElec.forEach((f,i) => {
    const h = Math.round(f * bMaxH);
    const bx = MAR + i*bW2;
    const col = f >= 1.0 ? [244,162,97] : [82,183,136];
    rc(bx+1, bBase-h, bW2-2, h, col, 1);
    sf('normal', 5.5, TM);
    tx(MES_C[i], bx+bW2/2, bBase+4, { align:'center' });
    tx(f.toFixed(2), bx+bW2/2, bBase-h-1.5, { align:'center' });
  });
  y = bBase + 10;
  sf('normal', 7.5, TM);
  tx('Taronja = per sobre de la mitjana · Verd = per sota · Factor 1.0 = consum mig mensual', MAR, y);
  y += 12;

  // Metodologia
  y = capTaula('METODOLOGIA DE CALCUL', y);
  const metod = [
    'Base referència: escola 350 alumnes, Catalunya, curs 2024-2025',
    'Factors estacionals mensuals aplicats a cada un dels 6 indicadors',
    'Tendencia creixement sense millores: +2% anual acumulatiu',
    'Escala per nombre d\'alumnes: factor = alumnes / 350',
    'Preus: electricitat 0.18 EUR/kWh · aigua 2.10 EUR/m3 · neteja 3.50 EUR/L',
    'Emissions: electricitat 0.27 kgCO2/kWh · aigua 0.35 kgCO2/m3',
    'Reduccions escalonades: any 1 -10%, any 2 -20%, any 3 -30%',
  ];
  metod.forEach((m, i) => {
    rc(MAR, y, 3, 4.5, VC, 1);
    sf('normal', 8, TX); tx(m, MAR+6, y+3.8);
    y += 7;
  });

  // ══════════════════════════════════════════════════════
  // PÀG 4 — PLA 3 ANYS + ECONOMIA CIRCULAR
  // ══════════════════════════════════════════════════════
  doc.addPage();
  rc(0, 0, W, 14, VF);
  sf('bold', 8, BL); tx('EcoEscola · Informe de Sostenibilitat', MAR, 9);
  tx('Pag. 4 / 4', W-MAR, 9, { align:'right' });
  y = 22;

  sf('bold', 15, VF); tx('Pla d\'Accio a 3 Anys i Economia Circular', MAR, y); y+=9;
  ln(y); y+=5;

  // Taula projecció 3 anys
  y = capTaula('PROJECCIO 3 ANYS AMB PLA DE MILLORA (350 alumnes, base 2025)', y);
  rc(MAR, y, COL, 8, VF);
  sf('bold', 8, BL);
  ['Indicador','Base 2025','2025 (-10%)','2026 (-20%)','2027 (-30%)','Estalvi any3'].forEach((h,i)=>{
    tx(h, MAR + [0,45,80,110,140,168][i] + 2, y+5.5);
  });
  y += 8;

  Object.entries(INDICADORS).forEach(([key, cfg], ri) => {
    const base = Math.round(consumAnual(key, 2025) * esc);
    const v1   = Math.round(consumAnual(key, 2025) * esc * 0.90);
    const v2   = Math.round(consumAnual(key, 2026) * esc * 0.80);
    const v3   = Math.round(consumAnual(key, 2027) * esc * 0.70);
    rc(MAR, y, COL, 7, ri%2===0 ? BL : GR);
    sf('normal', 8, TX); tx(cfg.nom, MAR+2, y+5);
    sf('normal', 8, TM);
    [base, v1, v2].forEach((val, ci) => { tx(n(val), MAR+[45,80,110][ci]+2, y+5); });
    sf('bold', 8, VM); tx(n(v3), MAR+142, y+5);
    doc.setFillColor(...VC); doc.roundedRect(MAR+168, y+1, 24, 5, 2,2,'F');
    sf('bold', 7, VF); tx('-'+n(base-v3), MAR+180, y+4.8, { align:'center' });
    y += 7;
  });
  y += 6;

  // Accions per any
  const bloc3 = [
    { any:'Any 1 · 2025', obj:'-10%', accions:[
      'Comptadors intel·ligents electricitat i aigua',
      'Auditoria energètica completa de l\'edifici',
      'Canvi il·luminació corredors per LED',
      'Doble cara per defecte a les impressores',
      'Dashboard de consum visible al centre',
    ]},
    { any:'Any 2 · 2026', obj:'-20%', accions:[
      'Plaques solars fotovoltaiques a la coberta',
      'Sensors presència lavabos i sales comunes',
      'Airejadors i reductors cabal en aixetes',
      'Paper 100% reciclat certificat FSC/PEFC',
      'Recollida d\'aigues pluvials per al reg',
    ]},
    { any:'Any 3 · 2027', obj:'-30%', accions:[
      'Termostats intel·ligents automatitzats',
      'Doble finestres a les aules (aïllament)',
      'Certificació eco-escola (Bandera Verda)',
      '100% productes neteja ecologics',
      'Memoria anual de sostenibilitat publica',
    ]},
  ];

  const cW3 = (COL-4)/3;
  bloc3.forEach((b, i) => {
    const bx = MAR + i*(cW3+2);
    rc(bx, y, cW3, 8, VF, 2); sf('bold', 8, BL); tx(b.any, bx+cW3/2, y+5.5, {align:'center'});
    rc(bx, y+8, cW3, 5, VC);  sf('bold', 8, VF); tx('Obj: '+b.obj, bx+cW3/2, y+12, {align:'center'});
    let ay = y+17;
    b.accions.forEach(a => {
      rc(bx, ay, 2.5, 2.5, VC, .5);
      sf('normal', 7, TX);
      const ls = doc.splitTextToSize(a, cW3-7);
      ls.forEach(l => { tx(l, bx+5, ay+2); ay+=4; });
      ay+=2;
    });
  });
  y += 82; ln(y); y += 7;

  // Economia circular (7 principis)
  sf('bold', 12, VF); tx('7 Principis d\'Economia Circular Aplicats', MAR, y); y+=8;
  const circs = [
    ['1. Reduir a l\'origen',   'Comprar menys i millor, menys embalatge, productes llarga durada.'],
    ['2. Reutilitzar',          'Banc materials: llibres, toner, carpetes entre cursos i nivells.'],
    ['3. Reparar i mantenir',   'Repair cafe amb alumnes. Manteniment preventiu d\'equips.'],
    ['4. Materials biobassats', 'Neteja biodegradable, paper fibra reciclada certificada.'],
    ['5. Energia renovable',    'Autoconsum solar fotovoltaic, electricitat 100% renovable.'],
    ['6. Compra responsable',   'Clausules verdes en contractació publica del centre.'],
    ['7. Educació i difusió',   'Alumnes com a agents de canvi: projectes i campanyes.'],
  ];
  circs.forEach((c, i) => {
    rc(MAR, y, COL, 8, i%2===0 ? CR : BL);
    sf('bold', 8, VF);   tx(c[0], MAR+2, y+5.5);
    sf('normal', 8, TM); tx(c[1], MAR+58, y+5.5);
    y += 8;
  });
  y += 6;

  // Peu de pàgina final
  rc(MAR, y, COL, 14, VF, 3);
  sf('bold', 9, BL); tx('EcoEscola — Calculadora de Sostenibilitat Escolar', W/2, y+6, {align:'center'});
  sf('normal', 7, [183,228,199]);
  tx('Informe generat automaticament · Dades calculades amb factors de referencia per a centres educatius de Catalunya', W/2, y+11, {align:'center'});

  // ── Descarregar ───────────────────────────────────────
  const nom = `EcoEscola_Informe_${any}_${alumnes}alumnes.pdf`;
  doc.save(nom);
}
