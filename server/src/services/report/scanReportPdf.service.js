const PDFDocument = require("pdfkit");

const PAGE_MARGIN = 40;
const PAGE_WIDTH = 595.28; // A4 points
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;

// Mirrors client/src/utils/chartColors.js so the report visually matches the
// dashboard's charts — kept as a separate copy since the client bundle isn't
// reachable from the server process.
const COLORS = {
  brand: "#2563eb",
  slate900: "#0f172a",
  slate600: "#475569",
  slate400: "#94a3b8",
  slate200: "#e2e8f0",
  slate50: "#f8fafc",
  white: "#ffffff",
  emerald: "#10b981",
  red: "#ef4444",
  amber: "#f59e0b",
};

const SEVERITY_COLORS = { HIGH: COLORS.red, MEDIUM: COLORS.amber, LOW: COLORS.emerald };

const RESOURCE_TYPE_PALETTE = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#f43f5e",
  "#6366f1",
  "#14b8a6",
  "#f97316",
  "#64748b",
];

const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
    : "—";

const ensureSpace = (doc, height) => {
  if (doc.y + height > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
  }
};

const sectionTitle = (doc, text) => {
  ensureSpace(doc, 40);
  doc.moveDown(0.6);
  doc.font("Helvetica-Bold").fontSize(14).fillColor(COLORS.slate900).text(text);
  doc.moveDown(0.4);
};

const drawHeader = (doc, scan) => {
  doc.rect(0, 0, doc.page.width, 90).fill(COLORS.brand);

  doc.fillColor(COLORS.white).font("Helvetica-Bold").fontSize(20).text("CloudLens", PAGE_MARGIN, 26);
  doc.font("Helvetica").fontSize(11).text("Infrastructure Scan Report", PAGE_MARGIN, 52);

  doc.y = 106;
  doc.font("Helvetica").fontSize(9).fillColor(COLORS.slate600);
  doc.text(`Scan ID: ${scan._id}`, PAGE_MARGIN, doc.y);
  doc.text(
    `Status: ${scan.status}    Started: ${formatDate(scan.startedAt)}    Completed: ${formatDate(scan.completedAt)}`
  );
  doc.text(`Generated: ${formatDate(new Date())}`);
  doc.moveDown(0.5);
};

// Simple bordered stat grid (3 columns) for the summary numbers. Text is
// positioned with explicit x/y (rather than the flowing doc.text cursor) so
// cards can sit side by side, then doc.y is advanced once at the end.
const drawStatCards = (doc, stats) => {
  const columns = 3;
  const gap = 12;
  const cardWidth = (CONTENT_WIDTH - gap * (columns - 1)) / columns;
  const cardHeight = 54;
  const startX = doc.page.margins.left;
  const rows = Math.ceil(stats.length / columns);

  ensureSpace(doc, rows * (cardHeight + gap));
  const startY = doc.y;

  stats.forEach((stat, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const cardX = startX + col * (cardWidth + gap);
    const cardY = startY + row * (cardHeight + gap);

    doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 6).fillAndStroke(COLORS.slate50, COLORS.slate200);
    doc
      .fillColor(COLORS.slate600)
      .font("Helvetica")
      .fontSize(9)
      .text(stat.label, cardX + 10, cardY + 10, { width: cardWidth - 20 });
    doc
      .fillColor(stat.color || COLORS.slate900)
      .font("Helvetica-Bold")
      .fontSize(15)
      .text(stat.value, cardX + 10, cardY + 25, { width: cardWidth - 20 });
  });

  doc.y = startY + rows * (cardHeight + gap);
};

// Pie slices are approximated as many-sided polygons (moveTo center, walk
// the arc in small steps, back to center) since pdfkit has no native
// start/end-angle filled-arc primitive.
const drawSeverityPieChart = (doc, severityCounts) => {
  const total = severityCounts.HIGH + severityCounts.MEDIUM + severityCounts.LOW;
  const radius = 55;
  const startX = doc.page.margins.left;

  if (total === 0) {
    doc.font("Helvetica").fontSize(10).fillColor(COLORS.slate400).text("No recommendations to chart.");
    doc.moveDown(1);
    return;
  }

  ensureSpace(doc, radius * 2 + 20);
  const centerX = startX + radius;
  const centerY = doc.y + radius;

  const segments = [
    { label: "High", value: severityCounts.HIGH, color: SEVERITY_COLORS.HIGH },
    { label: "Medium", value: severityCounts.MEDIUM, color: SEVERITY_COLORS.MEDIUM },
    { label: "Low", value: severityCounts.LOW, color: SEVERITY_COLORS.LOW },
  ].filter((segment) => segment.value > 0);

  let startAngle = -Math.PI / 2;

  segments.forEach((segment) => {
    const sweep = (segment.value / total) * Math.PI * 2;
    const endAngle = startAngle + sweep;
    const steps = Math.max(2, Math.ceil((sweep / (Math.PI * 2)) * 120));

    doc.moveTo(centerX, centerY);
    for (let i = 0; i <= steps; i += 1) {
      const angle = startAngle + (sweep * i) / steps;
      doc.lineTo(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle));
    }
    doc.closePath().fill(segment.color);

    startAngle = endAngle;
  });

  const legendX = centerX + radius + 30;
  let legendY = centerY - radius + 4;

  segments.forEach((segment) => {
    doc.rect(legendX, legendY, 10, 10).fill(segment.color);
    doc
      .fillColor(COLORS.slate900)
      .font("Helvetica")
      .fontSize(10)
      .text(
        `${segment.label}: ${segment.value} (${Math.round((segment.value / total) * 100)}%)`,
        legendX + 16,
        legendY - 1
      );
    legendY += 20;
  });

  doc.y = centerY + radius + 20;
};

// Horizontal bar chart, one row per resource type.
const drawResourceBarChart = (doc, resourceTypeCounts) => {
  const entries = Object.entries(resourceTypeCounts);

  if (!entries.length) {
    doc.font("Helvetica").fontSize(10).fillColor(COLORS.slate400).text("No resources found for this scan.");
    doc.moveDown(1);
    return;
  }

  const maxCount = Math.max(...entries.map(([, count]) => count));
  const barHeight = 14;
  const rowGap = 10;
  const labelWidth = 110;
  const maxBarWidth = CONTENT_WIDTH - labelWidth - 50;
  const startX = doc.page.margins.left;

  ensureSpace(doc, entries.length * (barHeight + rowGap));
  let y = doc.y;

  entries.forEach(([type, count], index) => {
    const color = RESOURCE_TYPE_PALETTE[index % RESOURCE_TYPE_PALETTE.length];
    const barWidth = Math.max(4, (count / maxCount) * maxBarWidth);

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(COLORS.slate600)
      .text(type, startX, y + 2, { width: labelWidth - 8 });
    doc.rect(startX + labelWidth, y, barWidth, barHeight).fill(color);
    doc
      .fillColor(COLORS.slate900)
      .fontSize(9)
      .text(String(count), startX + labelWidth + barWidth + 8, y + 2);

    y += barHeight + rowGap;
  });

  doc.y = y + 10;
};

// Generic paginated table: draws a dark header row, then striped data rows,
// re-drawing the header whenever a row would overflow the page.
const drawTable = (doc, { title, columns, rows, emptyMessage }) => {
  sectionTitle(doc, title);

  if (!rows.length) {
    doc.font("Helvetica").fontSize(10).fillColor(COLORS.slate400).text(emptyMessage);
    doc.moveDown(1);
    return;
  }

  const startX = doc.page.margins.left;
  const headerHeight = 22;
  const minRowHeight = 20;

  const drawHeaderRow = () => {
    const y = doc.y;
    doc.rect(startX, y, CONTENT_WIDTH, headerHeight).fill(COLORS.slate900);

    let x = startX;
    columns.forEach((col) => {
      doc
        .fillColor(COLORS.white)
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(col.label, x + 6, y + 6, { width: col.width - 12 });
      x += col.width;
    });

    doc.y = y + headerHeight;
  };

  ensureSpace(doc, headerHeight + minRowHeight);
  drawHeaderRow();

  rows.forEach((row, rowIndex) => {
    doc.font("Helvetica").fontSize(9);

    const rowHeight = Math.max(
      minRowHeight,
      ...columns.map(
        (col) => doc.heightOfString(row[col.key] ?? "—", { width: col.width - 12 }) + 10
      )
    );

    if (doc.y + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      drawHeaderRow();
    }

    const y = doc.y;

    if (rowIndex % 2 === 1) {
      doc.rect(startX, y, CONTENT_WIDTH, rowHeight).fill(COLORS.slate50);
    }

    let x = startX;
    columns.forEach((col) => {
      const value = row[col.key];
      const color = col.color ? col.color(row) : COLORS.slate900;

      doc
        .fillColor(color)
        .font("Helvetica")
        .fontSize(9)
        .text(value === undefined || value === null || value === "" ? "—" : String(value), x + 6, y + 6, {
          width: col.width - 12,
        });
      x += col.width;
    });

    doc.y = y + rowHeight;
  });

  doc.moveDown(1);
};

const drawFooter = (doc) => {
  const range = doc.bufferedPageRange();
  const bottomMargin = doc.page.margins.bottom;

  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);

    // The footer sits inside the page's bottom margin band, which pdfkit's
    // own overflow check would otherwise read as "doesn't fit" and silently
    // start a brand new page for — zeroing the margin during this one write
    // stops that self-inflicted page break.
    doc.page.margins.bottom = 0;
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(COLORS.slate400)
      .text(`CloudLens · Page ${i + 1} of ${range.count}`, PAGE_MARGIN, doc.page.height - 30, {
        width: CONTENT_WIDTH,
        align: "center",
      });
    doc.page.margins.bottom = bottomMargin;
  }
};

const buildScanReportPdf = (reportData) => {
  const { scan, resources, recommendations, monthlyCost, severityCounts, resourceTypeCounts } = reportData;

  const doc = new PDFDocument({ size: "A4", margin: PAGE_MARGIN, bufferPages: true });

  drawHeader(doc, scan);

  sectionTitle(doc, "Scan Summary");
  drawStatCards(doc, [
    { label: "Status", value: scan.status },
    { label: "Total Resources", value: String(scan.totalResources ?? resources.length) },
    { label: "Monthly Cost", value: formatCurrency(monthlyCost) },
    { label: "Estimated Savings", value: formatCurrency(scan.estimatedSavings), color: COLORS.emerald },
    { label: "High Alerts", value: String(severityCounts.HIGH), color: COLORS.red },
    { label: "Medium / Low Alerts", value: `${severityCounts.MEDIUM} / ${severityCounts.LOW}`, color: COLORS.amber },
  ]);

  sectionTitle(doc, "Severity Breakdown");
  drawSeverityPieChart(doc, severityCounts);

  sectionTitle(doc, "Resources by Type");
  drawResourceBarChart(doc, resourceTypeCounts);

  doc.addPage();

  drawTable(doc, {
    title: "Resources",
    emptyMessage: "No resources found for this scan.",
    columns: [
      { key: "resourceType", label: "Type", width: 90 },
      { key: "name", label: "Name", width: 150 },
      { key: "state", label: "State", width: 70 },
      { key: "resourceId", label: "Resource ID", width: 205 },
    ],
    rows: resources.map((resource) => ({
      resourceType: resource.resourceType,
      name: resource.name,
      state: resource.state,
      resourceId: resource.resourceId,
    })),
  });

  drawTable(doc, {
    title: "Recommendations",
    emptyMessage: "No recommendations for this scan.",
    columns: [
      { key: "resource", label: "Resource", width: 90 },
      {
        key: "severity",
        label: "Severity",
        width: 60,
        color: (row) => SEVERITY_COLORS[row.severity] || COLORS.slate900,
      },
      { key: "recommendation", label: "Recommendation", width: 210 },
      { key: "monthlyCost", label: "Monthly Cost", width: 75 },
      { key: "estimatedSavings", label: "Savings", width: 80 },
    ],
    rows: recommendations.map((rec) => ({
      resource: rec.resourceName || rec.resourceId,
      severity: rec.severity,
      recommendation: rec.recommendation,
      monthlyCost: formatCurrency(rec.monthlyCost),
      estimatedSavings: formatCurrency(rec.estimatedSavings),
    })),
  });

  drawFooter(doc);

  return doc;
};

module.exports = {
  buildScanReportPdf,
};
