import os
import re

TARGET_DIR = r"applications\terra-permit\client\src"

def fix_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Skipping {filepath}: {e}")
        return
    
    original = content
    
    # Fix 1: <Tag\n</> className -> <Tag className
    # Looking for: start of tag, maybe attributes, newline, close-frag, className
    # Example: <p\n</> className
    # Example: <span\n</> className
    
    # Regex: (<[a-zA-Z0-9_]+)(\s*\n\s*</>)\s+([a-zA-Z\-]+)
    # Replaces with: \1 \3
    # Matches className, variant, value, href, onClick, etc.
    content = re.sub(r'(<[a-zA-Z0-9_]+)(\s*\n\s*</>)\s+([a-zA-Z\-]+)', r'\1 \3', content)
    
    # Fix 2: </>> -> >
    # Example: <div\n</>>
    content = content.replace('</>>', '>')
    
    # Fix main.tsx weirdness: <NotificationProvider><> -> <NotificationProvider>
    content = content.replace('<NotificationProvider><>', '<NotificationProvider>')
    
    # Fix Toaster weirdness: <Toaster\n</> /> -> <Toaster />
    content = re.sub(r'<Toaster\s*\n\s*</>\s*/>', '<Toaster />', content)

    # General pattern <Tag\n</> /> -> <Tag />
    content = re.sub(r'(<[a-zA-Z0-9_]+)\s*\n\s*</>\s*/>', r'\1 />', content)

    # Fix 3: Remove dangling open fragments "<>" on their own lines
    # This addresses "Unexpected closing Tag... does not match opening fragment tag"
    # We replace "<>\n" with empty string if it's on its own line (with whitespace)
    content = re.sub(r'^\s*<>\s*\n', '', content, flags=re.MULTILINE)

    if content != original:
        print(f"Fixed {filepath}")
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

print(f"Scanning {TARGET_DIR}...")
for root, dirs, files in os.walk(TARGET_DIR):
    for file in files:
        if file.endswith(".tsx"):
            fix_file(os.path.join(root, file))
print("Done.")
