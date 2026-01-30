import os

def fix_header(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    if not lines:
        return False
        
    modified = False
    
    # Check first line
    if lines[0].strip().startswith('/**'):
        # It's a block style XML comment used as header. Change to /*
        lines[0] = lines[0].replace('/**', '/*', 1)
        modified = True
    elif lines[0].strip().startswith('///'):
        # It's a triple slash XML comment used as header. Change to //
        # We need to change all contiguous /// lines at the start
        for i, line in enumerate(lines):
            if line.strip().startswith('///'):
                lines[i] = line.replace('///', '//', 1)
                modified = True
            elif line.strip() == '':
                continue
            else:
                break
                
    if modified:
        print(f"Fixing header in {filepath}")
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(lines)
            
    return modified

def process_directory(root_dir):
    count = 0
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith('.cs'):
                if fix_header(os.path.join(root, file)):
                    count += 1
    print(f"Fixed {count} files.")

if __name__ == '__main__':
    process_directory('backend')
