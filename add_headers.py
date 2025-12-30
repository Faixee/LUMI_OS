import os

header_ts = """/**
 * LUMIX OS - Advanced Intelligence-First SMS
 * Created by: Faizain Murtuza
 * © 2025 Faizain Murtuza. All Rights Reserved.
 */
"""

header_py = '''"""
LUMIX OS - Advanced Intelligence-First SMS
Created by: Faizain Murtuza
© 2025 Faizain Murtuza. All Rights Reserved.
"""
'''

def add_header(file_path, header):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if "LUMIX OS" in content and "Faizain Murtuza" in content:
        print(f"Header already exists in {file_path}")
        return

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(header + "\n" + content)
    print(f"Added header to {file_path}")

def process_directory(directory, extensions, header):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if any(file.endswith(ext) for ext in extensions):
                file_path = os.path.join(root, file)
                add_header(file_path, header)

if __name__ == "__main__":
    # Add to root files
    root_files = ['App.tsx', 'index.tsx', 'types.ts', 'constants.ts', 'vite.config.ts']
    for file in root_files:
        if os.path.exists(file):
            add_header(file, header_ts)
            
    # Add to directories
    process_directory('components', ['.tsx', '.ts'], header_ts)
    process_directory('services', ['.tsx', '.ts'], header_ts)
    process_directory('backend', ['.py'], header_py)
