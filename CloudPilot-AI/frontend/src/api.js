const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Failed to fetch system health');
  return res.json();
}

export async function fetchSamples() {
  const res = await fetch(`${API_BASE}/logs/samples`);
  if (!res.ok) throw new Error('Failed to fetch sample catalog');
  return res.json();
}

export async function loadSample(sampleId) {
  const res = await fetch(`${API_BASE}/logs/samples/${sampleId}/load`, {
    method: 'POST'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to load sample log');
  }
  return res.json();
}

export async function analyzeLogs(file, rawText) {
  const formData = new FormData();
  if (file) {
    formData.append('file', file);
  } else if (rawText) {
    formData.append('raw_text', rawText);
  } else {
    throw new Error('Please select a file or enter log content.');
  }

  const res = await fetch(`${API_BASE}/logs/analyze`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Analysis request failed');
  }
  return res.json();
}

export async function fetchIncidents(status = '', severity = '', search = '') {
  const params = new URLSearchParams();
  if (status && status !== 'All') params.append('status', status);
  if (severity && severity !== 'All') params.append('severity', severity);
  if (search) params.append('search', search);

  const res = await fetch(`${API_BASE}/incidents?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch incidents');
  return res.json();
}

export async function updateIncident(id, updates) {
  const res = await fetch(`${API_BASE}/incidents/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update incident');
  return res.json();
}

export async function deleteIncident(id) {
  const res = await fetch(`${API_BASE}/incidents/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete incident');
  return res.json();
}

export async function fetchLatestReport() {
  const res = await fetch(`${API_BASE}/reports/latest`);
  if (!res.ok) throw new Error('No reports found');
  return res.json();
}

export async function fetchAnalysisHistory() {
  const res = await fetch(`${API_BASE}/analysis/history`);
  if (!res.ok) throw new Error('Failed to fetch analysis history');
  return res.json();
}

export async function fetchSettings() {
  const res = await fetch(`${API_BASE}/settings`);
  if (!res.ok) throw new Error('Failed to fetch application settings');
  return res.json();
}

export async function updateSettings(payload) {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to update settings');
  return res.json();
}

export async function resetDatabase() {
  const res = await fetch(`${API_BASE}/settings/reset-db`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to reset database');
  return res.json();
}

export function getExportCsvUrl(analysisId) {
  return `${API_BASE}/reports/${analysisId}/export/csv`;
}

export function getExportMarkdownUrl(analysisId) {
  return `${API_BASE}/reports/${analysisId}/export/markdown`;
}

export function getExportIncidentsCsvUrl() {
  return `${API_BASE}/reports/export/incidents-csv`;
}

