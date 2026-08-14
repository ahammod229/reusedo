import os

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
        
    lines = content.split('\n')
    new_lines = []
    for line in lines:
        if '@reusedo/database' in line:
            # Just replace with any for now, or comment out type import
            if 'import type' in line or 'import { type' in line:
                # Replace the import with an interface definition or generic any
                types = line.split('{')[1].split('}')[0].strip()
                for t in types.split(','):
                    t = t.strip()
                    if t:
                        new_lines.append(f"type {t} = any;")
            continue
        new_lines.append(line)
        
    new_content = '\n'.join(new_lines)
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Fixed {filepath}")

web_src = os.path.abspath('apps/web/src')
for root, _, files in os.walk(web_src):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            fix_file(os.path.join(root, file))
