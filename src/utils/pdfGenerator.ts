import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function generatePdfFromElement(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id '${elementId}' not found for PDF export.`);
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 10;

    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    // Fallback print
    window.print();
  }
}

export function printDocumentElement(elementId: string, title: string = 'Cetak Dokumen LPK IJEF CORP'): void {
  const element = document.getElementById(elementId);
  if (!element) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #1e293b; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 10px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 12px; font-size: 13px; }
          th { background-color: #f1f5f9; text-align: left; }
          .header-title { text-align: center; font-weight: bold; font-size: 18px; text-transform: uppercase; margin-bottom: 4px; }
          .header-subtitle { text-align: center; font-size: 12px; color: #64748b; margin-bottom: 20px; border-bottom: 2px solid #0f172a; padding-bottom: 8px; }
          .section-title { font-weight: bold; background: #e2e8f0; padding: 6px 10px; font-size: 14px; margin-top: 15px; margin-bottom: 10px; }
          .signature-box { display: flex; justify-content: space-between; margin-top: 40px; }
          .sig-col { text-align: center; width: 45%; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        ${element.innerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
}
