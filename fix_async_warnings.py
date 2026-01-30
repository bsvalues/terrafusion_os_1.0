import re
import os
import subprocess

def get_build_warnings():
    # Run dotnet build and capture output
    print("Running build to capture warnings...")
    try:
        result = subprocess.run(
            ["dotnet", "build", "backend/TerraFusion.sln"],
            capture_output=True,
            text=True,
            check=False 
        )
        return result.stdout
    except Exception as e:
        print(f"Error running build: {e}")
        return ""

def fix_async_warnings(build_output):
    # Regex to find CS1998
    # Format: Path(Line,Col): warning CS1998: ...
    pattern = re.compile(r"([a-zA-Z]:[\\/][^(\r\n]+)\((\d+),\d+\): warning CS1998:")
    
    matches = pattern.findall(build_output)
    
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
                insertion_idx = idx
                
                # Look ahead a few lines (e.g., 5) to find the opening brace
                for offset in range(0, 10): 
                    if idx + offset >= len(content):
                        break
                    
                    line = content[idx + offset]
                    if '{' in line:
                        # Found it.
                        # Indentation calculation
                        indent_match = re.match(r"^\s*", content[idx + offset + 1] if idx + offset + 1 < len(content) else "")
                        indent = indent_match.group(0) if indent_match else "            "
                        
                        # Use indentation of the line with '{' + 4 spaces usually, 
                        # but safer to check next line. 
                        # If next line is '}', it's empty body.
                        
                        if '}' in line and '{' in line:
                            # Single line body { ... } - hard to insert cleanly without expanding
                            # Skip for now or handle explicitly?
                            # Example: public async Task Foo() { }
                            # Replacing `{ }` with `{ await Task.CompletedTask; }`
                           # print(f"Skipping single-line method at {line_idx} in {file_path}")
                           pass

                        elif line.strip() == '{':
                            # Standard case
                            # Check indentation of the bracket line
                            brace_indent_match = re.search(r"^(\s*)", line)
                            brace_indent = brace_indent_match.group(1) if brace_indent_match else ""
                            new_indent = brace_indent + "    "
                            
                            content.insert(idx + offset + 1, f"{new_indent}await Task.CompletedTask;\n")
                            modified = True
                            brace_found = True
                            break
                        elif '{' in line:
                             # Brace is at end of line like `public async Task Foo() {`
                            brace_indent_match = re.search(r"^(\s*)", line)
                            brace_indent = brace_indent_match.group(1) if brace_indent_match else ""
                            new_indent = brace_indent + "    "
                             
                            content.insert(idx + offset + 1, f"{new_indent}await Task.CompletedTask;\n")
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
    output = get_build_warnings()
    if output:
        fix_async_warnings(output)
    else:
        print("No output from build.")
