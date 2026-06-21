import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import confetti from 'canvas-confetti';
import sampleTemplateUrl from '../assets/SAMPLE_CERTIFICATE.pdf?url';

export type CertificatePdfData = {
  userName: string;
  certificateId: string;
  verificationLink?: string;
  issueDate?: string;
};

const SAMPLE_CERT_ID = 'AT-SQL-1782060222812-wr29qi3tq';
const BG = rgb(0.04, 0.04, 0.06);

function formatIssueDate(value?: string) {
  const d = value ? new Date(value) : new Date();
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function fitFontSize(text: string, baseSize: number) {
  const len = text.length;
  if (len <= 18) return baseSize;
  if (len <= 28) return baseSize - 4;
  if (len <= 40) return baseSize - 8;
  return baseSize - 12;
}

/** Generate PDF from SAMPLE_CERTIFICATE.pdf template with personalized fields. */
export async function generateCertificatePdf(data: CertificatePdfData): Promise<void> {
  const response = await fetch(sampleTemplateUrl);
  const templateBytes = await response.arrayBuffer();

  const pdfDoc = await PDFDocument.load(templateBytes);
  const page = pdfDoc.getPage(0);
  const { width } = page.getSize();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const name = data.userName || 'AutoTune Graduate';
  const dateStr = formatIssueDate(data.issueDate);
  const certId = data.certificateId || SAMPLE_CERT_ID;
  const nameSize = fitFontSize(name, 26);

  page.drawRectangle({ x: 170, y: 268, width: 500, height: 42, color: BG });
  page.drawText(name, {
    x: width / 2 - fontBold.widthOfTextAtSize(name, nameSize) / 2,
    y: 280,
    size: nameSize,
    font: fontBold,
    color: rgb(0.98, 0.98, 1),
  });

  page.drawRectangle({ x: 95, y: 108, width: 180, height: 22, color: BG });
  page.drawText(dateStr, {
    x: 100,
    y: 112,
    size: 11,
    font,
    color: rgb(0.75, 0.75, 0.8),
  });

  page.drawRectangle({ x: 230, y: 48, width: 380, height: 18, color: BG });
  page.drawText(`Certificate ID: ${certId}`, {
    x: 235,
    y: 50,
    size: 9,
    font,
    color: rgb(0.55, 0.55, 0.62),
  });

  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `AutoTune-SQL-Certificate-${certId}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function getLinkedInShareUrl(verificationUrl: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verificationUrl)}`;
}

export function celebrateCertificateUnlock(): void {
  const duration = 4000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors: ['#e4e4e7', '#a1a1aa', '#22c55e', '#8b5cf6'],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors: ['#e4e4e7', '#a1a1aa', '#22c55e', '#8b5cf6'],
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };

  frame();
  confetti({
    particleCount: 120,
    spread: 100,
    origin: { y: 0.55 },
    colors: ['#fafafa', '#71717a', '#34d399', '#a78bfa'],
  });
}
