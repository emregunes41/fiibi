import os
import subprocess

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.js') or file.endswith('.jsx'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                code = f.read()

            try:
                # Just compile it with python's compile() to check basic syntax block matching? No python syntax isn't JS.
                # We don't have node, right? Wait, node must exist if Vercel builds were local but they are on Vercel. 
                pass
            except Exception as e:
                print(e)
