/* ============================================================
   Ecosistema
   Detrás de toda la home, lo que vive en un núcleo, con la tinta
   del paisaje del genoma. Tres planos que el scroll mueve a
   distinta velocidad: al fondo, aguadas y cromosomas en metafase
   con sus bandas G reales; en el medio, tramos sueltos de doble
   hebra con nucleosomas, árboles de Miller y proteínas; adelante,
   polisomas y polimerasas con su transcripto.

   El mundo se arma por celdas a medida que entra en pantalla, cada
   una con su semilla, y cada celda se pinta una sola vez en su
   propio lienzo. Al bajar no se repinta nada: el scroll corre los
   planos enteros. Donde se puede, eso lo hace el navegador con una
   animación atada al scroll, fuera del hilo principal.

   El pincel y los habitantes se copian de helice.js, que a su vez
   los copia de genoma/landscape.js.
   ============================================================ */

(function () {
    'use strict';

    var box = document.getElementById('eco');
    var planes = box ? box.querySelectorAll('.eco__layer') : [];
    if (planes.length < 3 || !document.createElement('canvas').getContext) { return; }

    /* ---------- Composición ---------- */
    var SEED = 'ecosistema';

    // Cuánto los mueve el scroll (1 = como el texto), alto de cada celda del mundo
    // y resolución máxima: el del fondo se pinta a 1x, borroso a propósito. Cada
    // celda es un lienzo del ancho de la pantalla: más resolución es más memoria.
    var LAYERS = [
        { speed: 0.3, cell: 620, res: 1, plan: planFar },
        { speed: 0.55, cell: 400, res: 1.5, plan: planMid },
        { speed: 0.8, cell: 560, res: 1.5, plan: planNear }
    ];
    var MAX_TILE_W = 2400;     // ancho máximo de un lienzo, en píxeles del dispositivo

    // Bandas G de UCSC sobre GRCh38, de genoma/genome-data.js: fin de cada banda en
    // décimas de Mb y tinción (0 gneg, 1-4 gpos25-100, 5 acen, 6 gvar, 7 stalk).
    // El X va último: es el del caso.
    var BANDS = [["1",[[23,0],[53,1],[71,0],[91,1],[125,0],[159,2],[201,0],[236,1],[276,0],[299,1],[323,0],[343,1],[396,0],[437,1],[463,0],[502,3],[556,0],[585,2],[608,0],[685,2],[693,0],[844,4],[879,0],[915,3],[943,0],[993,3],[1018,0],[1067,4],[1112,0],[1155,2],[1172,0],[1204,2],[1217,0],[1234,5],[1251,5],[1432,6],[1475,0],[1506,2],[1551,0],[1566,2],[1591,0],[1605,2],[1655,0],[1672,2],[1709,0],[1730,3],[1761,0],[1803,2],[1858,0],[1908,4],[1938,0],[1987,4],[2071,0],[2113,1],[2144,0],[2239,4],[2244,0],[2268,1],[2305,0],[2346,2],[2364,0],[2435,3],[2490,0]]],["4",[[45,0],[60,1],[113,0],[150,2],[177,0],[213,3],[277,0],[358,4],[412,0],[446,2],[482,0],[500,5],[518,5],[585,0],[655,4],[694,0],[753,3],[780,0],[815,2],[832,0],[860,1],[871,0],[928,3],[942,0],[979,3],[1001,0],[1067,2],[1132,0],[1199,3],[1228,0],[1279,2],[1301,0],[1385,4],[1406,0],[1459,1],[1475,0],[1502,1],[1546,0],[1608,4],[1636,0],[1692,4],[1710,0],[1754,3],[1766,0],[1823,4],[1862,0],[1902,1]]],["7",[[28,0],[45,1],[72,0],[137,4],[165,0],[209,4],[255,0],[279,2],[288,0],[349,3],[371,0],[433,3],[454,0],[490,3],[505,0],[539,3],[581,0],[601,5],[621,5],[675,0],[727,2],[779,0],[867,4],[885,0],[915,3],[933,0],[984,3],[1042,0],[1049,2],[1078,0],[1150,3],[1177,0],[1214,3],[1241,0],[1275,3],[1296,0],[1308,1],[1329,0],[1385,2],[1434,0],[1482,3],[1528,0],[1552,1],[1593,0]]],["9",[[22,0],[46,1],[90,0],[142,3],[166,0],[185,1],[199,0],[256,4],[280,0],[332,4],[363,0],[379,1],[390,0],[400,2],[422,0],[430,5],[455,5],[615,6],[650,0],[693,1],[713,0],[766,2],[785,0],[815,2],[843,0],[878,2],[892,0],[912,1],[939,0],[965,1],[998,0],[1054,4],[1085,0],[1121,1],[1149,0],[1198,3],[1231,0],[1275,1],[1306,0],[1311,1],[1331,0],[1345,1],[1384,0]]],["11",[[28,0],[117,2],[138,0],[169,2],[220,0],[262,4],[272,0],[310,3],[364,0],[434,4],[488,0],[510,3],[534,5],[558,5],[601,3],[619,0],[636,1],[661,0],[687,1],[705,0],[755,2],[774,0],[859,4],[886,0],[930,4],[974,0],[1023,4],[1030,0],[1106,4],[1127,0],[1146,2],[1213,0],[1240,2],[1279,0],[1309,2],[1351,0]]],["15",[[42,6],[97,7],[175,6],[190,5],[205,5],[255,0],[278,2],[300,0],[309,2],[334,0],[398,3],[425,0],[433,1],[445,0],[492,3],[526,0],[588,3],[590,0],[634,1],[669,0],[670,1],[672,0],[724,1],[749,0],[763,1],[780,0],[814,2],[847,0],[885,2],[938,0],[980,2],[1020,0]]],["17",[[34,0],[65,2],[108,0],[161,3],[227,0],[251,5],[274,5],[335,0],[398,2],[402,0],[428,1],[468,0],[493,1],[521,0],[595,3],[602,0],[631,3],[646,0],[662,2],[691,0],[729,3],[768,0],[772,1],[833,0]]],["21",[[31,6],[70,7],[109,6],[120,5],[130,5],[150,0],[226,4],[255,0],[302,3],[344,0],[364,2],[383,0],[412,2],[467,0]]],["X",[[44,0],[61,2],[96,0],[174,2],[192,0],[219,2],[249,0],[293,4],[315,0],[378,4],[425,0],[476,3],[501,0],[548,1],[581,0],[610,5],[638,5],[654,0],[685,2],[730,0],[747,2],[768,0],[854,4],[870,0],[927,4],[943,0],[991,3],[1033,0],[1045,2],[1094,0],[1174,3],[1218,0],[1295,4],[1313,0],[1345,1],[1389,0],[1412,3],[1430,0],[1480,4],[1560,0]]]];

    /* ---------- Azar con semilla y ruido (de helice.js) ---------- */

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

    /* ---------- Pincel (de helice.js) ---------- */

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
    function ends(t) { return Math.min(1, t * 7, (1 - t) * 7); }
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

    /* ---------- Habitantes (de helice.js) ----------
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

    /* ---------- Un tramo suelto de doble hebra ----------
       A lo largo de x y centrado en 0. El pincel apoya y se levanta en las
       puntas, y junto a cada nucleosoma la hebra se afina para darle la vuelta. */

    var DNA_P = 64, DNA_R = 10, DNA_GROOVE = 0.38;

    function dnaParts(e) {
        var h = e.len / 2, n0 = e.n0, nucs = e.nucs, x, k;
        function env(x) { return smoothstep(0, 40, Math.min(x + h, h - x)); }
        function pinch(x) {
            var f = 1;
            for (var i = 0; i < nucs.length; i++) {
                f = Math.min(f, lerp(0.12, 1, smoothstep(13, 36, Math.abs(x - nucs[i]))));
            }
            return f;
        }
        function th(k, x) { return 2 * Math.PI * (x / DNA_P + k * DNA_GROOVE + e.ph); }
        function axis(x) { return e.bend * Math.sin(Math.PI * (x + h) / e.len) + 12 * (noise(x * 0.005, n0 + 5) - 0.5); }
        function y(k, x) { return axis(x) + DNA_R * pinch(x) * Math.sin(th(k, x)) + 1.5 * (noise(x * 0.03, n0 + k) - 0.5); }

        // atrás, las dos hebras con el pincel casi seco; adelante, cada tramo que
        // pasa por delante, cargado y afinado en las puntas
        var back = '', front = '', rungs = '';
        for (k = 0; k < 2; k++) {
            var pts = [], run = [];
            var flush = function () {
                if (run.length >= 4) {
                    var load = 0.6 + 0.7 * noise(run[0][0] * 0.01, n0 + 33);
                    front += brush(run, 1.5 * load, 0.35, swell, n0 + k * 7 + run[0][0] * 0.1);
                }
                run = [];
            };
            for (x = -h; x <= h + 0.01; x += 3) {
                var p = [x, y(k, x)];
                pts.push(p);
                if (Math.cos(th(k, x)) > 0.1 && env(x) > 0.2 && pinch(x) > 0.5) { run.push(p); } else { flush(); }
            }
            flush();
            back += brush(pts, 0.75, 0.4, ends, n0 + k);
        }

        // diez pares de bases por vuelta
        for (x = -h + 8; x < h - 8; x += DNA_P / 10) {
            if (env(x) < 0.5 || pinch(x) < 0.7) { continue; }
            var y0 = y(0, x), y1 = y(1, x);
            if (Math.abs(y1 - y0) < 4) { continue; }
            var lean = 1.5 * (noise(x * 0.7, n0 + 95) - 0.5);
            rungs += 'M' + f1(x - 0.45) + ' ' + f1(y0) + 'L' + f1(x + 0.45) + ' ' + f1(y0)
                + 'L' + f1(x + lean + 0.3) + ' ' + f1(y1) + 'L' + f1(x + lean - 0.3) + ' ' + f1(y1) + 'Z';
        }

        var parts = [[0, 0, 0, 1, op('hb', 1, back).concat(op('ink', 0.22, rungs), op('hf', 1, front))]];
        nucs.forEach(function (nx, i) {
            parts.push([nx, axis(nx), 0, 1, nucBody({ tilt: (noise(i * 3.1, n0) - 0.5) * 0.5, n0: n0 + 10 + i * 5 })]);
        });

        // la polimerasa va sobre una de las hebras, y suelta su ARN hacia arriba
        if (e.pol) {
            var P = e.pol, py = y(P.k, P.x), pa = Math.atan(y(P.k, P.x + 0.5) - y(P.k, P.x - 0.5));
            var u = POL_EXIT[0] * P.dir, v = POL_EXIT[1];
            parts.push([P.x + Math.cos(pa) * u - Math.sin(pa) * v, py + Math.sin(pa) * u + Math.cos(pa) * v, 0, 1, polTail(P, P.len)]);
            parts.push([P.x, py, pa, P.dir, polBody(P)]);
        }
        return parts;
    }

    /* ---------- Árbol de Miller ----------
       Un gen ribosómico transcripto por decenas de polimerasas a la vez: los
       transcriptos crecen de una punta a la otra del gen. A veces dos genes en
       tándem, separados por un espaciador desnudo. */

    function millerParts(e) {
        var h = e.total / 2, n0 = e.n0, axisPts = [], x;
        for (x = -h; x <= h + 0.01; x += 4) { axisPts.push([x, 3 * (noise(x * 0.02, n0) - 0.5)]); }
        var fibers = '', pols = '';
        for (var g = 0; g < e.genes; g++) {
            var x0 = -h + 30 + g * (e.gl + e.sp);
            for (var q = 0; q < e.nf; q++) {
                var t = q / (e.nf - 1), fx = x0 + t * e.gl, side = q % 2 ? 1 : -1, L = 5 + t * 52, pts = [];
                for (var s = 0; s <= 8; s++) {
                    var u = s / 8;
                    pts.push([fx - u * L * 0.22 + Math.sin(u * 5 + q) * 2 * u, side * (2 + u * L)]);
                }
                fibers += brush(pts, 0.6, 0.35, taper, n0 + q * 3.1);
                pols += blob(fx, side * 1.2, 4.2, 4.2, 0, n0 + q);
            }
        }
        return [[0, 0, 0, 1, op('ink', 0.55, brush(axisPts, 0.75, 0.3, ends, n0))
            .concat(op('acc', 0.7, fibers), op('pw', 0.9, pols))]];
    }

    /* ---------- Polisoma ----------
       Un ARNm leído a la vez por varios ribosomas: cada uno lleva su cadena de
       aminoácidos, más larga cuanto más avanzó hacia el 3'. */

    function ribosome(x, y, n0) {
        return protein(blobPts(x + 3, y + 11, 36, 20, 0, n0 + 1), 0.16, n0 + 1)
            .concat(protein(blobPts(x, y - 16, 52, 34, 0, n0), 0.1, n0));
    }

    function polysomeParts(e) {
        var r = rngFrom(e.seed), x0 = -e.len / 2, n0 = e.n0, mrna = [], k;
        for (var t = 0; t <= 1.0001; t += 1 / 30) {
            mrna.push([x0 + t * e.len, Math.sin(t * 5 + n0) * 5]);
        }
        var beads = '', ribos = [];
        for (k = 0; k < e.n; k++) {
            var u = (k + 0.6) / (e.n + 0.4);
            var px = x0 + u * e.len, py = Math.sin(u * 5 + n0) * 5;
            var nb = Math.round(2 + u * 9), bx = px - 4, by = py - 34, a = -Math.PI / 2 - 0.4;
            for (var b = 0; b < nb; b++) {
                beads += blob(bx, by, 3.6, 3.6, 0, n0 + k + b * 0.3);
                a += (r() - 0.5) * 0.9;
                bx += Math.cos(a) * 3.8;
                by += Math.sin(a) * 3.8;
            }
            ribos = ribos.concat(ribosome(px, py, n0 + k * 3));
        }
        return [[0, 0, 0, 1, op('acc', 0.8, brush(mrna, 0.9, 0.3, flat))
            .concat(op('acc', 0.9, blob(mrna[0][0] - 2, mrna[0][1], 4.5, 4.5, 0, n0)), op('pw', 0.6, beads), ribos)]];
    }

    /* ---------- Cromosoma en metafase ----------
       Dos cromátides hermanas unidas en el centrómero, con sus bandas G. De
       pie, el brazo p arriba; los acrocéntricos con el tallo fino. */

    var CH_K = 1.15;           // px por Mb
    var CH_W = 8.5;            // media cromátide
    var BAND_A = [0, 0.2, 0.36, 0.52, 0.7, 0.12, 0.45, 0.1];

    function chromParts(e) {
        var b = BANDS[e.ci][1], L = b[b.length - 1][0] / 10 * CH_K, h = L / 2, n0 = e.n0;
        var bands = [], prev = 0, cen = null;
        b.forEach(function (bd) {
            var y1 = bd[0] / 10 * CH_K - h;
            bands.push([prev / 10 * CH_K - h, y1, bd[1]]);
            if (bd[1] === 5 && cen === null) { cen = y1; }
            prev = bd[0];
        });
        if (cen === null) { cen = 0; }

        function stainAt(y) {
            for (var i = 0; i < bands.length; i++) { if (y < bands[i][1]) { return bands[i][2]; } }
            return 0;
        }
        // ancho: telómeros redondos, cintura en el centrómero
        function w(y) {
            var round = Math.sqrt(clamp(Math.min(y + h, h - y) / CH_W, 0, 1));
            var waist = lerp(0.45, 1, smoothstep(1.5, 8, Math.abs(y - cen)));
            var stalk = stainAt(y) === 7 ? 0.35 : 1;
            return CH_W * round * waist * stalk * (0.93 + 0.14 * noise(y * 0.04, n0));
        }
        // las hermanas se separan un pelo a lo largo de los brazos
        function cx(s, y) {
            var off = CH_W * lerp(0.55, 1.08, smoothstep(1.5, 16, Math.abs(y - cen)));
            return e.bend * Math.sin(Math.PI * (y + h) / L) + s * off;
        }
        function poly(s, y0, y1) {
            var lft = [], rgt = [], n = Math.max(2, Math.ceil((y1 - y0) / 1.5));
            for (var q = 0; q <= n; q++) {
                var y = lerp(y0, y1, q / n), ww = w(y), xx = cx(s, y);
                lft.push([xx - ww, y]);
                rgt.push([xx + ww, y]);
            }
            return lft.concat(rgt.reverse());
        }

        var ops = [];
        [-1, 1].forEach(function (s) {
            var body = poly(s, -h, h), bd = pathOf(body, true), dark = [];
            ops.push({ c: 'pp', o: 1, d: bd }, { c: 'ink', o: 0.07, d: bd });
            bands.forEach(function (bb) {
                if (BAND_A[bb[2]]) { dark[bb[2]] = (dark[bb[2]] || '') + pathOf(poly(s, bb[0], bb[1]), true); }
            });
            dark.forEach(function (d, st) { if (d) { ops.push({ c: 'ink', o: BAND_A[st], d: d }); } });
            ops.push({ c: 'ink', o: 0.55, d: ring(body, 0.5, n0 + s) });
        });
        e.reach = h + 20;
        return [[0, 0, 0, 1, ops]];
    }

    /* ---------- Los elementos ----------
       x, y en el mundo de su plano; el dibujo, en coordenadas propias. */

    // en pantallas angostas todo se achica, hasta un 65%
    function el(x, y, sc, ang, reach, parts) {
        return { x: x, y: y, sc: sc * clamp(viewW / 1200, 0.65, 1), ang: ang, reach: reach, parts: parts };
    }

    function dnaEl(r, x, y, sc, withPol) {
        var e = { len: 200 + r() * 260, nucs: [], n0: r() * 200, ph: r(), bend: (r() - 0.5) * 50 };
        var h = e.len / 2, ang = (r() - 0.5) * Math.PI * 0.9;
        if (withPol) {
            e.pol = { x: (r() - 0.5) * e.len * 0.4, k: r() < 0.5 ? 0 : 1, dir: r() < 0.5 ? 1 : -1, len: 60 + r() * 60, n0: r() * 50 };
        } else if (r() < 0.6) {
            // una fila de cuentas
            for (var nx = -h + 50 + r() * 40, n = Math.floor(r() * 4); n > 0 && nx < h - 50; n--) {
                e.nucs.push(nx);
                nx += 48 + r() * 12;
            }
        }
        return el(x, y, sc, ang, h + (withPol ? 110 : 40), dnaParts(e));
    }

    function millerEl(r, x, y, sc) {
        var e = { genes: r() < 0.5 ? 2 : 1, gl: 130 + r() * 60, sp: 50 + r() * 30, nf: 16 + Math.floor(r() * 8), n0: r() * 200 };
        e.total = e.genes * e.gl + (e.genes - 1) * e.sp + 60;
        return el(x, y, sc, (r() - 0.5) * Math.PI * 0.8, e.total / 2 + 60, millerParts(e));
    }

    function polysomeEl(r, x, y, sc) {
        var e = { len: 150 + r() * 120, n: 3 + Math.floor(r() * 3), seed: Math.floor(r() * 1e9), n0: r() * 200 };
        return el(x, y, sc, (r() - 0.5) * 0.8, e.len / 2 + 50, polysomeParts(e));
    }

    // proteínas sueltas, de a una o en pequeños complejos
    function protEl(r, x, y, sc) {
        var ops = [], px = 0, py = 0, n0 = r() * 200;
        for (var i = 0, n = 1 + Math.floor(r() * 3); i < n; i++) {
            var size = 10 + r() * 16;
            ops = ops.concat(protein(blobPts(px, py, size * (1 + r() * 0.5), size, r() * 3, n0 + i * 2), 0.08 + r() * 0.14, n0 + i * 2));
            px += size * 0.75 * (r() < 0.5 ? 1 : -1);
            py += size * (r() - 0.5);
        }
        return el(x, y, sc, 0, 50, [[0, 0, 0, 1, ops]]);
    }

    // polvo de nucleótidos y moléculas sueltas a lo ancho de toda la celda:
    // tinta, ARN y proteína, de a granos
    function dustEl(r, y0, h) {
        var d = { ink: '', acc: '', pw: '' }, keys = ['ink', 'ink', 'acc', 'pw'];
        for (var i = 0, n = Math.round(viewW / 60); i < n; i++) {
            var sz = 1.2 + r() * r() * 3.5;
            d[keys[Math.floor(r() * 4)]] += blob(r() * viewW, (r() - 0.5) * h, sz, sz * (0.7 + r() * 0.5), r() * 3, r() * 50);
        }
        var e = el(0, 0, 1, 0, 0, [[0, 0, 0, 1, op('ink', 0.45, d.ink).concat(op('acc', 0.6, d.acc), op('pw', 0.6, d.pw))]]);
        e.sc = 1;
        e.y = y0 + h / 2;
        e.reach = h / 2 + 10;
        return e;
    }

    // salpicaduras de tinta
    function specksEl(r, x, y, sc) {
        var d = ['', '', ''];
        for (var i = 0, n = 8 + Math.floor(r() * 14); i < n; i++) {
            var sz = 0.8 + r() * r() * 5;
            d[Math.floor(r() * 3)] += blob((r() - 0.5) * 120, (r() - 0.5) * 90, sz, sz * (0.7 + r() * 0.5), r() * 3, r() * 50);
        }
        return el(x, y, sc, 0, 80, [[0, 0, 0, 1, op('ink', 0.3, d[0]).concat(op('ink', 0.5, d[1]), op('ink', 0.7, d[2]))]]);
    }

    function chromEl(r, ci, x, y) {
        var e = { ci: ci, n0: r() * 200, bend: (r() - 0.5) * 16 };
        var parts = chromParts(e);
        return el(x, y, 1, (r() - 0.5) * 0.6, e.reach, parts);
    }

    function washEl(r, x, y) {
        var e = el(x, y, 1, (r() - 0.5) * 0.8, 0, null);
        e.wash = { rx: 160 + r() * 240, ry: 100 + r() * 140, a: 0.05 + r() * 0.05, c: r() < 0.25 ? 'pw' : 'ink' };
        e.reach = Math.max(e.wash.rx, e.wash.ry);
        return e;
    }

    /* ---------- Qué va en cada celda ---------- */

    var viewW = 0, viewH = 0, colHalf = 496, margins = false, helixOn = false, special = null;

    // Dónde cae x: detrás del texto va menos que en los márgenes, y el margen
    // derecho es de la hebra (helice.css) cuando se ve. Lo de adelante, que es
    // lo más grande, va solo en los márgenes cuando los hay.
    function skip(r, x, near) {
        if (helixOn && x > viewW / 2 + colHalf) { return true; }
        var inCol = margins && Math.abs(x - viewW / 2) < colHalf;
        return inCol && (near || r() < 0.3);
    }

    // Que no se monten dentro de la celda: cada uno ocupa un círculo un poco más
    // chico que lo que llega a pintar, así se rozan pero no se tapan.
    function put(out, e) {
        var rad = e.reach * e.sc * 0.55;
        for (var i = 0; i < out.length; i++) {
            var o = out[i];
            if (o.wash || o.dust) { continue; }
            var dx = o.x - e.x, dy = o.y - e.y, rr = o.reach * o.sc * 0.55 + rad;
            if (dx * dx + dy * dy < rr * rr) { return; }
        }
        out.push(e);
    }

    // al fondo: aguadas y cromosomas. El X queda para el caso.
    function planFar(L, r, y0, out) {
        for (var i = 0, n = 2 + (r() < 0.5 ? 1 : 0); i < n; i++) { out.push(washEl(r, r() * viewW, y0 + r() * L.cell)); }
        for (var j = 0, m = Math.max(1, Math.round(viewW / 700)); j < m; j++) {
            if (r() > 0.75) { continue; }
            var ci = Math.floor(r() * (BANDS.length - 1)), x = (j + 0.1 + 0.8 * r()) / m * viewW, y = y0 + (0.1 + 0.8 * r()) * L.cell;
            if (!skip(r, x)) { put(out, chromEl(r, ci, x, y)); }
        }
    }

    // en el medio: hebras sueltas, árboles de Miller, proteínas, salpicaduras y polvo
    function planMid(L, r, y0, out) {
        var d = dustEl(r, y0, L.cell);
        d.dust = true;
        out.push(d);
        var cols = Math.max(2, Math.round(viewW / 250));
        for (var c = 0; c < cols; c++) {
            if (r() > 0.78) { continue; }
            var x = (c + 0.15 + 0.7 * r()) / cols * viewW, y = y0 + (0.1 + 0.8 * r()) * L.cell, t = r();
            if (skip(r, x) || (special && Math.abs(y - special.y) < 260 && Math.abs(x - special.x) < 200)) { continue; }
            put(out, t < 0.28 ? dnaEl(r, x, y, 0.8, false)
                : t < 0.4 ? dnaEl(r, x, y, 0.8, true)
                : t < 0.52 ? millerEl(r, x, y, 0.8)
                : t < 0.82 ? protEl(r, x, y, 0.85)
                : specksEl(r, x, y, 1));
        }
    }

    // adelante, más grandes: polisomas, proteínas y alguna polimerasa
    function planNear(L, r, y0, out) {
        var cols = Math.max(1, Math.round(viewW / 380));
        for (var c = 0; c < cols; c++) {
            if (r() > 0.58) { continue; }
            var x = (c + 0.15 + 0.7 * r()) / cols * viewW, y = y0 + (0.1 + 0.8 * r()) * L.cell, t = r();
            if (skip(r, x, true)) { continue; }
            put(out, t < 0.42 ? polysomeEl(r, x, y, 1.1)
                : t < 0.74 ? protEl(r, x, y, 1.25)
                : dnaEl(r, x, y, 1.1, true));
        }
    }

    function cellOf(L, k) {
        var list = L.cells.get(k);
        if (!list) {
            list = [];
            L.plan(L, rngFrom(hash(SEED, L.i, k)), k * L.cell, list);
            L.cells.set(k, list);
        }
        return list;
    }

    // El X del caso, en el plano del medio: pasa por el medio de la pantalla
    // mientras se lee «El caso». En el margen izquierdo si hay; si no, en el claro
    // que queda a la derecha del razonamiento.
    var SPECIAL = 1;

    function placeSpecial() {
        var sec = document.getElementById('caso');
        if (!sec) { special = null; return; }
        var rs = sec.getBoundingClientRect(), wrap = sec.querySelector('.wrap').getBoundingClientRect();
        var list = sec.querySelector('.reasoning');
        var right = list ? list.getBoundingClientRect().right : wrap.left + wrap.width * 0.6;
        var x = wrap.left > 110 ? wrap.left / 2 : wrap.right - right > 160 ? (right + wrap.right) / 2 : viewW * 0.82;
        var y = LAYERS[SPECIAL].speed * (rs.top + window.scrollY + rs.height * 0.4 - viewH / 2) + viewH / 2;
        // con movimiento reducido los planos quedan quietos: no hay dónde ponerlo
        if (reduce.matches) { x = y = NaN; }
        if (special ? Math.abs(special.y - y) < 1 && Math.abs(special.x - x) < 1 : isNaN(y)) { return; }
        special = isNaN(y) ? null : chromEl(rngFrom(hash(SEED, 'X')), BANDS.length - 1, x, y);
        if (special) { special.ang = -0.08; }
        resetLayer(LAYERS[SPECIAL]);
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

    var pal = {};

    function readPalette() {
        var cs = getComputedStyle(document.documentElement);
        function tok(n, fb) { var v = cs.getPropertyValue(n); return (v && v.trim()) || fb; }
        var paper = tok('--paper', '#fbfaf7'), ink = tok('--ink', '#16150f');
        var accent = tok('--accent', '#a8442a'), prot = tok('--g-protein', '#3d5a8c');
        pal = {
            pp: paper, ink: ink, acc: accent, pw: prot, po: mix(ink, prot, 0.5),
            hb: mix(paper, ink, 0.3), hf: mix(paper, ink, 0.65)
        };

    }

    /* ---------- Pintar ---------- */

    function paintOps(c, ops) {
        for (var i = 0; i < ops.length; i++) {
            var o = ops[i];
            if (!o.p) { o.p = new Path2D(o.d); }
            c.globalAlpha = o.o;
            c.fillStyle = pal[o.c];
            c.fill(o.p);
        }
        c.globalAlpha = 1;
    }

    // Una mancha difusa: elipse con degradé. No se pinta en el lienzo: es un
    // elemento con degradado CSS, que el navegador dibuja con la GPU (pintarla
    // grande en el lienzo era lo más caro del fondo) y que sigue solo al tema.
    var WASH_COL = { ink: 'var(--ink)', pw: 'var(--g-protein)' };

    function washDiv(e) {
        var w = e.wash, col = WASH_COL[w.c], d = document.createElement('div');
        d.className = 'eco__wash';
        d.style.cssText = 'left:' + f1(e.x - w.rx) + 'px;top:' + f1(e.y - w.ry) + 'px;width:' + f1(w.rx * 2)
            + 'px;height:' + f1(w.ry * 2) + 'px;transform:rotate(' + e.ang.toFixed(3) + 'rad);background:radial-gradient(closest-side,'
            + 'color-mix(in srgb,' + col + ' ' + (w.a * 100).toFixed(1) + '%,transparent),'
            + 'color-mix(in srgb,' + col + ' ' + (w.a * 45).toFixed(1) + '%,transparent) 55%,transparent)';
        return d;
    }

    function paintEl(c, e, y0, y1) {
        var rr = e.reach * e.sc;
        if (e.wash || e.y + rr < y0 || e.y - rr > y1) { return; }
        c.save();
        c.translate(e.x, e.y);
        if (e.ang) { c.rotate(e.ang); }
        if (e.sc !== 1) { c.scale(e.sc, e.sc); }
        for (var k = 0; k < e.parts.length; k++) {
            var p = e.parts[k];
            c.save();
            c.translate(p[0], p[1]);
            if (p[2]) { c.rotate(p[2]); }
            if (p[3] !== 1) { c.scale(p[3], 1); }
            paintOps(c, p[4]);
            c.restore();
        }
        c.restore();
    }

    /* ---------- Lienzos por celda ----------
       Cada celda se pinta en su lienzo con lo de las celdas vecinas que se le
       mete adentro (nada llega más lejos que una celda). Se pintan las que se
       ven y dos de cada lado; las de más allá se sueltan. */

    function paintTile(L, k, cv) {
        var t0 = performance.now();
        var c = cv.getContext('2d'), y0 = k * L.cell, y1 = y0 + L.cell;
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.clearRect(0, 0, cv.width, cv.height);
        c.setTransform(L.dpr, 0, 0, L.dpr, 0, -y0 * L.dpr);
        for (var j = k - 1; j <= k + 1; j++) {
            var list = cellOf(L, j);
            for (var i = 0; i < list.length; i++) { paintEl(c, list[i], y0, y1); }
        }
        if (L.i === SPECIAL && special) { paintEl(c, special, y0, y1); }
        // las manchas de esta celda, una vez
        cellOf(L, k).forEach(function (e) {
            if (e.wash && !e.div) { e.div = L.el.appendChild(washDiv(e)); }
        });
        cv.painted = true;
        // cuánto tarda una celda de este plano, para saber si entra en un rato libre
        L.cost = 0.7 * L.cost + 0.3 * (performance.now() - t0);
    }

    function tileOf(L, k) {
        var cv = L.tiles.get(k);
        if (!cv) {
            cv = document.createElement('canvas');
            cv.width = Math.round(viewW * L.dpr);
            cv.height = Math.round(L.cell * L.dpr);
            cv.style.top = k * L.cell + 'px';
            cv.style.height = L.cell + 'px';
            L.el.appendChild(cv);
            L.tiles.set(k, cv);
        }
        return cv;
    }

    // ancho en cero antes de soltarlo: Safari libera la memoria del lienzo antes
    function dropTile(L, k) {
        var cv = L.tiles.get(k);
        (L.cells.get(k) || []).forEach(function (e) {
            if (e.div) { e.div.remove(); e.div = null; }
        });
        cv.width = cv.height = 0;
        cv.remove();
        L.tiles.delete(k);
    }

    function resetLayer(L) {
        Array.from(L.tiles.keys()).forEach(function (k) { dropTile(L, k); });
        L.el.querySelectorAll('.eco__wash').forEach(function (d) { d.remove(); });
        L.cells.clear();
    }

    // Lo que no está a la vista se pinta en los ratos libres del navegador. Antes,
    // también ahí, se calcula el mundo entero de la página: son unas pocas decenas
    // de celdas, y así al bajar pintar una celda es solo pintar.
    var pending = [], genQueue = [], idleId = 0;
    var idle = window.requestIdleCallback
        ? function (fn) { return window.requestIdleCallback(fn, { timeout: 150 }); }
        : function (fn) { return setTimeout(function () { fn({ didTimeout: true, timeRemaining: function () { return 0; } }); }, 40); };

    function enqueue(L, k) {
        for (var i = 0; i < pending.length; i++) { if (pending[i][0] === L && pending[i][1] === k) { return; } }
        pending.push([L, k]);
        if (!idleId) { idleId = idle(work); }
    }

    // cuánto le falta a una celda para entrar en pantalla, en píxeles de pantalla
    function gap(p) {
        var y = p[1] * p[0].cell - speedOf(p[0]) * window.scrollY;
        return Math.max(0, y - viewH, -(y + p[0].cell));
    }

    function planAhead() {
        var root = document.documentElement, max = Math.max(0, root.scrollHeight - root.clientHeight);
        genQueue = [];
        LAYERS.forEach(function (L) {
            var last = Math.ceil((speedOf(L) * max + viewH) / L.cell) + 2;
            for (var k = -2; k <= last; k++) { if (!L.cells.has(k)) { genQueue.push([L, k]); } }
        });
        genQueue.sort(function (a, b) { return gap(a) - gap(b); });
        if (genQueue.length && !idleId) { idleId = idle(work); }
    }

    // Primero pintar lo que está por entrar, después calcular. De a una cosa y solo
    // si entra en el rato libre que queda; si el navegador no se libera en 150 ms,
    // igual hace una para no quedarse atrás.
    function work(dl) {
        idleId = 0;
        pending = pending.filter(function (p) { var cv = p[0].tiles.get(p[1]); return cv && !cv.painted; });
        pending.sort(function (a, b) { return gap(a) - gap(b); });
        var forced = dl.didTimeout;
        while (pending.length || genQueue.length) {
            var tile = pending.length > 0;
            if (!forced && dl.timeRemaining() < (tile ? pending[0][0].cost : 4) + 1) { break; }
            if (tile) {
                var p = pending.shift();
                paintTile(p[0], p[1], p[0].tiles.get(p[1]));
            } else {
                var q = genQueue.shift();
                cellOf(q[0], q[1]);
            }
            forced = false;
            if (dl.didTimeout) { break; }
        }
        if (pending.length || genQueue.length) { idleId = idle(work); }
    }

    // Mientras se baja casi no hay ratos libres: en cada cuadro, si una celda está
    // por entrar (a menos de media pantalla), se pinta esa sola.
    function soon() {
        var best = null, bg = viewH / 2;
        for (var i = 0; i < pending.length; i++) {
            var p = pending[i], cv = p[0].tiles.get(p[1]);
            if (!cv || cv.painted) { continue; }
            var g = gap(p);
            if (g < bg) { best = p; bg = g; }
        }
        if (best) { paintTile(best[0], best[1], best[0].tiles.get(best[1])); }
    }

    function want(L, top) {
        var a = Math.floor(top / L.cell), b = Math.floor((top + viewH) / L.cell);
        L.tiles.forEach(function (cv, k) { if (k < a - 3 || k > b + 3) { dropTile(L, k); } });
        for (var k = a - 2; k <= b + 2; k++) {
            var cv = tileOf(L, k);
            if (cv.painted) { continue; }
            // lo que está a la vista no puede esperar, salvo antes de que aparezca el fondo
            if (k >= a && k <= b && shown) { paintTile(L, k, cv); } else { enqueue(L, k); }
        }
    }

    /* ---------- Movimiento ---------- */

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    // Con animaciones atadas al scroll el navegador corre los planos solo (ecosistema.css);
    // sin ellas (Firefox, por ahora) los corre este script. Con movimiento reducido, quietos.
    var timeline = !!(window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()'));
    var shown = false;

    function speedOf(L) { return reduce.matches ? 0 : L.speed; }

    function layout() {
        var rc = box.getBoundingClientRect(), w = Math.round(rc.width), h = Math.round(rc.height);
        var dpr = window.devicePixelRatio || 1, rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        var root = document.documentElement;
        box.style.setProperty('--eco-max', Math.max(0, root.scrollHeight - root.clientHeight) + 'px');
        if (w !== viewW || dpr !== layout.dpr) {
            viewW = w;
            layout.dpr = dpr;
            LAYERS.forEach(function (L) {
                resetLayer(L);
                L.dpr = Math.min(dpr, L.res, MAX_TILE_W / Math.max(1, w));
            });
        }
        viewH = h;
        colHalf = 31 * rem;
        margins = w > 70 * rem;
        helixOn = w >= 81 * rem;
        placeSpecial();
        planAhead();
    }

    function move() {
        if (!viewW || !viewH) { return; }
        var y = window.scrollY;
        LAYERS.forEach(function (L) {
            var top = speedOf(L) * y;
            if (!timeline) { L.el.style.transform = 'translate3d(0,' + (-top).toFixed(1) + 'px,0)'; }
            want(L, top);
        });
    }

    var raf = 0;

    function frame() {
        raf = 0;
        move();
        if (shown) { soon(); }
    }

    function request() { if (!raf) { raf = requestAnimationFrame(frame); } }

    // Entra cuando el árbol del inicio termina de dibujarse, para no competir con él;
    // antes si se baja, y de una con movimiento reducido. Hasta entonces se pinta
    // solo en los ratos libres.
    function reveal() {
        if (shown) { return; }
        shown = true;
        box.classList.add('is-on');
        move();
    }

    function start() {
        seedNoise(hash(SEED, 'tinta'));
        LAYERS.forEach(function (L, i) {
            L.i = i;
            L.el = planes[i];
            L.el.style.setProperty('--speed', L.speed);
            L.tiles = new Map();
            L.cells = new Map();
            L.cost = 8;
        });
        readPalette();
        layout();
        move();

        var tree = document.querySelector('.hero__tree');
        var last = tree && tree.lastElementChild;
        if (reduce.matches || !last || window.scrollY > 0) {
            reveal();
        } else {
            last.addEventListener('animationend', reveal, { once: true });
            window.addEventListener('scroll', reveal, { once: true, passive: true });
            setTimeout(reveal, 7000);
        }

        window.addEventListener('scroll', request, { passive: true });
        window.addEventListener('resize', function () { layout(); request(); });
        reduce.addEventListener('change', function () { placeSpecial(); request(); });

        // el tema: el botón cambia data-theme; el sistema, la preferencia. Se repinta todo.
        function retheme() {
            readPalette();
            LAYERS.forEach(function (L) { L.tiles.forEach(function (cv) { cv.painted = false; }); });
            request();
        }
        new MutationObserver(retheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', retheme);
        // cuando cargan las fuentes y las imágenes cambia el alto de la página: el
        // recorrido del scroll y dónde cae el caso
        if (window.ResizeObserver) { new ResizeObserver(function () { layout(); request(); }).observe(document.body); }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
}());
