import { toast } from 'react-toastify';
import { Task } from './types';

export function exportTasksAsJSON(tasks: Task[]) {
  if (!tasks || tasks.length === 0) {
    console.warn('No tasks to export.');
    toast.error('User does not have any task in their list');
    return;
  }
  const jsonString = JSON.stringify(tasks, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tasks.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportTasksAsTXT(tasks: Task[]) {
  if (!tasks || tasks.length === 0) {
    console.warn('No tasks to export.');
    toast.error('User does not have any task in their list');
    return;
  }
  let txtContent = 'Your TaskWarrior Tasks\n';
  txtContent += '========================================\n\n';

  tasks.forEach((task) => {
    txtContent += `Description: ${task.description}\n`;
    txtContent += `Status: ${task.status}\n`;
    txtContent += `Project: ${task.project || 'None'}\n`;
    txtContent += `Tags: ${task.tags.length ? task.tags.join(', ') : 'None'}\n`;
    txtContent += `UUID: ${task.uuid}\n`;
    txtContent += `Entry: ${new Date(task.entry).toLocaleString()}\n`;
    txtContent += `Due: ${task.due ? new Date(task.due).toLocaleString() : 'None'}\n`;
    txtContent += `----------------------------------------\n\n`;
  });

  const blob = new Blob([txtContent], { type: 'text/plain' });

  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'tasks.txt';
  document.body.appendChild(a);

  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
