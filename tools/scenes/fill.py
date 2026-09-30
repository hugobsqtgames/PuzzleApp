# Adds real props where rooms lack lantern places (see free.ts), until the audit passes.
import json, re, subprocess
OUT = {'deck': ('Q.buoy', 'P.hang'), 'pond': ('Q.buoy', 'P.hang'), 'garden': ('Q.pot', 'P.hang'), 'balcony': ('P.plant', 'P.hang'), 'glass': ('Q.pot', 'P.hang')}
for it in range(8):
    res = subprocess.run(['npx', 'tsx', '../tools/scenes/free.ts'], capture_output=True, text=True).stdout.strip().splitlines()
    if not res: break
    for line in res:
        rid, arch = line.split()[0], line.split()[1]
        wall = json.loads(line.split('wall ')[1].split(' floor')[0]); floor = json.loads(line.split('floor ')[1])
        fp, wp = OUT.get(arch, ('P.candle', 'P.sconce'))
        if floor: prop = f"[{fp}, {floor[0][0]}, {floor[0][1]}, 0.9]"
        elif wall: prop = f"[{wp}, {wall[0][0]}, {wall[0][1] if wp == 'P.sconce' else wall[0][1] - 18}]"
        else: print('no spot', rid); continue
        for f in ['a', 'b', 'c', 'd']:
            p = f'src/ui/scenes/rooms-{f}.ts'; s = open(p).read()
            i = s.find(f"'{rid}':")
            if i < 0: continue
            j = s.find('props: [', i); k = s.find(']],', j)
            s = s[:k + 1] + ', ' + prop + s[k + 1:]
            open(p, 'w').write(s); print('added', rid, prop); break
