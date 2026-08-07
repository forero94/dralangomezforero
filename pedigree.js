/* ============================================================
   Árbol familiar interactivo — caso clínico guiado
   Dibuja el árbol en SVG y lo revela por pasos.
   El texto de los pasos vive en el HTML: sin JS el caso se lee
   igual como artículo, solo se pierde el dibujo.
   ============================================================ */

(function () {
    'use strict';

    var SVG_NS = 'http://www.w3.org/2000/svg';
    var R = 17;              // medio símbolo
    var VIEW = '0 0 800 420';

    /* ---------- Datos del árbol ---------- */

    var NODES = [
        { id: 'I1',    x: 300, y: 70,  sex: 'M', label: 'Abuelo' },
        { id: 'I2',    x: 420, y: 70,  sex: 'F', label: 'Abuela' },

        { id: 'II1',   x: 140, y: 210, sex: 'M', label: 'Tío materno', affected: true, deceased: true },
        { id: 'II2',   x: 320, y: 210, sex: 'F', label: 'Tía materna' },
        { id: 'II2p',  x: 440, y: 210, sex: 'M', label: '' },
        { id: 'II3',   x: 600, y: 210, sex: 'F', label: 'Madre' },
        { id: 'II3p',  x: 720, y: 210, sex: 'M', label: 'Padre' },

        { id: 'III1',  x: 380, y: 350, sex: 'M', label: 'Primo', affected: true },
        { id: 'III2',  x: 600, y: 350, sex: 'F', label: 'Hermana' },
        { id: 'III3',  x: 720, y: 350, sex: 'M', label: 'Paciente', affected: true, proband: true }
    ];

    var LINKS = [
        { id: 'partner-I',    d: 'M300 70 H420' },
        { id: 'sib2-stem',    d: 'M360 70 V150' },
        { id: 'sib2-bar-l',   d: 'M140 150 H360' },
        { id: 'sib2-bar-r',   d: 'M360 150 H600' },
        { id: 'drop-II1',     d: 'M140 150 V210' },
        { id: 'drop-II2',     d: 'M320 150 V210' },
        { id: 'drop-II3',     d: 'M600 150 V210' },

        { id: 'partner-II2',  d: 'M320 210 H440' },
        { id: 'drop-III1',    d: 'M380 210 V350' },

        { id: 'partner-II3',  d: 'M600 210 H720' },
        { id: 'sib3-stem',    d: 'M660 210 V290' },
        { id: 'sib3-bar-l',   d: 'M600 290 H660' },
        { id: 'sib3-bar-r',   d: 'M660 290 H720' },
        { id: 'drop-III2',    d: 'M600 290 V350' },
        { id: 'drop-III3',    d: 'M720 290 V350' }
    ];

    /* Qué se ve en cada paso. Es acumulativo: cada entrada lista
       todo lo visible, no solo lo nuevo. */
    var STEPS = [
        {   // 1 — motivo de consulta
            nodes: ['II3', 'II3p', 'III3'],
            links: ['partner-II3', 'sib3-stem', 'sib3-bar-r', 'drop-III3']
        },
        {   // 2 — la hermana
            nodes: ['II3', 'II3p', 'III3', 'III2'],
            links: ['partner-II3', 'sib3-stem', 'sib3-bar-r', 'drop-III3',
                    'sib3-bar-l', 'drop-III2']
        },
        {   // 3 — aparece el tío materno
            nodes: ['II3', 'II3p', 'III3', 'III2', 'I1', 'I2', 'II1'],
            links: ['partner-II3', 'sib3-stem', 'sib3-bar-r', 'drop-III3',
                    'sib3-bar-l', 'drop-III2',
                    'partner-I', 'sib2-stem', 'sib2-bar-l', 'sib2-bar-r',
                    'drop-II1', 'drop-II3']
        },
        {   // 4 — los primos
            nodes: ['I1', 'I2', 'II1', 'II2', 'II2p', 'II3', 'II3p', 'III1', 'III2', 'III3'],
            links: LINKS.map(function (l) { return l.id; })
        },
        {   // 5 — el patrón: portadoras obligadas, se atenúa lo que entró por matrimonio
            nodes: ['I1', 'I2', 'II1', 'II2', 'II2p', 'II3', 'II3p', 'III1', 'III2', 'III3'],
            links: LINKS.map(function (l) { return l.id; }),
            carriers: ['I2', 'II2', 'II3'],
            dimmed: ['I1', 'II2p', 'II3p']
        },
        {   // 6 — qué cambia: el foco pasa a la hermana
            nodes: ['I1', 'I2', 'II1', 'II2', 'II2p', 'II3', 'II3p', 'III1', 'III2', 'III3'],
            links: LINKS.map(function (l) { return l.id; }),
            carriers: ['I2', 'II2', 'II3'],
            dimmed: ['I1', 'II2p', 'II3p'],
            highlight: 'III2'
        }
    ];

    /* ---------- Utilidades SVG ---------- */

    function el(name, attrs) {
        var node = document.createElementNS(SVG_NS, name);
        for (var k in attrs) {
            if (Object.prototype.hasOwnProperty.call(attrs, k)) {
                node.setAttribute(k, attrs[k]);
            }
        }
        return node;
    }

    /* Símbolo estándar: cuadrado = varón, círculo = mujer,
       relleno = afectado, barra = fallecido, flecha = paciente que consulta. */
    function drawNode(n) {
        var g = el('g', { class: 'ped-node', 'data-id': n.id });
        if (n.affected) { g.classList.add('is-affected'); }
        if (n.proband) { g.classList.add('is-proband'); }

        var sym = n.sex === 'F'
            ? el('circle', { class: 'sym', cx: n.x, cy: n.y, r: R })
            : el('rect', { class: 'sym', x: n.x - R, y: n.y - R, width: R * 2, height: R * 2 });
        g.appendChild(sym);

        if (n.deceased) {
            g.appendChild(el('line', {
                class: 'ped-deceased',
                x1: n.x - R - 7, y1: n.y + R + 7,
                x2: n.x + R + 7, y2: n.y - R - 7
            }));
        }

        if (n.label) {
            var t = el('text', { class: 'label', x: n.x, y: n.y + R + 17 });
            t.textContent = n.label;
            g.appendChild(t);
        }

        return g;
    }

    function drawProbandArrow(n) {
        var g = el('g', { class: 'ped-proband-arrow-group' });
        var tailX = n.x - R - 22, tailY = n.y + R + 22;
        var tipX = n.x - R - 4, tipY = n.y + R + 4;

        g.appendChild(el('line', {
            class: 'ped-proband-arrow', x1: tailX, y1: tailY, x2: tipX, y2: tipY
        }));
        g.appendChild(el('polygon', {
            class: 'ped-proband-arrow-head',
            points: [tipX, tipY, tipX - 8, tipY + 2, tipX - 2, tipY + 8].join(' ')
        }));
        return g;
    }

    /* ---------- Construcción ---------- */

    var host = document.getElementById('pedigree');
    var stepEls = Array.prototype.slice.call(document.querySelectorAll('[data-case-step]'));
    if (!host || !stepEls.length) { return; }

    var svg = el('svg', {
        viewBox: VIEW,
        role: 'img',
        'aria-label': 'Árbol familiar de tres generaciones que se construye paso a paso a lo largo del caso.'
    });

    var layerLinks = el('g', {});
    var layerNodes = el('g', {});
    var layerMarks = el('g', {});
    svg.appendChild(layerLinks);   // las líneas van debajo de los símbolos
    svg.appendChild(layerNodes);
    svg.appendChild(layerMarks);

    var linkEls = {};
    LINKS.forEach(function (l) {
        var p = el('path', { class: 'ped-line', d: l.d });
        linkEls[l.id] = p;
        layerLinks.appendChild(p);
    });

    var nodeEls = {};
    var carrierEls = {};
    NODES.forEach(function (n) {
        var g = drawNode(n);
        nodeEls[n.id] = g;
        layerNodes.appendChild(g);

        if (n.proband) { layerMarks.appendChild(drawProbandArrow(n)); }

        // Punto central de portadora obligada, oculto hasta que corresponda
        var dot = el('circle', { class: 'ped-carrier', cx: n.x, cy: n.y, r: 4.5 });
        carrierEls[n.id] = dot;
        layerMarks.appendChild(dot);
    });

    var highlightRing = el('circle', { class: 'ped-highlight', r: R + 9 });
    layerMarks.appendChild(highlightRing);

    host.appendChild(svg);

    /* ---------- Estado y navegación ---------- */

    var current = 0;
    var prevBtn = document.getElementById('case-prev');
    var nextBtn = document.getElementById('case-next');
    var countEl = document.getElementById('case-count');
    var progressEl = document.getElementById('case-progress');
    var arrowEls = Array.prototype.slice.call(svg.querySelectorAll('.ped-proband-arrow, .ped-proband-arrow-head'));

    if (progressEl) {
        STEPS.forEach(function () { progressEl.appendChild(document.createElement('li')); });
    }
    var progressItems = progressEl
        ? Array.prototype.slice.call(progressEl.children)
        : [];

    function has(list, id) { return !!list && list.indexOf(id) !== -1; }

    function render(i) {
        var step = STEPS[i];
        if (!step) { return; }

        NODES.forEach(function (n) {
            var g = nodeEls[n.id];
            g.classList.toggle('is-visible', has(step.nodes, n.id));
            g.classList.toggle('is-dimmed', has(step.dimmed, n.id));
            carrierEls[n.id].classList.toggle('is-visible', has(step.carriers, n.id));
        });

        LINKS.forEach(function (l) {
            linkEls[l.id].classList.toggle('is-visible', has(step.links, l.id));
        });

        // La flecha acompaña al paciente que consulta
        var probandVisible = has(step.nodes, 'III3');
        arrowEls.forEach(function (a) { a.classList.toggle('is-visible', probandVisible); });

        if (step.highlight && nodeEls[step.highlight]) {
            var target = NODES.filter(function (n) { return n.id === step.highlight; })[0];
            highlightRing.setAttribute('cx', target.x);
            highlightRing.setAttribute('cy', target.y);
            highlightRing.classList.add('is-visible');
        } else {
            highlightRing.classList.remove('is-visible');
        }

        stepEls.forEach(function (s, idx) { s.hidden = idx !== i; });
        progressItems.forEach(function (p, idx) { p.classList.toggle('is-done', idx <= i); });

        if (prevBtn) { prevBtn.disabled = i === 0; }
        if (nextBtn) { nextBtn.disabled = i === STEPS.length - 1; }
        if (countEl) { countEl.textContent = (i + 1) + ' / ' + STEPS.length; }
    }

    function go(i) {
        current = Math.max(0, Math.min(STEPS.length - 1, i));
        render(current);
    }

    if (prevBtn) { prevBtn.addEventListener('click', function () { go(current - 1); }); }
    if (nextBtn) { nextBtn.addEventListener('click', function () { go(current + 1); }); }

    // Flechas del teclado cuando el caso está en pantalla
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') { return; }
        var tag = (document.activeElement && document.activeElement.tagName) || '';
        if (tag === 'INPUT' || tag === 'TEXTAREA') { return; }

        var box = host.getBoundingClientRect();
        var onScreen = box.top < window.innerHeight * 0.8 && box.bottom > 0;
        if (!onScreen) { return; }

        go(current + (e.key === 'ArrowRight' ? 1 : -1));
    });

    go(0);
}());
