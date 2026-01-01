import React from 'react';
import { ReportsViewProps } from '../../utils/types';
import { getStartOfDay } from '../../utils/utils';
import { ReportChart } from './ReportChart';
import { parseTaskwarriorDate, isOverdue } from '../Tasks/tasks-utils';

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
        const taskDateStr = task.end || task.due || task.entry;
        if (!taskDateStr) return false;

        const parsedDate = parseTaskwarriorDate(taskDateStr);
        if (!parsedDate) return false;

        const modifiedDate = getStartOfDay(parsedDate);

        // Include tasks within the time range
        if (modifiedDate >= filterDate) {
          return true;
        }

        // Also include overdue pending tasks even if their due date is before the filter date
        // This ensures overdue tasks appear in current reports
        if (task.status === 'pending' && task.due && isOverdue(task.due)) {
          return true;
        }

        return false;
      })
      .reduce(
        (acc, task) => {
          if (task.status === 'completed') {
            acc.completed += 1;
          } else if (task.status === 'pending') {
            if (isOverdue(task.due)) {
              acc.overdue += 1;
            } else {
              acc.ongoing += 1;
            }
          }
          return acc;
        },
        { completed: 0, ongoing: 0, overdue: 0 }
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
