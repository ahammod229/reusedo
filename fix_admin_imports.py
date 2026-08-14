import os

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
        
    replacements = {
        '@reusedo/ui': '@/shared/components/ui',
        '@reusedo/utils': '@/shared/utils',
        '@reusedo/logger': '@/shared/logger',
        '@reusedo/validation': '@/shared/validation',
        '@reusedo/types': '@/shared/types',
        '@reusedo/api-client': '@/services/api',
        '@reusedo/auth': '@/features/auth',
        '@/components': '@/shared/components/ui'
    }
    
    new_content = content
    for old, new in replacements.items():
        new_content = new_content.replace(old, new)
        
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Fixed {filepath}")

admin_src = os.path.abspath('apps/web/src/features/admin')
for root, _, files in os.walk(admin_src):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            fix_file(os.path.join(root, file))
