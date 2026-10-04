/* ============================================================
   Paisaje del genoma
   El genoma humano de referencia (GRCh38) pintado como un rollo de
   tinta que se recorre de punta a punta. La idea y el pincel vienen
   de {Shan, Shui}* de Lingdong Huang (MIT):
   https://github.com/LingDong-/shan-shui-inf

   Los datos mandan y el azar solo pone el pulso:
   - cada árbol es un gen codificante (GENCODE), plantado en su coordenada;
   - las montañas se levantan donde hay más genes por megabase;
   - la franja de abajo es el ideograma con las bandas G (UCSC).
   La semilla cambia la pincelada, nunca la geografía.

   El mundo se genera por tramos a medida que aparece en pantalla.
   Cada tramo se dibuja con su propia semilla, así que el paisaje es
   el mismo sin importar desde dónde se llegue.
   ============================================================ */

(function () {
    'use strict';

    var DATA = window.GENOME_DATA;
    if (!DATA) { return; }

    var SVG_NS = 'http://www.w3.org/2000/svg';

    /* ---------- Escala y composición ---------- */
    var BP = 10000;            // pares de bases por unidad del dibujo
    var H = 800;               // alto del mundo (unidades del viewBox)
    var CHUNK = 512;           // ancho de cada tramo que se genera de una vez
    var REACH_L = 720;         // tramos que se generan antes de la vista: objetos anclados por su borde izquierdo
    var REACH_R = 480;         // y después: la media montaña más ancha
    var LEAD = 560;            // aire antes del cromosoma 1, para el título
    var TAIL = 560;            // aire después del Y, para el colofón
    var GAP = 460;             // aire entre cromosomas, para el sello
    var WB = 10;               // bin de densidad génica, en unidades (= 100 kb)

    var Y_HELIX = 232;         // eje de la doble hebra: lejos, detrás de las montañas más altas
    var HX_GROOVE = 0.38;      // desfase entre hebras, en vueltas: surco mayor y surco menor
    // La hélice es simbólica, no está a escala. Se estira en la eucromatina y se
    // enrolla en la heterocromatina: cada tinción tiene su grado de compactación
    // (gneg, gpos25, gpos50, gpos75, gpos100, acen, gvar, stalk)
    var COMPACT = [0, 0.22, 0.38, 0.54, 0.68, 1, 0.95, 0];
    var P_EU = 640, P_HET = 80;    // unidades por vuelta: estirada y enrollada
    var R_EU = 54, R_HET = 27;     // radio
    var HX_STEP = 4;               // resolución de las tablas de la hélice
    var Y_MOUNT = 612;        // pie de las montañas cercanas (el más bajo posible)
    var Y_SHORE = 646;         // costa
    var Y_IDEO = 704;          // borde superior del ideograma
    var IDEO_H = 22;
    var Y_BANDLBL = 746;
    var Y_RULER = 758;

    var PAV = 9;               // escala de los pabellones

    /* Pabellones: genes con relevancia clínica conocida.
       Selección docente, no exhaustiva: uno o dos por cromosoma. */
    var CLINICAL = [
        ['GBA1', 'Enfermedad de Gaucher', 'Autosómica recesiva'],
        ['MSH2', 'Síndrome de Lynch', 'Autosómica dominante'],
        ['VHL', 'Enfermedad de von Hippel-Lindau', 'Autosómica dominante'],
        ['MLH1', 'Síndrome de Lynch', 'Autosómica dominante'],
        ['FGFR3', 'Acondroplasia', 'Autosómica dominante'],
        ['HTT', 'Enfermedad de Huntington (expansión CAG)', 'Autosómica dominante'],
        ['SMN1', 'Atrofia muscular espinal', 'Autosómica recesiva'],
        ['APC', 'Poliposis adenomatosa familiar', 'Autosómica dominante'],
        ['HFE', 'Hemocromatosis hereditaria tipo 1', 'Autosómica recesiva'],
        ['ELN', 'Estenosis aórtica supravalvular; incluido en la deleción del síndrome de Williams-Beuren', 'Autosómica dominante'],
        ['CFTR', 'Fibrosis quística', 'Autosómica recesiva'],
        ['CHD7', 'Síndrome CHARGE', 'Autosómica dominante'],
        ['TSC1', 'Complejo esclerosis tuberosa', 'Autosómica dominante'],
        ['RET', 'Neoplasia endocrina múltiple tipo 2', 'Autosómica dominante'],
        ['PTEN', 'Síndrome de tumores hamartomatosos asociados a PTEN', 'Autosómica dominante'],
        ['KCNQ1', 'Síndrome de QT largo tipo 1', 'Autosómica dominante'],
        ['HBB', 'Anemia falciforme y β-talasemia', 'Autosómica recesiva'],
        ['PAH', 'Fenilcetonuria', 'Autosómica recesiva'],
        ['BRCA2', 'Síndrome de cáncer de mama y ovario hereditario', 'Autosómica dominante'],
        ['RB1', 'Retinoblastoma hereditario', 'Autosómica dominante'],
        ['MYH7', 'Miocardiopatía hipertrófica', 'Autosómica dominante'],
        ['UBE3A', 'Síndrome de Angelman', 'Impronta: se expresa el alelo materno'],
        ['FBN1', 'Síndrome de Marfan', 'Autosómica dominante'],
        ['PKD1', 'Poliquistosis renal autosómica dominante', 'Autosómica dominante'],
        ['TP53', 'Síndrome de Li-Fraumeni', 'Autosómica dominante'],
        ['NF1', 'Neurofibromatosis tipo 1', 'Autosómica dominante'],
        ['BRCA1', 'Síndrome de cáncer de mama y ovario hereditario', 'Autosómica dominante'],
        ['COL1A1', 'Osteogénesis imperfecta', 'Autosómica dominante'],
        ['TCF4', 'Síndrome de Pitt-Hopkins', 'Autosómica dominante'],
        ['LDLR', 'Hipercolesterolemia familiar', 'Autosómica dominante'],
        ['DMPK', 'Distrofia miotónica tipo 1 (expansión CTG)', 'Autosómica dominante'],
        ['JAG1', 'Síndrome de Alagille', 'Autosómica dominante'],
        ['CBS', 'Homocistinuria clásica', 'Autosómica recesiva'],
        ['TBX1', 'Región del síndrome de deleción 22q11.2', 'Autosómica dominante; la deleción suele ser de novo'],
        ['DMD', 'Distrofias musculares de Duchenne y Becker', 'Recesiva ligada al X'],
        ['FMR1', 'Síndrome de X frágil (expansión CGG)', 'Ligada al X'],
        ['MECP2', 'Síndrome de Rett', 'Dominante ligada al X'],
        ['F8', 'Hemofilia A', 'Recesiva ligada al X'],
        ['SRY', 'Determinación testicular; sus variantes causan disgenesia gonadal 46,XY', 'Ligada al Y']
    ];

    var STAIN_TEXT = [
        'Banda G negativa (clara)',
        'Banda G positiva, tinción débil (gpos25)',
        'Banda G positiva, tinción media (gpos50)',
        'Banda G positiva, tinción fuerte (gpos75)',
        'Banda G positiva, tinción máxima (gpos100)',
        'Centrómero',
        'Heterocromatina variable',
        'Tallo del acrocéntrico: genes ribosómicos'
    ];

    /* ============================================================
       Azar con semilla y ruido
       ============================================================ */

    function hash() {
        // FNV-1a sobre los argumentos: misma entrada, mismo número
        var s = Array.prototype.join.call(arguments, '|');
        var h = 2166136261;
        for (var i = 0; i < s.length; i++) {
            h ^= s.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return h >>> 0;
    }

    function rngFrom(n) {
        // mulberry32
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
        var r = rngFrom(n);
        var p = [];
        var i;
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

    // Ruido fractal de cuatro octavas en [0, 1], centrado en 0,5 (como el de p5.js)
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

    /* ============================================================
       Datos: cromosomas, bandas y genes en coordenadas del dibujo
       ============================================================ */

    var chroms = [];
    var G = {};                // genes, en arrays paralelos
    var W = 0;                 // ancho total del mundo
    var totalBp = 0;

    function parseData() {
        var names = [], chromOf = [], starts = [], lens = [], strands = [];
        var x = LEAD;

        DATA.chroms.forEach(function (c, ci) {
            var bands = [], prev = 0, cen = 0;
            c.bands.forEach(function (b) {
                bands.push({ name: b[0], start: prev, end: b[1], stain: b[2] });
                if (b[2] === 5 && b[0].charAt(0) === 'p') { cen = b[1]; }
                prev = b[1];
            });

            var g0 = names.length, pos = 0;
            c.genes.split(';').forEach(function (rec) {
                var f = rec.split(',');
                var l = parseInt(f[2], 36);
                pos += parseInt(f[1], 36);
                names.push(f[0]);
                chromOf.push(ci);
                starts.push(pos);
                lens.push(Math.abs(l));
                strands.push(l < 0 ? -1 : 1);
            });

            chroms.push({
                n: c.n, len: c.len, bands: bands, cen: cen,
                x0: x, x1: x + c.len / BP, g0: g0, g1: names.length
            });
            totalBp += c.len;
            x += c.len / BP + GAP;
        });
        W = x - GAP + TAIL;

        var n = names.length;
        G.n = n;
        G.name = names;
        G.chrom = Int8Array.from(chromOf);
        G.start = Int32Array.from(starts);
        G.len = Int32Array.from(lens);
        G.strand = Int8Array.from(strands);
        G.xm = new Float64Array(n);
        for (var i = 0; i < n; i++) {
            G.xm[i] = chroms[chromOf[i]].x0 + (starts[i] + lens[i] / 2) / BP;
        }

        // por x del punto medio: un gen largo empieza antes pero su árbol va en el medio
        var idx = [];
        for (i = 0; i < n; i++) { idx.push(i); }
        idx.sort(function (a, b) { return G.xm[a] - G.xm[b]; });
        G.byX = Int32Array.from(idx);

        G.index = new Map();
        for (i = 0; i < n; i++) {
            var key = names[i].toUpperCase();
            if (!G.index.has(key)) { G.index.set(key, i); }
        }

        G.clin = new Int16Array(n).fill(-1);
        CLINICAL.forEach(function (c, k) {
            var gi = G.index.get(c[0]);
            if (gi !== undefined) { G.clin[gi] = k; }
        });

        G.th = new Float32Array(n);
        for (i = 0; i < n; i++) {
            // alto del árbol: largo del gen en escala logarítmica (1 kb ≈ 6, 1 Mb ≈ 27)
            G.th[i] = clamp(6 + 7 * (Math.log10(Math.max(lens[i], 1)) - 3), 5, 30);
        }
    }

    function chromAt(x) {
        var lo = 0, hi = chroms.length - 1;
        while (lo <= hi) {
            var mid = (lo + hi) >> 1, c = chroms[mid];
            if (x < c.x0) { hi = mid - 1; } else if (x > c.x1) { lo = mid + 1; } else { return mid; }
        }
        return -1;
    }

    function bandIndexAt(c, bp) {
        var lo = 0, hi = c.bands.length - 1;
        while (lo < hi) {
            var mid = (lo + hi) >> 1;
            if (c.bands[mid].end <= bp) { lo = mid + 1; } else { hi = mid; }
        }
        return lo;
    }

    function bandX(c, b) { return [c.x0 + b.start / BP, c.x0 + b.end / BP]; }

    // primer índice de G.byX cuyo punto medio es >= x
    function geneFrom(x) {
        var lo = 0, hi = G.n;
        while (lo < hi) {
            var mid = (lo + hi) >> 1;
            if (G.xm[G.byX[mid]] < x) { lo = mid + 1; } else { hi = mid; }
        }
        return lo;
    }

    /* ============================================================
       Densidad génica y plan del paisaje
       ============================================================ */

    var D1, D2;                // genes por Mb suavizados a dos escalas, en bins de WB unidades

    function blur(a, s) {
        var r = Math.ceil(3 * s), k = [], ks = 0, i, j;
        for (j = -r; j <= r; j++) { var v = Math.exp(-j * j / (2 * s * s)); k.push(v); ks += v; }
        var out = new Float32Array(a.length);
        for (i = 0; i < a.length; i++) {
            if (a[i] === 0) { continue; }
            // dispersión: cada bin reparte su valor, así los bins vacíos no cuestan nada
            var lo = Math.max(0, i - r), hi = Math.min(a.length - 1, i + r);
            for (j = lo; j <= hi; j++) { out[j] += a[i] * k[j - i + r] / ks; }
        }
        return out;
    }

    function density() {
        var nb = Math.ceil(W / WB) + 1;
        var counts = new Float32Array(nb);
        var perMb = 1e6 / (WB * BP);
        for (var i = 0; i < G.n; i++) { counts[Math.floor(G.xm[i] / WB)] += perMb; }
        D1 = blur(counts, 6);
        D2 = blur(counts, 30);
    }

    function dAt(arr, x) {
        var f = x / WB - 0.5;
        var i = Math.floor(f);
        if (i < 0) { return arr[0]; }
        if (i >= arr.length - 1) { return arr[arr.length - 1]; }
        return lerp(arr[i], arr[i + 1], f - i);
    }

    var seed = '';
    var mountains = [];        // ordenadas por cx
    var maxHw = 0;

    function plan() {
        seedNoise(hash(seed, 'tinta'));
        mountains = [];

        chroms.forEach(function (c, ci) {
            var b0 = Math.ceil(c.x0 / WB), b1 = Math.floor(c.x1 / WB);
            var b, j;

            // una montaña en cada máximo local de densidad
            for (b = b0; b <= b1; b++) {
                var d = D1[b];
                if (d < 3) { continue; }
                var peak = true;
                for (j = Math.max(b0, b - 10); j <= Math.min(b1, b + 10); j++) {
                    if (D1[j] > d || (D1[j] === d && j < b)) { peak = false; break; }
                }
                if (!peak) { continue; }

                var r = rngFrom(hash(seed, 'm', ci, b));
                var h = (34 + 290 * Math.pow(Math.min(1, d / 45), 0.75)) * (0.85 + 0.3 * r());
                var hw = 80 + h * 0.85 + 70 * r();
                var cx = clamp((b + 0.5) * WB + (r() - 0.5) * 30, c.x0 + 30, c.x1 - 30);
                // contra el borde del cromosoma la montaña se angosta, y con ella su alto
                hw = Math.max(30, Math.min(hw, cx - c.x0, c.x1 - cx));
                h = Math.min(h, hw * 1.3);
                var base = Y_MOUNT - 34 * (h / 330) - 20 * r();
                mountains.push({
                    cx: cx, hw: hw, h: h, base: base, ci: ci,
                    layer: base < Y_MOUNT - 34 ? 0 : base < Y_MOUNT - 17 ? 1 : 2,
                    nx: r() * 100, ny: r() * 100,
                    side: r() < 0.5 ? -1 : 1,
                    seed: hash(seed, 'mt', ci, b),
                    genes: []
                });
            }

        });

        mountains.sort(function (a, b) { return a.cx - b.cx; });
        maxHw = 0;
        mountains.forEach(function (m, k) { m.idx = k; maxHw = Math.max(maxHw, m.hw); });

        // orden de dibujo: capa, tramo, profundidad. Los árboles lo necesitan
        // para no quedar escondidos detrás de una montaña que se pinta después.
        mountains.map(function (m) { return m; })
            .sort(function (a, b) {
                return a.layer - b.layer
                    || Math.floor(a.cx / CHUNK) - Math.floor(b.cx / CHUNK)
                    || a.base - b.base || a.cx - b.cx;
            })
            .forEach(function (m, k) { m.ord = k; });

        plantGenes();
        planLife();
        hcache.clear();
        buildRungs();
        resetMolecules();
    }

    // altura relativa de la cresta j de la montaña m en u ∈ [-1, 1]
    function ridge(m, u, j) {
        var c = Math.cos(u * Math.PI / 2);
        var n = 0.65 * noise(u * 1.4 + m.nx, m.ny + j * 0.15)
            + 0.35 * noise(u * 4.2 + m.nx, m.ny + 5 + j * 0.3);
        return Math.pow(c, 1.2) * (0.3 + 1.4 * n);
    }

    function topAt(m, x) {
        var u = (x - m.cx) / m.hw;
        if (u <= -1 || u >= 1) { return Infinity; }
        return m.base - m.h * ridge(m, u, 0);
    }

    function mountainsCovering(x) {
        var lo = 0, hi = mountains.length;
        while (lo < hi) {
            var mid = (lo + hi) >> 1;
            if (mountains[mid].cx < x - maxHw) { lo = mid + 1; } else { hi = mid; }
        }
        var out = [];
        for (var k = lo; k < mountains.length && mountains[k].cx <= x + maxHw; k++) {
            var m = mountains[k];
            if (Math.abs(x - m.cx) < m.hw) { out.push(m); }
        }
        return out;
    }

    function shoreY(x) { return Y_SHORE - 5 * noise(x * 0.012, 7.7); }

    // Cada gen se planta en la montaña cuya cresta está más alta en su x,
    // a una altura de la ladera que ninguna montaña de adelante tape.
    function plantGenes() {
        G.gy = new Float32Array(G.n);
        G.mt = new Int32Array(G.n);
        for (var i = 0; i < G.n; i++) {
            var x = G.xm[i];
            var r = rngFrom(hash(seed, 'g', i));
            var cover = mountainsCovering(x);
            var best = null, bestY = Infinity;
            cover.forEach(function (m) {
                var y = topAt(m, x);
                if (y < bestY) { bestY = y; best = m; }
            });

            if (best && bestY < best.base - 3) {
                var limit = bestY + (best.base - bestY) * 0.6;
                cover.forEach(function (m) {
                    if (m.ord > best.ord) { limit = Math.min(limit, topAt(m, x) - 3); }
                });
                G.gy[i] = bestY + Math.max(0, limit - bestY) * Math.pow(r(), 1.6);
                G.mt[i] = best.idx;
                best.genes.push(i);
            } else {
                G.gy[i] = shoreY(x) - 1 - 3 * r();
                G.mt[i] = -1;
            }
        }
    }

    /* ============================================================
       Pinceles
       ============================================================ */

    function f1(v) { return Math.round(v * 10) / 10; }

    function area(pts) {
        var a = 0;
        for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
            a += (pts[j][0] - pts[i][0]) * (pts[j][1] + pts[i][1]);
        }
        return a;
    }

    // Las figuras cerradas salen todas con el mismo sentido de giro: así se pueden
    // juntar en un solo <path> sin que donde se cruzan quede un agujero.
    function pathOf(pts, close) {
        if (close && area(pts) < 0) { pts = pts.slice().reverse(); }
        var s = 'M' + f1(pts[0][0]) + ' ' + f1(pts[0][1]);
        for (var i = 1; i < pts.length; i++) { s += 'L' + f1(pts[i][0]) + ' ' + f1(pts[i][1]); }
        return close ? s + 'Z' : s;
    }

    function seg(x0, y0, x1, y1, n) {
        var pts = [];
        for (var i = 0; i <= n; i++) { pts.push([lerp(x0, x1, i / n), lerp(y0, y1, i / n)]); }
        return pts;
    }

    function swell(t) { return Math.sin(t * Math.PI); }
    function taper(t) { return 1 - t * 0.75; }
    function plank(t) { return Math.min(1, t * 10, (1 - t) * 10); }

    // Una pincelada: la línea central se ensancha según fun y tiembla con el ruido.
    function brush(pts, w, noi, fun, n0) {
        if (pts.length < 3) { return ''; }
        fun = fun || swell;
        if (n0 === undefined) { n0 = (pts[0][0] * 0.137 + pts[0][1] * 0.071) % 300; }
        var left = [], right = [];
        var n = pts.length;
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

    // Una mancha: elipse con el borde irregular
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

    function flat() { return 1; }

    // contorno a pincel de una figura cerrada
    function ring(pts, w, n0) { return brush(pts.concat([pts[0], pts[1]]), w, 0.45, flat, n0); }

    // Trazo continuo de ancho variable, sin puntas: los extremos son planos para
    // empalmar con el del tramo vecino. run = [[x, y, medio ancho], ...]
    function ribbon(run) {
        if (run.length < 2) { return ''; }
        var top = run.map(function (p) { return [p[0], p[1] - p[2]]; });
        var bot = run.map(function (p) { return [p[0], p[1] + p[2]]; }).reverse();
        return pathOf(top.concat(bot), true);
    }

    function esc(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function ink(d, op) { return d ? '<path class="ink" fill-opacity="' + op + '" d="' + d + '"/>' : ''; }

    // todo el ARN del dibujo va en el rojo del sello, para distinguirlo del ADN
    function rna(d, op) { return d ? '<path class="acc" fill-opacity="' + op + '" d="' + d + '"/>' : ''; }

    /* ============================================================
       Pintores
       ============================================================ */

    /* ---------- Doble hebra ----------
       Cada cromosoma es una sola molécula: la hélice nace y muere con él, y
       gira sobre su eje. Lo que no cambia con el giro (eje, radio, fase,
       temblores, anchos del pincel) se calcula una vez y se guarda; en cada
       cuadro solo se recalcula el ángulo de las hebras. Se pinta de atrás
       hacia adelante: los tramos de las hebras que van por detrás, los pares
       de bases, lo que está agarrado del lado de atrás, los tramos de
       adelante y, encima, lo que está agarrado del lado de adelante. */

    var SPIN_RATE = 0.07;      // vueltas por segundo: una cada unos 14 s
    var spin = 0;              // giro, en vueltas
    var clock = 0;             // segundos de movimiento: al pausar, todo queda donde está
    var rungX = [];            // pares de bases, ordenados por x: el giro no los corre
    var RG = null;             // lo fijo de cada par de bases

    function boxSmooth(a, r) {
        var out = new Float32Array(a.length);
        for (var i = 0; i < a.length; i++) {
            var acc = 0, n = 0;
            for (var j = Math.max(0, i - r); j <= Math.min(a.length - 1, i + r); j++) { acc += a[j]; n++; }
            out[i] = acc / n;
        }
        return out;
    }

    // x de la fase u en el cromosoma c (la fase siempre crece con x)
    function xAtPhase(c, u) {
        var ph = c.hxPh, lo = 0, hi = ph.length - 1;
        if (u <= ph[0]) { return c.x0; }
        if (u >= ph[hi]) { return c.x1; }
        while (hi - lo > 1) {
            var mid = (lo + hi) >> 1;
            if (ph[mid] < u) { lo = mid; } else { hi = mid; }
        }
        return Math.min(c.x1, c.x0 + (lo + (u - ph[lo]) / (ph[hi] - ph[lo])) * HX_STEP);
    }

    // Compactación por tramos de 40 kb, suavizada entre bandas. La fase de la
    // hélice se integra a lo largo del cromosoma: el paso cambia sin cortes.
    function buildHelix() {
        rungX = [];
        chroms.forEach(function (c) {
            var n = Math.ceil((c.x1 - c.x0) / HX_STEP) + 1;
            var raw = new Float32Array(n);
            var bi = 0, i;
            for (i = 0; i < n; i++) {
                var bp = Math.min(c.len - 1, i * HX_STEP * BP);
                while (c.bands[bi].end <= bp) { bi++; }
                raw[i] = COMPACT[c.bands[bi].stain];
            }
            c.hxC = boxSmooth(boxSmooth(raw, 8), 8);
            c.hxPh = new Float64Array(n);
            for (i = 1; i < n; i++) {
                // interpolación geométrica: cada grado de tinción se nota parecido
                c.hxPh[i] = c.hxPh[i - 1] + HX_STEP / (P_EU * Math.pow(P_HET / P_EU, c.hxC[i - 1]));
            }

            // diez pares de bases por vuelta, como en la forma B
            for (var r = 0.05; r < c.hxPh[n - 1]; r += 0.1) { rungX.push(xAtPhase(c, r)); }
        });
    }

    // cromosoma de x; en un hueco, el más cercano (para las puntas)
    function hxChrom(x) {
        var ci = chromAt(x);
        if (ci >= 0) { return ci; }
        var best = 0, bd = Infinity;
        chroms.forEach(function (c, k) {
            var d = Math.min(Math.abs(x - c.x0), Math.abs(x - c.x1));
            if (d < bd) { bd = d; best = k; }
        });
        return best;
    }

    function hxAt(arr, x) {
        var c = chroms[hxChrom(x)];
        var f = clamp((x - c.x0) / HX_STEP, 0, arr === 'c' ? c.hxC.length - 1 : c.hxPh.length - 1);
        var a = arr === 'c' ? c.hxC : c.hxPh;
        var i = Math.floor(f);
        if (i >= a.length - 1) { return a[a.length - 1]; }
        return lerp(a[i], a[i + 1], f - i);
    }

    function compactAt(x) { return hxAt('c', x); }

    function theta(k, x) { return 2 * Math.PI * (hxAt('ph', x) + k * HX_GROOVE + spin); }

    // el eje de la hélice: casi recto en la eucromatina, retorcido sobre sí
    // mismo (superenrollado) donde la cromatina está más compactada
    function axisY(x) {
        var w = 26 * smoothstep(0.6, 1, compactAt(x));
        return Y_HELIX + 4 * (noise(x * 0.008, 60) - 0.5) + w * Math.sin(2 * Math.PI * x / 170);
    }

    // cada hebra con su propio temblor: dos pinceladas, no dos senos perfectos
    function wobble(k, x) { return 3 * (noise(x * 0.02, 90 + k) - 0.5); }

    // Junto a cada nucleosoma la doble hebra se afina hasta ser un par fino: así
    // entra entera, da casi dos vueltas alrededor del núcleo de histonas y sale.
    var nucX = new Float64Array(0);

    function pinchAt(x) {
        var f = 1;
        for (var j = firstAtLeast(nucX, x - 62); j < nucX.length && nucX[j] < x + 62; j++) {
            f = Math.min(f, lerp(0.12, 1, smoothstep(17, 52, Math.abs(x - nucX[j]))));
        }
        return f;
    }

    function radiusAt(x) { return lerp(R_EU, R_HET, compactAt(x)) * pinchAt(x); }

    function strandY(k, x) {
        return axisY(x) + radiusAt(x) * Math.sin(theta(k, x)) + wobble(k, x);
    }

    function strandAngle(k, x) { return Math.atan(strandY(k, x + 0.5) - strandY(k, x - 0.5)); }

    // > 0: la hebra k pasa por delante en x; < 0: por detrás
    function depthAt(k, x) { return Math.cos(theta(k, x)); }

    // 1 dentro del cromosoma, se afina hasta 0 en los telómeros y vale 0 entre cromosomas
    function helixEnv(x) {
        var ci = chromAt(x);
        if (ci < 0) { return 0; }
        var c = chroms[ci];
        return smoothstep(0, 45, Math.min(x - c.x0, c.x1 - x));
    }

    /* ---------- Caché de lo fijo, por muestra ---------- */

    var HS = 3;                // una muestra de la hélice cada 3 unidades
    var HB = 256;              // muestras por bloque de la caché
    var hcache = new Map();

    function hblock(b) {
        var blk = hcache.get(b);
        if (blk) { return blk; }
        blk = { h: [] };
        ['axis', 'R', 'p', 'ph', 'env', 'w0', 'w1', 'b0', 'b1', 'f0', 'f1'].forEach(function (key) {
            blk[key] = new Float64Array(HB);
        });
        for (var q = 0; q < 4; q++) { blk.h.push(new Float64Array(HB)); }
        for (var j = 0; j < HB; j++) {
            var x = (b * HB + j) * HS;
            blk.env[j] = helixEnv(x);
            blk.axis[j] = axisY(x);
            blk.R[j] = radiusAt(x);
            blk.p[j] = lerp(0.5, 1, pinchAt(x));
            blk.ph[j] = hxAt('ph', x);
            blk.w0[j] = wobble(0, x);
            blk.w1[j] = wobble(1, x);
            // pincel casi seco atrás, más cargado adelante, y cerdas que se abren a trechos
            blk.b0[j] = 0.3 + 1.2 * noise(x * 0.03, 70);
            blk.b1[j] = 0.3 + 1.2 * noise(x * 0.03, 71);
            blk.f0[j] = 0.55 + 0.9 * noise(x * 0.035, 80);
            blk.f1[j] = 0.55 + 0.9 * noise(x * 0.035, 81);
            for (q = 0; q < 4; q++) { blk.h[q][j] = smoothstep(0.55, 0.68, noise(x * 0.05, 84 + q * 2)); }
        }
        hcache.set(b, blk);
        return blk;
    }

    function buildRungs() {
        var n = rungX.length;
        RG = {};
        ['axis', 'R', 'ph', 'w0', 'w1', 'env', 'lean'].forEach(function (key) { RG[key] = new Float64Array(n); });
        for (var r = 0; r < n; r++) {
            var x = rungX[r];
            RG.axis[r] = axisY(x);
            RG.R[r] = radiusAt(x);
            RG.ph[r] = hxAt('ph', x);
            RG.w0[r] = wobble(0, x);
            RG.w1[r] = wobble(1, x);
            RG.env[r] = helixEnv(x);
            RG.lean[r] = 3 * (noise(x * 0.7, 95) - 0.5);
        }
    }

    /* ---------- Render por cuadro ---------- */

    var SCR = null;            // arrays de trabajo, reusados entre cuadros

    function scratch(n) {
        if (SCR && SCR.n >= n) { return SCR; }
        var size = Math.max(n, 2048);
        function arr() { return new Float64Array(size); }
        SCR = { n: size, x: arr(), y: [arr(), arr()], b: [arr(), arr()], f: [arr(), arr()],
            h: [arr(), arr(), arr(), arr()], o: [arr(), arr(), arr(), arr()], l: [arr(), arr()] };
        return SCR;
    }

    // Trazo de ancho Wd a lo largo de las muestras (X, Y); Of lo corre sobre la normal.
    function ribbonPath(X, Y, Wd, j0, j1, Of) {
        if (j1 - j0 < 1) { return ''; }
        var L = [], R = [];
        for (var j = j0; j <= j1; j++) {
            var jp = j > j0 ? j - 1 : j, jn = j < j1 ? j + 1 : j;
            var dx = X[jn] - X[jp], dy = Y[jn] - Y[jp];
            var l = Math.sqrt(dx * dx + dy * dy) || 1;
            var nx = -dy / l, ny = dx / l;
            var o = Of ? Of[j] : 0, w = Wd[j];
            var cx = X[j] + nx * o, cy = Y[j] + ny * o;
            L.push(f1(cx + nx * w) + ' ' + f1(cy + ny * w));
            R.push(f1(cx - nx * w) + ' ' + f1(cy - ny * w));
        }
        return 'M' + L.join('L') + 'L' + R.reverse().join('L') + 'Z';
    }

    // solo donde el ancho no es cero: cada tramo se afina hasta cerrarse solo
    function runsPath(X, Y, Wd, j0, j1, Of) {
        var s = '', a = -1;
        for (var j = j0; j <= j1 + 1; j++) {
            var on = j <= j1 && Wd[j] > 0.04;
            if (on && a < 0) { a = j; }
            if (!on && a >= 0) {
                s += ribbonPath(X, Y, Wd, Math.max(j0, a - 1), Math.min(j1, j), Of);
                a = -1;
            }
        }
        return s;
    }

    function quad(x1, y1, x2, y2, w) {
        return 'M' + f1(x1 - w) + ' ' + f1(y1) + 'L' + f1(x1 + w) + ' ' + f1(y1)
            + 'L' + f1(x2 + w * 0.6) + ' ' + f1(y2) + 'L' + f1(x2 - w * 0.6) + ' ' + f1(y2) + 'Z';
    }

    var hx = {};               // los <path> de la hélice

    function renderHelix() {
        var xa = cam.x - 240, xb = cam.x + cam.w + 240;
        var tau = 2 * Math.PI;
        var back = '', front = '', hair = '', linked = '';
        var lg = linkGene >= 0 ? linkSpan(linkGene) : null;

        chroms.forEach(function (c) {
            var i0 = Math.ceil(Math.max(xa, c.x0) / HS), i1 = Math.floor(Math.min(xb, c.x1) / HS);
            if (i1 - i0 < 3) { return; }
            var n = i1 - i0 + 1, S = scratch(n);
            for (var j = 0; j < n; j++) {
                var i = i0 + j, bk = Math.floor(i / HB), blk = hblock(bk), o = i - bk * HB;
                S.x[j] = i * HS;
                for (var k = 0; k < 2; k++) {
                    var th = tau * (blk.ph[o] + k * HX_GROOVE + spin);
                    var cs = Math.cos(th);
                    S.y[k][j] = blk.axis[o] + blk.R[o] * Math.sin(th) + (k ? blk.w1[o] : blk.w0[o]);
                    // donde la hebra se afina, el trazo también
                    S.b[k][j] = 1.2 * blk.env[o] * blk.p[o] * (k ? blk.b1[o] : blk.b0[o]);
                    var wf = cs > 0 ? 3 * Math.pow(cs, 0.6) * blk.env[o] * blk.p[o] * (k ? blk.f1[o] : blk.f0[o]) : 0;
                    S.f[k][j] = wf;
                    for (var sd = 0; sd < 2; sd++) {
                        S.h[k * 2 + sd][j] = 0.35 * Math.min(1, wf) * blk.h[k * 2 + sd][o];
                        S.o[k * 2 + sd][j] = (sd ? 1 : -1) * (wf * 0.75 + 0.8);
                    }
                    // el tramo del gen señalado, más oscuro y un poco más grueso
                    S.l[k][j] = lg && S.x[j] >= lg[0] && S.x[j] <= lg[1] ? Math.max(S.b[k][j], wf) + 0.9 : 0;
                }
            }
            for (var kk = 0; kk < 2; kk++) {
                back += ribbonPath(S.x, S.y[kk], S.b[kk], 0, n - 1);
                front += runsPath(S.x, S.y[kk], S.f[kk], 0, n - 1);
                hair += runsPath(S.x, S.y[kk], S.h[kk * 2], 0, n - 1, S.o[kk * 2])
                    + runsPath(S.x, S.y[kk], S.h[kk * 2 + 1], 0, n - 1, S.o[kk * 2 + 1]);
                if (lg) { linked += runsPath(S.x, S.y[kk], S.l[kk], 0, n - 1); }
            }
        });

        // pares de bases: quietos en x, cambian de largo a medida que la hélice gira
        var rungs = [];
        for (var r = firstAtLeast(rungX, xa); r < rungX.length && rungX[r] < xb; r++) {
            if (RG.env[r] < 0.3) { continue; }
            var t0 = tau * (RG.ph[r] + spin), t1 = t0 + tau * HX_GROOVE;
            var y0 = RG.axis[r] + RG.R[r] * Math.sin(t0) + RG.w0[r];
            var y1 = RG.axis[r] + RG.R[r] * Math.sin(t1) + RG.w1[r];
            if (Math.abs(y1 - y0) < 10) { continue; }
            var x = rungX[r], x2 = x + RG.lean[r], ym = (y0 + y1) / 2, g = 1.8 * Math.sign(y1 - y0);
            rungs.push(quad(x, y0, x2, ym - g, 0.75), quad(x, y1, x2, ym + g, 0.75));
        }

        // polaridad: las dos hebras son antiparalelas
        var ends = '';
        chroms.forEach(function (c) {
            [[c.x0, -1, c.telP], [c.x1, 1, c.telQ]].forEach(function (end) {
                var x = end[0], sd = end[1], t = end[2];
                if (x < xa || x > xb || !t) { return; }
                var k3 = t.k, k5 = 1 - k3;
                var anchor = sd < 0 ? 'end' : 'start';
                // el 5' se corre hacia el lado contrario de la cola del telómero, para no pisarla
                var y5 = strandY(k5, x - sd * 4), y3 = strandY(k3, x);
                ends += '<text class="t5" x="' + f1(x + sd * 6) + '" y="' + f1(y5 + (y5 < y3 ? -6 : 13))
                    + '" text-anchor="' + anchor + '">5\'</text>'
                    + '<text class="t5" x="' + f1(x + sd * (t.enz ? 72 : 54)) + '" y="' + f1(y3 + 3)
                    + '" text-anchor="' + anchor + '">3\'</text>';
            });
        });
        hx.ends.innerHTML = ends;

        hx.back.setAttribute('d', back);
        for (var q = lifeFrom(xa - polReach); q < life.length && life[q].x < xb + polReach; q++) {
            if (life[q].type === 'pol') { life[q].st = polState(life[q]); }
        }
        hx.rungs.setAttribute('d', rungs.join(''));
        hx.front.setAttribute('d', front);
        hx.hair.setAttribute('d', hair);
        hx.link.setAttribute('d', linked);
        placeMolecules(xa, xb);

        // la caché guarda solo lo que está cerca de la vista
        if (hcache.size > 48) {
            var mid = Math.floor((cam.x + cam.w / 2) / HS / HB);
            hcache.forEach(function (v, key) { if (Math.abs(key - mid) > 12) { hcache.delete(key); } });
        }
    }

    /* ---------- El movimiento ----------
       La hélice gira y las enzimas andan. Todo sale de un mismo reloj que solo
       corre mientras el movimiento está prendido. */

    var moving = false;        // arranca en start(), salvo que se pida movimiento reducido
    var helixRaf = 0, lastFrame = 0, helixDirty = true;

    function helixFrame(now) {
        helixRaf = 0;
        if (moving) {
            clock += Math.min(100, now - (lastFrame || now)) / 1000;
            spin = (clock * SPIN_RATE) % 1;
            lastFrame = now;
            helixDirty = true;
        }
        if (helixDirty) {
            helixDirty = false;
            renderHelix();
        }
        if (moving) { helixRaf = requestAnimationFrame(helixFrame); }
    }

    function requestHelix() {
        helixDirty = true;
        if (!helixRaf) { helixRaf = requestAnimationFrame(helixFrame); }
    }

    function setMotion(on) {
        moving = on;
        lastFrame = 0;
        var btn = document.getElementById('motion');
        if (btn) {
            btn.setAttribute('aria-pressed', on ? 'true' : 'false');
            btn.classList.toggle('is-on', on);
        }
        requestHelix();
    }

    function firstAtLeast(arr, x, key) {
        var lo = 0, hi = arr.length;
        while (lo < hi) {
            var mid = (lo + hi) >> 1;
            if ((key ? arr[mid][key] : arr[mid]) < x) { lo = mid + 1; } else { hi = mid; }
        }
        return lo;
    }

    // nubes que velan la hebra a trechos, sin tapar a nadie
    function paintClouds(k, xs) {
        var r = rngFrom(hash(seed, 'nube', k));
        if (r() > 0.45) { return ''; }
        var x = xs + r() * CHUNK, rx = 70 + r() * 80;
        if (helixEnv(x) < 1) { return ''; }
        for (var j = lifeFrom(x - rx - 60); j < life.length && life[j].x < x + rx + 60; j++) {
            var b = life[j].box;
            if (b[1] > x - rx * 0.8 && b[0] < x + rx * 0.8 && life[j].type !== 'poly') { return ''; }
        }
        return fogPuff(x, Y_HELIX + (r() - 0.5) * 40, rx, 24 + r() * 16);
    }

    /* ============================================================
       La vida sobre la hebra
       Habitantes moleculares que aparecen al azar (con la semilla), cada
       uno donde tiene sentido: la polimerasa sobre un gen real y en su
       hebra, los nucleosomas donde la cromatina está compactada, la
       telomerasa en las puntas, el árbol de Miller en los tallos.
       ============================================================ */

    var life = [];             // ordenada por x de anclaje
    var polReach = 80;         // el recorrido más largo de una polimerasa, para saber qué mirar

    // la hebra que en x queda más arriba
    function upper(x) { return strandY(0, x) < strandY(1, x) ? 0 : 1; }

    function planLife() {
        life = [];
        polReach = 80;
        nucX = new Float64Array(0);     // las cajas se calculan sin el afinamiento; el puntero lo corrige
        var taken = new Map(), sky = new Map();

        function free(map, x0, x1) {
            for (var b = Math.floor(x0 / 100) - 1; b <= Math.floor(x1 / 100) + 1; b++) {
                var list = map.get(b);
                if (!list) { continue; }
                for (var i = 0; i < list.length; i++) {
                    if (list[i][0] < x1 && list[i][1] > x0) { return false; }
                }
            }
            return true;
        }

        function mark(map, x0, x1) {
            for (var b = Math.floor(x0 / 100); b <= Math.floor(x1 / 100); b++) {
                if (!map.has(b)) { map.set(b, []); }
                map.get(b).push([x0, x1]);
            }
        }

        // e.box = [x0, x1, y0, y1]: lo que ocupa, para el espaciado y para el puntero
        function put(e, map) {
            map = map || taken;
            var x0 = e.box[0] - 12, x1 = e.box[1] + 12;
            if (!free(map, x0, x1)) { return false; }
            mark(map, x0, x1);
            life.push(e);
            return true;
        }

        chroms.forEach(function (c, ci) {
            var r = rngFrom(hash(seed, 'vida', ci));
            var x, i;

            // telómeros: las dos puntas, a veces con la telomerasa trabajando
            [-1, 1].forEach(function (side) {
                // la hebra 0 es la + (5'→3' hacia la derecha) y la 1 la −: el extremo 3' de
                // cadena simple sale de la − en la punta p y de la + en la punta q
                var xe = side < 0 ? c.x0 : c.x1, k3 = side < 0 ? 1 : 0;
                var y0 = strandY(k3, xe);
                var tel = {
                    type: 'tel', x: xe, k: k3, yRef: y0, side: side, enz: r() < 0.5, ci: ci, n0: r() * 50,
                    box: [Math.min(xe, xe + side * 70), Math.max(xe, xe + side * 70), y0 - 32, y0 + 16]
                };
                put(tel);
                c[side < 0 ? 'telP' : 'telQ'] = tel;
            });

            c.bands.forEach(function (band) {
                var bx = bandX(c, band);
                // heterocromatina y centrómero: nucleosomas en fila
                if (band.stain === 5 || band.stain === 6) {
                    for (x = bx[0] + 30; x < bx[1] - 30; x += 58 + r() * 8) {
                        put(nucleosome(x, r, ci, true, band.stain === 5));
                    }
                }
                // tallo de los acrocéntricos: genes ribosómicos en plena transcripción
                if (band.stain === 7) {
                    var len = Math.min(200, bx[1] - bx[0] - 60);
                    put({
                        type: 'miller', x: bx[0] + 30, len: len, ci: ci, k: r() < 0.5 ? 0 : 1,
                        box: [bx[0] + 22, bx[0] + 34 + len, Y_HELIX - R_EU - 80, Y_HELIX + R_EU]
                    });
                }
            });

            // ARN polimerasa II: arranca en el inicio de transcripción de un gen real y avanza
            // un largo trecho en el sentido de su hebra (el recorrido está exagerado, para que
            // se la vea viajar). Al final se suelta con su transcripto y otra se engancha donde
            // arrancó la que se fue. Solo se reserva el arranque: en el camino puede pasar por
            // encima de lo que encuentre, como la real, que transcribe a través de los nucleosomas.
            var starts = [];
            for (var gi = c.g0; gi < c.g1; gi++) {
                var rg = rngFrom(hash(seed, 'pol', gi));
                if (rg() > 0.1) { continue; }
                var d = G.strand[gi];
                var tss = c.x0 + (d > 0 ? G.start[gi] : G.start[gi] + G.len[gi]) / BP;
                var room = d > 0 ? c.x1 - 60 - tss : tss - c.x0 - 60;
                var run = Math.min(1500 + 1500 * rg(), room);
                if (run < 600 || starts.some(function (x0) { return Math.abs(x0 - tss) < 200; })) { continue; }
                var pol = {
                    type: 'pol', x: tss, dir: d, k: d > 0 ? 1 : 0, run: run, gene: gi, n0: rg() * 50,
                    t0: rg() * 200, wait: 0.3 + rg() * 0.9,
                    box: [tss - 30, tss + 30, Y_HELIX - R_EU - 40, Y_HELIX + R_EU + 24]
                };
                if (put(pol)) {
                    starts.push(tss);
                    polReach = Math.max(polReach, run + 60);
                }
            }

            // islas CpG sin metilar en algunos promotores
            for (gi = c.g0; gi < c.g1; gi++) {
                var rc = rngFrom(hash(seed, 'cpg', gi));
                if (rc() > 0.035) { continue; }
                x = c.x0 + (G.strand[gi] > 0 ? G.start[gi] : G.start[gi] + G.len[gi]) / BP;
                if (x - c.x0 < 60 || c.x1 - x < 60) { continue; }
                var kc = upper(x), top = strandY(kc, x);
                put({
                    type: 'cpg', x: x, k: kc, yRef: top, gene: gi, n0: rc() * 50,
                    box: [x - 14, x + 14, top - 22, top + 2]
                });
            }

            // nucleosomas sueltos: más donde hay pocos genes
            for (x = c.x0 + 90; x < c.x1 - 90; x += 150) {
                var nx = x + (r() - 0.5) * 60;
                if (r() < 0.04 + 0.3 * (1 - smoothstep(2, 14, dAt(D2, nx)))) {
                    put(nucleosome(nx, r, ci, false, false));
                }
            }

            // CpG metilados sueltos: la mayoría de los CpG del genoma lo están
            for (x = c.x0 + 60; x < c.x1 - 60; x += 70) {
                if (r() < 0.14) {
                    var mx = x + (r() - 0.5) * 30, km = upper(mx), mt = strandY(km, mx);
                    put({ type: 'mc', x: mx, k: km, yRef: mt, n0: r() * 50, box: [mx - 5, mx + 5, mt - 19, mt + 2] });
                }
            }

            // polisomas en el cielo, más donde hay más genes
            for (x = c.x0 + 120; x < c.x1 - 300; x += 700) {
                var px = x + r() * 200;
                if (r() < 0.12 + 0.4 * smoothstep(3, 20, dAt(D2, px))) {
                    var nr = 3 + Math.floor(r() * 2), pl = nr * 62 + 40, py = 104 + 14 * r();
                    put({
                        type: 'poly', x: px, y: py, len: pl, n: nr, n0: r() * 50,
                        seed: hash(seed, 'poly', ci, x), box: [px - 30, px + pl + 30, py - 80, py + 26]
                    }, sky);
                }
            }
        });

        life.sort(function (a, b) { return a.x - b.x; });
        nucX = Float64Array.from(life.filter(function (e) { return e.type === 'nuc'; })
            .map(function (e) { return e.x; }));
    }

    // un nucleosoma sobre el eje de la hélice: la doble hebra entera lo envuelve
    function nucleosome(x, r, ci, het, cenpa) {
        var ya = axisY(x);
        return {
            type: 'nuc', x: x, het: het, cenpa: cenpa, tilt: (r() - 0.5) * 0.3, n0: r() * 50, ci: ci,
            box: [x - 19, x + 19, ya - 19, ya + 17]
        };
    }

    function lifeFrom(x) {
        var lo = 0, hi = life.length;
        while (lo < hi) {
            var mid = (lo + hi) >> 1;
            if (life[mid].x < x) { lo = mid + 1; } else { hi = mid; }
        }
        return lo;
    }

    function paper(pts, op) {
        return '<path class="pp"' + (op ? ' fill-opacity="' + op + '"' : '') + ' d="' + pathOf(pts, true) + '"/>';
    }

    // Código de color de la capa molecular: gris tinta el ADN, rojo el ARN y un
    // azul índigo las proteínas (el azul mineral de la pintura de paisaje).
    function prot(d, op) { return d ? '<path class="pw" fill-opacity="' + op + '" d="' + d + '"/>' : ''; }

    // un cuerpo de proteína: papel, lavado azul y contorno a pincel
    function protein(pts, wash, n0) {
        return paper(pts) + prot(pathOf(pts, true), wash * 2.2)
            + '<path class="po" fill-opacity=".85" d="' + ring(pts, 0.9, n0) + '"/>';
    }

    // La ARN polimerasa II, como en su estructura: un cuerpo grande atrás, la
    // abrazadera arriba y la mandíbula abajo. La hebra molde entra por la
    // hendidura que queda entre las dos y se pierde detrás del cuerpo.
    // Dibujada mirando hacia +x sobre (0, 0); el giro y el sentido van en la transformación.
    var POL_K = 1.2, POL_EXIT = [-12 * POL_K, -14 * POL_K];

    function polBody(e) {
        function domain(u, v, len, wid, tilt, n0) {
            return blobPts(u * POL_K, v * POL_K, len * POL_K, wid * POL_K, tilt, n0);
        }
        return protein(domain(-7, -1, 30, 30, 0, e.n0), 0.13, e.n0)
            + protein(domain(8, 11, 22, 12, -0.3, e.n0 + 2), 0.18, e.n0 + 2)
            + protein(domain(7, -11, 30, 15, 0.3, e.n0 + 4), 0.09, e.n0 + 4)
            // en la hendidura, la punta 3' del ARN recién hecho
            + rna(blob(POL_K, 0, 4.2, 4.2, 0, e.n0 + 6), 0.9);
    }

    // el transcripto sale por arriba y por detrás y sube; en la punta, el capuchón 5'.
    // Crece a medida que la polimerasa avanza.
    function polTailPaths(e, len) {
        var d = e.dir, tr = [];
        for (var t = 0; t <= 1.0001; t += 1 / 18) {
            tr.push([-d * t * len * 0.85, -t * len * 0.42 + Math.sin(t * 6 + e.n0) * 5 * t]);
        }
        var tip = tr[tr.length - 1];
        return [brush(tr, 1.05, 0.35, taper, e.n0), blob(tip[0], tip[1], 5, 5, 0, e.n0 + 2)];
    }

    function polTail(e, len) {
        var p = polTailPaths(e, len);
        return rna(p[0], 0.8) + rna(p[1], 0.9);
    }

    // Velocidad muy acelerada: 1,5 Mb/s (la real anda por los 3 kb por minuto).
    // Se engancha en 1 s y tarda 2,5 s en soltarse y desvanecerse.
    var POL_V = 150, POL_IN = 1, POL_OUT = 2.5;

    // Dónde está la polimerasa en su ciclo: se engancha bajando sobre la hebra,
    // recorre el gen, se suelta subiendo con su transcripto y, después de una
    // pausa, otra se engancha donde arrancó. null mientras no hay ninguna.
    function polState(e) {
        var travel = e.run / POL_V;
        var ph = (clock + e.t0) % (POL_IN + travel + POL_OUT + e.wait);
        if (ph < POL_IN) {
            var a = ph / POL_IN;
            return { pos: 0, a: a, lift: -(1 - a) * 12, drift: 0 };
        }
        ph -= POL_IN;
        if (ph < travel) { return { pos: ph * POL_V, a: 1, lift: 0, drift: 0 }; }
        ph -= travel;
        if (ph < POL_OUT) {
            var u = ph / POL_OUT;
            return { pos: e.run, a: 1 - u, lift: -u * 36, drift: u * 10 };
        }
        return null;
    }

    function transcriptLen(pos) { return Math.min(130, 10 + pos * 0.45); }

    // El núcleo de histonas, un cilindro chato visto de costado: el cuerpo, la
    // cara de arriba y los cuatro lóbulos que se ven de canto (dos copias de
    // cada histona). Por delante pasan las dos vueltas de la doble hebra: cada
    // vuelta, un par de trazos paralelos. El centromérico, con CENP-A, más oscuro.
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
                    // la vuelta baja en diagonal por delante del cilindro (superhélice
                    // levógira); las dos hebras, a la par
                    pts.push([lerp(-17, 17, t), (w - 0.5) * 10 + (t - 0.5) * 6 + Math.sin(Math.PI * t) * 5 + (k - 0.5) * 3.6]);
                }
                wraps += brush(pts, 1.1, 0.3, plank, e.n0 + w * 2 + k);
            }
        }
        return paper(core) + prot(pathOf(core, true), e.cenpa ? 0.55 : 0.24)
            + prot(lobes, e.cenpa ? 0.3 : 0.16) + paper(lid, 0.6)
            + '<path class="po" fill-opacity=".85" d="' + ring(core, 0.8, e.n0) + '"/>'
            + '<path class="po" fill-opacity=".45" d="' + ring(lid, 0.45, e.n0 + 3) + '"/>'
            + '<path class="hf" d="' + wraps + '"/>';
    }

    function telBody(e) {
        var sd = e.side;
        // el extremo 3' de cadena simple, rico en G
        var tail = [];
        for (var t = 0; t <= 1.0001; t += 1 / 12) { tail.push([sd * t * 46, Math.sin(t * 9 + e.n0) * 2.5]); }
        var s = ink(brush(tail, 0.85, 0.3, taper, e.n0), 0.65)
            + '<text class="t4" x="' + f1(sd * 22) + '" y="-8" text-anchor="middle">TTAGGG</text>';
        if (e.enz) {
            // la telomerasa se traga la punta: una proteína (TERT) armada sobre un
            // ARN grande (TERC), que se ve como un lazo rojo, y que lleva el molde
            var ex = sd * 50, ey = tail[tail.length - 1][1];
            var loop = [];
            for (var q = 0; q <= 20; q++) {
                var a = Math.PI * (1.15 + 1.7 * q / 20);
                loop.push([ex + sd * 4 + Math.cos(a) * 15, ey - 13 + Math.sin(a) * 13 + Math.sin(q * 0.9) * 1.5]);
            }
            s += rna(brush(loop, 1.1, 0.35, flat, e.n0 + 1), 0.8)
                + protein(blobPts(ex, ey, 26, 21, sd * 0.25, e.n0), 0.14, e.n0)
                // el molde, donde se aparea la punta 3'
                + rna(brush(seg(ex - sd * 8, ey + 1, ex + sd * 2, ey + 1, 5), 0.9, 0.3, flat, e.n0 + 2), 0.9);
        }
        return s;
    }

    // un transcripto de ARN ribosómico del árbol de Miller, sobre su polimerasa:
    // más largo cuanto más avanzó (t de 0 a 1)
    function millerFib(t, k) {
        var L = 6 + t * 62, pts = [];
        for (var q = 0; q <= 8; q++) {
            var u = q / 8;
            pts.push([-u * 6 + Math.sin(u * 5 + k) * 2.5 * u, -3 - u * L]);
        }
        return brush(pts, 0.55, 0.35, taper, k * 3.1);
    }

    function millerPart(t, k) { return rna(millerFib(t, k), 0.7) + prot(blob(0, -1, 5, 5, 0, k), 0.9); }

    var MILLER_N = 12, MILLER_V = 30;  // polimerasas en fila; unidades por segundo

    // piruleta de CpG: vacía sin metilar, llena metilada
    function lolly(filled, n0) {
        var head = blobPts(0, -14, 6.4, 6.4, 0, n0);
        return ink(brush(seg(0, -1, 0, -11, 4), 0.5, 0.2, plank, n0), 0.7)
            + (filled ? ink(pathOf(head, true), 0.85) : paper(head) + ink(ring(head, 0.45, n0), 0.85));
    }

    /* ---------- Lo que está en pantalla ---------- */

    var mols = new Map();      // índice en life → sus elementos

    function gWith(html) {
        var g = document.createElementNS(SVG_NS, 'g');
        g.innerHTML = html;
        return g;
    }

    function buildMol(e) {
        var m = { root: document.createElementNS(SVG_NS, 'g'), parts: [], side: 0 };
        function part(html, dx) {
            var g = gWith(html);
            g.dx = dx;
            m.parts.push(g);
            m.root.appendChild(g);
        }
        switch (e.type) {
            case 'pol':
                m.tail = gWith('<path class="acc" fill-opacity=".8"/><path class="acc" fill-opacity=".9"/>');
                m.body = gWith(polBody(e));
                m.root.appendChild(m.tail);
                m.root.appendChild(m.body);
                m.len = -1;
                break;
            case 'nuc':
                m.body = gWith(nucBody(e));
                m.body.setAttribute('transform', tr(e.x, axisY(e.x)));
                m.root.appendChild(m.body);
                break;
            case 'tel':
                part(telBody(e), 0);
                break;
            case 'cpg':
                [-10.5, -3.5, 3.5, 10.5].forEach(function (o, k) { part(lolly(false, e.n0 + k), o); });
                break;
            case 'mc':
                part(lolly(true, e.n0), 0);
                break;
            case 'miller':
                // cada polimerasa con su transcripto; avanzan en fila (ver placeMol)
                for (var k = 0; k < MILLER_N; k++) {
                    part('<path class="acc" fill-opacity=".7"/>' + prot(blob(0, -1, 5, 5, 0, k), 0.9), 0);
                }
                break;
        }
        return m;
    }

    function tr(x, y) { return 'translate(' + f1(x) + ' ' + f1(y) + ')'; }

    function placeMol(e, m) {
        if (e.type === 'nuc') {
            // sobre el eje: el giro no lo mueve, y la doble hebra lo envuelve por delante
            if (!m.side) {
                layerEl.mol.appendChild(m.root);
                m.side = 1;
            }
            return;
        }
        var x = e.x, y, dep, alpha = 1;
        if (e.type === 'pol') {
            var st = e.st !== undefined ? e.st : polState(e);
            if (!st) {
                m.root.setAttribute('display', 'none');
                e.cur = null;
                return;
            }
            m.root.removeAttribute('display');
            var d = e.dir;
            x = e.x + d * st.pos;
            dep = depthAt(e.k, x);
            alpha = st.a;
            // al soltarse sube y se corre un poco hacia adelante; la hélice sigue girando sin ella
            var ang = st.lift ? strandAngle(e.k, x) * st.a : strandAngle(e.k, x);
            var bx = x + d * st.drift;
            y = strandY(e.k, x) + st.lift;
            m.body.setAttribute('transform', tr(bx, y) + ' rotate(' + f1(ang * 180 / Math.PI) + ') scale(' + d + ' 1)');
            var u = POL_EXIT[0] * d, v = POL_EXIT[1];
            m.tail.setAttribute('transform', tr(bx + Math.cos(ang) * u - Math.sin(ang) * v,
                y + Math.sin(ang) * u + Math.cos(ang) * v));
            var len = transcriptLen(st.pos);
            if (Math.abs(len - m.len) > 0.4) {
                var paths = polTailPaths(e, len);
                m.tail.firstChild.setAttribute('d', paths[0]);
                m.tail.lastChild.setAttribute('d', paths[1]);
                m.len = len;
            }
            e.cur = { x: bx, y: y, len: len, a: st.a };
        } else if (e.type === 'miller') {
            // en cinta: cada una avanza por el gen ribosómico con su transcripto cada vez
            // más largo; al final se suelta y entra otra al principio
            m.parts.forEach(function (p, k) {
                var t = (k / MILLER_N + clock * MILLER_V / e.len) % 1;
                var px = x + t * e.len;
                p.setAttribute('transform', tr(px, strandY(e.k, px)));
                p.setAttribute('opacity', (smoothstep(0, 0.05, t) * (1 - smoothstep(0.93, 1, t))).toFixed(2));
                p.firstChild.setAttribute('d', millerFib(t, k));
            });
            y = strandY(e.k, x);
            dep = depthAt(e.k, x + e.len / 2);
        } else {
            m.parts.forEach(function (p) {
                var px = x + p.dx;
                p.setAttribute('transform', tr(px, strandY(e.k, px)));
            });
            dep = depthAt(e.k, x);
        }
        // lo que queda del lado de atrás pasa detrás de la hebra de adelante, y se apaga un poco
        var side = dep < -0.05 ? -1 : 1;
        if (side !== m.side) {
            (side < 0 ? layerEl.molb : layerEl.mol).appendChild(m.root);
            m.side = side;
        }
        // la polimerasa casi no se apaga: el viaje tiene que poder seguirse con la vista
        var back = e.type === 'pol' ? 0.8 + 0.2 * (1 + dep) : 0.45 + 0.55 * (1 + dep);
        m.root.setAttribute('opacity', ((side < 0 ? back : 1) * alpha).toFixed(2));
    }

    function placeMolecules(xa, xb) {
        var seen = new Set();
        for (var j = lifeFrom(xa - polReach); j < life.length && life[j].x < xb + polReach; j++) {
            var e = life[j];
            if (e.type === 'poly') { continue; }
            // de las polimerasas, las que están pasando por la vista; del resto, lo que está cerca
            if (e.type === 'pol') {
                var st = e.st !== undefined ? e.st : polState(e);
                var px = st ? e.x + e.dir * st.pos : NaN;
                if (!(px > xa - 120 && px < xb + 120)) { continue; }
            } else if (e.x < xa - 80 || e.x > xb + 80) {
                continue;
            }
            var m = mols.get(j);
            if (!m) {
                m = buildMol(e);
                mols.set(j, m);
            }
            placeMol(e, m);
            seen.add(j);
        }
        mols.forEach(function (m, j) {
            if (!seen.has(j)) {
                m.root.remove();
                mols.delete(j);
            }
        });
    }

    function resetMolecules() {
        mols.forEach(function (m) { m.root.remove(); });
        mols.clear();
    }

    // el ribosoma es lo más grande de la capa molecular: subunidad mayor arriba,
    // menor abajo, y el ARNm pasa entre las dos
    function paintRibosome(x, y, n0) {
        return protein(blobPts(x + 3, y + 11, 36, 20, 0, n0 + 1), 0.16, n0 + 1)
            + protein(blobPts(x, y - 16, 52, 34, 0, n0), 0.1, n0);
    }

    function paintPolysome(e) {
        var r = rngFrom(e.seed);
        var mrna = [], k;
        for (var t = 0; t <= 1.0001; t += 1 / 30) {
            mrna.push([e.x + t * e.len, e.y + Math.sin(t * 5 + e.n0) * 5]);
        }
        var beads = '', ribos = '';
        for (k = 0; k < e.n; k++) {
            var u = (k + 0.6) / (e.n + 0.4);
            var px = e.x + u * e.len, py = e.y + Math.sin(u * 5 + e.n0) * 5;
            // cadena de aminoácidos: más larga cuanto más avanzó el ribosoma hacia el 3'
            var nb = Math.round(2 + u * 9), bx = px - 4, by = py - 34, a = -Math.PI / 2 - 0.4;
            for (var b = 0; b < nb; b++) {
                beads += blob(bx, by, 3.6, 3.6, 0, e.n0 + k + b * 0.3);
                a += (r() - 0.5) * 0.9;
                bx += Math.cos(a) * 3.8;
                by += Math.sin(a) * 3.8;
            }
            ribos += paintRibosome(px, py, e.n0 + k * 3);
        }
        return '<g class="drift" style="animation-delay:-' + (r() * 9).toFixed(1) + 's">'
            + rna(brush(mrna, 0.9, 0.3, flat), 0.8)
            + rna(blob(mrna[0][0] - 2, mrna[0][1], 4.5, 4.5, 0, e.n0), 0.9)
            + prot(beads, 0.6) + ribos + '</g>';
    }

    function lifeAt(wx, wy) {
        var hit = null;
        for (var j = lifeFrom(wx - Math.max(260, polReach)); j < life.length && life[j].x < wx + Math.max(260, polReach); j++) {
            var e = life[j], b = e.box;
            if (e.type === 'pol') {
                var cu = e.cur;
                if (cu && cu.a > 0.3 && Math.abs(wx - cu.x) < 28 && wy > cu.y - 34 - 0.42 * cu.len && wy < cu.y + 24) {
                    hit = e;
                }
                continue;
            }
            // lo agarrado a la hebra sube y baja con el giro
            var dy = e.yRef !== undefined ? strandY(e.k, e.x) - e.yRef : 0;
            if (wx >= b[0] && wx <= b[1] && wy >= b[2] + dy && wy <= b[3] + dy) { hit = e; }
        }
        return hit;
    }

    function lifeText(e) {
        var c = e.ci !== undefined ? chroms[e.ci] : null;
        switch (e.type) {
            case 'pol': return ['ARN polimerasa II', 'Arrancó en el inicio de ' + G.name[e.gene] + ' (gen de la hebra '
                + (e.dir > 0 ? '+' : '−') + ') y avanza en su sentido',
                'Va montada sobre la hebra ' + (e.dir > 0 ? '−' : '+') + ', que usa de molde, y fabrica el ARN de 5\' a 3\'. '
                + 'Atrás crece el transcripto, con el capuchón 5\' en la punta. Al final se suelta y otra se engancha '
                + 'donde arrancó. El recorrido y la velocidad están exagerados (la real anda unos 3 kb por minuto), y '
                + 'qué gen se transcribe es azar del dibujo, no expresión medida.'];
            case 'poly': return ['Polisoma', 'Varios ribosomas traducen el mismo ARNm',
                'Cada uno arrastra su cadena de aminoácidos, más larga cuanto más avanzó. Licencia del dibujo: '
                + 'en la célula la traducción ocurre en el citoplasma, lejos del ADN.'];
            case 'nuc':
                if (e.cenpa) {
                    return ['Nucleosoma centromérico', 'Con CENP-A, la variante de H3 del centrómero',
                        'Marca el lugar donde se arma el cinetocoro, que toma al cromosoma en la división.'];
                }
                return ['Nucleosoma', 'La doble hebra da casi dos vueltas, unas 147 pb, alrededor de un octámero de histonas',
                    e.het ? 'En la heterocromatina van en fila, apretados: la cromatina está compactada y casi no se transcribe.'
                        : 'Dos copias de H2A, H2B, H3 y H4. Aparecen más donde hay pocos genes.'];
            case 'tel':
                return ['Telómero ' + c.n + (e.side < 0 ? 'p' : 'q'), 'Repeticiones TTAGGG con un extremo 3\' de cadena simple',
                    e.enz ? 'La telomerasa lo alarga usando su propio molde de ARN. Está activa en células germinales y madre, '
                        + 'y apagada en la mayoría de las somáticas.'
                        : 'Protege la punta del cromosoma, que se acorta un poco en cada división.'];
            case 'miller': return ['ARN polimerasa I', 'Genes ribosómicos del tallo de ' + c.n + 'p',
                'Muchas polimerasas en fila sobre el mismo gen, con transcriptos cada vez más largos: el «árbol de Navidad» '
                + 'que Miller y Beatty fotografiaron en 1969. Cada una se suelta al final y entra otra al principio.'];
            case 'cpg': return ['Isla CpG', 'Promotor de ' + G.name[e.gene],
                'Sin metilar (círculos vacíos), como la mayoría de las islas de los promotores. Cuáles aparecen es '
                + 'azar del dibujo.'];
            case 'mc': return ['CpG metilado', '5-metilcitosina',
                'La mayor parte de los CpG del genoma están metilados (círculo lleno). En los promotores, la metilación apaga genes.'];
        }
        return ['', '', ''];
    }

    function paintMountain(m) {
        var r = rngFrom(m.seed);
        var N = Math.max(24, Math.round(m.hw / 5));
        var outline = [], i, u;
        for (i = 0; i <= N; i++) {
            u = -1 + 2 * i / N;
            outline.push([m.cx + u * m.hw, m.base - m.h * ridge(m, u, 0)]);
        }

        // cuerpo opaco: tapa lo que queda atrás
        var s = '<path class="w1" d="'
            + pathOf(outline.concat([[m.cx + m.hw, m.base + 2], [m.cx - m.hw, m.base + 2]]), true) + '"/>';

        // textura: tramos de las crestas interiores, más densos del lado en sombra
        var light = '', dark = '';
        var L = 9;
        var nt = Math.round(8 + m.h * 0.3 + m.hw * 0.04);
        for (var t = 0; t < nt; t++) {
            var j = 1 + Math.floor(r() * (L - 1));
            var p = 1 - j / L;
            var side = r() < 0.72 ? m.side : -m.side;
            var ua = side * (0.02 + 0.8 * r());
            var ub = clamp(ua + side * (0.1 + 0.35 * r()), -0.98, 0.98);
            var pts = [];
            for (var q = 0; q <= 8; q++) {
                u = ua + (ub - ua) * q / 8;
                pts.push([m.cx + u * m.hw * p, m.base - m.h * p * ridge(m, u, j)]);
            }
            var stroke = brush(pts, 0.55 + 0.9 * r(), 0.5);
            if (side === m.side && r() < 0.5) { dark += stroke; } else { light += stroke; }
        }
        s += ink(light, 0.2) + ink(dark, 0.42);

        // contorno
        s += ink(brush(outline, 1.1 + m.h / 300, 0.5), 0.8);

        // puntos de musgo sobre la cresta
        var moss = '';
        var nm = Math.round(m.h / 30);
        for (i = 0; i < nm; i++) {
            u = (r() - 0.5) * 1.6;
            var mx = m.cx + u * m.hw;
            moss += blob(mx, topAt(m, mx) + 1, 2 + r() * 2, 1.2 + r(), r() * 0.6 - 0.3, r() * 50);
        }
        s += ink(moss, 0.7);

        // los genes de esta montaña: primero los árboles, después los pabellones
        var pav = '';
        m.genes.forEach(function (gi) {
            if (G.clin[gi] >= 0) { pav += paintPavilion(gi); } else { s += paintTree(gi, true); }
        });
        return s + pav;
    }

    // Un gen: el alto sigue su largo, la inclinación su hebra (+ a la derecha).
    function paintTree(i, pine) {
        return treeAt(G.xm[i], G.gy[i], G.th[i], G.strand[i] * G.th[i] * 0.22, (i * 7.31) % 211, pine);
    }

    function treeAt(x, y, h, lean, n0, pine) {
        var trunk = brush(seg(x, y, x + lean * (pine ? 1 : 0.8), y - h * (pine ? 1 : 0.75), 6),
            0.35 + h * 0.025, 0.3, taper, n0);
        var k, t;

        if (pine) {
            var tiers = 2 + Math.floor(h / 4.5);
            var d = trunk;
            for (k = 0; k < tiers; k++) {
                t = 0.3 + 0.7 * k / tiers;
                d += blob(x + lean * t, y - h * t, (1.05 - t) * h * 0.46 + 1.4, 1.1 + h * 0.045,
                    lean * 0.03, n0 + k * 1.3);
            }
            return ink(d, 0.74);
        }

        // copa redonda, en el llano
        var cx = x + lean * 0.8, cy = y - h * 0.75, rr = h * 0.28 + 1;
        var crown = '';
        for (k = 0; k < 4; k++) {
            var a = k * 1.7 + n0;
            crown += blob(cx + Math.cos(a) * rr * 0.6, cy + Math.sin(a) * rr * 0.4, rr * 1.3, rr, a, n0 + k);
        }
        return ink(trunk, 0.8) + ink(crown, 0.4);
    }

    function paintPavilion(i) { return pavilionAt(G.xm[i], G.gy[i], i % 97); }

    function pavilionAt(x, y, n0) {
        var s = PAV;
        // el cuerpo tapa los árboles de atrás para que el pabellón se lea
        var out = '<path class="w1" d="' + pathOf([[x - 1.1 * s, y], [x - 1.1 * s, y - 1.7 * s],
            [x + 1.1 * s, y - 1.7 * s], [x + 1.1 * s, y]], true) + '"/>';
        var d = brush(seg(x - 1.35 * s, y, x + 1.35 * s, y, 6), 0.8, 0.3, plank, n0)
            + brush(seg(x - 0.75 * s, y, x - 0.75 * s, y - 1.7 * s, 4), 0.5, 0.2, plank, n0 + 1)
            + brush(seg(x + 0.75 * s, y, x + 0.75 * s, y - 1.7 * s, 4), 0.5, 0.2, plank, n0 + 2)
            + brush(seg(x - 0.75 * s, y - 0.85 * s, x + 0.75 * s, y - 0.85 * s, 4), 0.35, 0.2, plank, n0 + 3);
        // techo con los aleros levantados
        var roof = pathOf([
            [x - 1.75 * s, y - 1.95 * s], [x - 1.2 * s, y - 1.88 * s], [x - 0.55 * s, y - 2.55 * s],
            [x + 0.55 * s, y - 2.55 * s], [x + 1.2 * s, y - 1.88 * s], [x + 1.75 * s, y - 1.95 * s],
            [x + 1.15 * s, y - 1.62 * s], [x - 1.15 * s, y - 1.62 * s]
        ], true);
        return out + ink(d, 0.85) + ink(roof, 0.9);
    }

    function pavilionLabel(i) {
        return '<text class="t2" x="' + f1(G.xm[i]) + '" y="' + f1(G.gy[i] - 2.55 * PAV - 9)
            + '" text-anchor="middle">' + esc(G.name[i]) + '</text>';
    }

    function landAt(x) {
        var ci = chromAt(x);
        if (ci < 0) { return 0; }
        var c = chroms[ci];
        return smoothstep(0.4, 1.6, dAt(D1, x)) * smoothstep(0, 20, Math.min(x - c.x0, c.x1 - x));
    }

    function paintShore(xs, xe) {
        var d = '', run = [];
        for (var x = xs; x <= xe + 0.001; x += 4) {
            var w = 1.4 * landAt(x) * (0.55 + 0.9 * noise(x * 0.05, 3.3));
            if (w > 0.06) {
                run.push([x, shoreY(x), w]);
            } else {
                d += ribbon(run);
                run = [];
            }
        }
        d += ribbon(run);
        return d ? '<path class="sh" d="' + d + '"/>' : '';
    }

    function paintWater(xs, r) {
        var d = '';
        for (var k = 0; k < 30; k++) {
            var x = xs + r() * CHUNK;
            var t = Math.pow(r(), 0.8);
            var y = Y_SHORE + 10 + t * (Y_IDEO - Y_SHORE - 20);
            var len = (8 + r() * 26) * (1.2 - t * 0.6);
            d += brush(seg(x, y, x + len, y + (r() - 0.5), 6), 0.45 + r() * 0.3, 0.3);
        }
        return ink(d, 0.16);
    }

    function fogPuff(cx, cy, rx, ry) {
        return '<ellipse fill="url(#gmist)" cx="' + f1(cx) + '" cy="' + f1(cy) + '" rx="' + f1(rx)
            + '" ry="' + f1(ry) + '"/>';
    }

    // Grosor relativo del ideograma en x: puntas redondas en los telómeros,
    // cintura en el centrómero, tallo fino en los acrocéntricos.
    function thick(c, x) {
        var e = Math.min(x - c.x0, c.x1 - x);
        var cap = e >= 9 ? 1 : Math.sqrt(Math.max(0, 1 - Math.pow((9 - e) / 9, 2)));
        var bp = (x - c.x0) * BP;
        var b = c.bands[bandIndexAt(c, bp)];
        if (b.stain === 5) {
            return cap * (0.28 + 0.72 * Math.min(1, Math.abs(bp - c.cen) / (b.end - b.start)));
        }
        if (b.stain === 7) { return cap * 0.38; }
        return cap;
    }

    function wob(x, k) { return 1.8 * (noise(x * 0.06, 50 + k) - 0.5); }

    function paintIdeogram(xs, xe) {
        var mid = Y_IDEO + IDEO_H / 2, half = IDEO_H / 2;
        var s = '', lbl = '', ticks = '';

        chroms.forEach(function (c) {
            var a = Math.max(xs, c.x0), b = Math.min(xe, c.x1);
            if (a >= b) { return; }

            // el temblor se apaga con el grosor, así las puntas cierran
            function edge(x, sign) { var t = thick(c, x); return mid + sign * half * t + wob(x, sign) * t; }
            function xsOf(p, q) {
                var out = [];
                for (var x = p; x < q; x += 3) { out.push(x); }
                out.push(q);
                return out;
            }

            var bi = bandIndexAt(c, (a - c.x0) * BP);
            var hatch = '';
            for (; bi < c.bands.length; bi++) {
                var band = c.bands[bi];
                var bx = bandX(c, band);
                if (bx[0] >= b) { break; }
                var p = Math.max(a, bx[0]), q = Math.min(b, bx[1]);
                if (q <= p) { continue; }
                var xsList = xsOf(p, q);
                var top = xsList.map(function (x) { return [x, edge(x, -1)]; });
                var bot = xsList.map(function (x) { return [x, edge(x, 1)]; }).reverse();
                s += '<path class="b' + band.stain + '" d="' + pathOf(top.concat(bot), true) + '"/>';

                if (band.stain === 6) {
                    // heterocromatina: rayado oblicuo
                    for (var hx = Math.ceil(p / 5) * 5; hx < q - 5; hx += 5) {
                        if (thick(c, hx) < 0.95 || thick(c, hx + 5) < 0.95) { continue; }
                        hatch += 'M' + f1(hx) + ' ' + f1(edge(hx, -1) + 2) + 'L' + f1(hx + 5) + ' ' + f1(edge(hx + 5, 1) - 2);
                    }
                }
            }
            if (hatch) { s += '<path class="hat" d="' + hatch + '"/>'; }

            // contorno superior e inferior: llegan a cero en las puntas y se cierran solos
            var all = xsOf(a, b);
            s += '<path class="ol" d="' + pathOf(all.map(function (x) { return [x, edge(x, -1)]; }), false)
                + pathOf(all.map(function (x) { return [x, edge(x, 1)]; }), false) + '"/>';

            // nombres de banda (los que entran) y regla en Mb
            c.bands.forEach(function (band) {
                var bx = bandX(c, band);
                var cxb = (bx[0] + bx[1]) / 2;
                if (cxb >= xs && cxb < xe && bx[1] - bx[0] >= 34) {
                    lbl += '<text class="t1" x="' + f1(cxb) + '" y="' + Y_BANDLBL + '" text-anchor="middle">'
                        + esc(band.name) + '</text>';
                }
            });
            var mb0 = Math.ceil((a - c.x0) * BP / 1e6), mb1 = Math.floor((b - c.x0) * BP / 1e6);
            for (var mb = mb0; mb <= mb1; mb++) {
                var tx = c.x0 + mb * 1e6 / BP;
                if (tx < xs || tx >= xe) { continue; }
                var major = mb % 10 === 0;
                ticks += 'M' + f1(tx) + ' ' + Y_RULER + 'v' + (major ? 6 : 3);
                if (major) {
                    lbl += '<text class="t1" x="' + f1(tx) + '" y="' + (Y_RULER + 17) + '" text-anchor="middle">'
                        + mb + ' Mb</text>';
                }
            }
        });

        return s + (ticks ? '<path class="rl" d="' + ticks + '"/>' : '') + lbl;
    }

    function paintSeal(ci) {
        var c = chroms[ci];
        var x = c.x0 - 120;
        var r = rngFrom(hash(seed, 's', ci));
        var sz = 36, sx = x - sz / 2, sy = 104;
        var pts = [];
        // sello de bordes gastados
        [[0, 0], [1, 0], [1, 1], [0, 1]].forEach(function (p, k, arr) {
            var nxt = arr[(k + 1) % 4];
            for (var t = 0; t < 1; t += 0.125) {
                pts.push([sx + lerp(p[0], nxt[0], t) * sz + (r() - 0.5) * 1.6,
                    sy + lerp(p[1], nxt[1], t) * sz + (r() - 0.5) * 1.6]);
            }
        });
        var genes = c.g1 - c.g0;
        return '<path class="acc" fill-opacity=".9" d="' + pathOf(pts, true) + '"/>'
            + '<text class="seal" x="' + f1(x) + '" y="' + (sy + 25) + '" text-anchor="middle">' + c.n + '</text>'
            + '<text class="ins" transform="translate(' + f1(x + 3) + ' ' + (sy + sz + 16) + ') rotate(90)">CROMOSOMA '
            + c.n + '</text>'
            + '<text class="ins2" transform="translate(' + f1(x - 14) + ' ' + (sy + sz + 16) + ') rotate(90)">'
            + fmtMb(c.len) + ' Mb · ' + fmtInt(genes) + ' genes</text>';
    }

    function paintTitle() {
        var x = 64, s = '<text class="ttl" x="' + x + '" y="150">Paisaje del genoma</text>';
        [
            'El genoma humano de referencia, de 1p a Yq,',
            'pintado como un rollo de tinta.',
            'Una representación didáctica, no a escala.',
            '',
            'Arriba corre la doble hebra. Cada árbol es',
            'un gen, y las montañas se levantan donde los',
            'genes se amontonan. Abajo, el cromosoma',
            'con sus bandas.',
            '',
            'Arrastrá hacia la izquierda para recorrerlo  →'
        ].forEach(function (line, k) {
            if (line) { s += '<text class="t3" x="' + x + '" y="' + (186 + k * 21) + '">' + esc(line) + '</text>'; }
        });
        return s;
    }

    function paintColophon() {
        var last = chroms[chroms.length - 1];
        var x = last.x1 + 110, s = '<text class="ttl" x="' + f1(x) + '" y="150">Fin del rollo</text>';
        [
            'El genoma nuclear completo: ' + fmtInt(Math.round(totalBp / 1e6)) + ' Mb y',
            fmtInt(G.n) + ' genes codificantes de proteínas.',
            '',
            'Genes: GENCODE v' + DATA.gencode + '. Bandas: UCSC, ' + 'hg38.',
            'Inspirado en {Shan, Shui}* de Lingdong Huang.'
        ].forEach(function (line, k) {
            if (line) { s += '<text class="t3" x="' + f1(x) + '" y="' + (186 + k * 21) + '">' + esc(line) + '</text>'; }
        });
        return s;
    }

    /* ============================================================
       Tramos
       ============================================================ */

    var LAYERS = ['sky', 'hxb', 'molb', 'hxf', 'cloud', 'mol', 'm0', 'm1', 'm2', 'foot', 'low', 'fog', 'water', 'ideo', 'lbl', 'link', 'hl'];
    // franjas de niebla que siguen a la cámara: [capa, y, alto]
    var BANDS_OF_MIST = [['foot', Y_MOUNT - 80, Y_SHORE - Y_MOUNT + 82]];

    function mountainsIn(xs, xe) {
        var lo = 0, hi = mountains.length;
        while (lo < hi) {
            var mid = (lo + hi) >> 1;
            if (mountains[mid].cx < xs) { lo = mid + 1; } else { hi = mid; }
        }
        var out = [];
        for (var k = lo; k < mountains.length && mountains[k].cx < xe; k++) { out.push(mountains[k]); }
        return out;
    }

    function buildChunk(k) {
        var xs = k * CHUNK, xe = xs + CHUNK;
        var r = rngFrom(hash(seed, 'chunk', k));
        var L = {};
        LAYERS.forEach(function (n) { L[n] = ''; });

        for (var li = lifeFrom(xs); li < life.length && life[li].x < xe; li++) {
            if (life[li].type === 'poly') { L.sky += paintPolysome(life[li]); }
        }
        L.cloud = paintClouds(k, xs);

        mountainsIn(xs, xe)
            .sort(function (a, b) { return a.base - b.base || a.cx - b.cx; })
            .forEach(function (m) {
                L['m' + m.layer] += paintMountain(m);
                m.genes.forEach(function (gi) { if (G.clin[gi] >= 0) { L.lbl += pavilionLabel(gi); } });
            });

        // genes del llano
        var low = '', pav = '';
        for (var j = geneFrom(xs); j < G.n; j++) {
            var gi = G.byX[j];
            if (G.xm[gi] >= xe) { break; }
            if (G.mt[gi] >= 0) { continue; }
            if (G.clin[gi] >= 0) {
                pav += paintPavilion(gi);
                L.lbl += pavilionLabel(gi);
            } else {
                low += paintTree(gi, false);
            }
        }
        L.low = paintShore(xs, xe) + low + pav;

        // niebla, puentes y barcas
        chroms.forEach(function (c, ci) {
            if (c.x1 < xs - 400 || c.x0 > xe + 400) { return; }
            c.bands.forEach(function (band, bi) {
                if (band.stain < 5) { return; }
                var bx = bandX(c, band);
                var n = Math.max(1, Math.round((bx[1] - bx[0]) / 240));
                for (var q = 0; q < n; q++) {
                    var px = bx[0] + (q + 0.5) * (bx[1] - bx[0]) / n;
                    if (px < xs || px >= xe) { continue; }
                    var rf = rngFrom(hash(seed, 'f', ci, bi, q));
                    L.fog += fogPuff(px, 548 + rf() * 40, (bx[1] - bx[0]) / n * 0.75 + 110 + rf() * 60,
                        100 + rf() * 50);
                }
            });
        });
        L.water += paintWater(xs, r);

        L.ideo = paintIdeogram(xs, xe);

        chroms.forEach(function (c, ci) {
            var sx = c.x0 - 120;
            if (sx >= xs && sx < xe) { L.lbl += paintSeal(ci); }
        });
        if (k === 0) { L.lbl += paintTitle(); }
        var cx = chroms[chroms.length - 1].x1 + 110;
        if (cx >= xs && cx < xe) { L.lbl += paintColophon(); }

        return L;
    }

    var svg, styleEl, layerEl = {}, mistRects = [];
    var loaded = new Map();

    function insertSorted(parent, g, k) {
        var kids = parent.children;
        for (var i = 0; i < kids.length; i++) {
            if (+kids[i].getAttribute('data-k') > k) { parent.insertBefore(g, kids[i]); return; }
        }
        parent.appendChild(g);
    }

    function loadChunk(k) {
        var L = buildChunk(k);
        var groups = [];
        LAYERS.forEach(function (n) {
            if (!L[n]) { return; }
            var g = document.createElementNS(SVG_NS, 'g');
            g.setAttribute('data-k', k);
            g.innerHTML = L[n];
            insertSorted(layerEl[n], g, k);
            groups.push(g);
        });
        loaded.set(k, groups);
    }

    function ensureChunks() {
        var k0 = Math.floor((cam.x - REACH_L) / CHUNK);
        var k1 = Math.floor((cam.x + cam.w + REACH_R) / CHUNK);
        var kmax = Math.floor(W / CHUNK);
        for (var k = Math.max(0, k0); k <= Math.min(kmax, k1); k++) {
            if (!loaded.has(k)) { loadChunk(k); }
        }
        loaded.forEach(function (groups, k) {
            if (k < k0 - 2 || k > k1 + 2) {
                groups.forEach(function (g) { g.remove(); });
                loaded.delete(k);
            }
        });
    }

    function clearChunks() {
        loaded.forEach(function (groups) { groups.forEach(function (g) { g.remove(); }); });
        loaded.clear();
    }

    /* ============================================================
       Paleta: sale de los tokens del sitio, así sigue al tema
       ============================================================ */

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

    var palette = null;

    function readPalette() {
        var cs = getComputedStyle(document.documentElement);
        function tok(n, fb) { var v = cs.getPropertyValue(n); return (v && v.trim()) || fb; }
        return {
            paper: tok('--paper', '#fbfaf7'),
            ink: tok('--ink', '#16150f'),
            accent: tok('--accent', '#a8442a'),
            protein: tok('--g-protein', '#3d5a8c')
        };
    }

    function paletteCss(c) {
        function m(t) { return mix(c.paper, c.ink, t); }
        var sans = 'Inter,system-ui,sans-serif', serif = 'Fraunces,Georgia,serif';
        return [
            '.pp{fill:' + c.paper + '}',
            '.w1{fill:' + m(0.03) + '}',
            '.hb{fill:' + m(0.2) + '}',
            '.hf{fill:' + m(0.58) + '}',
            '.ink{fill:' + c.ink + '}',
            '.acc{fill:' + c.accent + '}',
            '.pw{fill:' + c.protein + '}',
            '.po{fill:' + mix(c.ink, c.protein, 0.5) + '}',
            '.lk{fill:' + c.ink + '}',
            '.lkl{fill:none;stroke:' + m(0.55) + ';stroke-width:.8;stroke-dasharray:2 3}',
            '.lkb{fill:none;stroke:' + m(0.7) + ';stroke-width:1}',
            '.t5{fill:' + m(0.62) + ';font:600 9.5px ' + sans + '}',
            '.sh{fill:' + m(0.6) + '}',
            '.b0{fill:' + m(0.03) + '}',
            '.b1{fill:' + m(0.24) + '}',
            '.b2{fill:' + m(0.44) + '}',
            '.b3{fill:' + m(0.64) + '}',
            '.b4{fill:' + m(0.86) + '}',
            '.b5{fill:' + mix(c.paper, c.accent, 0.6) + '}',
            '.b6{fill:' + m(0.14) + '}',
            '.b7{fill:' + m(0.1) + '}',
            '.hat{fill:none;stroke:' + m(0.42) + ';stroke-width:.7}',
            '.ol{fill:none;stroke:' + m(0.78) + ';stroke-width:1.1;stroke-linejoin:round}',
            '.rl{fill:none;stroke:' + m(0.45) + ';stroke-width:.8}',
            '.t1{fill:' + m(0.6) + ';font:10.5px ' + sans + '}',
            '.t2{fill:' + c.accent + ';font:600 11.5px ' + sans + ';letter-spacing:.04em}',
            '.t4{fill:' + m(0.6) + ';font:500 8px ' + sans + ';letter-spacing:.1em}',
            '.t3{fill:' + m(0.72) + ';font:14px ' + serif + '}',
            '.ttl{fill:' + c.ink + ';font:600 30px ' + serif + ';letter-spacing:-.01em}',
            '.ins{fill:' + m(0.7) + ';font:500 12px ' + sans + ';letter-spacing:.3em}',
            '.ins2{fill:' + m(0.5) + ';font:11px ' + sans + ';letter-spacing:.06em}',
            '.seal{fill:' + c.paper + ';font:600 19px ' + serif + '}',
            '.hlr{fill:none;stroke:' + c.accent + ';stroke-width:1.6}',
            '.ms0{stop-color:' + c.paper + ';stop-opacity:.93}',
            '.ms1{stop-color:' + c.paper + ';stop-opacity:.6}',
            '.ms2{stop-color:' + c.paper + ';stop-opacity:0}',
            '.fv0{stop-color:' + c.paper + ';stop-opacity:0}',
            '.fv1{stop-color:' + c.paper + ';stop-opacity:.9}',
            '.fv2{stop-color:' + c.paper + ';stop-opacity:1}'
        ].join('');
    }

    function applyPalette() {
        palette = readPalette();
        styleEl.textContent = paletteCss(palette);
        stage.style.setProperty('--grain', 'url(' + grain(palette.ink) + ')');
    }

    // grano de papel: motas sueltas del color de la tinta
    function grain(inkColor) {
        var cv = document.createElement('canvas');
        cv.width = cv.height = 180;
        var ctx = cv.getContext('2d');
        if (!ctx) { return ''; }
        var r = rngFrom(hash('grano'));
        var rgb = hexRgb(inkColor);
        for (var k = 0; k < 2600; k++) {
            ctx.fillStyle = 'rgba(' + rgb.join(',') + ',' + (0.012 + r() * 0.035).toFixed(3) + ')';
            ctx.fillRect(r() * 180, r() * 180, 1 + r() * 1.4, 1 + r() * 1.4);
        }
        return cv.toDataURL();
    }

    /* ============================================================
       Cámara
       ============================================================ */

    var stage, tip, readout, statusEl, chromSel, mini, miniView;
    var cam = { x: 0, w: 1000 };
    var scale = 1;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    function buildSvg() {
        svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('xmlns', SVG_NS);
        svg.setAttribute('preserveAspectRatio', 'xMinYMin meet');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');

        styleEl = document.createElementNS(SVG_NS, 'style');
        svg.appendChild(styleEl);

        var defs = document.createElementNS(SVG_NS, 'defs');
        defs.innerHTML =
            '<radialGradient id="gmist"><stop offset="0" class="ms0"/><stop offset=".55" class="ms1"/>'
            + '<stop offset="1" class="ms2"/></radialGradient>'
            + '<linearGradient id="gfog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="fv0"/>'
            + '<stop offset=".62" class="fv1"/><stop offset="1" class="fv2"/></linearGradient>';
        svg.appendChild(defs);

        LAYERS.forEach(function (n) {
            var g = document.createElementNS(SVG_NS, 'g');
            g.setAttribute('data-layer', n);
            svg.appendChild(g);
            layerEl[n] = g;
        });
        [['hxb', 'back', 'hb', ''], ['hxb', 'rungs', 'ink', '.2'], ['hxf', 'front', 'hf', ''],
            ['hxf', 'hair', 'hf', '.45'], ['hxf', 'link', 'lk', '.85']].forEach(function (h) {
            var path = document.createElementNS(SVG_NS, 'path');
            path.setAttribute('class', h[2]);
            if (h[3]) { path.setAttribute('fill-opacity', h[3]); }
            layerEl[h[0]].appendChild(path);
            hx[h[1]] = path;
        });
        hx.ends = document.createElementNS(SVG_NS, 'g');
        layerEl.hxf.appendChild(hx.ends);
        BANDS_OF_MIST.forEach(function (b) {
            var rect = document.createElementNS(SVG_NS, 'rect');
            rect.setAttribute('fill', 'url(#gfog)');
            rect.setAttribute('y', b[1]);
            rect.setAttribute('height', b[2]);
            layerEl[b[0]].appendChild(rect);
            mistRects.push(rect);
        });
        stage.insertBefore(svg, stage.firstChild);
    }

    function resize() {
        var rc = stage.getBoundingClientRect();
        if (!rc.height || !rc.width) { return; }
        scale = rc.height / H;
        cam.w = rc.width / scale;
        drawMinimap();
        apply();
    }

    function clampX(x) { return clamp(x, 0, Math.max(0, W - cam.w)); }

    function apply() {
        cam.x = clampX(cam.x);
        svg.setAttribute('viewBox', f1(cam.x) + ' 0 ' + f1(cam.w) + ' ' + H);
        mistRects.forEach(function (r) {
            r.setAttribute('x', f1(cam.x - 10));
            r.setAttribute('width', f1(cam.w + 20));
        });
        ensureChunks();
        requestHelix();
        updateReadout();
        updateMinimapView();
        scheduleHash();
    }

    var anim = null;

    function stopMotion() {
        if (anim) { cancelAnimationFrame(anim.raf); anim = null; }
        setWalk(false);
    }

    // Lleva la cámara a x. Los saltos largos no se animan: recorrer media
    // Mb por cuadro obligaría a pintar todo el camino.
    function goTo(x, done) {
        stopMotion();
        x = clampX(x);
        if (reduceMotion.matches || Math.abs(x - cam.x) > cam.w * 2.5) {
            if (Math.abs(x - cam.x) > cam.w * 2.5 && !reduceMotion.matches) {
                svg.classList.remove('is-arriving');
                void svg.getBoundingClientRect();
                svg.classList.add('is-arriving');
            }
            cam.x = x;
            apply();
            if (done) { done(); }
            return;
        }
        var from = cam.x, t0 = performance.now(), dur = 650;
        anim = { raf: 0 };
        (function step(now) {
            var t = Math.min(1, (now - t0) / dur);
            var e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            cam.x = lerp(from, x, e);
            apply();
            if (t < 1) {
                anim.raf = requestAnimationFrame(step);
            } else {
                anim = null;
                if (done) { done(); }
            }
        }(t0));
    }

    function centerOn(x, done) { goTo(x - cam.w / 2, done); }

    /* ---------- Paseo ---------- */
    var walking = false, walkRaf = 0, walkLast = 0;

    function setWalk(on) {
        if (walking === on) { return; }
        walking = on;
        var btn = document.getElementById('walk');
        if (btn) {
            btn.setAttribute('aria-pressed', on ? 'true' : 'false');
            btn.classList.toggle('is-on', on);
        }
        if (on) {
            walkLast = performance.now();
            walkRaf = requestAnimationFrame(walkStep);
        } else {
            cancelAnimationFrame(walkRaf);
        }
    }

    function walkStep(now) {
        if (!walking) { return; }
        var dt = Math.min(64, now - walkLast);
        walkLast = now;
        cam.x += dt * 0.045;
        if (cam.x >= W - cam.w) { cam.x = W - cam.w; apply(); setWalk(false); return; }
        apply();
        walkRaf = requestAnimationFrame(walkStep);
    }

    /* ============================================================
       Lectura del lugar: dónde estoy, qué hay bajo el puntero
       ============================================================ */

    function fmtInt(n) { return Math.round(n).toLocaleString('es-AR'); }
    function fmtMb(bp) { return (bp / 1e6).toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }

    function fmtLen(bp) {
        if (bp >= 1e6) { return (bp / 1e6).toLocaleString('es-AR', { maximumFractionDigits: 2 }) + ' Mb'; }
        if (bp >= 1e3) { return (bp / 1e3).toLocaleString('es-AR', { maximumFractionDigits: 1 }) + ' kb'; }
        return bp + ' pb';
    }

    function where(x) {
        var ci = chromAt(x);
        if (ci >= 0) {
            var c = chroms[ci], bp = (x - c.x0) * BP;
            return { ci: ci, bp: bp, band: c.bands[bandIndexAt(c, bp)] };
        }
        return { ci: -1 };
    }

    function nearestChrom(x) {
        var best = 0;
        chroms.forEach(function (c, ci) { if (c.x0 - GAP <= x) { best = ci; } });
        return best;
    }

    var lastChrom = -2;

    function updateReadout() {
        var x = cam.x + cam.w / 2;
        var w = where(x);
        var text;
        if (w.ci >= 0) {
            var c = chroms[w.ci];
            text = 'Cromosoma ' + c.n + ' · ' + c.n + w.band.name + ' · ' + fmtMb(w.bp) + ' Mb';
        } else if (x < chroms[0].x0) {
            text = 'Antes del cromosoma 1';
        } else if (x > chroms[chroms.length - 1].x1) {
            text = 'Después del cromosoma Y';
        } else {
            var nc = nearestChrom(x);
            text = 'Entre el cromosoma ' + chroms[nc - 1 >= 0 ? nc - 1 : 0].n + ' y el ' + chroms[nc].n;
        }
        readout.textContent = text;

        var cur = w.ci >= 0 ? w.ci : nearestChrom(x);
        if (cur !== lastChrom) {
            lastChrom = cur;
            chromSel.value = String(cur);
        }
    }

    function hitTest(wx, wy) {
        var hidden = mountainsCovering(wx).some(function (m) { return wy > topAt(m, wx) && wy < m.base; });
        var e = hidden ? null : lifeAt(wx, wy);
        if (e) { return { type: 'life', e: e }; }

        // pabellones primero: son pocos y tienen nombre
        var j, gi;
        for (j = geneFrom(wx - 20); j < G.n; j++) {
            gi = G.byX[j];
            if (G.xm[gi] > wx + 20) { break; }
            if (G.clin[gi] >= 0 && Math.abs(G.xm[gi] - wx) < 15
                && wy > G.gy[gi] - 2.55 * PAV - 18 && wy < G.gy[gi] + 3) {
                return { type: 'gene', i: gi };
            }
        }

        // árboles: el más cercano en x cuyo alto cubre el puntero
        var best = -1, bd = Infinity;
        for (j = geneFrom(wx - 8); j < G.n; j++) {
            gi = G.byX[j];
            var dx = Math.abs(G.xm[gi] - wx);
            if (G.xm[gi] > wx + 8) { break; }
            var reach = Math.max(3, G.th[gi] * 0.35);
            if (dx < reach && wy > G.gy[gi] - G.th[gi] - 3 && wy < G.gy[gi] + 3 && dx < bd) {
                bd = dx; best = gi;
            }
        }
        if (best >= 0) { return { type: 'gene', i: best }; }

        // ideograma y nombres de banda
        if (wy > Y_IDEO - 5 && wy < Y_BANDLBL + 4) {
            var w = where(wx);
            if (w.ci >= 0) { return { type: 'band', ci: w.ci, band: w.band }; }
        }
        return null;
    }

    function line(cls, text) {
        var p = document.createElement('p');
        p.className = cls;
        p.textContent = text;
        return p;
    }

    function fillTip(hit) {
        tip.textContent = '';
        if (hit.type === 'life') {
            var t = lifeText(hit.e);
            tip.appendChild(line('gtip__name', t[0]));
            tip.appendChild(line('gtip__meta', t[1]));
            tip.appendChild(line('gtip__cond', t[2]));
        } else if (hit.type === 'gene') {
            var i = hit.i, c = chroms[G.chrom[i]];
            var s = G.start[i], e = s + G.len[i] - 1;
            var band = c.bands[bandIndexAt(c, s)];
            tip.appendChild(line('gtip__name', G.name[i]));
            tip.appendChild(line('gtip__meta', 'chr' + c.n + ':' + fmtInt(s) + '–' + fmtInt(e)));
            tip.appendChild(line('gtip__meta', c.n + band.name + ' · ' + fmtLen(G.len[i]) + ' · hebra '
                + (G.strand[i] > 0 ? '+' : '−')));
            if (G.clin[i] >= 0) {
                var cl = CLINICAL[G.clin[i]];
                var box = document.createElement('div');
                box.className = 'gtip__clin';
                box.appendChild(line('gtip__cond', cl[1]));
                box.appendChild(line('gtip__inh', cl[2]));
                tip.appendChild(box);
            }
        } else {
            var ch = chroms[hit.ci], b = hit.band;
            var n = 0;
            for (var g = ch.g0; g < ch.g1; g++) {
                if (G.start[g] < b.end && G.start[g] + G.len[g] > b.start) { n++; }
            }
            tip.appendChild(line('gtip__name', ch.n + b.name));
            tip.appendChild(line('gtip__meta', 'chr' + ch.n + ':' + fmtInt(b.start + 1) + '–' + fmtInt(b.end)));
            tip.appendChild(line('gtip__meta', fmtLen(b.end - b.start) + ' · ' + fmtInt(n) + (n === 1 ? ' gen' : ' genes')));
            tip.appendChild(line('gtip__cond', STAIN_TEXT[b.stain]));
        }
    }

    function placeTip(sx, sy) {
        tip.hidden = false;
        var rc = stage.getBoundingClientRect();
        var tw = tip.offsetWidth, th = tip.offsetHeight;
        var x = sx + 14, y = sy - th - 12;
        if (x + tw > rc.width - 8) { x = sx - tw - 14; }
        if (y < 8) { y = sy + 18; }
        tip.style.transform = 'translate(' + Math.round(clamp(x, 8, rc.width - tw - 8)) + 'px,'
            + Math.round(clamp(y, 8, rc.height - th - 8)) + 'px)';
    }

    function hideTip() {
        tip.hidden = true;
        clearLink();
    }

    function showHitAt(sx, sy) {
        var hit = hitTest(cam.x + sx / scale, sy / scale);
        if (!hit) { hideTip(); stage.classList.remove('is-over'); return; }
        stage.classList.add('is-over');
        if (hit.type === 'gene') { setLink(hit.i); } else { clearLink(); }
        fillTip(hit);
        placeTip(sx, sy);
    }

    function highlight(i) {
        var x = G.xm[i], y = G.gy[i] - G.th[i] / 2;
        var rad = G.th[i] / 2 + 9;
        var pts = [];
        for (var k = 0; k <= 30; k++) {
            var a = -Math.PI / 2 + k / 30 * Math.PI * 2.15;
            var rr = rad * (1 + 0.06 * Math.sin(k * 1.3));
            pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * 1.05]);
        }
        layerEl.hl.innerHTML = '<path class="hlr" d="' + pathOf(pts, false) + '"/>';
        setLink(i);
        fillTip({ type: 'gene', i: i });
        placeTip((x - cam.x) * scale, (G.gy[i] - G.th[i]) * scale);
    }

    function clearHighlight() { layerEl.hl.textContent = ''; }

    /* ---------- El hilo: un gen en las tres capas a la vez ----------
       Al señalar un gen se marca su tramo en la doble hebra, su lugar en el
       ideograma y un hilo a plomo que los une pasando por su árbol. */

    var linkGene = -1;

    // el tramo del gen en el dibujo; los genes cortos se ensanchan para que se vean
    function linkSpan(i) {
        var c = chroms[G.chrom[i]];
        var a = c.x0 + G.start[i] / BP, b = c.x0 + (G.start[i] + G.len[i]) / BP;
        if (b - a < 8) { a = G.xm[i] - 4; b = G.xm[i] + 4; }
        return [a, b];
    }

    function setLink(i) {
        if (i === linkGene) { return; }
        linkGene = i;
        var sp = linkSpan(i), x = G.xm[i];
        var top = axisY(x) - R_EU - 10, bot = axisY(x) + R_EU + 10;
        var y1 = Y_IDEO + IDEO_H + 4;
        layerEl.link.innerHTML =
            // corchetes que abrazan el tramo en la hélice
            '<path class="lkb" d="M' + f1(sp[0] + 4) + ' ' + f1(top) + 'H' + f1(sp[0]) + 'V' + f1(bot) + 'H' + f1(sp[0] + 4)
            + 'M' + f1(sp[1] - 4) + ' ' + f1(top) + 'H' + f1(sp[1]) + 'V' + f1(bot) + 'H' + f1(sp[1] - 4) + '"/>'
            // el hilo a plomo, de la hélice al cromosoma
            + '<path class="lkl" d="M' + f1(x) + ' ' + f1(bot + 4) + 'V' + f1(Y_IDEO - 7) + '"/>'
            // en el ideograma: una marca arriba y el largo del gen abajo
            + '<path class="lk" d="M' + f1(x - 4) + ' ' + f1(Y_IDEO - 8) + 'L' + f1(x + 4) + ' ' + f1(Y_IDEO - 8)
            + 'L' + f1(x) + ' ' + f1(Y_IDEO - 2) + 'Z"/>'
            + '<path class="lkb" d="M' + f1(sp[0]) + ' ' + f1(y1 - 2) + 'V' + f1(y1) + 'H' + f1(sp[1]) + 'V' + f1(y1 - 2) + '"/>';
        requestHelix();
    }

    function clearLink() {
        if (linkGene < 0) { return; }
        linkGene = -1;
        layerEl.link.textContent = '';
        requestHelix();
    }

    /* ============================================================
       Búsqueda: un gen, una banda, un cromosoma o una coordenada
       ============================================================ */

    function chromIndex(n) {
        n = String(n).toUpperCase().replace(/^CHR/, '');
        for (var i = 0; i < chroms.length; i++) { if (chroms[i].n === n) { return i; } }
        return -1;
    }

    function parsePos(txt, unit) {
        var t = txt.replace(/\s/g, '');
        if (unit || /^\d+[.,]\d{1,2}$/.test(t)) {
            var v = parseFloat(t.replace(',', '.'));
            var u = (unit || 'm').toLowerCase().charAt(0);
            return v * (u === 'k' ? 1e3 : 1e6);
        }
        return parseInt(t.replace(/[.,]/g, ''), 10);
    }

    function resolve(q) {
        var s = q.trim().replace(/\s+/g, '');
        if (!s) { return null; }
        var m, ci;

        m = /^(?:chr)?(\d{1,2}|x|y):([\d.,]+)(mb|m|kb|k)?(?:[-–]([\d.,]+)(?:mb|m|kb|k)?)?$/i.exec(s);
        if (m && (ci = chromIndex(m[1])) >= 0) {
            var a = parsePos(m[2], m[3]);
            var b = m[4] ? parsePos(m[4], m[3]) : a;
            if (isFinite(a) && isFinite(b)) {
                var c = chroms[ci];
                var bp = clamp((a + b) / 2, 0, c.len);
                return { x: c.x0 + bp / BP, label: 'chr' + c.n + ':' + fmtInt(bp) };
            }
        }

        m = /^(?:chr)?(\d{1,2}|x|y)([pq])(\d+(?:\.\d+)?)?$/i.exec(s);
        if (m && (ci = chromIndex(m[1])) >= 0) {
            var ch = chroms[ci];
            var pre = m[2].toLowerCase() + (m[3] || '');
            // "q21" es la banda q21 con sus subbandas; "q2" (o "q") toda la región
            var hits = ch.bands.filter(function (b) { return b.name === pre || b.name.indexOf(pre + '.') === 0; });
            if (!hits.length) { hits = ch.bands.filter(function (b) { return b.name.indexOf(pre) === 0; }); }
            if (hits.length) {
                var mid = (hits[0].start + hits[hits.length - 1].end) / 2;
                return { x: ch.x0 + mid / BP, label: ch.n + pre };
            }
        }

        m = /^(?:chr)?(\d{1,2}|x|y)$/i.exec(s);
        if (m && (ci = chromIndex(m[1])) >= 0) { return { chrom: ci }; }

        var key = s.toUpperCase();
        if (G.index.has(key)) { return { gene: G.index.get(key) }; }

        var near = [];
        G.index.forEach(function (gi, name) { if (name.indexOf(key) === 0) { near.push(gi); } });
        if (near.length === 1) { return { gene: near[0] }; }
        if (near.length) {
            near.sort(function (p, q2) { return G.name[p].length - G.name[q2].length || (G.name[p] < G.name[q2] ? -1 : 1); });
            return { suggest: near.slice(0, 6) };
        }
        return { none: true };
    }

    function say(nodes) {
        statusEl.textContent = '';
        if (!nodes) { statusEl.hidden = true; return; }
        statusEl.hidden = false;
        (Array.isArray(nodes) ? nodes : [nodes]).forEach(function (n) {
            statusEl.appendChild(typeof n === 'string' ? document.createTextNode(n) : n);
        });
    }

    function focusGene(i) {
        hideTip();
        centerOn(G.xm[i], function () { highlight(i); });
    }

    function goChrom(ci) {
        clearHighlight();
        hideTip();
        goTo(chroms[ci].x0 - 220);
    }

    function runSearch(q) {
        var r = resolve(q);
        if (!r) { return; }
        say(null);
        if (r.gene !== undefined) { focusGene(r.gene); return; }
        if (r.chrom !== undefined) { goChrom(r.chrom); return; }
        if (r.x !== undefined) { clearHighlight(); hideTip(); centerOn(r.x); return; }
        if (r.suggest) {
            var parts = ['¿Cuál de estos? '];
            r.suggest.forEach(function (gi) {
                var b = document.createElement('button');
                b.type = 'button';
                b.className = 'gtoast__pick';
                b.textContent = G.name[gi];
                b.addEventListener('click', function () { say(null); focusGene(gi); });
                parts.push(b);
            });
            say(parts);
            return;
        }
        say('No encontré «' + q.trim() + '». Probá con un símbolo (BRCA1), una banda (17q21.31) '
            + 'o una coordenada (chr17:43044292).');
    }

    /* ============================================================
       Minimapa: el genoma entero, para saltar
       ============================================================ */

    var miniW = 0;

    function drawMinimap() {
        var rc = mini.getBoundingClientRect();
        miniW = rc.width;
        if (!miniW) { return; }
        var k = miniW / W;
        var hgt = 12, y = 6;
        var s = '';
        var showLabels = miniW / chroms.length > 22;
        chroms.forEach(function (c) {
            var x0 = c.x0 * k, wdt = Math.max(1, (c.x1 - c.x0) * k);
            c.bands.forEach(function (b) {
                var bx = bandX(c, b);
                s += '<rect class="mb' + b.stain + '" x="' + (bx[0] * k).toFixed(2) + '" y="' + y + '" width="'
                    + Math.max(0.3, (bx[1] - bx[0]) * k).toFixed(2) + '" height="' + hgt + '"/>';
            });
            s += '<rect class="mo" x="' + x0.toFixed(2) + '" y="' + y + '" width="' + wdt.toFixed(2) + '" height="' + hgt
                + '" rx="' + Math.min(4, wdt / 2).toFixed(2) + '"/>';
            if (showLabels || c.n.length === 1 && miniW > 360) {
                s += '<text class="ml" x="' + (x0 + wdt / 2).toFixed(1) + '" y="' + (y + hgt + 12) + '">' + c.n + '</text>';
            }
        });
        mini.innerHTML = '<svg width="' + miniW + '" height="' + (y + hgt + 16) + '" aria-hidden="true">' + s
            + '<rect class="mv" id="mini-view" y="2" height="' + (hgt + 8) + '" rx="2"/></svg>';
        miniView = document.getElementById('mini-view');
        updateMinimapView();
    }

    function updateMinimapView() {
        if (!miniView || !miniW) { return; }
        var k = miniW / W;
        miniView.setAttribute('x', (cam.x * k).toFixed(1));
        miniView.setAttribute('width', Math.max(3, cam.w * k).toFixed(1));
    }

    /* ============================================================
       Enlace compartible: #chr17:43044292 y ?semilla=
       ============================================================ */

    var hashTimer = 0;

    function scheduleHash() {
        clearTimeout(hashTimer);
        hashTimer = setTimeout(function () {
            var w = where(cam.x + cam.w / 2);
            var h = w.ci >= 0 ? '#chr' + chroms[w.ci].n + ':' + Math.round(w.bp) : '';
            var url = location.pathname + '?semilla=' + encodeURIComponent(seed) + h;
            try { history.replaceState(null, '', url); } catch (e) { /* file:// en algunos navegadores */ }
        }, 400);
    }

    function newSeed() { return Math.floor(Math.random() * 36 * 36 * 36 * 36).toString(36); }

    function readUrl() {
        var p = new URLSearchParams(location.search);
        seed = (p.get('semilla') || '').slice(0, 24) || newSeed();
        return decodeURIComponent(location.hash.slice(1));
    }

    /* ============================================================
       Exportar la vista
       ============================================================ */

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

    function viewName() {
        var w = where(cam.x + cam.w / 2);
        return 'paisaje-genoma' + (w.ci >= 0 ? '-chr' + chroms[w.ci].n + '-' + Math.round(w.bp / 1e6) + 'Mb' : '');
    }

    function serialize() {
        var clone = svg.cloneNode(true);
        clone.setAttribute('width', Math.round(cam.w));
        clone.setAttribute('height', H);
        clone.removeAttribute('aria-hidden');
        clone.removeAttribute('class');
        var hl = clone.querySelector('[data-layer="hl"]');
        if (hl) { hl.textContent = ''; }
        var bg = document.createElementNS(SVG_NS, 'rect');
        bg.setAttribute('x', f1(cam.x));
        bg.setAttribute('y', 0);
        bg.setAttribute('width', f1(cam.w));
        bg.setAttribute('height', H);
        bg.setAttribute('fill', palette.paper);
        clone.insertBefore(bg, clone.querySelector('[data-layer]'));
        return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(clone);
    }

    function exportSvg() {
        download(new Blob([serialize()], { type: 'image/svg+xml;charset=utf-8' }), viewName() + '.svg');
    }

    function exportPng() {
        var k = 2;
        var img = new Image();
        img.onload = function () {
            var cv = document.createElement('canvas');
            cv.width = Math.round(cam.w * k);
            cv.height = H * k;
            var ctx = cv.getContext('2d');
            ctx.fillStyle = palette.paper;
            ctx.fillRect(0, 0, cv.width, cv.height);
            ctx.drawImage(img, 0, 0, cv.width, cv.height);
            cv.toBlob(function (blob) {
                if (blob) { download(blob, viewName() + '.png'); }
            }, 'image/png');
        };
        img.onerror = function () { say('No se pudo generar el PNG. Probá exportar en SVG.'); };
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(serialize());
    }

    /* ============================================================
       Gestos
       ============================================================ */

    function bindStage() {
        var drag = null, hoverRaf = 0, inertia = 0;

        stage.addEventListener('pointerdown', function (e) {
            if (e.button !== 0 || e.target.closest('.gtip, .gtoast')) { return; }
            stopMotion();
            cancelAnimationFrame(inertia);
            drag = { id: e.pointerId, x0: e.clientX, x: e.clientX, t: e.timeStamp, v: 0, moved: false };
            stage.setPointerCapture(e.pointerId);
        });

        stage.addEventListener('pointermove', function (e) {
            var rc = stage.getBoundingClientRect();
            if (drag && e.pointerId === drag.id) {
                var dx = e.clientX - drag.x;
                if (!drag.moved && Math.abs(e.clientX - drag.x0) > 4) {
                    drag.moved = true;
                    stage.classList.add('is-dragging');
                    hideTip();
                    clearHighlight();
                }
                if (drag.moved) {
                    var dt = Math.max(1, e.timeStamp - drag.t);
                    drag.v = 0.8 * (dx / dt) + 0.2 * drag.v;
                    drag.t = e.timeStamp;
                    cam.x -= dx / scale;
                    apply();
                }
                drag.x = e.clientX;
                return;
            }
            if (e.pointerType !== 'mouse') { return; }
            var sx = e.clientX - rc.left, sy = e.clientY - rc.top;
            cancelAnimationFrame(hoverRaf);
            hoverRaf = requestAnimationFrame(function () { showHitAt(sx, sy); });
        });

        function end(e) {
            if (!drag || e.pointerId !== drag.id) { return; }
            stage.classList.remove('is-dragging');
            if (!drag.moved) {
                // toque: muestra lo que hay ahí (en pantallas táctiles no hay hover)
                var rc = stage.getBoundingClientRect();
                clearHighlight();
                showHitAt(e.clientX - rc.left, e.clientY - rc.top);
            } else if (!reduceMotion.matches && Math.abs(drag.v) > 0.05 && e.type === 'pointerup') {
                var v = drag.v, last = performance.now();
                (function glide(now) {
                    var dt = now - last;
                    last = now;
                    cam.x -= v * dt / scale;
                    v *= Math.pow(0.94, dt / 16);
                    apply();
                    if (Math.abs(v) > 0.02) { inertia = requestAnimationFrame(glide); }
                }(last));
            }
            drag = null;
        }
        stage.addEventListener('pointerup', end);
        stage.addEventListener('pointercancel', end);

        stage.addEventListener('pointerleave', function (e) {
            if (e.pointerType === 'mouse' && !drag) { hideTip(); stage.classList.remove('is-over'); }
        });

        stage.addEventListener('wheel', function (e) {
            e.preventDefault();
            stopMotion();
            cancelAnimationFrame(inertia);
            hideTip();
            var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
            if (e.deltaMode === 1) { d *= 16; } else if (e.deltaMode === 2) { d *= stage.clientWidth; }
            cam.x += d / scale;
            apply();
        }, { passive: false });

        stage.addEventListener('keydown', function (e) {
            var x = cam.x + cam.w / 2;
            var ci = chromAt(x) >= 0 ? chromAt(x) : nearestChrom(x);
            var step = e.shiftKey ? cam.w * 0.8 : 120;
            switch (e.key) {
                case 'ArrowRight': goTo(cam.x + step); break;
                case 'ArrowLeft': goTo(cam.x - step); break;
                case 'PageDown': goChrom(Math.min(chroms.length - 1, ci + 1)); break;
                case 'PageUp': goChrom(x < chroms[ci].x0 + cam.w ? Math.max(0, ci - 1) : ci); break;
                case 'Home': goTo(0); break;
                case 'End': goTo(W); break;
                case 'Escape': hideTip(); clearHighlight(); return;
                default: return;
            }
            e.preventDefault();
            hideTip();
        });
    }

    function bindMinimap() {
        var active = false;
        function jump(e) {
            var rc = mini.getBoundingClientRect();
            var x = (e.clientX - rc.left) / rc.width * W;
            stopMotion();
            hideTip();
            clearHighlight();
            cam.x = x - cam.w / 2;
            apply();
        }
        mini.addEventListener('pointerdown', function (e) {
            active = true;
            mini.setPointerCapture(e.pointerId);
            jump(e);
        });
        mini.addEventListener('pointermove', function (e) { if (active) { jump(e); } });
        mini.addEventListener('pointerup', function () { active = false; });
        mini.addEventListener('pointercancel', function () { active = false; });
    }

    function bindUi() {
        var form = document.getElementById('search');
        var q = document.getElementById('q');
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            runSearch(q.value);
            closeTools();
        });

        chromSel.innerHTML = chroms.map(function (c, ci) {
            return '<option value="' + ci + '">Cromosoma ' + c.n + '</option>';
        }).join('');
        chromSel.addEventListener('change', function () {
            lastChrom = +chromSel.value;
            goChrom(+chromSel.value);
            closeTools();
        });

        document.getElementById('walk').addEventListener('click', function () {
            var on = !walking;
            if (on) { stopMotion(); hideTip(); clearHighlight(); }
            setWalk(on);
        });

        document.getElementById('motion').addEventListener('click', function () { setMotion(!moving); });

        document.getElementById('reseed').addEventListener('click', function () {
            seed = newSeed();
            plan();
            clearChunks();
            clearHighlight();
            hideTip();
            apply();
        });

        document.getElementById('export-svg').addEventListener('click', exportSvg);
        document.getElementById('export-png').addEventListener('click', exportPng);

        var info = document.getElementById('info');
        var infoBtn = document.getElementById('info-toggle');
        function setInfo(open) {
            info.classList.toggle('is-open', open);
            infoBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
            if (open) { closeTools(); info.focus(); }
        }
        infoBtn.addEventListener('click', function () { setInfo(!info.classList.contains('is-open')); });
        document.getElementById('info-close').addEventListener('click', function () {
            setInfo(false);
            infoBtn.focus();
        });
        info.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') { setInfo(false); infoBtn.focus(); }
        });

        var tools = document.getElementById('tools');
        var toolsBtn = document.getElementById('tools-toggle');
        function closeTools() {
            tools.classList.remove('is-open');
            toolsBtn.setAttribute('aria-expanded', 'false');
        }
        toolsBtn.addEventListener('click', function () {
            var open = !tools.classList.contains('is-open');
            tools.classList.toggle('is-open', open);
            toolsBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        });

        document.addEventListener('themechange', function () { applyPalette(); drawMinimap(); });
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
            applyPalette();
            drawMinimap();
        });
        window.addEventListener('resize', resize);

        // si alguien edita el #lugar a mano (o pega otro enlace en la misma pestaña)
        window.addEventListener('hashchange', function () {
            var r = resolve(decodeURIComponent(location.hash.slice(1)));
            if (!r) { return; }
            if (r.gene !== undefined) { focusGene(r.gene); } else if (r.x !== undefined) { centerOn(r.x); }
            else if (r.chrom !== undefined) { goChrom(r.chrom); }
        });
    }

    /* ============================================================
       Leyenda: los mismos dibujos que el paisaje, con el mismo pincel
       ============================================================ */

    function duplex(x0, x1, y, gapAt) {
        // un tramo corto de doble hebra, para que las moléculas tengan de dónde agarrarse
        var d = '';
        [-1, 1].forEach(function (k) {
            var pts = [];
            for (var x = x0; x <= x1 + 0.01; x += 2) {
                var pinch = gapAt === undefined ? 1 : lerp(0.15, 1, smoothstep(12, 30, Math.abs(x - gapAt)));
                pts.push([x, y + k * 7 * pinch * Math.sin((x - x0) / 9)]);
            }
            d += brush(pts, 1.1, 0.3, plank, 3 + k);
        });
        return '<path class="hf" d="' + d + '"/>';
    }

    function icon(kind) {
        var e;
        switch (kind) {
            case 'helix':
                var rungsI = '', strands = '';
                [0, 1].forEach(function (k) {
                    var pts = [];
                    for (var x = 4; x <= 116; x += 2) {
                        pts.push([x, 22 + 13 * Math.sin(2 * Math.PI * (x / 56 + k * HX_GROOVE))]);
                    }
                    strands += brush(pts, 1.4, 0.3, plank, 11 + k);
                });
                for (var x = 6; x < 116; x += 5.6) {
                    var y0 = 22 + 13 * Math.sin(2 * Math.PI * x / 56), y1 = 22 + 13 * Math.sin(2 * Math.PI * (x / 56 + HX_GROOVE));
                    if (Math.abs(y1 - y0) > 5) { rungsI += quad(x, y0, x, y1, 0.5); }
                }
                return ['0 0 120 44', ink(rungsI, 0.25) + '<path class="hf" d="' + strands + '"/>'];
            case 'pol':
                e = { dir: 1, len: 46, n0: 4 };
                return ['-4 -26 100 70', duplex(0, 96, 26) + '<g transform="translate(' + f1(62 + POL_EXIT[0]) + ' ' + f1(26 + POL_EXIT[1]) + ')">'
                    + polTail(e, 46) + '</g><g transform="translate(62 26)">' + polBody(e) + '</g>'];
            case 'nuc':
                return ['0 0 90 44', duplex(0, 90, 22, 45) + '<g transform="translate(45 22)">'
                    + nucBody({ tilt: 0.05, n0: 6 }) + '</g>'];
            case 'tel':
                return ['-30 -32 112 54', duplex(-30, 0, 0) + telBody({ side: 1, enz: true, n0: 8 })];
            case 'ribo':
                return ['-36 -44 220 112', paintPolysome({ x: 0, y: 46, len: 2 * 62 + 40, n: 2, n0: 5, seed: 21 })];
            case 'cpg':
                return ['-14 -24 82 34', duplex(-14, 68, 0)
                    + '<g transform="translate(6 -3)">' + lolly(false, 1) + '</g>'
                    + '<g transform="translate(20 -3)">' + lolly(false, 2) + '</g>'
                    + '<g transform="translate(46 -3)">' + lolly(true, 3) + '</g>'];
            case 'miller':
                var parts = '';
                for (var k = 0; k < 7; k++) {
                    parts += '<g transform="translate(' + f1(8 + k * 13) + ' 0)">' + millerPart(k / 6, k) + '</g>';
                }
                return ['-4 -74 112 84', duplex(-4, 108, 3) + parts];
            case 'tree':
                return ['-14 -34 64 40', treeAt(4, 2, 30, 4, 3, true) + treeAt(32, 2, 20, -3, 9, false)];
            case 'pav':
                return ['-20 -30 40 34', pavilionAt(0, 0, 5)];
        }
        return null;
    }

    function drawGlossary() {
        document.querySelectorAll('[data-icon]').forEach(function (el) {
            var ic = icon(el.getAttribute('data-icon'));
            if (ic) {
                el.innerHTML = '<svg viewBox="' + ic[0] + '" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">'
                    + ic[1] + '</svg>';
            }
        });
    }

    /* ============================================================
       Arranque
       ============================================================ */

    function start() {
        stage = document.getElementById('stage');
        tip = document.getElementById('tip');
        readout = document.getElementById('readout');
        statusEl = document.getElementById('status');
        chromSel = document.getElementById('chrom');
        mini = document.getElementById('minimap');

        parseData();
        density();
        buildHelix();
        var target = readUrl();
        plan();
        buildSvg();
        applyPalette();
        bindUi();
        bindStage();
        bindMinimap();
        document.documentElement.classList.add('g-ready');
        resize();
        setMotion(!reduceMotion.matches);
        drawGlossary();

        if (target) {
            var r = resolve(target);
            if (r && r.gene !== undefined) {
                cam.x = G.xm[r.gene] - cam.w / 2;
                apply();
                highlight(r.gene);
            } else if (r && r.x !== undefined) {
                cam.x = r.x - cam.w / 2;
                apply();
            } else if (r && r.chrom !== undefined) {
                cam.x = chroms[r.chrom].x0 - 220;
                apply();
            }
        }
    }

    // Para probar desde la consola: GenomeLandscape.go('BRCA1')
    window.GenomeLandscape = {
        go: function (q) { runSearch(q); },
        seed: function () { return seed; },
        stats: function () { return { genes: G.n, mountains: mountains.length, life: life.length, chunks: loaded.size, width: W }; }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
}());
