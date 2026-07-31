const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;

// Shared shell (branded header, card, footer) every notification email is
// rendered into — keeps the three templates below focused on just their own
// content instead of repeating layout markup.
const baseLayout = ({ title, preheader, bodyHtml }) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f1f5f9; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <span style="display:none; font-size:1px; color:#f1f5f9; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">
      ${preheader}
    </span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 1px 3px rgba(15,23,42,0.08);">
            <tr>
              <td style="background:linear-gradient(135deg,#2563eb,#4f46e5); padding:24px 32px;">
                <span style="color:#ffffff; font-size:20px; font-weight:700;">&#9729; CloudLens</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px; background-color:#f8fafc; border-top:1px solid #e2e8f0;">
                <p style="margin:0; font-size:12px; color:#94a3b8; line-height:1.5;">
                  You're receiving this because email notifications are enabled on your CloudLens account.
                  You can change this anytime from Notification Settings.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

const statRow = (label, value, color = "#0f172a") => `
  <tr>
    <td style="padding:10px 0; border-bottom:1px solid #f1f5f9; font-size:14px; color:#64748b;">${label}</td>
    <td style="padding:10px 0; border-bottom:1px solid #f1f5f9; font-size:14px; font-weight:700; color:${color}; text-align:right;">${value}</td>
  </tr>
`;

const buildScanCompletedEmail = ({ totalResources, highCount, mediumCount, lowCount, estimatedSavings }) => {
  const bodyHtml = `
    <h1 style="margin:0 0 8px; font-size:20px; color:#0f172a;">Scan completed</h1>
    <p style="margin:0 0 24px; font-size:14px; color:#64748b; line-height:1.5;">
      Your scheduled infrastructure scan finished successfully. Here's a summary:
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${statRow("Resources Scanned", totalResources)}
      ${statRow("High Alerts", highCount, "#dc2626")}
      ${statRow("Medium Alerts", mediumCount, "#d97706")}
      ${statRow("Low Alerts", lowCount, "#16a34a")}
      ${statRow("Estimated Monthly Savings", formatCurrency(estimatedSavings), "#059669")}
    </table>
  `;

  return baseLayout({
    title: "Scan Completed — CloudLens",
    preheader: `Scan finished: ${totalResources} resources, ${formatCurrency(estimatedSavings)} potential savings.`,
    bodyHtml,
  });
};

const buildHighSeverityEmail = ({ highCount, recommendations }) => {
  const items = recommendations
    .slice(0, 10)
    .map(
      (rec) => `
        <li style="margin-bottom:12px; font-size:14px; color:#0f172a; line-height:1.4;">
          <strong>${rec.resourceId}</strong> — ${rec.recommendation}
          <div style="font-size:12px; color:#64748b; margin-top:2px;">${rec.reason}</div>
        </li>
      `
    )
    .join("");

  const remaining = recommendations.length - 10;

  const bodyHtml = `
    <h1 style="margin:0 0 8px; font-size:20px; color:#dc2626;">&#9888; High severity findings</h1>
    <p style="margin:0 0 24px; font-size:14px; color:#64748b; line-height:1.5;">
      Your latest scan found <strong>${highCount}</strong> high-severity recommendation${highCount === 1 ? "" : "s"} that need attention:
    </p>
    <ul style="margin:0; padding-left:18px;">
      ${items}
    </ul>
    ${remaining > 0 ? `<p style="margin-top:16px; font-size:12px; color:#94a3b8;">+ ${remaining} more — view them all in CloudLens.</p>` : ""}
  `;

  return baseLayout({
    title: "High Severity Alert — CloudLens",
    preheader: `${highCount} high-severity recommendation(s) need your attention.`,
    bodyHtml,
  });
};

const buildWeeklyReportEmail = ({
  totalResources,
  monthlyCost,
  estimatedSavings,
  highRecommendations,
  mediumRecommendations,
  lowRecommendations,
}) => {
  const bodyHtml = `
    <h1 style="margin:0 0 8px; font-size:20px; color:#0f172a;">Your weekly cost report</h1>
    <p style="margin:0 0 24px; font-size:14px; color:#64748b; line-height:1.5;">
      Here's how your AWS infrastructure looks this week:
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${statRow("Total Resources", totalResources)}
      ${statRow("Monthly Cost", formatCurrency(monthlyCost))}
      ${statRow("Estimated Savings", formatCurrency(estimatedSavings), "#059669")}
      ${statRow("High Alerts", highRecommendations, "#dc2626")}
      ${statRow("Medium Alerts", mediumRecommendations, "#d97706")}
      ${statRow("Low Alerts", lowRecommendations, "#16a34a")}
    </table>
  `;

  return baseLayout({
    title: "Weekly Cost Report — CloudLens",
    preheader: `Weekly report: ${formatCurrency(monthlyCost)} monthly cost, ${formatCurrency(estimatedSavings)} potential savings.`,
    bodyHtml,
  });
};

module.exports = {
  buildScanCompletedEmail,
  buildHighSeverityEmail,
  buildWeeklyReportEmail,
};
