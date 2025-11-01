import React from 'react';
import { Task } from '../../utils/types';
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

const Legend: any = RechartsLegend;
type ReportsViewProps = {
  tasks: Task[];
};

const getStartOfDay = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const ReportChart = ({ data, title }: { data: any[]; title: string }) => (
  <div className="flex-1 min-w-[300px] p-4 bg-[#1c1c1c] rounded-lg h-[350px] mt-10">
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

export const ReportsView: React.FC<ReportsViewProps> = ({ tasks }) => {
  const now = new Date();
  const today = getStartOfDay(new Date());

  const startOfWeek = getStartOfDay(new Date());
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  const startOfMonth = getStartOfDay(
    new Date(now.getFullYear(), now.getMonth(), 1)
  );
  const countStatuses = (filterDate: Date) => {
    return tasks
      .filter((task) => {
        const taskDateStr = task.modified || task.due;
        if (!taskDateStr) return false;

        const modifiedDate = getStartOfDay(new Date(taskDateStr));
        return modifiedDate >= filterDate;
      })
      .reduce(
        (acc, task) => {
          if (task.status === 'completed') {
            acc.completed += 1;
          } else if (task.status === 'pending') {
            acc.ongoing += 1;
          }
          return acc;
        },
        { completed: 0, ongoing: 0 }
      );
  };

  const dailyData = [{ name: 'Today', ...countStatuses(today) }];
  const weeklyData = [{ name: 'This Week', ...countStatuses(startOfWeek) }];
  const monthlyData = [{ name: 'This Month', ...countStatuses(startOfMonth) }];

  return (
    <div className="flex flex-wrap gap-4 justify-center">
      <ReportChart data={dailyData} title="Daily Report" />
      <ReportChart data={weeklyData} title="Weekly Report" />
      <ReportChart data={monthlyData} title="Monthly Report" />
    </div>
  );
};
