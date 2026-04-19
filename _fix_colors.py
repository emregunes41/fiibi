import re, sys

def fix(path):
    with open(path) as f: c = f.read()
    o = c
    c = re.sub(r'rgba\(255,\s*255,\s*255,\s*0\.(\d+)\)', lambda m: f'color-mix(in srgb, var(--text) {int(float("0."+m.group(1))*100)}%, transparent)', c)
    c = c.replace('color: "#fff"', 'color: "var(--text)"')
    if c != o:
        with open(path,'w') as f: f.write(c)
        print(f'OK {path}')

for f in sys.argv[1:]: 
    try: fix(f)
    except: pass
