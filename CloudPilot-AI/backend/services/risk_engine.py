import math
from typing import List, Dict, Any, Tuple
from backend.models.schemas import RiskFactor, ErrorPattern, ActionableStep

class RiskEngine:
    """
    Transparent, explainable infrastructure risk scoring engine (0-100).
    Uses weighted multi-factor heuristic modeling:
      1. Critical Severity Impact (40%)
      2. Error Velocity & Density (30%)
      3. Blast Radius / Multi-Service Spread (15%)
      4. Catastrophic Failure Signatures (15%)
    """

    CATASTROPHIC_KEYWORDS = [
        "OOMKILLED", "OUT OF MEMORY", "CRASHLOOPBACKOFF", "SEGMENTATION FAULT",
        "DATABASE CONNECTION POOL EXHAUSTED", "TOO MANY CONNECTIONS",
        "DEADLOCK DETECTED", "DISK PRESSURE", "NO SPACE LEFT ON DEVICE",
        "READ-ONLY FILE SYSTEM", "SSL CERTIFICATE EXPIRED", "CONSENSUS LOSS",
        "SPLIT BRAIN", "UPSTREAM TIMEOUT 504", "CIRCUIT BREAKER OPEN"
    ]

    @classmethod
    def evaluate(
        cls,
        total_lines: int,
        level_counts: Dict[str, int],
        patterns: List[ErrorPattern],
        sensitivity: str = "normal"
    ) -> Tuple[int, str, List[RiskFactor], List[ActionableStep]]:
        if total_lines == 0:
            return 0, "LOW", [
                RiskFactor(
                    factor="Log Stream Status",
                    weight=100,
                    score_impact=0,
                    explanation="No log events were submitted for analysis."
                )
            ], [
                ActionableStep(
                    step_number=1,
                    title="Provide System Logs",
                    command_or_action="Submit system or container logs to compute risk analysis.",
                    rationale="Log metrics are currently zero."
                )
            ]

        # Sensitivity multiplier: conservative (1.2x), normal (1.0x), relaxed (0.8x)
        multiplier = 1.0
        if sensitivity == "high":
            multiplier = 1.2
        elif sensitivity == "low":
            multiplier = 0.8

        critical_count = level_counts.get("CRITICAL", 0)
        error_count = level_counts.get("ERROR", 0)
        warning_count = level_counts.get("WARNING", 0)
        info_count = level_counts.get("INFO", 0)

        # 1. Critical Impact Factor (max 40 pts)
        # 1 critical event alone warrants high attention; 5+ critical events push near 40 pts
        crit_score = min(40.0, (critical_count * 15.0) + (critical_count / max(total_lines, 1) * 20.0))
        crit_impact = int(round(crit_score))

        # 2. Error Density & Velocity Factor (max 30 pts)
        # Ratio of errors+warnings to total logs
        error_ratio = (error_count + 0.3 * warning_count) / max(total_lines, 1)
        err_score = min(30.0, (error_ratio * 40.0) + (math.log10(error_count + 1) * 7.0))
        err_impact = int(round(err_score))

        # 3. Blast Radius (max 15 pts)
        # Distinct services exhibiting errors
        failing_services = set(p.service for p in patterns if p.level in ("CRITICAL", "ERROR"))
        service_count = len(failing_services)
        if service_count >= 4:
            blast_score = 15.0
        elif service_count >= 2:
            blast_score = 10.0
        elif service_count == 1:
            blast_score = 5.0
        else:
            blast_score = 0.0
        blast_impact = int(round(blast_score))

        # 4. Catastrophic Pattern Fingerprinting (max 15 pts)
        catastrophic_matches = []
        for p in patterns:
            upper_sample = p.sample.upper()
            for kw in cls.CATASTROPHIC_KEYWORDS:
                if kw in upper_sample:
                    catastrophic_matches.append(kw)
                    break

        catastrophic_matches = list(set(catastrophic_matches))
        if len(catastrophic_matches) >= 3:
            cat_score = 15.0
        elif len(catastrophic_matches) >= 1:
            cat_score = 10.0
        else:
            cat_score = 0.0
        cat_impact = int(round(cat_score))

        # Calculate raw aggregate
        raw_score = (crit_score + err_score + blast_score + cat_score) * multiplier
        final_score = max(0, min(100, int(round(raw_score))))

        # Determine Risk Level Category
        if final_score >= 75:
            risk_level = "CRITICAL"
        elif final_score >= 50:
            risk_level = "HIGH"
        elif final_score >= 25:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        # Construct explainable factors
        factors: List[RiskFactor] = [
            RiskFactor(
                factor="Critical Event Severity",
                weight=40,
                score_impact=crit_impact,
                explanation=f"Detected {critical_count} critical incident event(s) requiring immediate intervention."
                if critical_count > 0 else "Zero critical panic or fatal events detected."
            ),
            RiskFactor(
                factor="Error Velocity & Density",
                weight=30,
                score_impact=err_impact,
                explanation=f"{error_count} active error(s) and {warning_count} warning(s) represent {round(error_ratio*100, 1)}% of total log volume."
            ),
            RiskFactor(
                factor="Service Blast Radius",
                weight=15,
                score_impact=blast_impact,
                explanation=f"{service_count} service component(s) impacted: {', '.join(sorted(failing_services)) if failing_services else 'None'}."
            ),
            RiskFactor(
                factor="Catastrophic Failure Signatures",
                weight=15,
                score_impact=cat_impact,
                explanation=f"Matched {len(catastrophic_matches)} known critical failure pattern(s): {', '.join(catastrophic_matches)}"
                if catastrophic_matches else "No known fatal crash loop or exhaustion signatures matched."
            ),
        ]

        # Preventive Recommendations
        recommendations: List[ActionableStep] = []
        if risk_level in ("CRITICAL", "HIGH"):
            if "OOMKILLED" in str(catastrophic_matches) or "OUT OF MEMORY" in str(catastrophic_matches):
                recommendations.append(ActionableStep(
                    step_number=1,
                    title="Scale Container Memory Limits",
                    command_or_action="kubectl top pods && kubectl set resources deployment/<app> --limits=memory=2Gi",
                    rationale="Mitigates host Linux cgroup OOM killer terminating process."
                ))
            if "DATABASE CONNECTION POOL" in str(catastrophic_matches) or "TOO MANY CONNECTIONS" in str(catastrophic_matches):
                recommendations.append(ActionableStep(
                    step_number=2,
                    title="Increase Pool Capacity & Drain Idle Leaks",
                    command_or_action="SELECT pid, age(clock_timestamp(), query_start), state, query FROM pg_stat_activity WHERE state != 'idle';",
                    rationale="Terminates leaked idle transactions consuming database backend worker slots."
                ))
            recommendations.append(ActionableStep(
                step_number=len(recommendations) + 1,
                title="Establish Traffic Shunting / Circuit Breaking",
                command_or_action="Configure 503 fallback responses in reverse-proxy to avoid upstream cascading failure.",
                rationale="Prevents retry storms from aggravating degraded infrastructure."
            ))
        elif risk_level == "MEDIUM":
            recommendations.append(ActionableStep(
                step_number=1,
                title="Monitor Error Frequency Trend",
                command_or_action="Check Prometheus / Datadog error rate spike metrics over the last 30 minutes.",
                rationale="Determines whether errors are transient or an emerging systemic failure."
            ))
            recommendations.append(ActionableStep(
                step_number=2,
                title="Audit Service Dependency Health",
                command_or_action="curl -f -m 2 http://<downstream-dependency>/healthz",
                rationale="Validates downstream latency and handshake stability."
            ))
        else:
            recommendations.append(ActionableStep(
                step_number=1,
                title="Nominal Health State Maintenance",
                command_or_action="Maintain scheduled automated backup snapshots and canary health checks.",
                rationale="Infrastructure behavior is within acceptable operating thresholds."
            ))

        return final_score, risk_level, factors, recommendations

