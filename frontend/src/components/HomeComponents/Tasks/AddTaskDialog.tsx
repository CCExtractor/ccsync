import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import {
  AddFieldKey,
  AddTaskDialogProps,
  FieldKey,
} from '@/components/utils/types';
import { format } from 'date-fns';
import { ADDTASKDIALOG_FIELDS } from './constants';
import { useAddTaskDialogKeyboard } from './UseTaskDialogKeyboard';
import { useAddTaskDialogFocusMap } from './UseTaskDialogFocusMap';
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

  const inputRefs = useRef<
    Partial<
      Record<
        FieldKey,
        HTMLInputElement | HTMLButtonElement | HTMLSelectElement | null
      >
    >
  >({});
  const [focusedFieldIndex, setFocusedFieldIndex] = useState(0);

  const focusedField = ADDTASKDIALOG_FIELDS[focusedFieldIndex];

  const handleDialogOpenChange = (open: boolean) => {
    onOpenChange?.(open);
    setIsOpen(open);
  };

  useEffect(() => {
    const element = inputRefs.current[focusedField];
    if (!element) return;

    element.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  }, [focusedField]);

  const focusMap = useAddTaskDialogFocusMap({
    fields: ADDTASKDIALOG_FIELDS,
    inputRefs: inputRefs as any,
  });

  useEffect(() => {
    focusMap(focusedField);
  }, [focusedField, focusMap]);

  const closeDialog = () => setIsOpen(false);

  const onEnter = (field: AddFieldKey) => {
    const element = inputRefs.current[field];
    if (!element) return;

    element.focus();
    element.click();
  };

  const handleDialogKeyDown = useAddTaskDialogKeyboard({
    fields: ADDTASKDIALOG_FIELDS,
    focusedFieldIndex,
    setFocusedFieldIndex,
    onEnter,
    closeDialog,
  });

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
        <Button
          type="button"
          id="add-new-task"
          variant="outline"
          onClick={() => setIsOpen(true)}
        >
          Add Task
          <Key label="a" />
        </Button>
      </DialogTrigger>
      <DialogContent tabIndex={0} onKeyDown={handleDialogKeyDown}>
        <DialogHeader>
          <DialogTitle>
            <span className="ml-0 mb-0 mr-0 text-2xl mt-0 md:text-2xl font-bold">
              <span className="inline bg-gradient-to-r from-[#F596D3]  to-[#D247BF] text-transparent bg-clip-text">
                Add a{' '}
              </span>
              new task
            </span>
          </DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new task.
          </DialogDescription>
        </DialogHeader>
        <div className="h-96 overflow-auto p-2">
          <div className="flex flex-col items-start justify-start">
            <div
              className={`grid grid-cols-4 items-center gap-4 border-b py-6 px-2 w-full ${focusedField === 'description' ? 'dark:bg-muted/50 bg-black/15' : ''}`}
            >
              <Label htmlFor="description" className="text-left col-span-1">
                Description
              </Label>
              <div className="col-span-3">
                <Input
                  ref={(element) => (inputRefs.current.description = element)}
                  id="description"
                  name="description"
                  type="text"
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      description: e.target.value,
                    })
                  }
                  required
                  className="col-span-6"
                />
              </div>
            </div>
            <div
              className={`grid grid-cols-4 items-center gap-4 border-b py-6 px-2 w-full ${focusedField === 'priority' ? 'dark:bg-muted/50 bg-black/15' : ''} `}
            >
              <Label
                htmlFor="priority"
                className="col-span-1 text-left w-[75px]"
              >
                Priority
              </Label>
              <div className="col-span-1 flex items-center">
                <select
                  ref={(element) => (inputRefs.current.priority = element)}
                  id="priority"
                  name="priority"
                  value={newTask.priority}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      priority: e.target.value,
                    })
                  }
                  className="border rounded-md px-2 py-1 w-full bg-white text-black dark:bg-black dark:text-white transition-colors"
                >
                  <option value="H">H</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                </select>
              </div>
            </div>

            <div
              className={`grid grid-cols-4 items-center gap-4 border-b py-6 px-2 w-full ${focusedField === 'project' ? 'dark:bg-muted/50 bg-black/15' : ''}`}
            >
              <Label
                htmlFor="project"
                className="text-left col-span-1 w-[77px]"
              >
                Project
              </Label>
              <div className="col-span-3 space-y-2">
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
                  data-testid="project-select"
                >
                  <SelectTrigger
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                        e.preventDefault();
                      }
                      if (e.key === 'Enter') {
                        (e.currentTarget as HTMLButtonElement).click();
                      }
                    }}
                    ref={(element) => (inputRefs.current.project = element)}
                    id="project"
                  >
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
                  />
                )}
              </div>
            </div>
            <div
              className={`grid grid-cols-4 items-center gap-4 border-b py-6 px-2 w-full ${focusedField === 'due' ? 'dark:bg-muted/50 bg-black/15' : ''} `}
            >
              <Label htmlFor="due" className="text-left w-[77px] col-span-1">
                Due
              </Label>
              <div className="col-span-3">
                <DateTimePicker
                  ref={(element) => (inputRefs.current.due = element)}
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
            </div>
            <div
              className={`grid grid-cols-4 items-center gap-4 border-b py-6 px-2 w-full ${focusedField === 'start' ? 'dark:bg-muted/50 bg-black/15' : ''}`}
            >
              <Label htmlFor="start" className="text-left col-span-1 w-[77px]">
                Start
              </Label>
              <div className="col-span-3">
                <DateTimePicker
                  ref={(element) => (inputRefs.current.start = element)}
                  date={
                    newTask.start
                      ? new Date(
                          newTask.start.includes('T')
                            ? newTask.start
                            : `${newTask.start}T00:00:00`
                        )
                      : undefined
                  }
                  onDateTimeChange={(date, hasTime) => {
                    setNewTask({
                      ...newTask,
                      start: date
                        ? hasTime
                          ? date.toISOString()
                          : format(date, 'yyyy-MM-dd')
                        : '',
                    });
                  }}
                  placeholder="Select start date and time"
                />
              </div>
            </div>
            <div
              className={`grid grid-cols-4 items-center gap-4 border-b py-6 px-2 w-full ${focusedField === 'end' ? 'dark:bg-muted/50 bg-black/15' : ''} `}
            >
              <Label htmlFor="end" className="text-left col-span-1 w-[77px]">
                End
              </Label>
              <div className="col-span-3">
                <DateTimePicker
                  ref={(element) => (inputRefs.current.end = element)}
                  date={
                    newTask.end
                      ? new Date(
                          newTask.end.includes('T')
                            ? newTask.end
                            : `${newTask.end}T00:00:00`
                        )
                      : undefined
                  }
                  onDateTimeChange={(date, hasTime) => {
                    setNewTask({
                      ...newTask,
                      end: date
                        ? hasTime
                          ? date.toISOString()
                          : format(date, 'yyyy-MM-dd')
                        : '',
                    });
                  }}
                  placeholder="Select end date and time"
                />
                {newTask.end && (
                  <div className="mt-1.5 pl-2.5 border-l-2 border-amber-500/60">
                    <p className="text-xs text-amber-400 leading-tight">
                      Task will be marked as completed
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div
              className={`grid grid-cols-4 items-center gap-4 border-b py-6 px-2 w-full ${focusedField === 'entry' ? 'dark:bg-muted/50 bg-black/15' : ''} `}
            >
              <Label htmlFor="entry" className="text-left col-span-1 w-[77px]">
                Entry
              </Label>
              <div className="col-span-3">
                <DateTimePicker
                  ref={(element) => (inputRefs.current.entry = element)}
                  date={
                    newTask.entry
                      ? new Date(
                          newTask.entry.includes('T')
                            ? newTask.entry
                            : `${newTask.entry}T00:00:00`
                        )
                      : undefined
                  }
                  onDateTimeChange={(date, hasTime) => {
                    setNewTask({
                      ...newTask,
                      entry: date
                        ? hasTime
                          ? date.toISOString()
                          : format(date, 'yyyy-MM-dd')
                        : '',
                    });
                  }}
                  placeholder="Select entry date and time"
                />
              </div>
            </div>
            <div
              className={`grid grid-cols-4 items-center gap-4 border-b py-6 px-2 w-full ${focusedField === 'wait' ? 'dark:bg-muted/50 bg-black/15' : ''} `}
            >
              <Label htmlFor="wait" className="text-left col-span-1 w-[77px]">
                Wait
              </Label>
              <div className="col-span-3">
                <DateTimePicker
                  ref={(element) => (inputRefs.current.wait = element)}
                  date={
                    newTask.wait
                      ? new Date(
                          newTask.wait.includes('T')
                            ? newTask.wait
                            : `${newTask.wait}T00:00:00`
                        )
                      : undefined
                  }
                  onDateTimeChange={(date, hasTime) => {
                    setNewTask({
                      ...newTask,
                      wait: date
                        ? hasTime
                          ? date.toISOString()
                          : format(date, 'yyyy-MM-dd')
                        : '',
                    });
                  }}
                  placeholder="Select wait date and time"
                />
              </div>
            </div>
            <div
              className={`grid grid-cols-4 items-center gap-4 border-b py-6 px-2 w-full ${focusedField === 'recur' ? 'dark:bg-muted/50 bg-black/15' : ''} `}
            >
              <Label htmlFor="recur" className="text-left col-span-1 w-[77px]">
                Recur
              </Label>
              <div className="col-span-3 flex items-start">
                <select
                  ref={(element) => (inputRefs.current.recur = element)}
                  id="recur"
                  name="recur"
                  value={newTask.recur}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      recur: e.target.value,
                    })
                  }
                  className="border rounded-md px-2 py-1 w-full bg-white text-black dark:bg-black dark:text-white transition-colors"
                >
                  <option value="">None</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>
            <div
              className={`grid grid-cols-4 items-center gap-4 border-b py-6 px-2 w-full ${focusedField === 'tags' ? 'dark:bg-muted/50 bg-black/15' : ''} `}
            >
              <Label htmlFor="tags" className="text-left col-span-1 w-[77px]">
                Tags
              </Label>
              <div className="col-span-3">
                <MultiSelect
                  ref={(element) => (inputRefs.current.tags = element)}
                  availableItems={uniqueTags}
                  selectedItems={newTask.tags}
                  onItemsChange={(tags: string[]) =>
                    setNewTask({ ...newTask, tags })
                  }
                  placeholder="Select or create tags"
                />
              </div>
            </div>

            <div
              className={`grid grid-cols-4 items-center gap-4 border-b py-6 px-2 w-full ${focusedField === 'annotations' ? 'dark:bg-muted/50 bg-black/15' : ''} `}
            >
              <Label
                htmlFor="annotations"
                className="text-left col-span-1 w-[77px]"
              >
                Annotation
              </Label>
              <div className="col-span-3">
                <Input
                  ref={(element) => (inputRefs.current.annotations = element)}
                  id="annotations"
                  name="annotations"
                  placeholder="Add an annotation"
                  value={annotationInput}
                  onChange={(e) => setAnnotationInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddAnnotation()}
                  className="col-span-3"
                />
              </div>
            </div>

            {newTask.annotations.length > 0 && (
              <div className="grid grid-cols-4 items-center">
                <div> </div>
                <div className="flex flex-wrap gap-2 col-span-3">
                  {newTask.annotations.map((annotation, index) => (
                    <Badge key={index}>
                      <span>{annotation.description}</span>
                      <button
                        type="button"
                        className="ml-2 text-red-500"
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

            <div
              className={`grid grid-cols-4 items-center gap-4 border-b py-6 px-2 w-full ${focusedField === 'depends' ? 'dark:bg-muted/50 bg-black/15' : ''} `}
            >
              <Label
                htmlFor="depends"
                className="text-left col-span-1 w-[87px]"
              >
                Depends On
              </Label>
              <div className="col-span-3 space-y-2 relative">
                {/* Search input */}
                <Input
                  ref={(element) => (inputRefs.current.depends = element)}
                  placeholder="Search and select tasks this depends on..."
                  value={dependencySearch}
                  onChange={(e) => {
                    setDependencySearch(e.target.value);
                    setShowDependencyResults(e.target.value.trim() !== '');
                  }}
                  onFocus={() =>
                    setShowDependencyResults(dependencySearch.trim() !== '')
                  }
                />

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
                            e.preventDefault(); // prevents blur
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
                  <div className="flex flex-wrap gap-2">
                    {newTask.depends.map((taskUuid) => {
                      const dependentTask = allTasks.find(
                        (t) => t.uuid === taskUuid
                      );
                      return (
                        <Badge
                          key={taskUuid}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          <span>
                            #{dependentTask?.id || '?'}{' '}
                            {dependentTask?.description?.substring(0, 20) ||
                              taskUuid.substring(0, 8)}
                            {dependentTask?.description &&
                              dependentTask.description.length > 20 &&
                              '...'}
                          </span>
                          <button
                            type="button"
                            className="ml-1 text-red-500 hover:text-red-700"
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
                )}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            className="dark:bg-white/5 bg-black hover:bg-black text-white"
            variant="secondary"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
          <Button
            className="mb-1"
            variant="default"
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
