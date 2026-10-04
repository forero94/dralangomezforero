/* ============================================================
   Hebra de tinta
   La doble hebra del paisaje del genoma, de pie en el margen de la
   home y pintada con más libertad que exactitud: no es ningún
   cromosoma en particular. Tramos largos y sueltos, cada tanto un
   nudo apretado o una fila de nucleosomas como cuentas de un collar,
   polimerasas que sueltan su ARN rojo, aguadas, salpicaduras y
   niebla. Al bajar por la página se la recorre de punta a punta: el
   pincel apoya arriba y se levanta al final.

   El pincel y los habitantes se copian de genoma/landscape.js. La
   hebra no gira sola: avanzar a lo largo de ella con el scroll ya se
   ve como un giro. Lo fijo se calcula una vez; en cada cuadro solo
   se pinta el tramo visible.
   ============================================================ */

(function () {
    'use strict';

    var box = document.getElementById('helix');
    var cv = box && box.querySelector('canvas');
    var ctx = cv && cv.getContext('2d');
    if (!ctx) { return; }

    /* ---------- Composición ---------- */
    var SEED = 'tinta';
    var L = 9500;              // largo de la hebra, en unidades del dibujo
    var LIFT = 220;            // tramo en que el pincel apoya y se levanta, en cada punta
    var P_EU = 260, P_HET = 32.5;  // unidades por vuelta, suelta y apretada: de 8 a 1, como en el paisaje
    var R_EU = 54, R_HET = 27;     // radio
    var HX_GROOVE = 0.38;          // desfase entre hebras, en vueltas: surco mayor y surco menor
    var HX_STEP = 4;               // resolución de las tablas de la hélice
    var HS = 3;                    // una muestra de la hebra cada 3 unidades
    var REST = 0.62;               // con movimiento reducido queda quieta en este punto del recorrido
    var X0 = 0, X1 = L;

    /* ---------- Azar con semilla y ruido (de landscape.js) ---------- */

    function hash() {
        var s = Array.prototype.join.call(arguments, '|');
        var h = 2166136261;
        for (var i = 0; i < s.length; i++) {
            h ^= s.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return h >>> 0;
    }

    function rngFrom(n) {
        var a = n >>> 0;
        return function () {
            a = (a + 0x6D2B79F5) >>> 0;
            var t = a;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    var perm = new Uint8Array(512);

    function seedNoise(n) {
        var r = rngFrom(n), p = [], i;
        for (i = 0; i < 256; i++) { p[i] = i; }
        for (i = 255; i > 0; i--) {
            var j = Math.floor(r() * (i + 1));
            var t = p[i]; p[i] = p[j]; p[j] = t;
        }
        for (i = 0; i < 512; i++) { perm[i] = p[i & 255]; }
    }

    function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    function lerp(a, b, t) { return a + (b - a) * t; }

    function grad(h, x, y) {
        switch (h & 7) {
            case 0: return x + y;
            case 1: return -x + y;
            case 2: return x - y;
            case 3: return -x - y;
            case 4: return x;
            case 5: return -x;
            case 6: return y;
            default: return -y;
        }
    }

    function perlin(x, y) {
        var X = Math.floor(x), Y = Math.floor(y);
        var fx = x - X, fy = y - Y;
        X &= 255; Y &= 255;
        var u = fade(fx), v = fade(fy);
        var a = perm[X] + Y, b = perm[X + 1] + Y;
        return lerp(
            lerp(grad(perm[a], fx, fy), grad(perm[b], fx - 1, fy), u),
            lerp(grad(perm[a + 1], fx, fy - 1), grad(perm[b + 1], fx - 1, fy - 1), u),
            v);
    }

    function noise(x, y) {
        y = y || 0;
        var sum = 0, amp = 0.5, f = 1;
        for (var o = 0; o < 4; o++) {
            sum += amp * perlin(x * f, y * f);
            amp *= 0.5;
            f *= 2;
        }
        var v = 0.5 + sum * 0.75;
        return v < 0 ? 0 : v > 1 ? 1 : v;
    }

    function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
    function smoothstep(a, b, v) { var t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }

    /* ---------- Pincel (de landscape.js) ---------- */

    function f1(v) { return Math.round(v * 10) / 10; }

    function area(pts) {
        var a = 0;
        for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
            a += (pts[j][0] - pts[i][0]) * (pts[j][1] + pts[i][1]);
        }
        return a;
    }

    function pathOf(pts, close) {
        if (close && area(pts) < 0) { pts = pts.slice().reverse(); }
        var s = 'M' + f1(pts[0][0]) + ' ' + f1(pts[0][1]);
        for (var i = 1; i < pts.length; i++) { s += 'L' + f1(pts[i][0]) + ' ' + f1(pts[i][1]); }
        return close ? s + 'Z' : s;
    }

    function swell(t) { return Math.sin(t * Math.PI); }
    function taper(t) { return 1 - t * 0.75; }
    function plank(t) { return Math.min(1, t * 10, (1 - t) * 10); }
    function flat() { return 1; }

    function brush(pts, w, noi, fun, n0) {
        if (pts.length < 3) { return ''; }
        fun = fun || swell;
        if (n0 === undefined) { n0 = (pts[0][0] * 0.137 + pts[0][1] * 0.071) % 300; }
        var left = [], right = [], n = pts.length;
        for (var i = 1; i < n - 1; i++) {
            var ww = w * fun(i / (n - 1));
            ww *= (1 - noi) + noi * 2 * noise(i * 0.5, n0);
            var tx = pts[i + 1][0] - pts[i - 1][0], ty = pts[i + 1][1] - pts[i - 1][1];
            var l = Math.sqrt(tx * tx + ty * ty) || 1;
            var nx = -ty / l, ny = tx / l;
            left.push([pts[i][0] + nx * ww, pts[i][1] + ny * ww]);
            right.push([pts[i][0] - nx * ww, pts[i][1] - ny * ww]);
        }
        return pathOf([pts[0]].concat(left, [pts[n - 1]], right.reverse()), true);
    }

    function blobPts(x, y, len, wid, ang, n0) {
        var pts = [], ca = Math.cos(ang), sa = Math.sin(ang);
        for (var k = 0; k < 14; k++) {
            var th = k / 14 * Math.PI * 2;
            var ns = 0.75 + 0.5 * noise(Math.cos(th) * 0.9 + n0, Math.sin(th) * 0.9 + n0 * 0.37);
            var px = Math.cos(th) * len / 2 * ns, py = Math.sin(th) * wid / 2 * ns;
            pts.push([x + px * ca - py * sa, y + px * sa + py * ca]);
        }
        return pts;
    }

    function blob(x, y, len, wid, ang, n0) { return pathOf(blobPts(x, y, len, wid, ang, n0), true); }
    function ring(pts, w, n0) { return brush(pts.concat([pts[0], pts[1]]), w, 0.45, flat, n0); }

    /* ---------- El ritmo de la hebra ----------
       Sin datos: cuánto se enrolla y dónde lleva cuentas sale de un ruido
       lento. Tramos largos y sueltos, cada tanto un nudo apretado. */

    function coilAt(x) {
        var knot = smoothstep(0.52, 0.72, noise(x * 0.0016, 3));
        var drift = 0.35 * Math.pow(noise(x * 0.005, 9), 2);
        return clamp(knot + drift, 0, 1);
    }

    // tramos de cuentas: nucleosomas en fila, donde la hebra está suelta
    function beadsAt(x) { return noise(x * 0.0022, 21) > 0.6 && coilAt(x) < 0.5; }

    // cuánta tinta lleva el pincel: tramos cargados y tramos que se van secando
    function loadAt(x) { return 0.6 + 0.7 * noise(x * 0.0025, 33); }

    // pincel seco: a trechos cortos la hebra de adelante se corta
    function dryAt(x) { return smoothstep(0.22, 0.3, noise(x * 0.018, 77)); }

    /* ---------- Doble hebra (de landscape.js) ---------- */

    function boxSmooth(a, r) {
        var out = new Float32Array(a.length);
        for (var i = 0; i < a.length; i++) {
            var acc = 0, n = 0;
            for (var j = Math.max(0, i - r); j <= Math.min(a.length - 1, i + r); j++) { acc += a[j]; n++; }
            out[i] = acc / n;
        }
        return out;
    }

    // La fase se integra a lo largo de la hebra: el paso cambia sin cortes.
    var NC = Math.ceil((X1 - X0) / HX_STEP) + 1, hxC, hxPh;

    function buildTables() {
        var raw = new Float32Array(NC), i;
        for (i = 0; i < NC; i++) { raw[i] = coilAt(X0 + i * HX_STEP); }
        hxC = boxSmooth(boxSmooth(raw, 8), 8);
        hxPh = new Float64Array(NC);
        for (i = 1; i < NC; i++) {
            hxPh[i] = hxPh[i - 1] + HX_STEP / (P_EU * Math.pow(P_HET / P_EU, hxC[i - 1]));
        }
    }

    function tab(a, x) {
        var f = clamp((x - X0) / HX_STEP, 0, a.length - 1), i = Math.floor(f);
        return i >= a.length - 1 ? a[a.length - 1] : lerp(a[i], a[i + 1], f - i);
    }

    function xAtPhase(u) {
        var lo = 0, hi = NC - 1;
        if (u <= hxPh[0]) { return X0; }
        if (u >= hxPh[hi]) { return X1; }
        while (hi - lo > 1) {
            var mid = (lo + hi) >> 1;
            if (hxPh[mid] < u) { lo = mid; } else { hi = mid; }
        }
        return Math.min(X1, X0 + (lo + (u - hxPh[lo]) / (hxPh[hi] - hxPh[lo])) * HX_STEP);
    }

    function compactAt(x) { return tab(hxC, x); }
    function theta(k, x) { return 2 * Math.PI * (tab(hxPh, x) + k * HX_GROOVE); }

    // el eje serpentea como un trazo a mano alzada, y se superenrolla en los nudos
    function axisY(x) {
        var w = 26 * smoothstep(0.6, 1, compactAt(x));
        return 40 * (noise(x * 0.0009, 40) - 0.5) + 4 * (noise(x * 0.008, 60) - 0.5)
            + w * Math.sin(2 * Math.PI * x / 170);
    }

    function wobble(k, x) { return 3 * (noise(x * 0.02, 90 + k) - 0.5); }

    var nucX = new Float64Array(0);

    function firstAtLeast(arr, x) {
        var lo = 0, hi = arr.length;
        while (lo < hi) {
            var mid = (lo + hi) >> 1;
            if (arr[mid] < x) { lo = mid + 1; } else { hi = mid; }
        }
        return lo;
    }

    // junto a cada nucleosoma la doble hebra se afina para darle casi dos vueltas
    function pinchAt(x) {
        var f = 1;
        for (var j = firstAtLeast(nucX, x - 62); j < nucX.length && nucX[j] < x + 62; j++) {
            f = Math.min(f, lerp(0.12, 1, smoothstep(17, 52, Math.abs(x - nucX[j]))));
        }
        return f;
    }

    function radiusAt(x) { return lerp(R_EU, R_HET, compactAt(x)) * pinchAt(x); }
    function strandY(k, x) { return axisY(x) + radiusAt(x) * Math.sin(theta(k, x)) + wobble(k, x); }
    function strandAngle(k, x) { return Math.atan(strandY(k, x + 0.5) - strandY(k, x - 0.5)); }
    function depthAt(k, x) { return Math.cos(theta(k, x)); }
    // el pincel apoya y se levanta: la hebra se afina hasta desaparecer en las puntas
    function helixEnv(x) { return x < X0 || x > X1 ? 0 : smoothstep(0, LIFT, Math.min(x - X0, X1 - x)); }

    /* ---------- Habitantes (de landscape.js) ----------
       Cada dibujo es una lista de rellenos: color, opacidad y trazo. */

    function op(c, o, d) { return d ? [{ c: c, o: o, d: d }] : []; }

    function protein(pts, wash, n0) {
        var d = pathOf(pts, true);
        return [{ c: 'pp', o: 1, d: d }, { c: 'pw', o: wash * 2.2, d: d }, { c: 'po', o: 0.85, d: ring(pts, 0.9, n0) }];
    }

    var POL_K = 1.2, POL_EXIT = [-12 * POL_K, -14 * POL_K];

    function polBody(e) {
        function domain(u, v, len, wid, tilt, n0) {
            return blobPts(u * POL_K, v * POL_K, len * POL_K, wid * POL_K, tilt, n0);
        }
        return protein(domain(-7, -1, 30, 30, 0, e.n0), 0.13, e.n0)
            .concat(protein(domain(8, 11, 22, 12, -0.3, e.n0 + 2), 0.18, e.n0 + 2))
            .concat(protein(domain(7, -11, 30, 15, 0.3, e.n0 + 4), 0.09, e.n0 + 4))
            .concat(op('acc', 0.9, blob(POL_K, 0, 4.2, 4.2, 0, e.n0 + 6)));
    }

    // el transcripto, con el capuchón 5' en la punta
    function polTail(e, len) {
        var d = e.dir, trk = [];
        for (var t = 0; t <= 1.0001; t += 1 / 18) {
            trk.push([-d * t * len * 0.85, -t * len * 0.42 + Math.sin(t * 6 + e.n0) * 5 * t]);
        }
        var tip = trk[trk.length - 1];
        return op('acc', 0.8, brush(trk, 1.05, 0.35, taper, e.n0)).concat(op('acc', 0.9, blob(tip[0], tip[1], 5, 5, 0, e.n0 + 2)));
    }

    function nucBody(e) {
        var ang = e.tilt;
        var core = blobPts(0, 0, 30, 26, ang, e.n0);
        var lid = blobPts(Math.sin(ang) * 8, -7.5, 22, 8, ang, e.n0 + 3);
        var lobes = '';
        [[-6, -1], [6, -1], [-6, 7.5], [6, 7.5]].forEach(function (o, k) {
            lobes += blob(o[0], o[1], 9, 7, ang, e.n0 + k);
        });
        var wraps = '';
        for (var w = 0; w < 2; w++) {
            for (var k = 0; k < 2; k++) {
                var pts = [];
                for (var q = 0; q <= 16; q++) {
                    var t = q / 16;
                    pts.push([lerp(-17, 17, t), (w - 0.5) * 10 + (t - 0.5) * 6 + Math.sin(Math.PI * t) * 5 + (k - 0.5) * 3.6]);
                }
                wraps += brush(pts, 1.1, 0.3, plank, e.n0 + w * 2 + k);
            }
        }
        var cd = pathOf(core, true);
        return [{ c: 'pp', o: 1, d: cd }, { c: 'pw', o: 0.24, d: cd }]
            .concat(op('pw', 0.16, lobes))
            .concat([{ c: 'pp', o: 0.6, d: pathOf(lid, true) }])
            .concat(op('po', 0.85, ring(core, 0.8, e.n0)), op('po', 0.45, ring(lid, 0.45, e.n0 + 3)), op('hf', 1, wraps));
    }

    /* ---------- Dónde va cada uno ----------
       Repartidos para que el dibujo respire: cuentas en fila donde toca,
       alguna suelta, y polimerasas en los tramos tranquilos. */

    var life = [];             // ordenada por x

    function nucleosome(x, r) {
        return { type: 'nuc', x: x, tilt: (r() - 0.5) * 0.3, n0: r() * 50, box: [x - 19, x + 19] };
    }

    function planLife() {
        var taken = new Map();
        function free(x0, x1) {
            for (var b = Math.floor(x0 / 100) - 1; b <= Math.floor(x1 / 100) + 1; b++) {
                var list = taken.get(b);
                if (!list) { continue; }
                for (var i = 0; i < list.length; i++) {
                    if (list[i][0] < x1 && list[i][1] > x0) { return false; }
                }
            }
            return true;
        }
        function put(e) {
            var x0 = e.box[0] - 12, x1 = e.box[1] + 12;
            if (!free(x0, x1)) { return false; }
            for (var b = Math.floor(x0 / 100); b <= Math.floor(x1 / 100); b++) {
                if (!taken.has(b)) { taken.set(b, []); }
                taken.get(b).push([x0, x1]);
            }
            life.push(e);
            return true;
        }

        var r = rngFrom(hash(SEED, 'vida')), x;

        // cuentas en fila
        for (x = X0 + LIFT; x < X1 - LIFT; x += 58 + r() * 8) {
            if (beadsAt(x)) { put(nucleosome(x, r)); }
        }

        // polimerasas con su transcripto, en los tramos sueltos
        for (x = X0 + LIFT + r() * 300; x < X1 - LIFT; x += 380 + r() * 520) {
            if (coilAt(x) > 0.35 || beadsAt(x)) { continue; }
            var d = r() < 0.5 ? 1 : -1;
            put({ type: 'pol', x: x, dir: d, k: d > 0 ? 1 : 0, len: 60 + r() * 70, n0: r() * 50, box: [x - 30, x + 30] });
        }

        // alguna cuenta suelta
        for (x = X0 + LIFT; x < X1 - LIFT; x += 150) {
            if (r() < 0.06) { put(nucleosome(x + (r() - 0.5) * 60, r)); }
        }

        life.sort(function (a, b) { return a.x - b.x; });
        nucX = Float64Array.from(life.filter(function (e) { return e.type === 'nuc'; })
            .map(function (e) { return e.x; }));
    }

    // Todo es fijo: lugar, giro y de qué lado de la hebra queda cada uno se calculan una vez.
    // parts: [x, y, ángulo, sentido, dibujo]
    function placeLife() {
        life.forEach(function (e) {
            if (e.type === 'nuc') {
                e.parts = [[e.x, axisY(e.x), 0, 1, nucBody(e)]];
                e.side = 1;
                e.alpha = 1;
                return;
            }
            var y = strandY(e.k, e.x), ang = strandAngle(e.k, e.x), u = POL_EXIT[0] * e.dir, v = POL_EXIT[1];
            e.parts = [
                [e.x + Math.cos(ang) * u - Math.sin(ang) * v, y + Math.sin(ang) * u + Math.cos(ang) * v, 0, 1, polTail(e, e.len)],
                [e.x, y, ang, e.dir, polBody(e)]
            ];
            // del lado de atrás pasa detrás de la hebra de adelante, y se apaga un poco
            var dep = depthAt(e.k, e.x);
            e.side = dep < -0.05 ? -1 : 1;
            e.alpha = e.side > 0 ? 1 : 0.8 + 0.2 * (1 + dep);
        });
    }

    function lifeFrom(x) {
        var lo = 0, hi = life.length;
        while (lo < hi) {
            var mid = (lo + hi) >> 1;
            if (life[mid].x < x) { lo = mid + 1; } else { hi = mid; }
        }
        return lo;
    }

    /* ---------- La tinta alrededor ----------
       Aguadas detrás de los nudos (y alguna suelta), salpicaduras junto a
       los nudos y niebla que vela la hebra a trechos sin tapar a nadie. */

    var washes = [], specks = [], veils = [];

    function planInk() {
        var r = rngFrom(hash(SEED, 'aguada')), x, wasBeads = false;
        for (x = X0 + LIFT; x < X1 - LIFT; x += 40) {
            // al empezar cada fila de cuentas, una aguada suave
            var beads = beadsAt(x);
            if (beads && !wasBeads) { washes.push({ x: x + 140, along: 230 + r() * 80, across: 100, a: 0.05 + r() * 0.02 }); }
            wasBeads = beads;

            var c = coilAt(x);
            if (c < 0.72 || c < coilAt(x - 40) || c < coilAt(x + 40)) { continue; }
            washes.push({ x: x, along: 160 + r() * 100, across: 100 + r() * 30, a: 0.09 + r() * 0.04 });
            for (var n = 10 + Math.floor(r() * 16), i = 0; i < n; i++) {
                var sz = 0.8 + r() * r() * 5;
                specks.push({ x: x + (r() - 0.5) * 190, y: (r() - 0.5) * 170, a: 0.25 + r() * 0.5,
                    d: blob(0, 0, sz, sz * (0.7 + r() * 0.5), r() * 3, r() * 50) });
            }
        }
        for (x = X0 + 600; x < X1 - 600; x += 700 + r() * 900) {
            if (r() < 0.5) { washes.push({ x: x, along: 220 + r() * 120, across: 115, a: 0.035 }); }
        }
        for (x = X0 + 900; x < X1 - 600; x += 1100 + r() * 900) {
            var vx = x + (r() - 0.5) * 200;
            if (life.some(function (e) { return Math.abs(e.x - vx) < 150; })) { continue; }
            veils.push({ x: vx, along: 70 + r() * 60, across: 125, a: 0.75 + r() * 0.2 });
        }
        [washes, specks, veils].forEach(function (list) { list.sort(function (a, b) { return a.x - b.x; }); });
    }

    /* ---------- Lo fijo de cada muestra y de cada par de bases ---------- */

    var NS = 0, SM = null, RX = null, RG = null;

    function buildSamples() {
        NS = Math.floor((X1 - X0) / HS) + 1;
        SM = {};
        ['x', 'env', 'axis', 'R', 'p', 'ph', 'w0', 'w1', 'b0', 'b1', 'f0', 'f1', 'h0', 'h1', 'h2', 'h3'].forEach(function (k) {
            SM[k] = new Float64Array(NS);
        });
        for (var j = 0; j < NS; j++) {
            var x = X0 + j * HS;
            SM.x[j] = x;
            SM.env[j] = helixEnv(x);
            SM.axis[j] = axisY(x);
            SM.R[j] = radiusAt(x);
            SM.p[j] = lerp(0.5, 1, pinchAt(x));
            SM.ph[j] = tab(hxPh, x);
            SM.w0[j] = wobble(0, x);
            SM.w1[j] = wobble(1, x);
            // pincel casi seco atrás, más cargado adelante, y cerdas que se abren a trechos;
            // la carga de tinta cambia a lo largo, y a veces el trazo de adelante se corta
            var load = loadAt(x);
            SM.b0[j] = (0.3 + 1.2 * noise(x * 0.03, 70)) * load;
            SM.b1[j] = (0.3 + 1.2 * noise(x * 0.03, 71)) * load;
            SM.f0[j] = (0.55 + 0.9 * noise(x * 0.035, 80)) * load * dryAt(x);
            SM.f1[j] = (0.55 + 0.9 * noise(x * 0.035, 81)) * load * dryAt(x + 37);
            for (var q = 0; q < 4; q++) { SM['h' + q][j] = smoothstep(0.55, 0.68, noise(x * 0.05, 84 + q * 2)); }
        }

        // diez pares de bases por vuelta, como en la forma B
        var xs = [];
        for (var u = 0.05; u < hxPh[NC - 1]; u += 0.1) { xs.push(xAtPhase(u)); }
        RX = Float64Array.from(xs);
        RG = {};
        ['axis', 'R', 'ph', 'w0', 'w1', 'env', 'lean'].forEach(function (k) { RG[k] = new Float64Array(RX.length); });
        for (var r = 0; r < RX.length; r++) {
            var rx = RX[r];
            RG.axis[r] = axisY(rx);
            RG.R[r] = radiusAt(rx);
            RG.ph[r] = tab(hxPh, rx);
            RG.w0[r] = wobble(0, rx);
            RG.w1[r] = wobble(1, rx);
            RG.env[r] = helixEnv(rx);
            RG.lean[r] = 3 * (noise(rx * 0.7, 95) - 0.5);
        }
    }

    /* ---------- Paleta: sale de los tokens del sitio, así sigue al tema ---------- */

    function hexRgb(h) {
        h = h.trim();
        if (h.charAt(0) === '#') {
            if (h.length === 4) { h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3]; }
            return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
        }
        var m = h.match(/\d+(\.\d+)?/g);
        return m ? [+m[0], +m[1], +m[2]] : [0, 0, 0];
    }

    function mix(a, b, t) {
        var A = hexRgb(a), B = hexRgb(b);
        return '#' + [0, 1, 2].map(function (i) {
            return ('0' + Math.round(lerp(A[i], B[i], t)).toString(16)).slice(-2);
        }).join('');
    }

    function rgba(hex, a) { return 'rgba(' + hexRgb(hex).join(',') + ',' + a + ')'; }

    var pal = {};

    function readPalette() {
        var cs = getComputedStyle(document.documentElement);
        function tok(n, fb) { var v = cs.getPropertyValue(n); return (v && v.trim()) || fb; }
        var paper = tok('--paper', '#fbfaf7'), ink = tok('--ink', '#16150f');
        var accent = tok('--accent', '#a8442a'), protein = tok('--g-protein', '#3d5a8c');
        pal = {
            pp: paper, ink: ink, acc: accent, pw: protein, po: mix(ink, protein, 0.5),
            hb: mix(paper, ink, 0.2), hf: mix(paper, ink, 0.58)
        };
    }

    /* ---------- Pintar ---------- */

    var dpr = 1, viewW = 0, viewH = 0, s = 1, cx = 0, camX = 0, shown = false;
    var K = null;              // arrays de trabajo, reusados entre cuadros

    function work(n) {
        if (K && K.n >= n) { return K; }
        var size = Math.max(n, 512);
        function arr() { return new Float64Array(size); }
        K = { n: size, x: arr(), y: [arr(), arr()], b: [arr(), arr()], f: [arr(), arr()],
            h: [arr(), arr(), arr(), arr()], o: [arr(), arr(), arr(), arr()] };
        return K;
    }

    // trazo de ancho Wd a lo largo de las muestras; Of lo corre sobre la normal
    function ribbon(X, Y, Wd, j0, j1, Of) {
        if (j1 - j0 < 1) { return; }
        var j, Lp = [], Rp = [];
        for (j = j0; j <= j1; j++) {
            var jp = j > j0 ? j - 1 : j, jn = j < j1 ? j + 1 : j;
            var dx = X[jn] - X[jp], dy = Y[jn] - Y[jp];
            var l = Math.sqrt(dx * dx + dy * dy) || 1;
            var nx = -dy / l, ny = dx / l, o = Of ? Of[j] : 0, w = Wd[j];
            var px = X[j] + nx * o, py = Y[j] + ny * o;
            Lp.push(px + nx * w, py + ny * w);
            Rp.push(px - nx * w, py - ny * w);
        }
        ctx.moveTo(Lp[0], Lp[1]);
        for (j = 2; j < Lp.length; j += 2) { ctx.lineTo(Lp[j], Lp[j + 1]); }
        for (j = Rp.length - 2; j >= 0; j -= 2) { ctx.lineTo(Rp[j], Rp[j + 1]); }
        ctx.closePath();
    }

    // solo donde el ancho no es cero: cada tramo se afina hasta cerrarse solo
    function runs(X, Y, Wd, j0, j1, Of) {
        var a = -1;
        for (var j = j0; j <= j1 + 1; j++) {
            var on = j <= j1 && Wd[j] > 0.04;
            if (on && a < 0) { a = j; }
            if (!on && a >= 0) {
                ribbon(X, Y, Wd, Math.max(j0, a - 1), Math.min(j1, j), Of);
                a = -1;
            }
        }
    }

    function quad(x1, y1, x2, y2, w) {
        ctx.moveTo(x1 - w, y1);
        ctx.lineTo(x1 + w, y1);
        ctx.lineTo(x2 + w * 0.6, y2);
        ctx.lineTo(x2 - w * 0.6, y2);
        ctx.closePath();
    }

    function fill(c, alpha) {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = pal[c];
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    function paintOps(ops, alpha) {
        for (var i = 0; i < ops.length; i++) {
            var o = ops[i];
            if (!o.p) { o.p = new Path2D(o.d); }
            ctx.globalAlpha = o.o * alpha;
            ctx.fillStyle = pal[o.c];
            ctx.fill(o.p);
        }
        ctx.globalAlpha = 1;
    }

    function paintLife(xa, xb, side) {
        for (var i = lifeFrom(xa - 150); i < life.length && life[i].x < xb + 150; i++) {
            var e = life[i];
            if (e.side !== side) { continue; }
            for (var k = 0; k < e.parts.length; k++) {
                var p = e.parts[k];
                ctx.save();
                ctx.translate(p[0], p[1]);
                if (p[2]) { ctx.rotate(p[2]); }
                if (p[3] !== 1) { ctx.scale(p[3], 1); }
                paintOps(p[4], e.alpha);
                ctx.restore();
            }
        }
    }

    // una mancha difusa: elipse con degradé, larga a lo largo de la hebra
    function puff(x, y, along, across, inner, outer) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(along / 100, across / 100);
        var g = ctx.createRadialGradient(0, 0, 0, 0, 0, 100);
        g.addColorStop(0, inner);
        g.addColorStop(0.55, inner.replace(/[\d.]+\)$/, function (a) { return parseFloat(a) * 0.45 + ')'; }));
        g.addColorStop(1, outer);
        ctx.fillStyle = g;
        ctx.fillRect(-100, -100, 200, 200);
        ctx.restore();
    }

    function inRange(list, xa, xb, reach, fn) {
        for (var i = 0; i < list.length; i++) {
            if (list[i].x > xa - reach && list[i].x < xb + reach) { fn(list[i]); }
        }
    }

    function paint() {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, cv.width, cv.height);

        // de pie: x del mundo hacia abajo, y del mundo hacia la izquierda. Es un giro,
        // no un espejo, así que la hélice sigue siendo dextrógira.
        ctx.setTransform(0, s * dpr, -s * dpr, 0, cx * dpr, -s * camX * dpr);
        var xa = camX - 60, xb = camX + viewH / s + 60;
        var j0 = Math.max(0, Math.floor((xa - X0) / HS)), j1 = Math.min(NS - 1, Math.ceil((xb - X0) / HS));
        var n = j1 - j0 + 1, tau = 2 * Math.PI, j, k;

        // aguadas, detrás de todo
        inRange(washes, xa, xb, 340, function (w) {
            puff(w.x, axisY(w.x), w.along, w.across, rgba(pal.ink, w.a), rgba(pal.ink, 0));
        });

        if (n >= 3) {
            var S = work(n);
            for (j = 0; j < n; j++) {
                var i = j0 + j;
                S.x[j] = SM.x[i];
                for (k = 0; k < 2; k++) {
                    var th = tau * (SM.ph[i] + k * HX_GROOVE), cs = Math.cos(th);
                    S.y[k][j] = SM.axis[i] + SM.R[i] * Math.sin(th) + (k ? SM.w1[i] : SM.w0[i]);
                    S.b[k][j] = 1.2 * SM.env[i] * SM.p[i] * (k ? SM.b1[i] : SM.b0[i]);
                    var wf = cs > 0 ? 3 * Math.pow(cs, 0.6) * SM.env[i] * SM.p[i] * (k ? SM.f1[i] : SM.f0[i]) : 0;
                    S.f[k][j] = wf;
                    for (var sd = 0; sd < 2; sd++) {
                        S.h[k * 2 + sd][j] = 0.35 * Math.min(1, wf) * SM['h' + (k * 2 + sd)][i];
                        S.o[k * 2 + sd][j] = (sd ? 1 : -1) * (wf * 0.75 + 0.8);
                    }
                }
            }

            // atrás: las hebras, y los pares de bases entre ellas
            ctx.beginPath();
            ribbon(S.x, S.y[0], S.b[0], 0, n - 1);
            ribbon(S.x, S.y[1], S.b[1], 0, n - 1);
            fill('hb', 1);

            ctx.beginPath();
            for (var r = firstAtLeast(RX, xa); r < RX.length && RX[r] < xb; r++) {
                if (RG.env[r] < 0.3) { continue; }
                var t0 = tau * RG.ph[r], t1 = t0 + tau * HX_GROOVE;
                var y0 = RG.axis[r] + RG.R[r] * Math.sin(t0) + RG.w0[r];
                var y1 = RG.axis[r] + RG.R[r] * Math.sin(t1) + RG.w1[r];
                if (Math.abs(y1 - y0) < 10) { continue; }
                var rx = RX[r], x2 = rx + RG.lean[r], ym = (y0 + y1) / 2, g = 1.8 * Math.sign(y1 - y0);
                quad(rx, y0, x2, ym - g, 0.75);
                quad(rx, y1, x2, ym + g, 0.75);
            }
            fill('ink', 0.2);

            paintLife(xa, xb, -1);

            // adelante: las hebras con su pincel cargado y las cerdas sueltas
            ctx.beginPath();
            runs(S.x, S.y[0], S.f[0], 0, n - 1);
            runs(S.x, S.y[1], S.f[1], 0, n - 1);
            fill('hf', 1);
            ctx.beginPath();
            for (k = 0; k < 4; k++) { runs(S.x, S.y[k >> 1], S.h[k], 0, n - 1, S.o[k]); }
            fill('hf', 0.45);
        }

        paintLife(xa, xb, 1);

        // salpicaduras
        inRange(specks, xa, xb, 20, function (p) {
            if (!p.p) { p.p = new Path2D(p.d); }
            ctx.save();
            ctx.translate(p.x, axisY(p.x) + p.y);
            ctx.globalAlpha = p.a;
            ctx.fillStyle = pal.ink;
            ctx.fill(p.p);
            ctx.restore();
        });
        ctx.globalAlpha = 1;

        // niebla: borra a medias lo pintado, así deja ver el fondo de cualquier sección
        ctx.globalCompositeOperation = 'destination-out';
        inRange(veils, xa, xb, 160, function (v) {
            puff(v.x, axisY(v.x), v.along, v.across, 'rgba(0,0,0,' + v.a + ')', 'rgba(0,0,0,0)');
        });
        ctx.globalCompositeOperation = 'source-over';
    }

    /* ---------- Cámara: la sigue el scroll ---------- */

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

    // La hebra se arma la primera vez que se ve: en pantallas angostas el CSS la
    // oculta, y ahí no tiene sentido pagar el cálculo al cargar la página.
    var built = false;

    function build() {
        if (built) { return; }
        built = true;
        seedNoise(hash(SEED, 'tinta'));
        buildTables();
        planLife();
        placeLife();
        planInk();
        buildSamples();
    }

    function layout() {
        var rc = box.getBoundingClientRect();
        shown = rc.width > 0 && rc.height > 0;     // en pantallas angostas el CSS la oculta
        if (!shown) { return; }
        build();
        dpr = window.devicePixelRatio || 1;
        viewW = rc.width;
        viewH = rc.height;
        cv.width = Math.round(viewW * dpr);
        cv.height = Math.round(viewH * dpr);
        cv.style.width = viewW + 'px';
        cv.style.height = viewH + 'px';
        s = clamp(viewW / 290, 0.5, 0.8);
        cx = viewW * 0.45;
    }

    // Arriba de la página el pincel apoya cerca del borde de arriba; al final se
    // levanta a media altura, antes de que la hebra se apague sobre el sello.
    function aim() {
        var span = viewH / s;
        if (reduce.matches) {
            camX = lerp(X0, X1, REST) - span / 2;
            return;
        }
        var max = document.documentElement.scrollHeight - window.innerHeight;
        var p = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
        camX = lerp(X0 - 0.12 * span, X1 - 0.55 * span, p);
    }

    var raf = 0;

    function frame() {
        raf = 0;
        if (!shown) { return; }
        aim();
        paint();
    }

    function request() { if (!raf) { raf = requestAnimationFrame(frame); } }

    function start() {
        readPalette();
        layout();
        request();

        window.addEventListener('scroll', function () { if (!reduce.matches) { request(); } }, { passive: true });
        window.addEventListener('resize', function () { layout(); request(); });
        reduce.addEventListener('change', request);

        // el tema: el botón cambia data-theme; el sistema, la preferencia
        function retheme() { readPalette(); request(); }
        new MutationObserver(retheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', retheme);
        // cuando cargan las fuentes y las imágenes cambia el alto de la página
        if (window.ResizeObserver) { new ResizeObserver(request).observe(document.body); }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
}());
