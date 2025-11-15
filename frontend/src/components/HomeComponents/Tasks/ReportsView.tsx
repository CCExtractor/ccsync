import React from 'react';
import { ReportsViewProps } from '../../utils/types';
import { getStartOfDay } from '../../utils/utils';
import { ReportChart } from './ReportChart';

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
    <div className="flex flex-wrap gap-4 justify-center mt-10">
      <ReportChart
        data={dailyData}
        title="Daily Report"
        chartId="daily-report-chart"
      />
      <ReportChart
        data={weeklyData}
        title="Weekly Report"
        chartId="weekly-report-chart"
      />
      <ReportChart
        data={monthlyData}
        title="Monthly Report"
        chartId="monthly-report-chart"
      />
    </div>
  );
};
