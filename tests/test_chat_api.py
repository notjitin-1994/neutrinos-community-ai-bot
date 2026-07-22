import os
import subprocess
import pytest

def test_chat_api_route_exists():
    route_path = os.path.join("docs-frontend", "src", "app", "api", "chat", "route.ts")
    assert os.path.exists(route_path), "route.ts should exist"

def test_chat_api_route_tests_pass():
    res = subprocess.run(
        ["npx", "tsx", "--test", "src/app/api/chat/route.test.ts"],
        cwd="docs-frontend",
        capture_output=True,
        text=True
    )
    assert res.returncode == 0, f"Node test failed:\n{res.stdout}\n{res.stderr}"
