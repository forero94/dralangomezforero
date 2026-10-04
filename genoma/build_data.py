"""Genera genome-data.js a partir de las bandas citogenéticas de UCSC y la anotación de GENCODE.

No es un paso de build del sitio: genome-data.js ya está en el repo y se publica tal cual.
Este script queda para poder regenerarlo cuando salga una versión nueva de GENCODE.

Fuentes (GRCh38 / hg38):
    curl -O https://hgdownload.soe.ucsc.edu/goldenPath/hg38/database/cytoBand.txt.gz
    curl -O https://ftp.ebi.ac.uk/pub/databases/gencode/Gencode_human/latest_release/gencode.v50.annotation.gtf.gz

Uso:
    python build_data.py cytoBand.txt.gz gencode.v50.annotation.gtf.gz > genome-data.js

Formato de salida, pensado para pesar poco y parsearse rápido:
    chroms[i].bands  [nombre, fin en bp, tinción]   tinción: índice en STAINS
    chroms[i].genes  "NOMBRE,inicio,largo;..."      ordenados por inicio; inicio como delta
                                                    respecto del gen anterior, ambos en base 36;
                                                    largo negativo = hebra menos
"""

import gzip
import json
import re
import sys

CHROMS = [str(i) for i in range(1, 23)] + ["X", "Y"]
STAINS = ["gneg", "gpos25", "gpos50", "gpos75", "gpos100", "acen", "gvar", "stalk"]


def opener(path):
    return gzip.open(path, "rt") if path.endswith(".gz") else open(path)


def b36(n):
    digits = "0123456789abcdefghijklmnopqrstuvwxyz"
    sign = "-" if n < 0 else ""
    n = abs(n)
    out = ""
    while True:
        n, r = divmod(n, 36)
        out = digits[r] + out
        if n == 0:
            return sign + out


def read_bands(path):
    bands = {c: [] for c in CHROMS}
    with opener(path) as f:
        for line in f:
            chrom, start, end, name, stain = line.rstrip("\n").split("\t")
            c = chrom.removeprefix("chr")
            if c in bands:
                bands[c].append((int(start), int(end), name, stain))
    for c in bands:
        bands[c].sort()
    return bands


def read_genes(path):
    name_re = re.compile(r'gene_name "([^"]+)"')
    genes = {c: [] for c in CHROMS}
    release = None
    with opener(path) as f:
        for line in f:
            if line.startswith("#"):
                m = re.search(r"version (\d+)", line)
                if m and release is None:
                    release = m.group(1)
                continue
            cols = line.split("\t", 8)
            if cols[2] != "gene" or 'gene_type "protein_coding"' not in cols[8]:
                continue
            c = cols[0].removeprefix("chr")
            if c not in genes:
                continue
            start, end = int(cols[3]), int(cols[4])
            name = name_re.search(cols[8]).group(1)
            genes[c].append((start, end, cols[6], name))
    for c in genes:
        genes[c].sort()
    return genes, release


def main(band_path, gtf_path):
    bands = read_bands(band_path)
    genes, release = read_genes(gtf_path)

    chroms = []
    for c in CHROMS:
        b = bands[c]
        prev = 0
        packed = []
        for start, end, strand, name in genes[c]:
            length = end - start + 1
            packed.append("%s,%s,%s" % (name, b36(start - prev), b36(length if strand == "+" else -length)))
            prev = start
        chroms.append({
            "n": c,
            "len": b[-1][1],
            "bands": [[name, end, STAINS.index(stain)] for _, end, name, stain in b],
            "genes": ";".join(packed),
        })

    data = {
        "assembly": "GRCh38",
        "gencode": release,
        "stains": STAINS,
        "chroms": chroms,
    }
    total = sum(len(genes[c]) for c in CHROMS)
    sys.stdout.write("// Generado por build_data.py. GRCh38: bandas de UCSC, genes codificantes de GENCODE v%s (%d).\n"
                     % (release, total))
    sys.stdout.write("window.GENOME_DATA = ")
    sys.stdout.write(json.dumps(data, separators=(",", ":")))
    sys.stdout.write(";\n")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
