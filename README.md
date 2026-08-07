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
