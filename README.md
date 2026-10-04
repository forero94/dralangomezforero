# alangomezforero.com.ar

Sitio personal del Dr. Alan Gómez Forero — Residente de Genética Médica (CNGM). Genética clínica y
tecnologías aplicadas a la práctica médica.

Está dirigido a colegas, empleadores y potenciales colaboradores. No es un sitio de captación de pacientes.

## Estructura

| Archivo | Qué es |
|---|---|
| `index.html` | Todo el contenido del sitio |
| `styles.css` | Estilos. CSS a mano, sin frameworks. Tokens en `:root`, tema claro/oscuro |
| `pedigree.js` | Árbol familiar interactivo del caso guiado |
| `arbol/` | Constructor de árboles familiares |
| `genoma/` | Paisaje del genoma: el genoma de referencia pintado como un rollo de tinta |
| `og.jpg` | Preview para redes (1200×630) |
| `CNAME` | Dominio: `alangomezforero.com.ar` |

## Stack

Ninguno. HTML, CSS y JavaScript sin dependencias ni paso de build — se publica tal cual en GitHub Pages.
La única carga externa son las tipografías (Fraunces e Inter) desde Google Fonts.

## Desarrollo

No hace falta servidor: alcanza con abrir `index.html` en el navegador. Para probarlo servido:

```bash
python -m http.server 8000
```

## El caso guiado

`pedigree.js` dibuja un árbol familiar de tres generaciones y lo revela por pasos. Los datos del árbol
(`NODES`, `LINKS`) y qué se ve en cada paso (`STEPS`) están separados del dibujo, así que agregar
personas o pasos no toca la lógica de render.

El texto de cada paso vive en el HTML, no en el JS: sin JavaScript el caso se lee igual como artículo
y queda indexable.

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

> Es una representación didáctica, no a escala.
