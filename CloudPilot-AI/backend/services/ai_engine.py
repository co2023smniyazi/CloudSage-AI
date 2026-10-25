import json
import logging
from typing import List, Dict, Any, Tuple, Optional
import httpx
from backend.core.config import settings
from backend.models.schemas import ErrorPattern, ActionableStep

logger = logging.getLogger("cloudpilot.ai")

class AIEngine:
    """
    Intelligent Cloud Operations Analysis Engine.
    Operates in dual mode:
    - AI-Powered: Uses Gemini or OpenAI when credentials are present.
    - Rule-Based Heuristic Expert System: Deterministic, deep root-cause analysis
      with verified mitigation steps when running offline or without API keys.
    """

    @classmethod
    async def analyze(
        cls,
        total_lines: int,
        level_counts: Dict[str, int],
        patterns: List[ErrorPattern],
        raw_snippet: str,
        risk_score: int,
        risk_level: str
    ) -> Dict[str, Any]:
        # Check if AI provider credentials exist
        if settings.GEMINI_API_KEY:
            try:
                ai_result = await cls._call_gemini(total_lines, level_counts, patterns, raw_snippet, risk_score, risk_level)
                if ai_result:
                    return ai_result
            except Exception as e:
                logger.warning(f"Gemini API invocation failed ({e}), falling back to Rule-Based Expert Engine.")

        if settings.OPENAI_API_KEY:
            try:
                ai_result = await cls._call_openai(total_lines, level_counts, patterns, raw_snippet, risk_score, risk_level)
                if ai_result:
                    return ai_result
            except Exception as e:
                logger.warning(f"OpenAI API invocation failed ({e}), falling back to Rule-Based Expert Engine.")

        # Default fallback to the Rule-Based Expert Engine
        return cls._rule_based_expert_analysis(total_lines, level_counts, patterns, risk_score, risk_level)

    @classmethod
    def _rule_based_expert_analysis(
        cls,
        total_lines: int,
        level_counts: Dict[str, int],
        patterns: List[ErrorPattern],
        risk_score: int,
        risk_level: str
    ) -> Dict[str, Any]:
        critical_count = level_counts.get("CRITICAL", 0)
        error_count = level_counts.get("ERROR", 0)
        warning_count = level_counts.get("WARNING", 0)

        # Handle nominal / healthy state
        if critical_count == 0 and error_count == 0:
            return {
                "explanation_mode": "Rule-Based Heuristic",
                "summary": "Infrastructure telemetry exhibits healthy operating characteristics. No critical panics, system crashes, or unhandled application errors were detected across all parsed log streams.",
                "root_cause": "Nominal system operation; steady-state heartbeat and standard request routing.",
                "impact_assessment": "Zero operational disruption. Systems are responding within expected service level objectives (SLO).",
                "confidence_score": 95,
                "confirmed_observations": [
                    f"Parsed {total_lines} log lines without discovering unhandled stack traces.",
                    f"Zero critical faults and zero unhandled server error codes (5xx) detected.",
                    "Heartbeat and routine transaction processing remain stable."
                ],
                "heuristic_hypotheses": [
                    "Underlying resource utilization (CPU, memory, disk I/O) appears to be within normal operating thresholds."
                ],
                "recommendations": [
                    ActionableStep(
                        step_number=1,
                        title="Maintain Standard Observability",
                        command_or_action="Ensure continuous metric collection and scheduled snapshot backups are active.",
                        rationale="Keeps baseline telemetry current for anomaly detection."
                    )
                ]
            }

        # Analyze patterns for specific cloud infrastructure failures
        matched_text = " ".join([p.sample.lower() + " " + p.signature.lower() for p in patterns])

        # 1. Kubernetes OOMKilled / CrashLoopBackOff
        if "oomkilled" in matched_text or "crashloopbackoff" in matched_text or "exit code 137" in matched_text:
            return {
                "explanation_mode": "Rule-Based Heuristic",
                "summary": "Kubernetes pod is repeatedly crashing and failing liveness checks due to Linux cgroup memory limit enforcement (Exit Code 137 / OOMKilled). The container runtime has placed the pod into CrashLoopBackOff with exponential retry delay.",
                "root_cause": "Process memory allocation exceeded container spec limit, triggering the kernel Out-Of-Memory Killer.",
                "impact_assessment": "High availability degradation. Ingress traffic to affected endpoints experiences 502/503 errors; downstream consumers face elevated retry latency.",
                "confidence_score": 92,
                "confirmed_observations": [
                    f"Container terminated with OOM / CrashLoopBackOff across {critical_count + error_count} recurring events.",
                    "Process terminated abruptly without graceful SIGTERM shutdown."
                ],
                "heuristic_hypotheses": [
                    "Application may have experienced a memory leak or a sudden burst of high-concurrency payload processing.",
                    "Container memory request/limit is likely set too low for peak transactional throughput."
                ],
                "recommendations": [
                    ActionableStep(
                        step_number=1,
                        title="Inspect Pod Termination Reason",
                        command_or_action="kubectl describe pod <pod-name> -n <namespace> | grep -A 10 'Last State:'",
                        rationale="Confirms whether Exit Code was 137 (OOM) or 1/255 (application exception)."
                    ),
                    ActionableStep(
                        step_number=2,
                        title="Review Memory Utilization Baseline",
                        command_or_action="kubectl top pod <pod-name> --containers",
                        rationale="Measures actual memory consumption against container resource limits."
                    ),
                    ActionableStep(
                        step_number=3,
                        title="Increase Container Memory Limits in Deployment",
                        command_or_action="kubectl patch deployment <deployment-name> -p '{\"spec\":{\"template\":{\"spec\":{\"containers\":[{\"name\":\"<container>\",\"resources\":{\"limits\":{\"memory\":\"2Gi\"},\"requests\":{\"memory\":\"1Gi\"}}}]}}}}'",
                        rationale="Supplies sufficient operating headroom to stabilize the pod while root cause profiling occurs."
                    )
                ]
            }

        # 2. Database Connection Pool Exhaustion / Deadlock
        if "connection pool" in matched_text or "too many connections" in matched_text or "deadlock detected" in matched_text or "pg_stat_activity" in matched_text:
            return {
                "explanation_mode": "Rule-Based Heuristic",
                "summary": "Application database connection pool has been completely exhausted. New database client queries are queuing indefinitely or timing out, causing cascading failures in the API layer.",
                "root_cause": "Slow, unindexed SQL queries or unclosed database sessions holding pool slots beyond pool timeout limits (max_connections reached).",
                "impact_assessment": "Severe database bottleneck. Client HTTP requests block until timeout, causing cascading 504 Gateway Timeouts across upstream services.",
                "confidence_score": 88,
                "confirmed_observations": [
                    f"Pool exhaustion errors logged {error_count} times in the analyzed log stream.",
                    "Database driver reported connection acquisition timeout."
                ],
                "heuristic_hypotheses": [
                    "A recent batch job or long-running report query locked critical rows.",
                    "Application code may be leaking connections by missing session.close() or try/finally cleanup blocks."
                ],
                "recommendations": [
                    ActionableStep(
                        step_number=1,
                        title="Audit Active Database Transactions",
                        command_or_action="SELECT pid, age(clock_timestamp(), query_start), state, query FROM pg_stat_activity WHERE state != 'idle' ORDER BY query_start ASC LIMIT 10;",
                        rationale="Identifies long-running or blocking queries holding pool connections open."
                    ),
                    ActionableStep(
                        step_number=2,
                        title="Terminate Leaked or Orphaned Backends",
                        command_or_action="SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle in transaction' AND query_start < NOW() - INTERVAL '5 minutes';",
                        rationale="Immediately restores available worker connections to the application pool."
                    ),
                    ActionableStep(
                        step_number=3,
                        title="Enable Connection Pool Bounding / PgBouncer",
                        command_or_action="Review pool max_size in application config and verify connection timeout is set <= 5000ms.",
                        rationale="Prevents client requests from stacking up indefinitely under load."
                    )
                ]
            }

        # 3. Authentication & Microservice Gateway Timeout
        if "jwt" in matched_text or "unauthorized" in matched_text or "gateway timeout" in matched_text or "504" in matched_text or "auth-service" in matched_text:
            return {
                "explanation_mode": "Rule-Based Heuristic",
                "summary": "Upstream API Gateway is experiencing severe timeout degradation communicating with the identity/auth microservice. Requests fail with HTTP 504 Gateway Timeout or repeated token validation errors.",
                "root_cause": "Authentication microservice latency spike, expired JWKS key rotation cache, or network saturation between gateway and auth service.",
                "impact_assessment": "Direct user impact: incoming user sessions are rejected, public API calls fail with 401/504, checkout/login workflows halted.",
                "confidence_score": 85,
                "confirmed_observations": [
                    f"Encountered repeated HTTP 504 / Auth failures across {error_count + warning_count} events.",
                    "Client connections dropped after exceeding default reverse proxy timeout."
                ],
                "heuristic_hypotheses": [
                    "Auth service database or Redis session store may be throttled.",
                    "A distributed denial of service or credential stuffing attack could be overwhelming the login endpoint."
                ],
                "recommendations": [
                    ActionableStep(
                        step_number=1,
                        title="Check Identity Service Health & Logs",
                        command_or_action="curl -I http://auth-service.internal:8080/health && kubectl logs -l app=auth-service --tail=100",
                        rationale="Verifies whether the identity service is healthy and logging errors."
                    ),
                    ActionableStep(
                        step_number=2,
                        title="Verify JWKS & Public Key Cache Validity",
                        command_or_action="curl -s https://auth.domain.com/.well-known/jwks.json | jq .",
                        rationale="Ensures public keys have not expired and DNS resolves correctly."
                    ),
                    ActionableStep(
                        step_number=3,
                        title="Temporarily Adjust Proxy Timeout Threshold",
                        command_or_action="proxy_read_timeout 15s; proxy_connect_timeout 5s; in nginx/ingress configuration",
                        rationale="Prevents immediate 504 aborts while investigating backend auth latency."
                    )
                ]
            }

        # 4. Storage / Disk Pressure / Read-Only Filesystem
        if "disk" in matched_text or "no space" in matched_text or "read-only" in matched_text or "enospc" in matched_text:
            return {
                "explanation_mode": "Rule-Based Heuristic",
                "summary": "Storage volume exhaustion or host node disk pressure detected. Write operations are failing with ENOSPC or the operating system has remounted the filesystem as Read-Only to protect data integrity.",
                "root_cause": "Log file accumulation, unpruned container images, or unconstrained database temp table generation filled the root or data partition (100% inode or block usage).",
                "impact_assessment": "Imminent system halt. New writes, log output, and temp file creation fail, resulting in crash loops across multiple co-located containers.",
                "confidence_score": 90,
                "confirmed_observations": [
                    "Filesystem write errors and disk capacity warnings observed.",
                    "Persistence layer failed during write/commit operations."
                ],
                "heuristic_hypotheses": [
                    "Docker/containerd storage directory (/var/lib/docker) saturated with dangling images.",
                    "Application logging level was left in TRACE/DEBUG without logrotate."
                ],
                "recommendations": [
                    ActionableStep(
                        step_number=1,
                        title="Audit Filesystem Block and Inode Usage",
                        command_or_action="df -h && df -i",
                        rationale="Pinpoints which specific mount point or volume has exhausted capacity."
                    ),
                    ActionableStep(
                        step_number=2,
                        title="Prune Stale Container Images and Build Cache",
                        command_or_action="docker system prune -af --volumes",
                        rationale="Rapidly reclaims tens of gigabytes of disk space on container hosts."
                    ),
                    ActionableStep(
                        step_number=3,
                        title="Clean Log Accumulations & Rotate",
                        command_or_action="journalctl --vacuum-time=2d && find /var/log -type f -name '*.gz' -delete",
                        rationale="Frees critical disk space to restore service read-write access."
                    )
                ]
            }

        # 5. General Error Cascade (Default Heuristic)
        return {
            "explanation_mode": "Rule-Based Heuristic",
            "summary": f"Detected operational anomaly with {critical_count} critical failures, {error_count} application errors, and {warning_count} warnings. Service components exhibit elevated exception rates requiring targeted remediation.",
            "root_cause": f"Systemic exceptions observed in top error signatures: {patterns[0].signature if patterns else 'unclassified error stream'}.",
            "impact_assessment": f"Risk assessment score is {risk_score}/100 ({risk_level}). Operational stability is degraded; users may experience intermittent failures or degraded throughput.",
            "confidence_score": 80,
            "confirmed_observations": [
                f"Recorded {error_count + critical_count} total error-grade log records.",
                f"Most frequent error pattern detected {patterns[0].count if patterns else 0} times."
            ],
            "heuristic_hypotheses": [
                "Underlying root cause appears tied to network connectivity, configuration mismatches, or resource contention.",
                "Error clustering indicates recurring failure rather than isolated transient packet loss."
            ],
            "recommendations": [
                ActionableStep(
                    step_number=1,
                    title="Trace Primary Error Signature",
                    command_or_action=f"Review stack trace for '{patterns[0].sample[:60] if patterns else 'primary error'}'",
                    rationale="Pinpoints the exact file, line, and exception type triggering failures."
                ),
                ActionableStep(
                    step_number=2,
                    title="Audit Recent Deployments & Configurations",
                    command_or_action="git log -n 5 --stat && kubectl rollout history deployment",
                    rationale="Verifies whether recent code releases or config map changes introduced regression."
                ),
                ActionableStep(
                    step_number=3,
                    title="Correlate Network & Dependency Latencies",
                    command_or_action="netstat -s || ss -s",
                    rationale="Checks for socket queue overflows and TCP retransmission spikes."
                )
            ]
        }

    @classmethod
    async def _call_gemini(
        cls,
        total_lines: int,
        level_counts: Dict[str, int],
        patterns: List[ErrorPattern],
        raw_snippet: str,
        risk_score: int,
        risk_level: str
    ) -> Optional[Dict[str, Any]]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
        pattern_samples = [{"count": p.count, "level": p.level, "service": p.service, "signature": p.signature} for p in patterns[:5]]

        prompt = f"""You are a Cloud Infrastructure SRE Expert. Analyze these cloud operational logs:
Total Lines: {total_lines}
Level Counts: {json.dumps(level_counts)}
Computed Risk: {risk_score}/100 ({risk_level})
Top Clustered Patterns: {json.dumps(pattern_samples)}
Log Sample:
{raw_snippet[:2000]}

Return STRICT JSON matching this schema:
{{
  "summary": "Plain-English executive summary (2-3 sentences)",
  "root_cause": "Primary technical root cause",
  "impact_assessment": "Operational and business impact assessment",
  "confidence_score": 85,
  "confirmed_observations": ["Concrete fact 1 from logs", "Concrete fact 2 from logs"],
  "heuristic_hypotheses": ["Reasoned hypothesis 1", "Reasoned hypothesis 2"],
  "recommendations": [
    {{"step_number": 1, "title": "Step title", "command_or_action": "Exact shell or kubectl command", "rationale": "Why this fixes it"}},
    {{"step_number": 2, "title": "Step title", "command_or_action": "Exact command", "rationale": "Why this fixes it"}}
  ]
}}
"""
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"response_mime_type": "application/json"}
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                parsed = json.loads(text)
                recs = [ActionableStep(**r) for r in parsed.get("recommendations", [])]
                return {
                    "explanation_mode": "AI-Powered (Gemini)",
                    "summary": parsed.get("summary", ""),
                    "root_cause": parsed.get("root_cause", ""),
                    "impact_assessment": parsed.get("impact_assessment", ""),
                    "confidence_score": parsed.get("confidence_score", 90),
                    "confirmed_observations": parsed.get("confirmed_observations", []),
                    "heuristic_hypotheses": parsed.get("heuristic_hypotheses", []),
                    "recommendations": recs
                }
        return None

    @classmethod
    async def _call_openai(
        cls,
        total_lines: int,
        level_counts: Dict[str, int],
        patterns: List[ErrorPattern],
        raw_snippet: str,
        risk_score: int,
        risk_level: str
    ) -> Optional[Dict[str, Any]]:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        pattern_samples = [{"count": p.count, "level": p.level, "service": p.service, "signature": p.signature} for p in patterns[:5]]
        prompt = f"""You are a Cloud Infrastructure SRE Expert. Analyze these cloud operational logs:
Total Lines: {total_lines}
Level Counts: {json.dumps(level_counts)}
Computed Risk: {risk_score}/100 ({risk_level})
Top Patterns: {json.dumps(pattern_samples)}
Log Snippet:
{raw_snippet[:2000]}

Return STRICT JSON:
{{
  "summary": "Plain-English executive summary",
  "root_cause": "Primary technical root cause",
  "impact_assessment": "Operational and business impact",
  "confidence_score": 88,
  "confirmed_observations": ["Fact 1", "Fact 2"],
  "heuristic_hypotheses": ["Hypothesis 1"],
  "recommendations": [
    {{"step_number": 1, "title": "Step title", "command_or_action": "Command or action", "rationale": "Rationale"}}
  ]
}}
"""
        payload = {
            "model": "gpt-4o-mini",
            "messages": [{"role": "user", "content": prompt}],
            "response_format": {"type": "json_object"}
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                text = data["choices"][0]["message"]["content"]
                parsed = json.loads(text)
                recs = [ActionableStep(**r) for r in parsed.get("recommendations", [])]
                return {
                    "explanation_mode": "AI-Powered (OpenAI)",
                    "summary": parsed.get("summary", ""),
                    "root_cause": parsed.get("root_cause", ""),
                    "impact_assessment": parsed.get("impact_assessment", ""),
                    "confidence_score": parsed.get("confidence_score", 90),
                    "confirmed_observations": parsed.get("confirmed_observations", []),
                    "heuristic_hypotheses": parsed.get("heuristic_hypotheses", []),
                    "recommendations": recs
                }
        return None

