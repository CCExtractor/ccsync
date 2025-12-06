import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { CopyIcon, CheckIcon } from 'lucide-react';
import { url } from '../../utils/URLs';
import { toast } from 'react-toastify';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  syncId?: string;
  operation?: string;
}

interface DevLogsProps {
  isOpen: boolean;
}

export const DevLogs: React.FC<DevLogsProps> = ({ isOpen }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedLevel === 'all') {
      setFilteredLogs(logs);
    } else {
      setFilteredLogs(logs.filter((log) => log.level === selectedLevel));
    }
  }, [selectedLevel, logs]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${url.backendURL}sync/logs?last=100`);
      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }
      const data = await response.json();
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to fetch logs', {
        position: 'bottom-left',
        autoClose: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyLog = (log: LogEntry, index: number) => {
    const logText = `[${log.timestamp}] [${log.level}] ${log.message}${
      log.operation ? ` | Operation: ${log.operation}` : ''
    }${log.syncId ? ` | Sync ID: ${log.syncId}` : ''}`;
    navigator.clipboard.writeText(logText);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAllLogs = () => {
    const allLogsText = filteredLogs
      .map(
        (log) =>
          `[${log.timestamp}] [${log.level}] ${log.message}${
            log.operation ? ` | Operation: ${log.operation}` : ''
          }${log.syncId ? ` | Sync ID: ${log.syncId}` : ''}`
      )
      .join('\n');
    navigator.clipboard.writeText(allLogsText);
    toast.success('All logs copied to clipboard', {
      position: 'bottom-left',
      autoClose: 2000,
    });
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR':
        return 'text-red-600 dark:text-red-400';
      case 'WARN':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'INFO':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4 gap-4">
        <Select value={selectedLevel} onValueChange={setSelectedLevel}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="INFO">INFO</SelectItem>
            <SelectItem value="WARN">WARN</SelectItem>
            <SelectItem value="ERROR">ERROR</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={copyAllLogs}
            disabled={filteredLogs.length === 0}
          >
            Copy All
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto border rounded-md p-4 bg-gray-50 dark:bg-gray-900">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No logs available
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLogs.map((log, index) => (
              <div
                key={index}
                className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-shadow group"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 font-mono text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-gray-500 dark:text-gray-400">
                        {formatTimestamp(log.timestamp)}
                      </span>
                      <span
                        className={`font-semibold ${getLevelColor(log.level)}`}
                      >
                        [{log.level}]
                      </span>
                      {log.operation && (
                        <span className="text-purple-600 dark:text-purple-400 text-xs">
                          {log.operation}
                        </span>
                      )}
                    </div>
                    <div className="text-gray-800 dark:text-gray-200 break-words">
                      {log.message}
                    </div>
                    {log.syncId && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Sync ID: {log.syncId}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyLog(log, index)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {copiedIndex === index ? (
                      <CheckIcon className="h-4 w-4 text-green-600" />
                    ) : (
                      <CopyIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
