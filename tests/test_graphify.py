import os
import json
import pytest
from scripts.graphify import extract_graph

def test_extract_graph(tmp_path):
    test_file = tmp_path / "test.py"
    test_file.write_text("def my_func():\n    pass")
    
    graph = extract_graph([str(test_file)])
    assert "test.py" in graph["nodes"]
    assert "my_func" in graph["nodes"]["test.py"]["functions"]
