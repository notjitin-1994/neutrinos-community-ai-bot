"""Tests for config loading from .env."""

import os
import shutil
from pathlib import Path

import pytest


def test_config_loads_from_env():
    """Settings load successfully when .env is present with valid values."""
    from neutrinos_bot.config import Settings

    settings = Settings()
    assert settings.discourse_base_url.startswith("https://")
    assert settings.discourse_api_key
    assert settings.discourse_api_username
    assert settings.nvidia_base_url == "https://integrate.api.nvidia.com/v1"
    assert settings.nvidia_embed_model == "nvidia/nv-embed-v1"
    assert settings.nvidia_gen_model == "nvidia/llama-3.1-70b-instruct"
    assert settings.rate_limit_rpm == 30
    assert settings.sla_window_minutes == 5
    assert settings.confidence_threshold == 0.35


def test_config_defaults():
    """Defaults are applied for optional fields."""
    from neutrinos_bot.config import Settings

    settings = Settings()
    assert settings.sla_grace_minutes == 10
    assert settings.state_db_path == "state.db"
    assert settings.chroma_persist_dir == "chroma"


def test_config_missing_required_raises():
    """Missing required fields raises ValidationError."""
    from pydantic import ValidationError

    from neutrinos_bot.config import Settings

    old_env = dict(os.environ)
    for key in list(os.environ.keys()):
        if any(k in key.upper() for k in ["DISCOURSE", "NVIDIA"]):
            del os.environ[key]

    env_path = Path(".env")
    backup_path = Path(".env.test-backup")
    env_existed = env_path.exists()
    if env_existed:
        shutil.move(str(env_path), str(backup_path))

    try:
        with pytest.raises(ValidationError):
            Settings()
    finally:
        if env_existed and backup_path.exists():
            shutil.move(str(backup_path), str(env_path))
        os.environ.clear()
        os.environ.update(old_env)


def test_get_settings_cached():
    """get_settings returns the same cached instance."""
    from neutrinos_bot.config import get_settings

    get_settings.cache_clear()
    s1 = get_settings()
    s2 = get_settings()
    assert s1 is s2
