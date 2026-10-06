# alangomezforero.com.ar

Sitio personal del Dr. Alan Gómez Forero — Residente de Genética Médica (CNGM). Genética clínica y
tecnologías aplicadas a la práctica médica.

Está dirigido a colegas, empleadores y potenciales colaboradores. No es un sitio de captación de pacientes.

## Estructura

| Archivo | Qué es |
|---|---|
| `index.html` | Todo el contenido del sitio |
| `styles.css` | Estilos. CSS a mano, sin frameworks. Tokens en `:root`, tema claro/oscuro |
| `arbol/` | Constructor de árboles familiares. Compilado: la fuente está en `forero94/pedigree` |
| `genoma/` | Paisaje del genoma: el genoma de referencia pintado como un rollo de tinta |
| `helice.js`, `helice.css` | Hebra de tinta: la doble hebra del paisaje, de pie en el margen de la home |
| `og.jpg` | Preview para redes (1200×630) |
| `CNAME` | Dominio: `alangomezforero.com.ar` |

## Stack

Ninguno. HTML, CSS y JavaScript sin dependencias ni paso de build — se publica tal cual en GitHub Pages.
La única carga externa son las tipografías (Fraunces e Inter) desde Google Fonts.

La excepción es `arbol/`: es una aplicación React que se compila en su propio repositorio
(`forero94/pedigree`) y se copia acá ya compilada. No se edita a mano.

## El constructor de árboles

Para publicar una versión nueva, compilar en `forero94/pedigree` (`npm run build`) y, desde esta
carpeta, reemplazar `arbol/` entera por el `dist/` de allá:

```bash
rm -rf arbol && cp -r <ruta a pedigree>/dist arbol
```

Va la carpeta entera porque los nombres de los archivos compilados cambian con cada versión. Como el
resto del sitio, corre todo en el navegador: el árbol que se carga no sale del equipo. Solo tiene tema
claro, porque el árbol se dibuja en blanco y negro.

## Desarrollo

No hace falta servidor: alcanza con abrir `index.html` en el navegador. La excepción es `arbol/`, que
carga módulos de JavaScript y el navegador no los abre desde `file://`. Para probarlo servido:

```bash
python -m http.server 8000
```

GitHub Pages deja que el navegador guarde el CSS y el JS 10 minutos. Por eso `index.html` los enlaza con
`?v=N`: al cambiar `styles.css`, `helice.css` o `helice.js`, subir ese número. Si no, quien vuelva al
sitio ve un rato el HTML nuevo con los estilos viejos.

## El árbol del inicio y el caso

El inicio lo ocupa el árbol familiar de un caso docente, que se dibuja solo. Es un SVG escrito en
`index.html` y la animación es CSS: cada trazo lleva en `--d` cuándo empieza y en `--t` cuánto tarda, y
`pathLength="1"` permite dibujarlo corriendo el guion de 1 a 0. El orden de los trazos es el del
razonamiento. Un script corto deja la escala del dibujo en `--tree-scale`, así la letra y los trazos se
ven del mismo tamaño en cualquier ancho. Con movimiento reducido el árbol aparece entero.

La sección «El caso» cuenta ese razonamiento en texto y en el mismo orden, con la leyenda de símbolos
para leer el árbol.

> El caso es material docente. No corresponde a ningún paciente real.

## El paisaje del genoma

`genoma/` dibuja el genoma humano (GRCh38) como un rollo de tinta que se recorre de punta a punta,
inspirado en [{Shan, Shui}*](https://github.com/LingDong-/shan-shui-inf) de Lingdong Huang (MIT).
Cada elemento sale de un dato: los árboles son los genes codificantes de GENCODE, las montañas la
densidad génica, la franja de abajo el ideograma de UCSC, y la doble hebra se enrolla según la tinción
de cada banda. El mundo se genera por tramos a medida que entra en pantalla, cada uno con su propia
semilla, así que el dibujo es el mismo sin importar por dónde se llegue.

`genoma/genome-data.js` está en el repo y se publica tal cual. Para regenerarlo con una versión nueva
de GENCODE, ver las instrucciones al principio de `genoma/build_data.py`.

La home lo presenta con una captura del propio paisaje, una por tema: `genoma/vista-xq28-claro.webp` y
`genoma/vista-xq28-oscuro.webp`. Se sacaron en `genoma/?semilla=tinta#chrX:149270000`, sin el grano del
papel, y están en WebP sin pérdida para que su papel sea exactamente el de la página. Si cambia el
dibujo o la paleta, hay que volver a sacarlas: exportar en PNG desde esa dirección y recortar.

`helice.js` pone la doble hebra de pie en el margen derecho de la home, pintada con más libertad que
exactitud: no sale de ningún cromosoma. El scroll la recorre de punta a punta. Copia el pincel y los
habitantes de `genoma/landscape.js`, así que un cambio allá no le llega solo. Aparece desde 81rem de
ancho, donde el margen alcanza; el tablero del caso y la captura del genoma terminan justo donde empieza.

> Es una representación didáctica, no a escala.
