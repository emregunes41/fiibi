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
            
            # Cases like: isSelected ? "#fff" : ...
            # background: sel ? "#fff" : ...
            content = re.sub(r'\?\s*"(?:#fff|#ffffff)"', '? "var(--text)"', content)
            content = re.sub(r'\?\s*\'(?:#fff|#ffffff)\'', "? 'var(--text)'", content)
            
            content = re.sub(r'\?\s*"(?:#000|#000000|#111|#111111)"', '? "var(--bg)"', content)
            content = re.sub(r'\?\s*\'(?:#000|#000000|#111|#111111)\'', "? 'var(--bg)'", content)
            
            content = re.sub(r':\s*"(?:#fff|#ffffff)"', ': "var(--text)"', content)
            content = re.sub(r':\s*\'(?:#fff|#ffffff)\'', ": 'var(--text)'", content)
            
            content = re.sub(r':\s*"(?:#000|#000000|#111|#111111)"', ': "var(--bg)"', content)
            content = re.sub(r':\s*\'(?:#000|#000000|#111|#111111)\'', ": 'var(--bg)'", content)
            
            # Revert unintentional object keys like `border: "var(--text)"` if we messed up earlier? No, the previous script changed `background: "#fff"` to `background: "var(--text)"` which is fine.
            # But the new regex `: "#fff"` -> `: "var(--text)"` covers that.

            if content != original:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Updated {path}")
