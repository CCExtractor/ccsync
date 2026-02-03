import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Key } from '@/components/ui/key-button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AddTaskDialogProps } from '@/components/utils/types';
import { format } from 'date-fns';
import { Clock, Tag as TagIcon, FileText, Link2, Repeat } from 'lucide-react';
import { MultiSelect } from './MultiSelect';

export const AddTaskdialog = ({
  onOpenChange,
  isOpen,
  setIsOpen,
  newTask,
  setNewTask,
  onSubmit,
  isCreatingNewProject,
  setIsCreatingNewProject,
  uniqueProjects = [],
  uniqueTags = [],
  allTasks = [],
}: AddTaskDialogProps) => {
  const [annotationInput, setAnnotationInput] = useState('');
  const [dependencySearch, setDependencySearch] = useState('');
  const [showDependencyResults, setShowDependencyResults] = useState(false);

  const handleDialogOpenChange = (open: boolean) => {
    onOpenChange?.(open);
    setIsOpen(open);
  };

  const getFilteredTasks = () => {
    const availableTasks = allTasks.filter(
      (task) =>
        task.status === 'pending' && !newTask.depends.includes(task.uuid)
    );

    if (dependencySearch.trim() === '') {
      return [];
    }

    return availableTasks
      .filter(
        (task) =>
          task.description
            .toLowerCase()
            .includes(dependencySearch.toLowerCase()) ||
          (task.project &&
            task.project
              .toLowerCase()
              .includes(dependencySearch.toLowerCase())) ||
          (task.tags &&
            task.tags.some((tag) =>
              tag.toLowerCase().includes(dependencySearch.toLowerCase())
            ))
      )
      .slice(0, 5);
  };

  useEffect(() => {
    if (!isOpen) {
      setAnnotationInput('');
    }
  }, [isOpen]);

  const handleAddAnnotation = () => {
    if (annotationInput.trim()) {
      const newAnnotation = {
        entry: new Date().toISOString(),
        description: annotationInput.trim(),
      };
      setNewTask({
        ...newTask,
        annotations: [...newTask.annotations, newAnnotation],
      });
      setAnnotationInput('');
    }
  };

  const handleRemoveAnnotation = (annotationToRemove: {
    entry: string;
    description: string;
  }) => {
    setNewTask({
      ...newTask,
      annotations: newTask.annotations.filter(
        (annotation) => annotation !== annotationToRemove
      ),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" id="add-new-task" variant="outline">
          Add Task
          <Key label="a" />
        </Button>
      </DialogTrigger>
      <DialogContent
        tabIndex={0}
        className="max-w-6xl max-h-[90vh] flex flex-col"
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            <span className="ml-0 mb-0 mr-0 text-2xl mt-0 md:text-2xl font-bold">
              <span className="inline bg-gradient-to-r from-[#F596D3]  to-[#D247BF] text-transparent bg-clip-text">
                Add a{' '}
              </span>
              new task
            </span>
          </DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new task
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto space-y-6 py-4 px-2 flex-1 min-h-0">
          {/* Essential Fields Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Essential Fields</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Description - Full Width */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  name="description"
                  type="text"
                  placeholder="Task description..."
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      description: e.target.value,
                    })
                  }
                  required
                />
              </div>

              {/* Priority and Project - Two Column */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    name="priority"
                    value={newTask.priority}
                    onChange={(e) =>
                      setNewTask({
                        ...newTask,
                        priority: e.target.value,
                      })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Select priority</option>
                    <option value="H">High</option>
                    <option value="M">Medium</option>
                    <option value="L">Low</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project">Project</Label>
                  <Select
                    value={
                      isCreatingNewProject ? '__CREATE_NEW__' : newTask.project
                    }
                    onValueChange={(value) => {
                      if (value === '__CREATE_NEW__') {
                        setIsCreatingNewProject(true);
                        setNewTask({ ...newTask, project: '' });
                      } else if (value === '__NONE__') {
                        setIsCreatingNewProject(false);
                        setNewTask({ ...newTask, project: '' });
                      } else {
                        setIsCreatingNewProject(false);
                        setNewTask({ ...newTask, project: value });
                      }
                    }}
                  >
                    <SelectTrigger id="project" data-testid="project-select">
                      <SelectValue
                        placeholder={
                          uniqueProjects.length
                            ? 'Select a project'
                            : 'No projects yet'
                        }
                      >
                        {isCreatingNewProject
                          ? newTask.project
                            ? `New: ${newTask.project}`
                            : '+ Create new project…'
                          : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent
                      onWheel={(e) => e.stopPropagation()}
                      className="max-h-60 overflow-y-auto"
                    >
                      <SelectItem value="__CREATE_NEW__">
                        + Create new project…
                      </SelectItem>
                      <SelectItem value="__NONE__">No project</SelectItem>
                      {uniqueProjects.map((project: string) => (
                        <SelectItem key={project} value={project}>
                          {project}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isCreatingNewProject && (
                    <Input
                      id="project-name"
                      placeholder="New project name"
                      value={newTask.project}
                      autoFocus
                      onChange={(e) =>
                        setNewTask({ ...newTask, project: e.target.value })
                      }
                      className="mt-2"
                    />
                  )}
                </div>
              </div>

              {/* Due Date - Full Width */}
              <div className="space-y-2">
                <Label
                  htmlFor="due"
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  Due Date
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-normal">
                    (with time)
                  </span>
                </Label>
                <DateTimePicker
                  date={
                    newTask.due
                      ? new Date(
                          newTask.due.includes('T')
                            ? newTask.due
                            : `${newTask.due}T00:00:00`
                        )
                      : undefined
                  }
                  onDateTimeChange={(date, hasTime) => {
                    setNewTask({
                      ...newTask,
                      due: date
                        ? hasTime
                          ? date.toISOString()
                          : format(date, 'yyyy-MM-dd')
                        : '',
                    });
                  }}
                  placeholder="Select due date and time"
                />
              </div>
            </CardContent>
          </Card>

          {/* Dates Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Start Date */}
                <div className="space-y-2">
                  <Label htmlFor="start">Start Date</Label>
                  <DatePicker
                    date={newTask.start ? new Date(newTask.start) : undefined}
                    onDateChange={(date) => {
                      setNewTask({
                        ...newTask,
                        start: date ? format(date, 'yyyy-MM-dd') : '',
                      });
                    }}
                    placeholder="Select start date"
                  />
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <Label htmlFor="end">End Date</Label>
                  <DatePicker
                    date={newTask.end ? new Date(newTask.end) : undefined}
                    onDateChange={(date) => {
                      setNewTask({
                        ...newTask,
                        end: date ? format(date, 'yyyy-MM-dd') : '',
                      });
                    }}
                    placeholder="Select end date"
                  />
                </div>

                {/* Entry Date */}
                <div className="space-y-2">
                  <Label htmlFor="entry">Entry Date</Label>
                  <DatePicker
                    date={newTask.entry ? new Date(newTask.entry) : undefined}
                    onDateChange={(date) => {
                      setNewTask({
                        ...newTask,
                        entry: date ? format(date, 'yyyy-MM-dd') : '',
                      });
                    }}
                    placeholder="Select entry date"
                  />
                </div>

                {/* Wait Date */}
                <div className="space-y-2">
                  <Label htmlFor="wait">Wait Date</Label>
                  <DatePicker
                    date={newTask.wait ? new Date(newTask.wait) : undefined}
                    onDateChange={(date) => {
                      setNewTask({
                        ...newTask,
                        wait: date ? format(date, 'yyyy-MM-dd') : '',
                      });
                    }}
                    placeholder="Select wait date"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Fields */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Advanced Fields</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tags */}
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <TagIcon className="h-4 w-4 text-blue-500" />
                  <span className="font-semibold text-sm">Tags</span>
                  {newTask.tags.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-2 h-5 px-2 text-xs"
                    >
                      {newTask.tags.length}
                    </Badge>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="p-4 bg-muted/30 rounded-lg border border-dashed">
                    <MultiSelect
                      availableItems={uniqueTags}
                      selectedItems={newTask.tags}
                      onItemsChange={(tags: string[]) =>
                        setNewTask({ ...newTask, tags })
                      }
                      placeholder="Select or create tags..."
                    />
                  </div>
                </div>
              </section>

              {/* Annotations */}
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-500" />
                  <span className="font-semibold text-sm">Annotations</span>
                  {newTask.annotations.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-2 h-5 px-2 text-xs"
                    >
                      {newTask.annotations.length}
                    </Badge>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="p-4 bg-muted/30 rounded-lg border border-dashed">
                    <Input
                      id="annotations"
                      name="annotations"
                      placeholder="Add an annotation (press Enter to add)"
                      value={annotationInput}
                      onChange={(e) => setAnnotationInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddAnnotation();
                        }
                      }}
                      className="h-10"
                    />
                  </div>
                  {newTask.annotations.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Added annotations:
                      </p>
                      <div className="flex flex-wrap gap-2 p-3 bg-background rounded-lg border min-h-[60px]">
                        {newTask.annotations.map((annotation, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="h-auto py-2 px-3 text-sm bg-green-500/10 text-green-700 dark:text-green-300 hover:bg-green-500/20"
                          >
                            <FileText className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span className="max-w-[200px] truncate">
                              {annotation.description}
                            </span>
                            <button
                              type="button"
                              className="ml-2 text-red-500 hover:text-red-700 flex-shrink-0"
                              aria-label="remove annotation"
                              onClick={() => handleRemoveAnnotation(annotation)}
                            >
                              ✖
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Dependencies */}
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-purple-500" />
                  <span className="font-semibold text-sm">Dependencies</span>
                  {newTask.depends.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-2 h-5 px-2 text-xs"
                    >
                      {newTask.depends.length}
                    </Badge>
                  )}
                </div>
                <div className="space-y-3 relative">
                  <div className="p-4 bg-muted/30 rounded-lg border border-dashed">
                    <Input
                      placeholder="Search and select tasks this depends on..."
                      value={dependencySearch}
                      onChange={(e) => {
                        setDependencySearch(e.target.value);
                        setShowDependencyResults(e.target.value.trim() !== '');
                      }}
                      onFocus={() =>
                        setShowDependencyResults(dependencySearch.trim() !== '')
                      }
                      className="h-10"
                    />
                  </div>

                  {/* Search results dropdown */}
                  {showDependencyResults && (
                    <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {(() => {
                        const filteredTasks = getFilteredTasks();

                        if (filteredTasks.length === 0) {
                          return (
                            <div className="p-3 text-sm text-muted-foreground text-center">
                              No tasks found matching your search
                            </div>
                          );
                        }

                        return filteredTasks.map((task) => (
                          <div
                            key={task.uuid}
                            className="p-3 cursor-pointer hover:bg-accent transition-colors"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setNewTask({
                                ...newTask,
                                depends: [...newTask.depends, task.uuid],
                              });
                              setDependencySearch('');
                              setShowDependencyResults(false);
                            }}
                          >
                            <div className="flex items-center gap-2 w-full min-w-0">
                              <span className="font-medium text-xs shrink-0 text-muted-foreground">
                                #{task.id}
                              </span>
                              <span className="truncate flex-1 text-sm">
                                {task.description}
                              </span>
                              {task.project && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs px-1 py-0 shrink-0"
                                >
                                  {task.project}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  )}

                  {/* Display selected dependencies */}
                  {newTask.depends.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Selected dependencies:
                      </p>
                      <div className="flex flex-wrap gap-2 p-3 bg-background rounded-lg border min-h-[60px]">
                        {newTask.depends.map((taskUuid) => {
                          const dependentTask = allTasks.find(
                            (t) => t.uuid === taskUuid
                          );
                          return (
                            <Badge
                              key={taskUuid}
                              variant="secondary"
                              className="h-auto py-2 px-3 text-sm bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20"
                            >
                              <Link2 className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="max-w-[200px] truncate">
                                #{dependentTask?.id || '?'}{' '}
                                {dependentTask?.description?.substring(0, 20) ||
                                  taskUuid.substring(0, 8)}
                                {dependentTask?.description &&
                                  dependentTask.description.length > 20 &&
                                  '...'}
                              </span>
                              <button
                                type="button"
                                className="ml-2 text-red-500 hover:text-red-700 flex-shrink-0"
                                onClick={() => {
                                  setNewTask({
                                    ...newTask,
                                    depends: newTask.depends.filter(
                                      (d) => d !== taskUuid
                                    ),
                                  });
                                }}
                              >
                                ✖
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Recurrence */}
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <Repeat className="h-4 w-4 text-orange-500" />
                  <span className="font-semibold text-sm">Recurrence</span>
                  {newTask.recur && (
                    <Badge
                      variant="secondary"
                      className="ml-2 h-5 px-2 text-xs capitalize"
                    >
                      {newTask.recur}
                    </Badge>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="p-4 bg-muted/30 rounded-lg border border-dashed">
                    <select
                      id="recur"
                      name="recur"
                      value={newTask.recur}
                      onChange={(e) =>
                        setNewTask({
                          ...newTask,
                          recur: e.target.value,
                        })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">None</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  {newTask.recur && (
                    <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                      <div className="flex items-center gap-2 text-sm text-orange-700 dark:text-orange-300">
                        <Repeat className="h-4 w-4" />
                        <span>
                          This task will repeat{' '}
                          <strong className="capitalize">
                            {newTask.recur}
                          </strong>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </CardContent>
          </Card>
        </div>
        <DialogFooter className="flex-shrink-0 mt-4">
          <Button
            variant="outline"
            onClick={() => {
              setIsOpen(false);
              onOpenChange?.(false);
            }}
          >
            Cancel
          </Button>
          <Button
            className="bg-gradient-to-r from-[#F596D3] to-[#D247BF] hover:from-[#F596D3] hover:to-[#D247BF] text-white"
            onClick={() => {
              onSubmit(newTask);
            }}
          >
            Add Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
