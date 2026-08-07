/* ============================================================
   Constructor de árboles familiares
   Todo corre en el navegador. Nada se envía ni se guarda fuera.

   El árbol se arma con cuatro operaciones (padres, pareja, hermano,
   hijo) y las posiciones se calculan solas: nadie escribe coordenadas.
   ============================================================ */

(function () {
    'use strict';

    var SVG_NS = 'http://www.w3.org/2000/svg';

    /* ---------- Geometría ---------- */
    var SYM = 34;                 // lado del cuadrado / diámetro del círculo
    var R = SYM / 2;
    var SIB_GAP = 42;             // aire entre bloques hermanos
    var PARTNER_GAP = 96;         // centro a centro entre miembros de una pareja
    var GEN_GAP = 150;            // alto entre generaciones
    var LABEL_DROP = 24;
    var PAD = 48;

    /* ---------- Modelo ---------- */
    var persons = {};
    var unions = {};
    var seq = 0;
    var selectedId = null;

    function uid(prefix) { seq += 1; return prefix + seq; }

    function newPerson(sex) {
        var id = uid('p');
        persons[id] = {
            id: id,
            sex: sex || 'U',
            affected: false,
            carrier: false,
            deceased: false,
            proband: false,
            name: '',
            parentUnion: null
        };
        return persons[id];
    }

    function newUnion(aId, bId) {
        var id = uid('u');
        unions[id] = { id: id, a: aId, b: bId || null, children: [] };
        return unions[id];
    }

    /* Unión en la que esta persona es miembro de la pareja (no hijo). */
    function unionOf(personId) {
        for (var k in unions) {
            if (unions[k].a === personId || unions[k].b === personId) { return unions[k]; }
        }
        return null;
    }

    function isPartnerB(personId) {
        for (var k in unions) { if (unions[k].b === personId) { return true; } }
        return false;
    }

    function count() { return Object.keys(persons).length; }

    /* ---------- Operaciones ---------- */

    function addParents(id) {
        var p = persons[id];
        if (!p || p.parentUnion) { return; }
        var f = newPerson('M');
        var m = newPerson('F');
        var u = newUnion(f.id, m.id);
        u.children.push(id);
        p.parentUnion = u.id;
        commit(id);
    }

    function addPartner(id) {
        var p = persons[id];
        if (!p || unionOf(id)) { return; }
        var partner = newPerson(p.sex === 'M' ? 'F' : (p.sex === 'F' ? 'M' : 'U'));
        newUnion(id, partner.id);
        commit(partner.id);
    }

    /* Hermanos e hijos dejan la selección donde estaba: así clickear el botón
       dos veces agrega dos hermanos, y no un hijo y después un nieto. */

    function addSibling(id) {
        var p = persons[id];
        if (!p || !p.parentUnion) { return; }
        var s = newPerson('U');
        s.parentUnion = p.parentUnion;
        unions[p.parentUnion].children.push(s.id);
        commit(id);
    }

    function addChild(id) {
        var p = persons[id];
        if (!p) { return; }
        var u = unionOf(id) || newUnion(id, null);
        var c = newPerson('U');
        c.parentUnion = u.id;
        u.children.push(c.id);
        commit(id);
    }

    function descendantsOf(id, acc) {
        acc = acc || {};
        var u = unionOf(id);
        if (!u) { return acc; }
        u.children.forEach(function (cid) {
            if (acc[cid]) { return; }
            acc[cid] = true;
            descendantsOf(cid, acc);
        });
        return acc;
    }

    /* Borra a la persona y a todo lo que desciende de ella. Una pareja que
       había entrado solo por esa unión se va con ella. */
    function removePerson(id) {
        var doomed = descendantsOf(id);
        doomed[id] = true;

        Object.keys(doomed).forEach(function (d) {
            var u = unionOf(d);
            if (!u) { return; }
            var other = u.a === d ? u.b : u.a;
            if (other && !doomed[other] && persons[other] && !persons[other].parentUnion) {
                doomed[other] = true;
            }
        });

        Object.keys(doomed).forEach(function (d) { delete persons[d]; });

        Object.keys(unions).forEach(function (k) {
            var u = unions[k];
            u.children = u.children.filter(function (c) { return !!persons[c]; });
            if (!persons[u.a]) { u.a = u.b; u.b = null; }
            if (u.b && !persons[u.b]) { u.b = null; }
            if (!u.a || !persons[u.a] || (!u.b && !u.children.length)) { delete unions[k]; }
        });

        Object.keys(persons).forEach(function (pid) {
            var pu = persons[pid].parentUnion;
            if (pu && !unions[pu]) { persons[pid].parentUnion = null; }
        });

        commit(Object.keys(persons)[0] || null);
    }

    function reset() {
        persons = {};
        unions = {};
        seq = 0;
        var p = newPerson('M');
        p.proband = true;
        commit(p.id);
    }

    /* ---------- Layout automático ---------- */

    /* Primero medimos el ancho que necesita cada bloque (persona + pareja +
       toda su descendencia); después repartimos las x de izquierda a derecha.
       Es un recorrido en dos pasadas, estilo Reingold-Tilford adaptado a
       parejas: los padres terminan centrados sobre sus hijos. */

    function measure(id) {
        var p = persons[id];
        var u = unionOf(id);
        var selfW = (u && u.b) ? PARTNER_GAP + SYM : SYM;
        var kids = u ? u.children : [];

        var kw = 0;
        kids.forEach(function (cid, i) {
            kw += measure(cid);
            if (i) { kw += SIB_GAP; }
        });

        p._kw = kw;
        p._w = Math.max(selfW, kw);
        return p._w;
    }

    function assign(id, left, gen) {
        var p = persons[id];
        var u = unionOf(id);
        var kids = u ? u.children : [];
        var center;

        if (kids.length) {
            var kx = left + (p._w - p._kw) / 2;
            var firstX = null, lastX = null;
            kids.forEach(function (cid, i) {
                assign(cid, kx, gen + 1);
                if (i === 0) { firstX = persons[cid]._x; }
                lastX = persons[cid]._x;
                kx += persons[cid]._w + SIB_GAP;
            });
            // los padres cuelgan del medio de la línea de hermanos
            center = (firstX + lastX) / 2;
        } else {
            center = left + p._w / 2;
        }

        p._y = gen * GEN_GAP;

        if (u && u.b) {
            var partner = persons[u.a === id ? u.b : u.a];
            var leftSide = center - PARTNER_GAP / 2;
            var rightSide = center + PARTNER_GAP / 2;
            if (u.a === id) { p._x = leftSide; partner._x = rightSide; }
            else { p._x = rightSide; partner._x = leftSide; }
            partner._y = p._y;
            partner._w = SYM;
        } else {
            p._x = center;
        }
    }

    function layout() {
        var rootIds = Object.keys(persons).filter(function (id) {
            return !persons[id].parentUnion && !isPartnerB(id);
        });

        var x = 0;
        rootIds.forEach(function (id) {
            var w = measure(id);
            assign(id, x, 0);
            x += w + SIB_GAP * 2;
        });
    }

    function bounds() {
        var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        Object.keys(persons).forEach(function (id) {
            var p = persons[id];
            if (typeof p._x !== 'number') { return; }
            minX = Math.min(minX, p._x - R);
            maxX = Math.max(maxX, p._x + R);
            minY = Math.min(minY, p._y - R);
            maxY = Math.max(maxY, p._y + R + (p.name ? LABEL_DROP : 0));
        });
        if (minX === Infinity) { return { x: 0, y: 0, w: 200, h: 200 }; }
        return {
            x: minX - PAD, y: minY - PAD,
            w: (maxX - minX) + PAD * 2, h: (maxY - minY) + PAD * 2
        };
    }

    /* ---------- Dibujo ---------- */

    function el(name, attrs) {
        var node = document.createElementNS(SVG_NS, name);
        for (var k in attrs) {
            if (Object.prototype.hasOwnProperty.call(attrs, k)) {
                node.setAttribute(k, attrs[k]);
            }
        }
        return node;
    }

    function themeColors(forExport) {
        // La exportación sale siempre en negro sobre blanco: es el formato
        // canónico y es lo que se pega en una historia clínica o un paper.
        if (forExport) {
            return { line: '#111111', fill: '#111111', empty: '#ffffff', label: '#444444', accent: '#111111' };
        }
        var cs = getComputedStyle(document.documentElement);
        function tok(n, fallback) {
            var v = cs.getPropertyValue(n);
            return (v && v.trim()) || fallback;
        }
        return {
            line: tok('--ped-line', '#43413a'),
            fill: tok('--ped-fill', '#16150f'),
            empty: tok('--ped-empty', '#ffffff'),
            label: tok('--ink-muted', '#6f6c62'),
            accent: tok('--accent', '#a8442a')
        };
    }

    function buildSvg(forExport) {
        var c = themeColors(forExport);
        var b = bounds();

        var svg = el('svg', {
            xmlns: SVG_NS,
            viewBox: b.x + ' ' + b.y + ' ' + b.w + ' ' + b.h,
            preserveAspectRatio: 'xMidYMid meet'
        });

        if (forExport) {
            svg.setAttribute('width', b.w);
            svg.setAttribute('height', b.h);
            var bg = el('rect', { x: b.x, y: b.y, width: b.w, height: b.h, fill: '#ffffff' });
            svg.appendChild(bg);
        }

        var gLines = el('g', {});
        var gNodes = el('g', {});
        svg.appendChild(gLines);
        svg.appendChild(gNodes);

        function line(x1, y1, x2, y2) {
            gLines.appendChild(el('line', {
                x1: x1, y1: y1, x2: x2, y2: y2,
                stroke: c.line, 'stroke-width': 1.8, 'stroke-linecap': 'square'
            }));
        }

        // Uniones: línea de pareja, bajada, línea de hermanos
        Object.keys(unions).forEach(function (k) {
            var u = unions[k];
            var a = persons[u.a];
            if (!a) { return; }
            var bP = u.b ? persons[u.b] : null;

            var cx = bP ? (a._x + bP._x) / 2 : a._x;
            var cy = a._y;

            if (bP) { line(a._x, cy, bP._x, cy); }

            var kids = u.children.filter(function (id) { return !!persons[id]; });
            if (!kids.length) { return; }

            var childY = persons[kids[0]]._y;
            var sibY = childY - GEN_GAP / 2;

            line(cx, cy, cx, sibY);

            var xs = kids.map(function (id) { return persons[id]._x; });
            var minX = Math.min.apply(null, xs);
            var maxX = Math.max.apply(null, xs);
            if (kids.length > 1) { line(minX, sibY, maxX, sibY); }

            kids.forEach(function (id) { line(persons[id]._x, sibY, persons[id]._x, childY); });
        });

        // Personas
        Object.keys(persons).forEach(function (id) {
            var p = persons[id];
            if (typeof p._x !== 'number') { return; }

            var g = el('g', {});
            if (!forExport) {
                g.setAttribute('data-person', id);
                g.setAttribute('tabindex', '0');
                g.setAttribute('role', 'button');
                g.setAttribute('class', 'node' + (id === selectedId ? ' is-selected' : ''));
                g.setAttribute('aria-label', describe(p));
            }

            if (!forExport && id === selectedId) {
                g.appendChild(el('circle', {
                    cx: p._x, cy: p._y, r: R + 11,
                    fill: 'none', stroke: c.accent, 'stroke-width': 2
                }));
            }

            var shapeFill = p.affected ? c.fill : c.empty;
            var shape;
            if (p.sex === 'F') {
                shape = el('circle', { cx: p._x, cy: p._y, r: R });
            } else if (p.sex === 'M') {
                shape = el('rect', { x: p._x - R, y: p._y - R, width: SYM, height: SYM });
            } else {
                // sexo desconocido: rombo
                shape = el('polygon', {
                    points: [
                        p._x, p._y - R - 3,
                        p._x + R + 3, p._y,
                        p._x, p._y + R + 3,
                        p._x - R - 3, p._y
                    ].join(' ')
                });
            }
            shape.setAttribute('fill', shapeFill);
            shape.setAttribute('stroke', c.line);
            shape.setAttribute('stroke-width', 1.8);
            g.appendChild(shape);

            if (p.carrier && !p.affected) {
                g.appendChild(el('circle', { cx: p._x, cy: p._y, r: 4.5, fill: c.line }));
            }

            if (p.deceased) {
                g.appendChild(el('line', {
                    x1: p._x - R - 8, y1: p._y + R + 8,
                    x2: p._x + R + 8, y2: p._y - R - 8,
                    stroke: c.line, 'stroke-width': 1.8
                }));
            }

            if (p.proband) {
                var tipX = p._x - R - 5, tipY = p._y + R + 5;
                g.appendChild(el('line', {
                    x1: tipX - 17, y1: tipY + 17, x2: tipX, y2: tipY,
                    stroke: c.line, 'stroke-width': 1.8
                }));
                g.appendChild(el('polygon', {
                    points: [tipX, tipY, tipX - 9, tipY + 3, tipX - 3, tipY + 9].join(' '),
                    fill: c.line
                }));
            }

            if (p.name) {
                var t = el('text', {
                    x: p._x, y: p._y + R + 17,
                    'text-anchor': 'middle',
                    fill: c.label,
                    'font-family': 'Inter, system-ui, -apple-system, Segoe UI, sans-serif',
                    'font-size': 12
                });
                t.textContent = p.name;
                g.appendChild(t);
            }

            gNodes.appendChild(g);
        });

        return svg;
    }

    function describe(p) {
        var bits = [p.sex === 'M' ? 'Varón' : (p.sex === 'F' ? 'Mujer' : 'Sexo no especificado')];
        if (p.affected) { bits.push('afectado'); }
        if (p.carrier) { bits.push('portadora'); }
        if (p.deceased) { bits.push('fallecido'); }
        if (p.proband) { bits.push('caso índice'); }
        if (p.name) { bits.push(p.name); }
        return bits.join(', ');
    }

    /* ---------- Exportar ---------- */

    function download(blob, filename) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }

    function serialize() {
        return '<?xml version="1.0" encoding="UTF-8"?>\n'
            + new XMLSerializer().serializeToString(buildSvg(true));
    }

    function exportSVG() {
        download(new Blob([serialize()], { type: 'image/svg+xml;charset=utf-8' }),
            'arbol-familiar.svg');
    }

    function exportPNG() {
        var b = bounds();
        var scale = 2;
        var xml = serialize();
        var url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);

        var img = new Image();
        img.onload = function () {
            var canvas = document.createElement('canvas');
            canvas.width = Math.round(b.w * scale);
            canvas.height = Math.round(b.h * scale);
            var ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(function (blob) {
                if (blob) { download(blob, 'arbol-familiar.png'); }
            }, 'image/png');
        };
        img.onerror = function () {
            status('No se pudo generar el PNG. Probá exportar en SVG.');
        };
        img.src = url;
    }

    /* ---------- Interfaz ---------- */

    var stage = document.getElementById('stage');
    var panel = document.getElementById('panel');
    var statusEl = document.getElementById('status');
    if (!stage || !panel) { return; }

    function status(msg) {
        if (statusEl) { statusEl.textContent = msg || ''; }
    }

    function select(id) {
        selectedId = id;
    }

    function commit(nextSelected) {
        if (typeof nextSelected !== 'undefined') { select(nextSelected); }
        layout();
        paint();
    }

    function paint() {
        stage.innerHTML = '';
        stage.appendChild(buildSvg(false));
        paintPanel();
    }

    function on(id, evt, fn) {
        var node = document.getElementById(id);
        if (node) { node.addEventListener(evt, fn); }
    }

    function setDisabled(id, off) {
        var node = document.getElementById(id);
        if (node) { node.disabled = !!off; }
    }

    function setPressed(id, isOn) {
        var node = document.getElementById(id);
        if (node) {
            node.setAttribute('aria-pressed', String(!!isOn));
            node.classList.toggle('is-on', !!isOn);
        }
    }

    function paintPanel() {
        var p = persons[selectedId];
        panel.hidden = !p;
        if (!p) { return; }

        setDisabled('act-parents', !!p.parentUnion);
        setDisabled('act-partner', !!unionOf(p.id));
        setDisabled('act-sibling', !p.parentUnion);
        setDisabled('act-remove', count() <= 1);

        ['M', 'F', 'U'].forEach(function (s) {
            var node = document.getElementById('sex-' + s);
            if (node) {
                node.setAttribute('aria-pressed', String(p.sex === s));
                node.classList.toggle('is-on', p.sex === s);
            }
        });

        setPressed('flag-affected', p.affected);
        setPressed('flag-carrier', p.carrier);
        setPressed('flag-deceased', p.deceased);
        setPressed('flag-proband', p.proband);

        var nameInput = document.getElementById('field-name');
        if (nameInput && nameInput.value !== p.name) { nameInput.value = p.name; }
    }

    // Selección: click o teclado sobre un símbolo
    stage.addEventListener('click', function (e) {
        var g = e.target.closest ? e.target.closest('[data-person]') : null;
        if (!g) { return; }
        select(g.getAttribute('data-person'));
        paint();
    });

    stage.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') { return; }
        var g = e.target.closest ? e.target.closest('[data-person]') : null;
        if (!g) { return; }
        e.preventDefault();
        select(g.getAttribute('data-person'));
        paint();
    });

    on('act-parents', 'click', function () { addParents(selectedId); });
    on('act-partner', 'click', function () { addPartner(selectedId); });
    on('act-sibling', 'click', function () { addSibling(selectedId); });
    on('act-child', 'click', function () { addChild(selectedId); });

    on('act-remove', 'click', function () {
        var p = persons[selectedId];
        if (!p || count() <= 1) { return; }
        var kids = Object.keys(descendantsOf(selectedId)).length;
        var msg = kids
            ? 'Se van a borrar esta persona y ' + kids + ' descendiente(s). ¿Seguir?'
            : '¿Borrar esta persona?';
        if (window.confirm(msg)) { removePerson(selectedId); }
    });

    ['M', 'F', 'U'].forEach(function (s) {
        on('sex-' + s, 'click', function () {
            if (!persons[selectedId]) { return; }
            persons[selectedId].sex = s;
            commit();
        });
    });

    [['flag-affected', 'affected'], ['flag-carrier', 'carrier'],
     ['flag-deceased', 'deceased'], ['flag-proband', 'proband']].forEach(function (pair) {
        on(pair[0], 'click', function () {
            var p = persons[selectedId];
            if (!p) { return; }
            if (pair[1] === 'proband' && !p.proband) {
                // el caso índice es uno solo
                Object.keys(persons).forEach(function (id) { persons[id].proband = false; });
            }
            p[pair[1]] = !p[pair[1]];
            commit();
        });
    });

    on('field-name', 'input', function (e) {
        var p = persons[selectedId];
        if (!p) { return; }
        p.name = e.target.value.slice(0, 24);
        layout();
        stage.innerHTML = '';
        stage.appendChild(buildSvg(false));
    });

    on('act-png', 'click', exportPNG);
    on('act-svg', 'click', exportSVG);

    on('act-reset', 'click', function () {
        if (window.confirm('Esto borra el árbol y empieza de cero. ¿Seguir?')) {
            reset();
            status('');
        }
    });

    // Redibuja al cambiar de tema, para que los colores acompañen
    if (window.matchMedia) {
        var mq = window.matchMedia('(prefers-color-scheme: dark)');
        if (mq.addEventListener) { mq.addEventListener('change', paint); }
    }
    document.addEventListener('themechange', paint);

    reset();
}());
