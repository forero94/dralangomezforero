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
| `ecosistema.js`, `ecosistema.css` | Ecosistema: lo que vive en un núcleo, pintado detrás de toda la home |
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
`?v=N`: al cambiar `styles.css`, `helice.css`, `helice.js`, `ecosistema.css` o `ecosistema.js`, subir ese número. Si no, quien vuelva al
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

Desde la home se llega por el menú y por el sello de la hebra.

`helice.js` pone la doble hebra de pie en el margen derecho de la home, pintada con más libertad que
exactitud: no sale de ningún cromosoma. El scroll la recorre de punta a punta. Copia el pincel y los
habitantes de `genoma/landscape.js`, así que un cambio allá no le llega solo. Aparece desde 81rem de
ancho, donde el margen alcanza.

> Es una representación didáctica, no a escala.

## El ecosistema

Detrás de toda la home, con la misma tinta del paisaje, vive lo que hay en un núcleo. Son tres planos
que el scroll mueve a distinta velocidad:

- **Al fondo:** aguadas y cromosomas en metafase con sus bandas G reales (UCSC, GRCh38, copiadas de
  `genoma/genome-data.js`).
- **En el medio:** tramos sueltos de doble hebra con nucleosomas, polimerasas que sueltan su ARN,
  árboles de Miller, proteínas y un polvo de moléculas.
- **Adelante:** polisomas, proteínas y alguna polimerasa.

Mientras se lee «El caso», que es ligado al X, pasa un cromosoma X por el margen izquierdo. Detrás de
la columna del texto hay menos y más tenue. Los polisomas, que son lo más grande, van solo en los
márgenes cuando los hay, y el margen derecho es de la hebra. El fondo entra cuando el árbol del inicio
termina de dibujarse.

Como `helice.js`, copia el pincel y los habitantes del paisaje: un cambio allá no le llega solo.

**Cómo se pinta.** El mundo se arma por celdas, cada una con su semilla, y se calcula entero de
antemano en los ratos libres del navegador. Cada celda se pinta una sola vez en su propio lienzo; al
bajar no se repinta nada, solo se corren los planos. En Chrome y Safari eso lo hace el navegador con
una animación atada al scroll; en Firefox, el script. Las aguadas son elementos con degradado CSS, no
trazos en el lienzo. Con movimiento reducido los planos quedan quietos.

**Para ajustarlo.** La cantidad está en `planFar`, `planMid` y `planNear` (`ecosistema.js`): cuántos
lugares por ancho y la probabilidad de que cada uno se llene. La intensidad está en `--eco-far`,
`--eco-mid` y `--eco-near`, y detrás del texto en `--eco-col` (`ecosistema.css`).

«El caso» y «Contacto» dejan ver el fondo porque su papel hundido es translúcido. `--eco-sunken` está
calculado para que sobre papel liso dé exactamente `--paper-sunken`: si cambia alguno de los dos
colores, hay que recalcularlo.
