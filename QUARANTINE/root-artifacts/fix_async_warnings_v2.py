import re
import os
import sys

def get_build_warnings_from_file(filename="build_output.txt"):
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"Error reading {filename}: {e}")
        return ""

def fix_async_warnings(build_output):
    # Regex to find CS1998
    # Format: Path(Line,Col): warning CS1998: ...
    pattern = re.compile(r"([a-zA-Z]:[\\/][^(\r\n]+)\((\d+),\d+\): warning CS1998:")
    
    matches = pattern.findall(build_output)
    print(f"Found {len(matches)} CS1998 warnings.")
    
    # Group by file to handle multiple warnings per file efficiently
    files_to_fix = {}
    for file_path, line_num in matches:
        if file_path not in files_to_fix:
            files_to_fix[file_path] = []
        files_to_fix[file_path].append(int(line_num))
    
    for file_path, lines in files_to_fix.items():
        print(f"Processing {file_path}...")
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.readlines()
            
            # Sort lines in descending order to avoid offsetting indices when inserting
            lines.sort(reverse=True)
            
            modified = False
            for line_idx in lines:
                # Line numbers are 1-based, list is 0-based
                idx = line_idx - 1
                
                # Check if it's already fixed (simple check)
                if idx + 1 < len(content) and "await Task.CompletedTask;" in content[idx+1]:
                    continue
                
                # Find the opening brace of the method.
                # The warning points to the method signature line.
                # We need to insert `await Task.CompletedTask;` after `{`.
                
                # Search forward from the warning line to find `{`
                brace_found = False
                
                # Look ahead a few lines (e.g., 20) to find the opening brace
                for offset in range(0, 20): 
                    if idx + offset >= len(content):
                        break
                    
                    line = content[idx + offset]
                    
                    # Check for single line body { }
                    if '{' in line and '}' in line and line.rfind('}') > line.find('{'):
                         # Handle inline body: e.g. { return; }  -> { await Task.CompletedTask; return; }
                        open_brace_idx = line.find('{')
                        content[idx + offset] = line[:open_brace_idx+1] + " await Task.CompletedTask; " + line[open_brace_idx+1:]
                        modified = True
                        brace_found = True
                        break

                    if '{' in line:
                        # Found open brace
                        brace_indent_match = re.search(r"^(\s*)", line)
                        
                        # Try to infer indentation from the next line if possible
                        next_line_indent = "    " # Default
                        if idx + offset + 1 < len(content):
                             next_match = re.match(r"^(\s+)\S", content[idx + offset + 1])
                             if next_match:
                                 next_line_indent = next_match.group(1)
                             else:
                                 # Fallback: brace indent + 4 spaces
                                 if brace_indent_match:
                                     next_line_indent = brace_indent_match.group(1) + "    "
                        else:
                             if brace_indent_match:
                                 next_line_indent = brace_indent_match.group(1) + "    "

                        content.insert(idx + offset + 1, f"{next_line_indent}await Task.CompletedTask;\n")
                        modified = True
                        brace_found = True
                        break
                
                if not brace_found:
                    print(f"Could not find opening brace for warning at line {line_idx}")

            if modified:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.writelines(content)
                print(f"Updated {file_path}")

        except Exception as e:
            print(f"Failed to process {file_path}: {e}")

if __name__ == "__main__":
    # Prefer reading file argument, or default to build_output.txt
    filename = "build_output.txt"
    if len(sys.argv) > 1:
        filename = sys.argv[1]
        
    print(f"Reading warnings from {filename}...")
    output = get_build_warnings_from_file(filename)
    if output:
        fix_async_warnings(output)
    else:
        print("No output found or empty file.")
