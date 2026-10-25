import pytest
from backend.services.log_parser import LogParser, normalize_log_level, normalize_message_for_signature

def test_normalize_log_level():
    assert normalize_log_level("CRITICAL") == "CRITICAL"
    assert normalize_log_level("fatal") == "CRITICAL"
    assert normalize_log_level("ERROR") == "ERROR"
    assert normalize_log_level("warn") == "WARNING"
    assert normalize_log_level("info") == "INFO"
    assert normalize_log_level(None) == "INFO"

def test_message_signature_normalization():
    msg = "Worker failed connection to 192.168.1.55:8080 with uuid 123e4567-e89b-12d3-a456-426614174000 at 0x7fff5fbff8c0"
    sig = normalize_message_for_signature(msg)
    assert "<IP>" in sig
    assert "<UUID>" in sig
    assert "<HEX>" in sig

def test_empty_log_content():
    entries, counts, patterns = LogParser.parse_content("")
    assert len(entries) == 0
    assert counts["CRITICAL"] == 0
    assert len(patterns) == 0

def test_k8s_log_parsing():
    content = """2026-10-25T14:10:33.910Z [kernel] CRITICAL cgroup-v2 memory limit exceeded: Task killed by OOM-killer (exit code 137)
2026-10-25T14:10:34.001Z [kubelet] CRITICAL Container web-api in pod web-api-7b89d4c88-x2p9f terminated with exit code 137 (OOMKilled)
2026-10-25T14:10:55.500Z [kubelet] ERROR Pod web-api entered CrashLoopBackOff: back-off 40s restarting failed container
"""
    entries, counts, patterns = LogParser.parse_content(content)
    assert len(entries) == 3
    assert counts["CRITICAL"] == 2
    assert counts["ERROR"] == 1
    assert len(patterns) >= 2

def test_json_log_parsing():
    content = """{"timestamp": "2026-10-25T12:00:00Z", "level": "ERROR", "service": "auth-service", "message": "Failed to decode JWT token"}
{"timestamp": "2026-10-25T12:00:05Z", "level": "INFO", "service": "auth-service", "message": "Health check OK"}
"""
    entries, counts, patterns = LogParser.parse_content(content)
    assert len(entries) == 2
    assert counts["ERROR"] == 1
    assert counts["INFO"] == 1
    assert entries[0].service == "auth-service"

