import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import { format } from 'date-fns';
import { Key } from '@/components/ui/key-button';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import {
  CheckIcon,
  XIcon,
  PencilIcon,
  Trash2Icon,
  Folder,
  Tag,
} from 'lucide-react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { CopyIcon } from '@radix-ui/react-icons';
import { Task } from '../../utils/types';
import { formattedDate } from './tasks-utils';

interface EditTaskDialogProps {
  task: Task;
  isDialogOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: Task[];

  // Description editing
  isEditing: boolean;
  editedDescription: string;
  setEditedDescription: (value: string) => void;
  handleEditClick: (description: string) => void;
  handleSaveClick: (task: Task) => void;
  handleCancelClick: () => void;

  // Due date editing
  isEditingDueDate: boolean;
  editedDueDate: string;
  setEditedDueDate: (value: string) => void;
  setIsEditingDueDate: (value: boolean) => void;
  handleDueDateSaveClick: (task: Task) => void;

  // Start date editing
  isEditingStartDate: boolean;
  editedStartDate: string;
  setEditedStartDate: (value: string) => void;
  setIsEditingStartDate: (value: boolean) => void;
  handleStartDateSaveClick: (task: Task) => void;

  // End date editing
  isEditingEndDate: boolean;
  editedEndDate: string;
  setEditedEndDate: (value: string) => void;
  setIsEditingEndDate: (value: boolean) => void;
  handleEndDateSaveClick: (task: Task) => void;

  // Wait date editing
  isEditingWaitDate: boolean;
  editedWaitDate: string;
  setEditedWaitDate: (value: string) => void;
  setIsEditingWaitDate: (value: boolean) => void;
  handleWaitDateSaveClick: (task: Task) => void;

  // Entry date editing
  isEditingEntryDate: boolean;
  editedEntryDate: string;
  setEditedEntryDate: (value: string) => void;
  setIsEditingEntryDate: (value: boolean) => void;
  handleEntryDateSaveClick: (task: Task) => void;

  // Depends editing
  isEditingDepends: boolean;
  editedDepends: string[];
  setIsEditingDepends: (value: boolean) => void;
  handleDependsSaveClick: (task: Task) => void;
  handleAddDependency: (uuid: string) => void;
  handleRemoveDependency: (uuid: string) => void;
  dependsDropdownOpen: boolean;
  setDependsDropdownOpen: (value: boolean) => void;
  dependsSearchTerm: string;
  setDependsSearchTerm: (value: string) => void;
  setIsDialogOpen: (value: boolean) => void;
  setSelectedTask: (task: Task) => void;

  // Priority editing
  isEditingPriority: boolean;
  editedPriority: string;
  setEditedPriority: (value: string) => void;
  handleEditPriorityClick: (task: Task) => void;
  handleSavePriority: (task: Task) => void;
  handleCancelPriority: () => void;

  // Project editing
  isEditingProject: boolean;
  editedProject: string;
  setEditedProject: (value: string) => void;
  setIsEditingProject: (value: boolean) => void;
  handleProjectSaveClick: (task: Task) => void;

  // Tags editing
  isEditingTags: boolean;
  editedTags: string[];
  editTagInput: string;
  setEditTagInput: (value: string) => void;
  handleEditTagsClick: (task: Task) => void;
  handleSaveTags: (task: Task) => void;
  handleCancelTags: () => void;
  handleAddEditTag: () => void;
  handleRemoveEditTag: (tag: string) => void;

  // Utility functions
  isOverdue: (due?: string) => boolean;
  handleCopy: (text: string) => void;

  // Actions
  markTaskAsCompleted: (
    email: string,
    encryptionSecret: string,
    UUID: string,
    uuid: string
  ) => void;
  markTaskAsDeleted: (
    email: string,
    encryptionSecret: string,
    UUID: string,
    uuid: string
  ) => void;

  // Props data
  email: string;
  encryptionSecret: string;
  UUID: string;

  // Optional
  showKeyBindings?: boolean;
}

export const EditTaskDialog: React.FC<EditTaskDialogProps> = ({
  task,
  isDialogOpen,
  onOpenChange,
  tasks,
  isEditing,
  editedDescription,
  setEditedDescription,
  handleEditClick,
  handleSaveClick,
  handleCancelClick,
  isEditingDueDate,
  editedDueDate,
  setEditedDueDate,
  setIsEditingDueDate,
  handleDueDateSaveClick,
  isEditingStartDate,
  editedStartDate,
  setEditedStartDate,
  setIsEditingStartDate,
  handleStartDateSaveClick,
  isEditingEndDate,
  editedEndDate,
  setEditedEndDate,
  setIsEditingEndDate,
  handleEndDateSaveClick,
  isEditingWaitDate,
  editedWaitDate,
  setEditedWaitDate,
  setIsEditingWaitDate,
  handleWaitDateSaveClick,
  isEditingEntryDate,
  editedEntryDate,
  setEditedEntryDate,
  setIsEditingEntryDate,
  handleEntryDateSaveClick,
  isEditingDepends,
  editedDepends,
  setIsEditingDepends,
  handleDependsSaveClick,
  handleAddDependency,
  handleRemoveDependency,
  dependsDropdownOpen,
  setDependsDropdownOpen,
  dependsSearchTerm,
  setDependsSearchTerm,
  setIsDialogOpen,
  setSelectedTask,
  isEditingPriority,
  editedPriority,
  setEditedPriority,
  handleEditPriorityClick,
  handleSavePriority,
  handleCancelPriority,
  isEditingProject,
  editedProject,
  setEditedProject,
  setIsEditingProject,
  handleProjectSaveClick,
  isEditingTags,
  editedTags,
  editTagInput,
  setEditTagInput,
  handleEditTagsClick,
  handleSaveTags,
  handleCancelTags,
  handleAddEditTag,
  handleRemoveEditTag,
  isOverdue,
  handleCopy,
  markTaskAsCompleted,
  markTaskAsDeleted,
  email,
  encryptionSecret,
  UUID,
  showKeyBindings = true,
}) => {
  return (
    <Dialog open={isDialogOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <div>{/* Trigger is handled by TableRow click */}</div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            <span className="ml-0 mb-0 mr-0 text-2xl mt-0 md:text-2xl font-bold">
              <span className="inline bg-gradient-to-r from-[#F596D3]  to-[#D247BF] text-transparent bg-clip-text">
                Task{' '}
              </span>
              Details
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1">
          <DialogDescription asChild>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell>ID:</TableCell>
                  <TableCell className="flex items-center gap-3">
                    {task.id}
                    {task.status === 'pending' && isOverdue(task.due) && (
                      <Badge className="bg-red-600 text-white shadow-lg shadow-red-700/40 animate-pulse">
                        Overdue
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Description:</TableCell>
                  <TableCell>
                    {isEditing ? (
                      <>
                        <div className="flex items-center">
                          <Input
                            id={`description-${task.id}`}
                            name={`description-${task.id}`}
                            type="text"
                            value={editedDescription}
                            onChange={(e) =>
                              setEditedDescription(e.target.value)
                            }
                            className="flex-grow mr-2"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSaveClick(task)}
                          >
                            <CheckIcon className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleCancelClick}
                          >
                            <XIcon className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span>{task.description}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(task.description)}
                        >
                          <PencilIcon className="h-4 w-4 text-gray-500" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Due:</TableCell>
                  <TableCell>
                    {isEditingDueDate ? (
                      <div className="flex items-center gap-2">
                        <DatePicker
                          date={
                            editedDueDate && editedDueDate !== ''
                              ? (() => {
                                  try {
                                    const dateStr = editedDueDate.includes('T')
                                      ? editedDueDate.split('T')[0]
                                      : editedDueDate;
                                    const parsed = new Date(
                                      dateStr + 'T00:00:00'
                                    );
                                    return isNaN(parsed.getTime())
                                      ? undefined
                                      : parsed;
                                  } catch {
                                    return undefined;
                                  }
                                })()
                              : undefined
                          }
                          onDateChange={(date) =>
                            setEditedDueDate(
                              date ? format(date, 'yyyy-MM-dd') : ''
                            )
                          }
                          placeholder="Select due date"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDueDateSaveClick(task)}
                        >
                          <CheckIcon className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setIsEditingDueDate(false)}
                        >
                          <XIcon className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span>{formattedDate(task.due)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setIsEditingDueDate(true);
                            const dueDate = task.due
                              ? task.due.includes('T')
                                ? task.due.split('T')[0]
                                : task.due
                              : '';
                            setEditedDueDate(dueDate);
                          }}
                        >
                          <PencilIcon className="h-4 w-4 text-gray-500" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Start:</TableCell>
                  <TableCell>
                    {isEditingStartDate ? (
                      <div className="flex items-center gap-2">
                        <DatePicker
                          date={
                            editedStartDate && editedStartDate !== ''
                              ? (() => {
                                  try {
                                    // Handle YYYY-MM-DD format
                                    const dateStr = editedStartDate.includes(
                                      'T'
                                    )
                                      ? editedStartDate.split('T')[0]
                                      : editedStartDate;
                                    const parsed = new Date(
                                      dateStr + 'T00:00:00'
                                    );
                                    return isNaN(parsed.getTime())
                                      ? undefined
                                      : parsed;
                                  } catch {
                                    return undefined;
                                  }
                                })()
                              : undefined
                          }
                          onDateChange={(date) =>
                            setEditedStartDate(
                              date ? format(date, 'yyyy-MM-dd') : ''
                            )
                          }
                        />

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleStartDateSaveClick(task)}
                        >
                          <CheckIcon className="h-4 w-4 text-green-500" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setIsEditingStartDate(false)}
                        >
                          <XIcon className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span>{formattedDate(task.start)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setIsEditingStartDate(true);
                            // Extract just the date part if it's in ISO format
                            const startDate = task.start
                              ? task.start.includes('T')
                                ? task.start.split('T')[0]
                                : task.start
                              : '';
                            setEditedStartDate(startDate);
                          }}
                        >
                          <PencilIcon className="h-4 w-4 text-gray-500" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>End:</TableCell>
                  <TableCell>
                    {isEditingEndDate ? (
                      <div className="flex items-center gap-2">
                        <DatePicker
                          date={
                            editedEndDate && editedEndDate !== ''
                              ? (() => {
                                  try {
                                    const dateStr = editedEndDate.includes('T')
                                      ? editedEndDate.split('T')[0]
                                      : editedEndDate;
                                    const parsed = new Date(
                                      dateStr + 'T00:00:00'
                                    );
                                    return isNaN(parsed.getTime())
                                      ? undefined
                                      : parsed;
                                  } catch {
                                    return undefined;
                                  }
                                })()
                              : undefined
                          }
                          onDateChange={(date) =>
                            setEditedEndDate(
                              date ? format(date, 'yyyy-MM-dd') : ''
                            )
                          }
                          placeholder="Select end date"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEndDateSaveClick(task)}
                        >
                          <CheckIcon className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setIsEditingEndDate(false)}
                        >
                          <XIcon className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span>{formattedDate(task.end)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setIsEditingEndDate(true);
                            const endDate = task.end
                              ? task.end.includes('T')
                                ? task.end.split('T')[0]
                                : task.end
                              : '';
                            setEditedEndDate(endDate);
                          }}
                        >
                          <PencilIcon className="h-4 w-4 text-gray-500" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Wait:</TableCell>
                  <TableCell>
                    {isEditingWaitDate ? (
                      <div className="flex items-center gap-2">
                        <DatePicker
                          date={
                            editedWaitDate
                              ? new Date(editedWaitDate)
                              : undefined
                          }
                          onDateChange={(date) =>
                            setEditedWaitDate(
                              date ? format(date, 'yyyy-MM-dd') : ''
                            )
                          }
                        />

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleWaitDateSaveClick(task)}
                        >
                          <CheckIcon className="h-4 w-4 text-green-500" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setIsEditingWaitDate(false)}
                        >
                          <XIcon className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span>{formattedDate(task.wait)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setIsEditingWaitDate(true);
                            setEditedWaitDate(task?.wait ?? '');
                          }}
                        >
                          <PencilIcon className="h-4 w-4 text-gray-500" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Depends:</TableCell>
                  <TableCell>
                    {!isEditingDepends ? (
                      <div className="flex flex-wrap items-center gap-2">
                        {(task.depends || []).map((depUuid) => {
                          const depTask = tasks.find((t) => t.uuid === depUuid);
                          return (
                            <Badge
                              key={depUuid}
                              variant="secondary"
                              className="cursor-pointer"
                              onClick={() => {
                                if (depTask) {
                                  setIsDialogOpen(false);
                                  setTimeout(() => {
                                    setSelectedTask(depTask);
                                    setIsDialogOpen(true);
                                  }, 100);
                                }
                              }}
                            >
                              {depTask?.description || depUuid.substring(0, 8)}
                            </Badge>
                          );
                        })}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setIsEditingDepends(true);
                            // Use the setter passed via props
                          }}
                        >
                          <PencilIcon className="h-4 w-4 text-gray-500" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {editedDepends.map((depUuid) => {
                            const depTask = tasks.find(
                              (t) => t.uuid === depUuid
                            );
                            return (
                              <Badge key={depUuid} variant="secondary">
                                <span>
                                  {depTask?.description ||
                                    depUuid.substring(0, 8)}
                                </span>
                                <button
                                  type="button"
                                  className="ml-2 text-red-500"
                                  onClick={() =>
                                    handleRemoveDependency(depUuid)
                                  }
                                >
                                  ✖
                                </button>
                              </Badge>
                            );
                          })}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setDependsDropdownOpen(!dependsDropdownOpen)
                              }
                              className="w-full justify-start"
                            >
                              <span className="text-lg mr-2">+</span>
                              Add Dependency
                            </Button>
                            {dependsDropdownOpen && (
                              <div className="absolute left-0 top-full mt-1 z-50 w-full bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                <Input
                                  type="text"
                                  placeholder="Search tasks..."
                                  value={dependsSearchTerm}
                                  onChange={(e) =>
                                    setDependsSearchTerm(e.target.value)
                                  }
                                  className="m-2 w-[calc(100%-1rem)]"
                                />
                                {tasks
                                  .filter(
                                    (t) =>
                                      t.uuid !== task.uuid &&
                                      t.status === 'pending' &&
                                      !editedDepends.includes(t.uuid) &&
                                      t.description
                                        .toLowerCase()
                                        .includes(
                                          dependsSearchTerm.toLowerCase()
                                        )
                                  )
                                  .map((t) => (
                                    <div
                                      key={t.uuid}
                                      className="flex items-center gap-2 p-2 hover:bg-accent cursor-pointer"
                                      onClick={() => {
                                        handleAddDependency(t.uuid);
                                        setDependsSearchTerm('');
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={editedDepends.includes(t.uuid)}
                                        readOnly
                                      />
                                      <span className="text-sm">
                                        {t.description}
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDependsSaveClick(task)}
                          >
                            <CheckIcon className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setIsEditingDepends(false);
                              setDependsDropdownOpen(false);
                            }}
                          >
                            <XIcon className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Recur:</TableCell>
                  <TableCell>{task.recur}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>RType:</TableCell>
                  <TableCell>{task.rtype}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Priority:</TableCell>
                  <TableCell>
                    {isEditingPriority ? (
                      <div className="flex items-center">
                        <Select
                          value={editedPriority}
                          onValueChange={setEditedPriority}
                        >
                          <SelectTrigger className="flex-grow mr-2">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NONE">None</SelectItem>
                            <SelectItem value="H">High (H)</SelectItem>
                            <SelectItem value="M">Medium (M)</SelectItem>
                            <SelectItem value="L">Low (L)</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSavePriority(task)}
                        >
                          <CheckIcon className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleCancelPriority}
                        >
                          <XIcon className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span>
                          {task.priority
                            ? task.priority === 'H'
                              ? 'High (H)'
                              : task.priority === 'M'
                                ? 'Medium (M)'
                                : task.priority === 'L'
                                  ? 'Low (L)'
                                  : task.priority
                            : 'None'}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditPriorityClick(task)}
                        >
                          <PencilIcon className="h-4 w-4 text-gray-500" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Project:</TableCell>
                  <TableCell>
                    {isEditingProject ? (
                      <>
                        <div className="flex items-center">
                          <Input
                            id={`project-${task.id}`}
                            name={`project-${task.id}`}
                            type="text"
                            value={editedProject}
                            onChange={(e) => setEditedProject(e.target.value)}
                            className="flex-grow mr-2"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleProjectSaveClick(task)}
                          >
                            <CheckIcon className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsEditingProject(false)}
                          >
                            <XIcon className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span>{task.project}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setIsEditingProject(true);
                            setEditedProject(task.project);
                          }}
                        >
                          <PencilIcon className="h-4 w-4 text-gray-500" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Status:</TableCell>
                  <TableCell>{task.status}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Tags:</TableCell>
                  <TableCell>
                    {isEditingTags ? (
                      <div>
                        <div className="flex items-center w-full">
                          <Input
                            type="text"
                            value={editTagInput}
                            onChange={(e) => {
                              // For allowing only alphanumeric characters
                              if (e.target.value.length > 1) {
                                /^[a-zA-Z0-9]*$/.test(e.target.value.trim())
                                  ? setEditTagInput(e.target.value.trim())
                                  : '';
                              } else {
                                /^[a-zA-Z]*$/.test(e.target.value.trim())
                                  ? setEditTagInput(e.target.value.trim())
                                  : '';
                              }
                            }}
                            placeholder="Add a tag (press enter to add)"
                            className="flex-grow mr-2"
                            onKeyDown={(e) =>
                              e.key === 'Enter' && handleAddEditTag()
                            }
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSaveTags(task)}
                            aria-label="Save tags"
                          >
                            <CheckIcon className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleCancelTags}
                            aria-label="Cancel editing tags"
                          >
                            <XIcon className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                        <div className="mt-2">
                          {editedTags != null && editedTags.length > 0 && (
                            <div>
                              <div className="flex flex-wrap gap-2 col-span-3">
                                {editedTags.map((tag, index) => (
                                  <Badge key={index}>
                                    <span>{tag}</span>
                                    <button
                                      type="button"
                                      className="ml-2 text-red-500"
                                      onClick={() => handleRemoveEditTag(tag)}
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
                    ) : (
                      <div className="flex items-center flex-wrap">
                        {task.tags !== null && task.tags.length >= 1 ? (
                          task.tags.map((tag, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="mr-2 mt-1"
                            >
                              <Tag className="pr-3" />
                              {tag}
                            </Badge>
                          ))
                        ) : (
                          <span>No Tags</span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditTagsClick(task)}
                        >
                          <PencilIcon className="h-4 w-4 text-gray-500" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Entry:</TableCell>
                  <TableCell>
                    {isEditingEntryDate ? (
                      <div className="flex items-center gap-2">
                        <DatePicker
                          date={
                            editedEntryDate && editedEntryDate !== ''
                              ? (() => {
                                  try {
                                    // Handle YYYY-MM-DD format
                                    const dateStr = editedEntryDate.includes(
                                      'T'
                                    )
                                      ? editedEntryDate.split('T')[0]
                                      : editedEntryDate;
                                    const parsed = new Date(
                                      dateStr + 'T00:00:00'
                                    );
                                    return isNaN(parsed.getTime())
                                      ? undefined
                                      : parsed;
                                  } catch {
                                    return undefined;
                                  }
                                })()
                              : undefined
                          }
                          onDateChange={(date) =>
                            setEditedEntryDate(
                              date ? format(date, 'yyyy-MM-dd') : ''
                            )
                          }
                        />

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEntryDateSaveClick(task)}
                        >
                          <CheckIcon className="h-4 w-4 text-green-500" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setIsEditingEntryDate(false)}
                        >
                          <XIcon className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span>{formattedDate(task.entry)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setIsEditingEntryDate(true);
                            const entryDate = task.entry
                              ? task.entry.includes('T')
                                ? task.entry.split('T')[0]
                                : task.entry
                              : '';
                            setEditedEntryDate(entryDate);
                          }}
                        >
                          <PencilIcon className="h-4 w-4 text-gray-500" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Urgency:</TableCell>
                  <TableCell>{task.urgency}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>UUID:</TableCell>
                  <TableCell className="flex items-center">
                    <span>{task.uuid}</span>
                    <CopyToClipboard
                      text={task.uuid}
                      onCopy={() => handleCopy('Task UUID')}
                    >
                      <button className="bg-blue-500 hover:bg-gray-900 text-white font-bold py-2 px-2 rounded ml-2">
                        <CopyIcon />
                      </button>
                    </CopyToClipboard>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </DialogDescription>
        </div>

        {/* Non-scrollable footer */}
        <DialogFooter className="flex flex-row justify-end pt-4">
          {task.status == 'pending' ? (
            <Dialog>
              <DialogTrigger asChild className="mr-5">
                <Button id={`mark-task-complete-${task.id}`}>
                  Mark As Completed {showKeyBindings && <Key lable="c" />}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>
                  <span className="ml-0 mb-0 mr-0 text-2xl mt-0 md:text-2xl font-bold">
                    <span className="inline bg-gradient-to-r from-[#F596D3]  to-[#D247BF] text-transparent bg-clip-text">
                      Are you{' '}
                    </span>
                    sure?
                  </span>
                </DialogTitle>
                <DialogFooter className="flex flex-row justify-center">
                  <DialogClose asChild>
                    <Button
                      className="mr-5"
                      onClick={() => {
                        markTaskAsCompleted(
                          email,
                          encryptionSecret,
                          UUID,
                          task.uuid
                        );
                        setIsDialogOpen(false);
                      }}
                    >
                      Yes
                    </Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button variant={'destructive'}>No</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : null}

          {task.status != 'deleted' ? (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  id={`mark-task-as-deleted-${task.id}`}
                  className="mr-4"
                  variant={'destructive'}
                >
                  <Trash2Icon />
                  {showKeyBindings && <Key lable="d" />}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>
                  <span className="ml-0 mb-0 mr-0 text-2xl mt-0 md:text-2xl font-bold">
                    <span className="inline bg-gradient-to-r from-[#F596D3]  to-[#D247BF] text-transparent bg-clip-text">
                      Are you{' '}
                    </span>
                    sure?
                  </span>
                </DialogTitle>
                <DialogFooter className="flex flex-row justify-center">
                  <DialogClose asChild>
                    <Button
                      className="mr-5"
                      onClick={() => {
                        markTaskAsDeleted(
                          email,
                          encryptionSecret,
                          UUID,
                          task.uuid
                        );
                        setIsDialogOpen(false);
                      }}
                    >
                      Yes
                    </Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button variant={'destructive'}>No</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : null}
          <DialogClose asChild>
            <Button className="dark:bg-white bg-black ">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
