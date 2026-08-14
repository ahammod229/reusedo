import os

def get_relative_prefix(filepath, base_dir):
    depth = filepath.replace(base_dir, '').count(os.sep) - 1
    if depth <= 0:
        return './'
    return '../' * depth

def fix_file(filepath, base_dir):
    with open(filepath, 'r') as f:
        content = f.read()
    
    prefix = get_relative_prefix(filepath, base_dir)
    
    replacements = {
        '@reusedo/database': f'{prefix}database',
        '@reusedo/validation': f'{prefix}shared/validation',
        '@reusedo/types': f'{prefix}shared/types',
        '@reusedo/logger': f'{prefix}shared/logger'
    }
    
    new_content = content
    for old, new in replacements.items():
        new_content = new_content.replace(old, new)
        
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Fixed {filepath}")

api_src = os.path.abspath('apps/api/src')
for root, _, files in os.walk(api_src):
    for file in files:
        if file.endswith('.ts'):
            fix_file(os.path.join(root, file), api_src)

