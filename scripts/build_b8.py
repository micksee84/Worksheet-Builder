"""Trace Batch 08 (winter + Christmas) into pictureArt.ts."""
import sys, glob, os, json, re
sys.path.insert(0, '/home/claude/krea')
from concurrent.futures import ProcessPoolExecutor
from svgelements import Path
SRC = '/mnt/user-data/outputs/b8'
def work(f):
    from trace_art import trace
    name = os.path.basename(f)[:-4].split('_', 1)[1]
    p, k = trace(f, (50, 50, 80, 'centre'))
    bb = Path(k).bbox()
    return name, p, k, round(bb[3], 1)
if __name__ == '__main__':
    files = sorted(glob.glob(SRC + '/2*.png'))
    with ProcessPoolExecutor() as ex:
        res = list(ex.map(work, files))
    json.dump(res, open('/home/claude/krea/b8_traced.json', 'w'))
    print(len(res), [(r[0], r[3]) for r in res][:5])
