import json, re
R = '/home/claude/worksheet-builder/src/blocks/'
res = json.load(open('/home/claude/krea/b8_traced.json'))
# name: (label, sound, theme, kind, syllables, size, moves)
META = {
 'arctic-fox': ('arctic fox', '', 'winter', 'animal', 3, 2, 'land'),
 'cardinal': ('cardinal', 'c', 'winter', 'animal', 3, 1, 'air'),
 'earmuffs': ('earmuffs', '', 'winter', 'clothes', 2, 2, None),
 'fireplace': ('fireplace', 'f', 'winter', 'home', 0, 4, None),
 'hockey': ('hockey stick', 'h', 'winter', 'toy', 3, 3, None),
 'hot-cocoa': ('hot cocoa', 'h', 'winter', 'food', 3, 2, None),
 'ice-skates': ('ice skates', '', 'winter', 'clothes', 2, 2, None),
 'icicles': ('icicles', '', 'winter', 'nature', 3, 2, None),
 'moose': ('moose', 'm', 'winter', 'animal', 1, 5, 'land'),
 'pine-tree': ('pine tree', 'p', 'winter', 'nature', 2, 5, None),
 'pinecone': ('pinecone', 'p', 'winter', 'nature', 2, 1, None),
 'skis': ('skis', '', 'winter', 'toy', 1, 4, None),
 'snow-globe': ('snow globe', '', 'winter', 'toy', 2, 2, None),
 'snow-shovel': ('snow shovel', '', 'winter', 'home', 3, 3, None),
 'snowballs': ('snowballs', '', 'winter', 'nature', 2, 1, None),
 'snowboard': ('snowboard', '', 'winter', 'toy', 2, 4, None),
 'toque': ('toque', 't', 'winter', 'clothes', 1, 2, None),
 'walrus': ('walrus', 'w', 'winter', 'animal', 2, 5, 'water'),
 'angel': ('angel', '', 'christmas', 'person', 2, 2, None),
 'candle': ('candle', 'c', 'christmas', 'home', 2, 1, None),
 'candy-cane': ('candy cane', 'c', 'christmas', 'food', 3, 2, None),
 'christmas-tree': ('Christmas tree', '', 'christmas', 'nature', 3, 5, None),
 'elf': ('elf', 'e', 'christmas', 'person', 1, 3, None),
 'gingerbread-house': ('gingerbread house', 'j', 'christmas', 'food', 4, 3, None),
 'gingerbread-man': ('gingerbread man', 'j', 'christmas', 'food', 4, 2, None),
 'holly': ('holly', 'h', 'christmas', 'nature', 2, 1, None),
 'lights': ('lights', 'l', 'christmas', 'home', 1, 2, None),
 'nutcracker': ('nutcracker', 'n', 'christmas', 'toy', 3, 3, None),
 'ornament': ('ornament', '', 'christmas', 'home', 3, 1, None),
 'poinsettia': ('poinsettia', 'p', 'christmas', 'nature', 0, 2, None),
 'reindeer': ('reindeer', 'r', 'christmas', 'animal', 2, 4, 'land'),
 'santa-hat': ('Santa hat', 's', 'christmas', 'clothes', 3, 2, None),
 'santa': ('Santa', 's', 'christmas', 'person', 2, 4, None),
 'sleigh': ('sleigh', '', 'christmas', 'vehicle', 1, 4, 'land'),
 'stocking': ('stocking', '', 'christmas', 'clothes', 2, 2, None),
 'wreath': ('wreath', 'r', 'christmas', 'home', 1, 3, None),
}
assert set(META) == {r[0] for r in res}, set(META) ^ {r[0] for r in res}
q = lambda n: n if re.fullmatch(r'[a-z]+', n) else "'%s'" % n
def add_to_record(src, recname, lines):
    i = src.index('export const ' + recname)
    j = src.index('\n};', i)
    return src[:j] + '\n' + '\n'.join(lines) + src[j:]
# pictureArt.ts
s = open(R + 'pictureArt.ts').read()
s = add_to_record(s, 'PICTURE_LINE', ['  %s: 1.4,' % q(n) for n, *_ in res])
s = add_to_record(s, 'PICTURE_BOTTOM', ['  %s: %s,' % (q(n), b) for n, p, k, b in res])
s = add_to_record(s, 'PICTURE_SHAPES', ["  %s: {\n    p: '%s',\n    k: '%s',\n  }," % (q(n), p, k) for n, p, k, b in res])
s = s.replace('("Builder Illustrations Redraw / Krea Batch 01-05")', '("Builder Illustrations Redraw / Krea Batch 01-05", winter and Christmas from Batch 08)')
open(R + 'pictureArt.ts', 'w').write(s)
# pictures.tsx: library entries
s = open(R + 'pictures.tsx').read()
lines = []
for n in sorted(META):
    l, snd = META[n][0], META[n][1]
    note = ' // blend, digraph or vowel that isn\'t short: left out of Beginning sounds' if snd == '' else ''
    lines.append("  %s: { label: '%s', sound: '%s' },%s" % (q(n), l, snd, note))
anchor = "  icecream: { label: 'ice cream'"
s = s.replace(anchor, '  // Winter and Christmas (Krea Batch 08)\n' + '\n'.join(lines) + '\n' + anchor, 1)
open(R + 'pictures.tsx', 'w').write(s)
# pictureTags.ts
s = open(R + 'pictureTags.ts').read()
s = s.replace("| 'toys' | 'go';", "| 'toys' | 'go' | 'winter' | 'christmas';", 1)
s = s.replace("| 'vehicle' | 'farm';", "| 'vehicle' | 'farm' | 'person';", 1)
s = s.replace(" *   k  kind: animal, fruit, veg, food, nature, home, clothes, toy, vehicle, farm", " *   k  kind: animal, fruit, veg, food, nature, home, clothes, toy, vehicle, farm, person")
tl = []
for n in sorted(list(META) + ['mitten', 'snowflake', 'snowman']):
    if n in META:
        _, _, t, k, sy, z, m = META[n]
    else:
        t, k, sy, z, m = {'mitten': ('winter', 'clothes', 2, 1, None), 'snowflake': ('winter', 'nature', 2, 1, None), 'snowman': ('winter', 'nature', 2, 4, None)}[n]
    tl.append("  %s: { t: '%s', k: '%s', s: %d, z: %d%s }," % (q(n), t, k, sy, z, ", m: '%s'" % m if m else ''))
s = add_to_record(s, 'PICTURE_TAGS', ['  // Winter and Christmas'] + tl)
open(R + 'pictureTags.ts', 'w').write(s)
# themes
s = open(R + 'pictureLibrary.ts').read()
s = s.replace("  { value: 'go', label: 'Things that go' },\n", "  { value: 'go', label: 'Things that go' },\n  { value: 'winter', label: 'Winter' },\n  { value: 'christmas', label: 'Christmas' },\n", 1)
open(R + 'pictureLibrary.ts', 'w').write(s)
print('ok')
