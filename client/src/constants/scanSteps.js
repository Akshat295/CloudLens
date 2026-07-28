// Mirrors the backend's scan pipeline (server/src/services/scanner) as a
// friendly, illustrative progress readout. The backend scan is a single
// opaque request with no incremental status API, so steps are paced on the
// frontend rather than driven by real per-step events from the server.
export const SCAN_STEPS = [
  { key: "ec2", label: "Fetch EC2" },
  { key: "s3", label: "Fetch S3" },
  { key: "pricing", label: "Fetch Pricing" },
  { key: "analyze", label: "Analyze" },
  { key: "save", label: "Save Database" },
];
