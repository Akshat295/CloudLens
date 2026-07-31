import api from "../api/api";

// Filename is generated client-side rather than read from the response's
// Content-Disposition header — that header isn't in the default CORS
// exposed-headers allowlist, and exposing it would mean widening the
// shared `cors()` config in app.js for every route just for this one.
export const downloadScanReport = async (scanId) => {
  const response = await api.get(`/reports/scan/${scanId}`, {
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `cloudlens-scan-report-${scanId}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
