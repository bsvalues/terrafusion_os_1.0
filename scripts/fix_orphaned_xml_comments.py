import os
import re

def fix_orphaned_comments(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    if not lines:
        return False
        
    new_lines = []
    i = 0
    n = len(lines)
    modified = False
    
    while i < n:
        line = lines[i]
        stripped = line.strip()
        
        # Check for /// start
        if stripped.startswith('///'):
            comment_block_indices = []
            # Collect the block
            j = i
            while j < n and lines[j].strip().startswith('///'):
                comment_block_indices.append(j)
                j += 1
            
            # Now look ahead from j for the next meaningful line
            k = j
            next_meaningful_line = None
            while k < n:
                if lines[k].strip() == '':
                    k += 1
                    continue
                next_meaningful_line = lines[k].strip()
                break
            
            # Decide if we convert /// to //
            convert = False
            if next_meaningful_line:
                if (next_meaningful_line.startswith('using ') or 
                    next_meaningful_line.startswith('namespace ') or 
                    next_meaningful_line.startswith('#region') or
                    next_meaningful_line.startswith('#if') or
                    next_meaningful_line.startswith('#else') or
                    next_meaningful_line.startswith('#endif') or
                    next_meaningful_line.startswith('#nullable') or
                    next_meaningful_line.startswith('#pragma') or 
                    next_meaningful_line == '{' or
                    next_meaningful_line == '}'):
                    convert = True
            else:
                # End of file or just whitespace left
                convert = True
            
            if convert:
                modified = True
                for idx in comment_block_indices:
                    # preserve indentation, replace /// with //
                    new_lines.append(lines[idx].replace('///', '//', 1))
                i = j
            else:
                # Keep as is
                for idx in comment_block_indices:
                    new_lines.append(lines[idx])
                i = j
        
        else:
            new_lines.append(line)
            i += 1
            
    if modified:
        print(f"Fixing orphaned XML comments in {filepath}")
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
            
    return modified

def process_directory(root_dir):
    count = 0
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith('.cs'):
                if fix_orphaned_comments(os.path.join(root, file)):
                    count += 1
    print(f"Fixed {count} files.")

if __name__ == '__main__':
    process_directory('backend')
