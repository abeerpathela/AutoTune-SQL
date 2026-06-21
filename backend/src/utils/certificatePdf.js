const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

const TEMPLATE_PATH = path.join(__dirname, '../../assets/SAMPLE_CERTIFICATE.pdf');

/** Sample placeholders baked into SAMPLE_CERTIFICATE.pdf */
const SAMPLE_NAME = 'Abeer Pathela';
const SAMPLE_DATE = 'June 21, 2026';
const SAMPLE_CERT_ID = 'AT-SQL-1782060222812-wr29qi3tq';

const BG = rgb(0.04, 0.04, 0.06);

function formatIssueDate(value) {
  const d = value ? new Date(value) : new Date();
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function fitFontSize(text, maxWidth, baseSize) {
  const len = text.length;
  if (len <= 18) return baseSize;
  if (len <= 28) return baseSize - 4;
  if (len <= 40) return baseSize - 8;
  return baseSize - 12;
}

/**
 * Load SAMPLE_CERTIFICATE.pdf and overlay user-specific fields.
 */
async function buildCertificatePdfBytes({ userName, certificateId, issueDate }) {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    throw new Error('Certificate template not found on server');
  }

  const templateBytes = fs.readFileSync(TEMPLATE_PATH);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const page = pdfDoc.getPage(0);
  const { width } = page.getSize();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const name = userName || 'AutoTune Graduate';
  const dateStr = formatIssueDate(issueDate);
  const certId = certificateId || SAMPLE_CERT_ID;
  const nameSize = fitFontSize(name, 440, 26);

  // Cover sample name
  page.drawRectangle({ x: 170, y: 268, width: 500, height: 42, color: BG });
  page.drawText(name, {
    x: width / 2 - (fontBold.widthOfTextAtSize(name, nameSize) / 2),
    y: 280,
    size: nameSize,
    font: fontBold,
    color: rgb(0.98, 0.98, 1),
  });

  // Cover sample date
  page.drawRectangle({ x: 95, y: 108, width: 180, height: 22, color: BG });
  page.drawText(dateStr, {
    x: 100,
    y: 112,
    size: 11,
    font,
    color: rgb(0.75, 0.75, 0.8),
  });

  // Cover sample certificate ID
  page.drawRectangle({ x: 230, y: 48, width: 380, height: 18, color: BG });
  page.drawText(`Certificate ID: ${certId}`, {
    x: 235,
    y: 50,
    size: 9,
    font,
    color: rgb(0.55, 0.55, 0.62),
  });

  return pdfDoc.save();
}

module.exports = {
  buildCertificatePdfBytes,
  TEMPLATE_PATH,
  SAMPLE_NAME,
  SAMPLE_DATE,
  SAMPLE_CERT_ID,
};
