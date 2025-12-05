import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import { format } from 'date-fns';
import { Key } from '@/components/ui/key-button';

interface AddTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  newTask: {
    description: string;
    priority: string;
    project: string;
    due: string;
    tags: string[];
  };
  setNewTask: React.Dispatch<
    React.SetStateAction<{
      description: string;
      priority: string;
      project: string;
      due: string;
      tags: string[];
    }>
  >;
  tagInput: string;
  setTagInput: (value: string) => void;
  handleAddTag: () => void;
  handleRemoveTag: (tag: string) => void;
  handleAddTask: (
    email: string,
    encryptionSecret: string,
    UUID: string,
    description: string,
    project: string,
    priority: string,
    due: string,
    tags: string[]
  ) => void;
  email: string;
  encryptionSecret: string;
  UUID: string;
  showKeyBindings?: boolean;
}

export const AddTaskDialog: React.FC<AddTaskDialogProps> = ({
  isOpen,
  onOpenChange,
  newTask,
  setNewTask,
  tagInput,
  setTagInput,
  handleAddTag,
  handleRemoveTag,
  handleAddTask,
  email,
  encryptionSecret,
  UUID,
  showKeyBindings = true,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          id="add-new-task"
          variant="outline"
          onClick={() => onOpenChange(true)}
        >
          Add Task
          {showKeyBindings && <Key lable="a" />}
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
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
              className="col-span-3"
            />
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
            <Label htmlFor="description" className="text-right">
              Project
            </Label>
            <Input
              id="project"
              name="project"
              type=""
              value={newTask.project}
              onChange={(e) =>
                setNewTask({
                  ...newTask,
                  project: e.target.value,
                })
              }
              className="col-span-3"
            />
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
            <Label htmlFor="description" className="text-right">
              Tags
            </Label>
            <Input
              id="tags"
              name="tags"
              placeholder="Add a tag"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTag()} // Allow adding tag on pressing Enter
              required
              className="col-span-3"
            />
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
        </div>
        <DialogFooter>
          <Button
            className="dark:bg-white/5 bg-black hover:bg-black text-white"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="mb-1"
            variant="default"
            onClick={() =>
              handleAddTask(
                email,
                encryptionSecret,
                UUID,
                newTask.description,
                newTask.project,
                newTask.priority,
                newTask.due,
                newTask.tags
              )
            }
          >
            Add Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
