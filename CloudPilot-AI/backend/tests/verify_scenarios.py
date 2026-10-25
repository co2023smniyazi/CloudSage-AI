import sys
import os
from pathlib import Path
from fastapi.testclient import TestClient

# Ensure backend can be imported
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.main import app

def run_qa_suite():
    client = TestClient(app)
    results = []
    base_dir = Path(__file__).resolve().parent.parent.parent
    sample_dir = base_dir / "sample_logs"

    print("=" * 65)
    print("      CLOUDPILOT AI — COMPREHENSIVE END-TO-END QA SUITE       ")
    print("=" * 65)

    # 1. Scenario 1: Normal Traffic Logs
    normal_file = sample_dir / "normal-traffic.log"
    with open(normal_file, "rb") as f:
        resp1 = client.post("/api/logs/analyze", files={"file": ("normal-traffic.log", f, "text/plain")})
    assert resp1.status_code == 200, f"Scenario 1 failed with {resp1.status_code}"
    d1 = resp1.json()
    s1_pass = (d1["risk_level"] == "LOW") and (d1["risk_score"] <= 25) and (d1["level_counts"]["CRITICAL"] == 0)
    results.append({
        "Scenario": "1. Normal Traffic Logs",
        "Expected": "LOW risk (score <= 25), 0 Crit",
        "Actual": f"{d1['risk_level']} ({d1['risk_score']}/100), {d1['level_counts']['CRITICAL']} Crit",
        "Passed": s1_pass
    })
    print(f"[+] Scenario 1: {d1['risk_level']} ({d1['risk_score']}/100), Lines={d1['total_lines']} -> {'PASS' if s1_pass else 'FAIL'}")

    # 2. Scenario 2: Kubernetes CrashLoopBackOff Logs
    k8s_file = sample_dir / "k8s-crashloop.log"
    with open(k8s_file, "rb") as f:
        resp2 = client.post("/api/logs/analyze", files={"file": ("k8s-crashloop.log", f, "text/plain")})
    assert resp2.status_code == 200, f"Scenario 2 failed with {resp2.status_code}"
    d2 = resp2.json()
    s2_pass = (d2["risk_level"] in ("HIGH", "CRITICAL")) and (d2["risk_score"] >= 70) and ("cgroup" in d2["root_cause"].lower() or "memory" in d2["root_cause"].lower())
    results.append({
        "Scenario": "2. K8s CrashLoopBackOff",
        "Expected": "HIGH/CRITICAL (score >= 70)",
        "Actual": f"{d2['risk_level']} ({d2['risk_score']}/100)",
        "Passed": s2_pass
    })
    print(f"[+] Scenario 2: {d2['risk_level']} ({d2['risk_score']}/100), RootCause='{d2['root_cause'][:40]}...' -> {'PASS' if s2_pass else 'FAIL'}")

    # 3. Scenario 3: Database Connection Pool Exhaustion Logs
    db_file = sample_dir / "db-pool-exhaustion.log"
    with open(db_file, "rb") as f:
        resp3 = client.post("/api/logs/analyze", files={"file": ("db-pool-exhaustion.log", f, "text/plain")})
    assert resp3.status_code == 200, f"Scenario 3 failed with {resp3.status_code}"
    d3 = resp3.json()
    s3_pass = (d3["risk_level"] in ("HIGH", "CRITICAL")) and (d3["risk_score"] >= 50) and ("pool" in d3["root_cause"].lower() or "database" in d3["root_cause"].lower())
    results.append({
        "Scenario": "3. DB Pool Exhaustion",
        "Expected": "HIGH/CRITICAL (score >= 50)",
        "Actual": f"{d3['risk_level']} ({d3['risk_score']}/100)",
        "Passed": s3_pass
    })
    print(f"[+] Scenario 3: {d3['risk_level']} ({d3['risk_score']}/100), RootCause='{d3['root_cause'][:40]}...' -> {'PASS' if s3_pass else 'FAIL'}")

    # 4. Scenario 4: Authentication Service Failure Logs
    auth_file = sample_dir / "auth-service-failure.log"
    with open(auth_file, "rb") as f:
        resp4 = client.post("/api/logs/analyze", files={"file": ("auth-service-failure.log", f, "text/plain")})
    assert resp4.status_code == 200, f"Scenario 4 failed with {resp4.status_code}"
    d4 = resp4.json()
    s4_pass = (d4["risk_level"] in ("HIGH", "CRITICAL")) and (d4["risk_score"] >= 50) and ("auth" in d4["summary"].lower() or "gateway" in d4["summary"].lower() or "jwt" in d4["summary"].lower())
    results.append({
        "Scenario": "4. Auth Service Failure",
        "Expected": "HIGH/CRITICAL (score >= 50)",
        "Actual": f"{d4['risk_level']} ({d4['risk_score']}/100)",
        "Passed": s4_pass
    })
    print(f"[+] Scenario 4: {d4['risk_level']} ({d4['risk_score']}/100), Summary='{d4['summary'][:40]}...' -> {'PASS' if s4_pass else 'FAIL'}")

    # 5. Scenario 5: Empty / Whitespace Content Handling
    resp5_empty = client.post("/api/logs/analyze", data={"raw_text": "   \n\t  "})
    s5_pass = (resp5_empty.status_code == 400) and ("empty" in resp5_empty.json()["detail"].lower())
    results.append({
        "Scenario": "5. Empty Log Content Validation",
        "Expected": "HTTP 400 rejection",
        "Actual": f"HTTP {resp5_empty.status_code}",
        "Passed": s5_pass
    })
    print(f"[+] Scenario 5: Rejected empty content with HTTP {resp5_empty.status_code} -> {'PASS' if s5_pass else 'FAIL'}")

    # 6. Scenario 6: Incident Status Lifecycle & Notes Update
    incidents_resp = client.get("/api/incidents")
    assert incidents_resp.status_code == 200
    all_incidents = incidents_resp.json()
    assert len(all_incidents) > 0
    target_inc = all_incidents[0]
    inc_id = target_inc["id"]

    patch_resp = client.patch(f"/api/incidents/{inc_id}", json={"status": "Investigating", "notes": "Automated QA Verification Note"})
    assert patch_resp.status_code == 200
    patched_data = patch_resp.json()
    s6_pass = (patched_data["status"] == "Investigating") and ("QA Verification" in patched_data["notes"])
    results.append({
        "Scenario": "6. Incident Status Lifecycle (PATCH)",
        "Expected": "Status='Investigating', Notes saved",
        "Actual": f"Status='{patched_data['status']}', Notes saved",
        "Passed": s6_pass
    })
    print(f"[+] Scenario 6: Incident {target_inc['incident_code']} status updated to {patched_data['status']} -> {'PASS' if s6_pass else 'FAIL'}")

    # 7. Scenario 7: CSV & Markdown Report Exports
    last_analysis_id = d2["id"]
    csv_resp = client.get(f"/api/reports/{last_analysis_id}/export/csv")
    md_resp = client.get(f"/api/reports/{last_analysis_id}/export/markdown")
    s7_pass = (csv_resp.status_code == 200) and ("Level,Service,Occurrences" in csv_resp.text) and (md_resp.status_code == 200) and ("Executive Infrastructure Diagnostics Report" in md_resp.text)
    results.append({
        "Scenario": "7. Report Exports (CSV & Markdown)",
        "Expected": "HTTP 200, valid headers & content",
        "Actual": f"CSV {csv_resp.status_code}, MD {md_resp.status_code}",
        "Passed": s7_pass
    })
    print(f"[+] Scenario 7: Exported CSV ({len(csv_resp.text)} chars) and MD ({len(md_resp.text)} chars) -> {'PASS' if s7_pass else 'FAIL'}")

    print("\n" + "=" * 65)
    print("                     VERIFICATION SUMMARY                      ")
    print("=" * 65)
    all_passed = True
    for r in results:
        status = "PASSED" if r["Passed"] else "FAILED"
        if not r["Passed"]:
            all_passed = False
        print(f" * {r['Scenario']:<35} | {status:<6} | Actual: {r['Actual']}")

    print("=" * 65)
    if all_passed:
        print("ALL SCENARIOS VERIFIED SUCCESSFULLY! (7/7 PASSED)")
        return 0
    else:
        print("SOME SCENARIOS FAILED!")
        return 1

if __name__ == "__main__":
    sys.exit(run_qa_suite())

