"""
Builds the Sunshine Print font files from the builder's handwriting model.

  npx esbuild scripts/build-fonts/export-glyphs.ts --bundle --platform=node --outfile=/tmp/sp.cjs
  node /tmp/sp.cjs glyphs.json
  python3 scripts/build-fonts/build_fonts.py glyphs.json fonts/

Makes:
  SunshinePrint-Regular.ttf  solid letters, the model to copy
  SunshinePrintDots-Regular.ttf  dotted letters to trace, with a big start dot on each
  SunshinePrintStarts-Regular.ttf  only the start dots: set the same text in black on top of Dots

Needs: pip install fonttools shapely
"""
import json, sys, os
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from shapely.geometry import LineString, Point, MultiPolygon, Polygon
from shapely.geometry.polygon import orient
from shapely.ops import unary_union

UPM = 1000
CAP = 700                 # top line to baseline, in font units
STROKE = 0.10 * CAP       # solid letter line weight
DOT_R = 0.048 * CAP       # trace dot radius
START_R = 0.085 * CAP     # start dot radius
GAP = 0.22 * CAP          # space between letters (matches the builder's LETTER_GAP)
VERSION = "1.000"

def to_font(pt):
    x, y = pt
    return (x * CAP, (1 - y) * CAP)

def shape_solid(g):
    parts = []
    for line in g["polylines"]:
        pts = [to_font(p) for p in line]
        if len(pts) == 1 or LineString(pts).length < 1:
            parts.append(Point(pts[0]).buffer(STROKE * 0.6, quad_segs=16))
        else:
            parts.append(LineString(pts).buffer(STROKE / 2, quad_segs=16, cap_style="round", join_style="round"))
    for p in g["dots"]:
        parts.append(Point(to_font(p)).buffer(STROKE * 0.6, quad_segs=16))
    return unary_union(parts), STROKE / 2

def shape_dots(g):
    parts = [Point(to_font(p)).buffer(DOT_R, quad_segs=12) for p in g["traceDots"]]
    parts.append(Point(to_font(g["start"])).buffer(START_R, quad_segs=16))
    return unary_union(parts), START_R

def shape_starts(g):
    # Only the start dot, with the same spacing as Dots, so a black copy can sit on top.
    _, ink_r = shape_dots(g)
    return Point(to_font(g["start"])).buffer(START_R, quad_segs=16), ink_r

def draw(geom, dx):
    pen = TTGlyphPen(None)
    polys = list(geom.geoms) if isinstance(geom, MultiPolygon) else [geom]
    for poly in polys:
        if poly.is_empty:
            continue
        poly = orient(poly.simplify(0.6), sign=-1.0)  # TrueType: outer contours clockwise
        for ring in [poly.exterior, *poly.interiors]:
            pts = [(round(x + dx), round(y)) for x, y in list(ring.coords)[:-1]]
            if len(pts) < 3:
                continue
            pen.moveTo(pts[0])
            for p in pts[1:]:
                pen.lineTo(p)
            pen.closePath()
    return pen.glyph()

def notdef():
    pen = TTGlyphPen(None)
    for ring in [[(50, 0), (50, CAP), (450, CAP), (450, 0)], [(100, 50), (400, 50), (400, CAP - 50), (100, CAP - 50)]]:
        pen.moveTo(ring[0]); [pen.lineTo(p) for p in ring[1:]]; pen.closePath()
    return pen.glyph()

def glyph_name(ch):
    names = {".": "period", ",": "comma", "!": "exclam", "?": "question", "'": "quotesingle", "-": "hyphen"}
    if ch in names: return names[ch]
    if ch.isdigit(): return ["zero","one","two","three","four","five","six","seven","eight","nine"][int(ch)]
    return ch

def build(data, family, style_fn, out):
    order = [".notdef", "space"]
    glyphs = {".notdef": notdef(), "space": TTGlyphPen(None).glyph()}
    metrics = {".notdef": (500, 50), "space": (round(data["spaceWidth"] * CAP - GAP), 0)}
    cmap = {32: "space"}
    for ch, g in data["glyphs"].items():
        geom, ink_r = style_fn(g)
        sb = GAP / 2
        dx = sb + ink_r
        name = glyph_name(ch)
        glyphs[name] = draw(geom, dx)
        adv = round(g["width"] * CAP + 2 * dx)
        metrics[name] = (adv, round(sb))
        cmap[ord(ch)] = name
        order.append(name)

    fb = FontBuilder(UPM, isTTF=True)
    fb.setupGlyphOrder(order)
    fb.setupCharacterMap(cmap)
    fb.setupGlyf(glyphs)
    # Recalculate left side bearings from the outlines.
    glyf = fb.font["glyf"]
    hmtx = {}
    for name in order:
        g = glyf[name]
        g.recalcBounds(glyf)
        hmtx[name] = (metrics[name][0], getattr(g, "xMin", 0))
    fb.setupHorizontalMetrics(hmtx)
    asc, desc = 920, -330
    fb.setupHorizontalHeader(ascent=asc, descent=desc)
    ps = family.replace(" ", "") + "-Regular"
    fb.setupNameTable({
        "familyName": family,
        "styleName": "Regular",
        "uniqueFontIdentifier": f"{ps};{VERSION}",
        "fullName": f"{family} Regular",
        "psName": ps,
        "version": f"Version {VERSION}",
        "copyright": "Copyright 2026 Sunshine Brigade. Learn. Wonder. Shine.",
        "designer": "Sunshine Brigade",
        "description": "Sunshine Print: a print handwriting model for children aged 3 to 5. "
                       "Letters drawn as pencil strokes, with start dots in the Dots style.",
    })
    fb.setupOS2(sTypoAscender=asc, sTypoDescender=desc, sTypoLineGap=0, usWinAscent=asc, usWinDescent=-desc,
                sxHeight=round(CAP / 2), sCapHeight=CAP, fsType=0, achVendID="SNBG")
    fb.setupPost()
    fb.font.save(out)
    print("wrote", out, len(order), "glyphs")

if __name__ == "__main__":
    data = json.load(open(sys.argv[1]))
    out = sys.argv[2]
    os.makedirs(out, exist_ok=True)
    build(data, "Sunshine Print", shape_solid, os.path.join(out, "SunshinePrint-Regular.ttf"))
    build(data, "Sunshine Print Dots", shape_dots, os.path.join(out, "SunshinePrintDots-Regular.ttf"))
    build(data, "Sunshine Print Starts", shape_starts, os.path.join(out, "SunshinePrintStarts-Regular.ttf"))
