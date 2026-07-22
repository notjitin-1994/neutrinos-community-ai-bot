import os
import json
import pytest
from scripts.graphify import extract_graph

def test_extract_graph(tmp_path):
    test_file = tmp_path / "test.py"
    test_file.write_text("def my_func():\n    pass")
    
    graph = extract_graph([str(test_file)], root_dir=str(tmp_path))
    rel_path = os.path.relpath(str(test_file), start=str(tmp_path))
    assert rel_path in graph["nodes"]
    assert "my_func" in graph["nodes"][rel_path]["functions"]

def test_extract_async_function(tmp_path):
    test_file = tmp_path / "async_test.py"
    test_file.write_text("async def my_async_func():\n    pass")
    
    graph = extract_graph([str(test_file)], root_dir=str(tmp_path))
    rel_path = os.path.relpath(str(test_file), start=str(tmp_path))
    assert rel_path in graph["nodes"]
    assert "my_async_func" in graph["nodes"][rel_path]["functions"]

