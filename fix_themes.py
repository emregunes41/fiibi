import os
import re

dirs_to_walk = ['src/components', 'src/app']

for root_dir, dirs, files in os.walk('.'):
    if not any(root_dir.startswith(f"./{d}") or root_dir == f"./{d}" for d in dirs_to_walk):
        continue
    
    for file in files:
        if file.endswith('.js') or file.endswith('.jsx'):
            path = os.path.join(root_dir, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original = content
            
            # Replace background: "#fff" with "var(--text)"
            content = re.sub(r'background:\s*"(?:#fff|#ffffff)"', 'background: "var(--text)"', content)
            content = re.sub(r'backgroundColor:\s*"(?:#fff|#ffffff)"', 'backgroundColor: "var(--text)"', content)
            
            # Replace border/solid #fff with var(--text)
            content = re.sub(r'border:\s*"(\d+)px\s+solid\s+(?:#fff|#ffffff)"', r'border: "\1px solid var(--text)"', content)
            # Sometimes used as ternary output like `sel ? "2px solid #fff" : ...`
            # The above covers 'border: "...#fff"' but if it's separate:
            # Let's just find exactly '"2px solid #fff"'
            content = content.replace('"2px solid #fff"', '"2px solid var(--text)"')
            content = content.replace('"1px solid #fff"', '"1px solid var(--text)"')
            
            # Replace color: "#000" with var(--bg)
            content = re.sub(r'color:\s*"(?:#000|#000000|#111|#111111)"', 'color: "var(--bg)"', content)

            if content != original:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Updated {path}")
