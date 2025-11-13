import html2canvas from 'html2canvas';
import { toast } from 'react-toastify';

/**
 * Interface for report data structure
 */
export interface ReportData {
  name: string;
  completed: number;
  ongoing: number;
}

/**
 * Generates and downloads a CSV file from report data
 * @param data - Array of report data objects
 * @param reportType - Type of report (e.g., "Daily", "Weekly", "Monthly")
 */
export const exportReportToCSV = (
  data: ReportData[],
  reportType: string
): void => {
  try {
    // Create CSV header
    const headers = ['Report Type', 'Completed', 'Ongoing'];

    // Create CSV rows
    const rows = data.map((item) => [
      item.name,
      item.completed.toString(),
      item.ongoing.toString(),
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    // Create blob and download
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

/**
 * Captures a chart element as PNG and downloads it
 * @param elementId - DOM element ID of the chart container
 * @param reportType - Type of report (e.g., "Daily", "Weekly", "Monthly")
 * @returns Promise that resolves when download is complete
 */
export const exportChartToPNG = async (
  elementId: string,
  reportType: string
): Promise<void> => {
  try {
    const element = document.getElementById(elementId);

    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }

    // Create canvas from the element
    const canvas = await html2canvas(element, {
      backgroundColor: '#1c1c1c',
      scale: 2, // Higher quality
      logging: false,
      useCORS: true,
    });

    // Convert canvas to blob
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

/**
 * Triggers a file download in the browser
 * @param blob - File blob to download
 * @param filename - Name of the file to save
 */
const downloadFile = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Generates a standardized filename for downloads
 * @param reportType - Type of report (e.g., "Daily", "Weekly", "Monthly")
 * @param extension - File extension (csv or png)
 * @returns Formatted filename string
 */
const generateFileName = (reportType: string, extension: string): string => {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
  const reportTypeLower = reportType.toLowerCase().replace(/\s+/g, '-');
  return `ccsync-${reportTypeLower}-report-${dateStr}.${extension}`;
};
