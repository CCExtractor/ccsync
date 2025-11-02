import React from 'react';
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
const Legend: any = RechartsLegend;

export const ReportChart: React.FC<ReportChartProps> = ({ data, title }) => (
  <div className="flex-1 min-w-[300px] p-4 bg-[#1c1c1c] rounded-lg h-[350px]">
    <h3 className="text-center text-xl mb-6 text-white">{title}</h3>
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
        />
        <Legend wrapperClassName="text-white" />
        <Bar dataKey="completed" fill="#E776CB" name="Completed" />
        <Bar dataKey="ongoing" fill="#5FD9FA" name="Ongoing" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);
