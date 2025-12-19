import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
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
import { AddTaskDialogProps } from '@/components/utils/types';
import { format } from 'date-fns';

export const AddTaskdialog = ({
  isOpen,
  setIsOpen,
  newTask,
  setNewTask,
  tagInput,
  setTagInput,
  onSubmit,
  isCreatingNewProject,
  setIsCreatingNewProject,
  uniqueProjects = [],
}: AddTaskDialogProps) => {
  const [annotationInput, setAnnotationInput] = useState('');

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

  const handleAddTag = () => {
    if (tagInput && !newTask.tags.includes(tagInput, 0)) {
      setNewTask({ ...newTask, tags: [...newTask.tags, tagInput] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNewTask({
      ...newTask,
      tags: newTask.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          id="add-new-task"
          variant="outline"
          onClick={() => setIsOpen(true)}
        >
          Add Task
          <Key lable="a" />
        </Button>
      </DialogTrigger>
      <DialogContent>
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
        <div className="space-y-4">
          <div className="grid grid-cols-8 items-center gap-4">
            <Label htmlFor="description" className="text-right col-span-2">
              Description
            </Label>
            <div className="col-span-6">
              <Input
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="priority" className="text-right">
              Priority
            </Label>
            <div className="col-span-1 flex items-center">
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
                className="border rounded-md px-2 py-1 w-full bg-white text-black dark:bg-black dark:text-white transition-colors"
              >
                <option value="H">H</option>
                <option value="M">M</option>
                <option value="L">L</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="project" className="text-right">
              Project
            </Label>
            <div className="col-span-3 space-y-2">
              <Select
                value={newTask.project}
                onValueChange={(value) => {
                  if (value === '__CREATE_NEW__') {
                    setIsCreatingNewProject(true);
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
                  />
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="due" className="text-right">
              Due
            </Label>
            <div className="col-span-3">
              <DatePicker
                date={newTask.due ? new Date(newTask.due) : undefined}
                onDateChange={(date) => {
                  setNewTask({
                    ...newTask,
                    due: date ? format(date, 'yyyy-MM-dd') : '',
                  });
                }}
                placeholder="Select a due date"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="start" className="text-right">
              Start
            </Label>
            <div className="col-span-3">
              <DatePicker
                date={newTask.start ? new Date(newTask.start) : undefined}
                onDateChange={(date) => {
                  setNewTask({
                    ...newTask,
                    start: date ? format(date, 'yyyy-MM-dd') : '',
                  });
                }}
                placeholder="Select a start date"
              />
            </div>
          </div>
          <div className="grid grid-cols-8 items-center gap-4">
            <Label htmlFor="tags" className="text-right col-span-2">
              Tags
            </Label>
            <div className="col-span-6">
              <Input
                id="tags"
                name="tags"
                placeholder="Add a tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                required
                className="col-span-6"
              />
            </div>
          </div>

          <div className="mt-2">
            {newTask.tags.length > 0 && (
              <div className="grid grid-cols-4 items-center">
                <div> </div>
                <div className="flex flex-wrap gap-2 col-span-3">
                  {newTask.tags.map((tag, index) => (
                    <Badge key={index}>
                      <span>{tag}</span>
                      <button
                        type="button"
                        className="ml-2 text-red-500"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        ✖
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-8 items-center gap-4">
            <Label htmlFor="annotations" className="text-right col-span-2">
              Annotation
            </Label>
            <div className="col-span-6">
              <Input
                id="annotations"
                name="annotations"
                placeholder="Add an annotation"
                value={annotationInput}
                onChange={(e) => setAnnotationInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddAnnotation()}
                className="col-span-6"
              />
            </div>
          </div>

          <div className="mt-2">
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
