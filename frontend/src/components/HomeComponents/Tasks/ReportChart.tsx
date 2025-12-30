import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend as RechartsLegend,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { ReportChartProps } from '../../utils/types';
import { Button } from '../../ui/button';
import { FileText, Image, Loader2 } from 'lucide-react';
import { exportReportToCSV, exportChartToPNG } from './report-download-utils';

const Legend: any = RechartsLegend;

export const ReportChart: React.FC<ReportChartProps> = ({
  data,
  title,
  chartId,
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleCSVExport = () => {
    exportReportToCSV(data, title);
  };

  const handlePNGExport = async () => {
    setIsExporting(true);
    try {
      await exportChartToPNG(chartId, title);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      id={chartId}
      className="flex-1 min-w-[300px] p-4 border border[1px] bg-black/15 dark:bg-[#1c1c1c] rounded-lg h-[350px] relative"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-center text-xl text-black dark:text-white flex-1">
          {title}
        </h3>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCSVExport}
            disabled={isExporting}
            title="Download as CSV"
            className="h-8 w-8 hover:bg-transparent dark:hover:bg-gray-700"
          >
            <FileText className="h-4 w-4 text-black dark:text-gray-400 dark:hover:text-white m-1" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePNGExport}
            disabled={isExporting}
            title="Download as PNG"
            className="h-8 w-8 hover:bg-transparent dark:hover:bg-gray-700"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            ) : (
              <Image className="h-4 w-4 text-black dark:text-gray-400 dark:hover:text-white" />
            )}
          </Button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="80%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#555" />
          <XAxis dataKey="name" stroke="#999" />
          <YAxis allowDecimals={false} stroke="#999" />
          <Tooltip
            contentStyle={{ backgroundColor: '#333', border: 'none' }}
            labelClassName="text-white"
            cursor={false}
          />
          <Legend wrapperClassName="text-white" />
          <Bar
            dataKey="completed"
            fill="#E776CB"
            name="Completed"
            label={{ position: 'top', fill: 'white', fontSize: 12 }}
          />
          <Bar
            dataKey="ongoing"
            fill="#5FD9FA"
            name="Ongoing"
            label={{ position: 'top', fill: 'white', fontSize: 12 }}
          />
          <Bar
            dataKey="overdue"
            fill="#F33434"
            name="Overdue"
            label={{ position: 'top', fill: 'white', fontSize: 12 }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
