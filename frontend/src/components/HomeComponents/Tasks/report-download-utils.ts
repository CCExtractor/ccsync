import html2canvas from 'html2canvas';
import { toast } from 'react-toastify';

export interface ReportData {
  name: string;
  completed: number;
  ongoing: number;
}

export const exportReportToCSV = (
  data: ReportData[],
  reportType: string
): void => {
  try {
    const headers = ['Report Type', 'Completed', 'Ongoing'];
    const rows = data.map((item) => [
      item.name,
      item.completed.toString(),
      item.ongoing.toString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = generateFileName(reportType, 'csv');
    downloadFile(blob, filename);

    toast.success(`${reportType} Report exported to CSV successfully!`, {
      position: 'bottom-right',
      autoClose: 3000,
    });
  } catch (error) {
    console.error('Error exporting CSV:', error);
    toast.error('Failed to export CSV. Please try again.', {
      position: 'bottom-right',
      autoClose: 3000,
    });
  }
};

export const exportChartToPNG = async (
  elementId: string,
  reportType: string
): Promise<void> => {
  try {
    const element = document.getElementById(elementId);

    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }

    const canvas = await html2canvas(element, {
      backgroundColor: '#1c1c1c',
      scale: 2,
      logging: false,
      useCORS: true,
    });

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      }, 'image/png');
    });

    const filename = generateFileName(reportType, 'png');
    downloadFile(blob, filename);

    toast.success(`${reportType} Report exported to PNG successfully!`, {
      position: 'bottom-right',
      autoClose: 3000,
    });
  } catch (error) {
    console.error('Error exporting PNG:', error);
    toast.error('Failed to export PNG. Please try again.', {
      position: 'bottom-right',
      autoClose: 3000,
    });
  }
};

const downloadFile = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const generateFileName = (reportType: string, extension: string): string => {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
  const reportTypeLower = reportType.toLowerCase().replace(/\s+/g, '-');
  return `ccsync-${reportTypeLower}-report-${dateStr}.${extension}`;
};
