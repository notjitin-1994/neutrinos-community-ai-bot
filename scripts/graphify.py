import ast
import json
import os
import sys

def extract_graph(file_paths):
    graph = {"nodes": {}}
    for path in file_paths:
        try:
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            tree = ast.parse(content)
            funcs = [node.name for node in ast.walk(tree) if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))]
            graph["nodes"][os.path.basename(path)] = {"functions": funcs, "content": content[:1000]}
        except Exception:
            continue
    return graph

if __name__ == "__main__":
    target_dir = os.path.join("src", "neutrinos_bot")
    if os.path.exists(target_dir):
        paths = [os.path.join(target_dir, f) for f in os.listdir(target_dir) if f.endswith(".py")]
    else:
        paths = []
    g = extract_graph(paths)
    out_dir = os.path.join("docs-frontend", "public")
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, "codebase_graph.json"), "w", encoding="utf-8") as f:
        json.dump(g, f, indent=2)
