import re
import json
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional
from backend.models.schemas import LogEntrySchema, ErrorPattern

# Regex patterns for various log timestamp formats
TIMESTAMP_PATTERNS = [
    # ISO 8601 / RFC 3339: 2026-10-25T14:30:00.123Z or 2026-10-25 14:30:00,123
    re.compile(r"(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:[.,]\d+)?(?:Z|[+-]\d{2}:?\d{2})?)"),
    # Syslog: Oct 25 14:30:00 or 25/Oct/2026:14:30:00
    re.compile(r"([A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})"),
    re.compile(r"(\d{2}/[A-Z][a-z]{2}/\d{4}:\d{2}:\d{2}:\d{2}(?:\s+[+-]\d{4})?)"),
    # Simple Date: 2026/10/25 14:30:00
    re.compile(r"(\d{4}/\d{2}/\d{2}\s+\d{2}:\d{2}:\d{2})"),
]

# Regex patterns for severity levels
LEVEL_REGEX = re.compile(
    r"\b(CRITICAL|FATAL|PANIC|EMERGENCY|SEVERE|ERROR|ERR|WARN|WARNING|INFO|DEBUG|TRACE|NOTICE)\b",
    re.IGNORECASE
)

# Regex to detect service or component names
SERVICE_BRACKET_REGEX = re.compile(r"\[([a-zA-Z0-9_\-\.\/]+)\]")
SERVICE_COLON_REGEX = re.compile(r"\b([a-zA-Z0-9_\-]+(?:-service|-api|-worker|-job|-app|-pod|-db)?)\s*:\s")

def normalize_log_level(raw_level: Optional[str]) -> str:
    if not raw_level:
        return "INFO"
    l = raw_level.upper()
    if l in ("CRITICAL", "FATAL", "PANIC", "EMERGENCY", "SEVERE"):
        return "CRITICAL"
    if l in ("ERROR", "ERR", "EXCEPTION", "FAIL", "FAILED"):
        return "ERROR"
    if l in ("WARN", "WARNING"):
        return "WARNING"
    return "INFO"

def normalize_message_for_signature(msg: str) -> str:
    """
    Replaces dynamic tokens (IPs, UUIDs, hex memory, numbers, timestamps)
    with generic placeholders to cluster repeating error messages.
    """
    # Replace UUIDs
    s = re.sub(r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}", "<UUID>", msg)
    # Replace IPv4 and IPv6
    s = re.sub(r"\b(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?\b", "<IP>", s)
    s = re.sub(r"([0-9a-fA-F]{1,4}:){3,7}[0-9a-fA-F]{1,4}", "<IPV6>", s)
    # Replace Hex memory addresses like 0x7fff5fbff8c0
    s = re.sub(r"0x[0-9a-fA-F]+", "<HEX>", s)
    # Replace container hashes / commit hashes (long hex strings >= 10 chars)
    s = re.sub(r"\b[0-9a-fA-F]{10,64}\b", "<HASH>", s)
    # Replace dates/timestamps
    s = re.sub(r"\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:[.,]\d+)?(?:Z|[+-]\d{2}:?\d{2})?", "<TIMESTAMP>", s)
    # Replace standalone numbers (e.g. port, line numbers, IDs)
    s = re.sub(r"\b\d+\b", "<NUM>", s)
    # Replace quotes content if it contains paths or queries
    s = re.sub(r"\"[^\"]{25,}\"", "\"<STR>\"", s)
    # Collapse multiple whitespaces
    s = re.sub(r"\s+", " ", s).strip()
    return s[:250] # bound length for signature

class LogParser:
    """Robust multi-format log parser supporting JSON, Syslog, K8s, and Custom formats."""

    @staticmethod
    def parse_single_line(line: str, line_num: int) -> LogEntrySchema:
        raw = line.strip()
        if not raw:
            return LogEntrySchema(
                line_number=line_num,
                timestamp=None,
                level="INFO",
                service="general",
                message=""
            )

        # 1. Try parsing JSON structured log
        if raw.startswith("{") and raw.endswith("}"):
            try:
                data = json.loads(raw)
                timestamp = str(data.get("timestamp") or data.get("time") or data.get("@timestamp") or data.get("datetime") or "")
                raw_level = str(data.get("level") or data.get("severity") or data.get("levelname") or data.get("log_level") or "INFO")
                service = str(data.get("service") or data.get("app") or data.get("logger") or data.get("component") or data.get("container") or "application")
                message = str(data.get("message") or data.get("msg") or data.get("event") or raw)

                return LogEntrySchema(
                    line_number=line_num,
                    timestamp=timestamp if timestamp else None,
                    level=normalize_log_level(raw_level),
                    service=service,
                    message=message
                )
            except Exception:
                pass # Fall back to regex parsing

        # 2. Extract Timestamp via regex
        timestamp = None
        for pattern in TIMESTAMP_PATTERNS:
            match = pattern.search(raw)
            if match:
                timestamp = match.group(1)
                break

        # 3. Extract Level
        level_match = LEVEL_REGEX.search(raw)
        level = normalize_log_level(level_match.group(1) if level_match else None)

        # 4. Extract Service / Component
        service = "system"
        b_match = SERVICE_BRACKET_REGEX.search(raw)
        if b_match:
            candidate = b_match.group(1).strip()
            # ensure it's not the timestamp or level
            if candidate.upper() not in ("INFO", "WARN", "WARNING", "ERROR", "CRITICAL", "DEBUG") and len(candidate) < 40:
                service = candidate
        else:
            c_match = SERVICE_COLON_REGEX.search(raw)
            if c_match:
                candidate = c_match.group(1).strip()
                if candidate.upper() not in ("INFO", "WARN", "WARNING", "ERROR", "CRITICAL", "DEBUG") and len(candidate) < 40:
                    service = candidate

        # Clean message: if it had timestamp/level prefix, preserve message body
        msg = raw
        # Detect catastrophic keywords if level was defaulted to INFO
        if level == "INFO":
            upper_msg = raw.upper()
            if any(k in upper_msg for k in ["CRASHLOOPBACKOFF", "OOMKILLED", "PANIC:", "FATAL EXCEPTION", "DEADLOCK DETECTED"]):
                level = "CRITICAL"
            elif any(k in upper_msg for k in ["EXCEPTION", "FAILED TO CONNECT", "CONNECTION REFUSED", "TIMEOUT EXCEEDED", "STATUS 500", "HTTP 502", "HTTP 504"]):
                level = "ERROR"

        return LogEntrySchema(
            line_number=line_num,
            timestamp=timestamp,
            level=level,
            service=service,
            message=msg
        )

    @classmethod
    def parse_content(cls, content: str) -> Tuple[List[LogEntrySchema], Dict[str, int], List[ErrorPattern]]:
        """
        Parses multi-line log string or JSON array.
        Returns:
          - parsed_entries (list of LogEntrySchema)
          - level_counts (dict: INFO, WARNING, ERROR, CRITICAL)
          - patterns (list of clustered ErrorPattern objects)
        """
        lines = content.splitlines()
        entries: List[LogEntrySchema] = []
        level_counts = {"INFO": 0, "WARNING": 0, "ERROR": 0, "CRITICAL": 0}
        pattern_map: Dict[str, Dict[str, Any]] = {}

        # Handle empty file
        if not lines or (len(lines) == 1 and not lines[0].strip()):
            return [], level_counts, []

        # Check if entire content is a JSON array
        trimmed = content.strip()
        if trimmed.startswith("[") and trimmed.endswith("]"):
            try:
                items = json.loads(trimmed)
                if isinstance(items, list):
                    lines = [json.dumps(it) if isinstance(it, dict) else str(it) for it in items]
            except Exception:
                pass

        for idx, line in enumerate(lines, start=1):
            if not line.strip():
                continue
            entry = cls.parse_single_line(line, idx)
            entries.append(entry)
            level_counts[entry.level] = level_counts.get(entry.level, 0) + 1

            # Only cluster WARNING, ERROR, and CRITICAL patterns
            if entry.level in ("WARNING", "ERROR", "CRITICAL"):
                sig = normalize_message_for_signature(entry.message)
                if sig not in pattern_map:
                    pattern_map[sig] = {
                        "signature": sig,
                        "count": 0,
                        "level": entry.level,
                        "service": entry.service,
                        "sample": entry.message,
                        "first_seen": entry.timestamp,
                        "last_seen": entry.timestamp,
                    }
                pattern_map[sig]["count"] += 1
                pattern_map[sig]["last_seen"] = entry.timestamp or pattern_map[sig]["last_seen"]
                # Upgrade pattern level if a more severe instance appears
                if entry.level == "CRITICAL":
                    pattern_map[sig]["level"] = "CRITICAL"

        # Sort patterns by frequency and severity
        severity_weight = {"CRITICAL": 3, "ERROR": 2, "WARNING": 1, "INFO": 0}
        sorted_patterns = sorted(
            pattern_map.values(),
            key=lambda p: (severity_weight.get(p["level"], 0), p["count"]),
            reverse=True
        )

        patterns: List[ErrorPattern] = [
            ErrorPattern(
                signature=p["signature"],
                count=p["count"],
                level=p["level"],
                service=p["service"],
                sample=p["sample"],
                first_seen=p["first_seen"],
                last_seen=p["last_seen"]
            )
            for p in sorted_patterns
        ]

        return entries, level_counts, patterns

