import { EditTaskDialogProps, FieldKey } from '../../utils/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-time-picker';
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
import { Input } from '@/components/ui/input';
import { Key } from '@/components/ui/key-button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import {
  CheckIcon,
  CopyIcon,
  Folder,
  PencilIcon,
  Tag,
  Trash2Icon,
  XIcon,
} from 'lucide-react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { formattedDate, handleCopy } from './tasks-utils';
import { useEffect, useRef, useState } from 'react';
import { useTaskDialogKeyboard } from './UseTaskDialogKeyboard';
import { FIELDS } from './constants';
import { useTaskDialogFocusMap } from './UseTaskDialogFocusMap';

export const TaskDialog = ({
  index,
  task,
  isOpen,
  selectedIndex,
  onOpenChange,
  onSelectTask,
  selectedTaskUUIDs,
  onCheckboxChange,
  editState,
  onUpdateState,
  allTasks,
  isCreatingNewProject,
  setIsCreatingNewProject,
  uniqueProjects,
  onSaveDescription,
  onSaveTags,
  onSavePriority,
  onSaveProject,
  onSaveWaitDate,
  onSaveStartDate,
  onSaveEntryDate,
  onSaveEndDate,
  onSaveDueDate,
  onSaveDepends,
  onSaveRecur,
  onSaveAnnotations,
  onMarkComplete,
  onMarkDeleted,
  isOverdue,
  isUnsynced,
}: EditTaskDialogProps) => {
  const editButtonRef = useRef<
    Partial<Record<FieldKey, HTMLButtonElement | null>>
  >({});
  const inputRefs = useRef<
    Partial<Record<FieldKey, HTMLInputElement | HTMLButtonElement | null>>
  >({});
  const [focusedFieldIndex, setFocusedFieldIndex] = useState(0);

  const isEditingAny =
    editState.isEditing ||
    editState.isEditingDueDate ||
    editState.isEditingStartDate ||
    editState.isEditingEndDate ||
    editState.isEditingWaitDate ||
    editState.isEditingEntryDate ||
    editState.isEditingPriority ||
    editState.isEditingProject ||
    editState.isEditingTags ||
    editState.isEditingDepends ||
    editState.isEditingRecur ||
    editState.isEditingAnnotations;

  const focusedField = FIELDS[focusedFieldIndex];

  const stopEditing = () => {
    onUpdateState({
      isEditing: false,
      isEditingDueDate: false,
      isEditingStartDate: false,
      isEditingEndDate: false,
      isEditingWaitDate: false,
      isEditingEntryDate: false,
      isEditingPriority: false,
      isEditingProject: false,
      isEditingTags: false,
      isEditingDepends: false,
      isEditingRecur: false,
      isEditingAnnotations: false,
    });
  };

  const triggerEditForField = (field: FieldKey) => {
    editButtonRef.current[field]?.click();
  };

  useEffect(() => {
    const element = editButtonRef.current[focusedField];
    if (!element) return;

    element.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  }, [focusedField]);

  useEffect(() => {
    focusMap(focusedField);
  }, [
    focusedField,
    editState.isEditing,
    editState.isEditingDueDate,
    editState.isEditingStartDate,
    editState.isEditingEndDate,
    editState.isEditingWaitDate,
    editState.isEditingEntryDate,
    editState.isEditingTags,
    editState.isEditingAnnotations,
  ]);

  const focusMap = useTaskDialogFocusMap({
    fields: FIELDS,
    inputRefs: inputRefs,
  });

  const handleDialogKeyDown = useTaskDialogKeyboard({
    fields: FIELDS,
    focusedFieldIndex: focusedFieldIndex,
    setFocusedFieldIndex: setFocusedFieldIndex,
    isEditingAny: isEditingAny,
    stopEditing: stopEditing,
    triggerEditForField: triggerEditForField,
  });

  const saveAndExit = (onSave: () => void) => {
    onSave();
    stopEditing();
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (open) {
      onSelectTask(task, index);
    }
    onOpenChange(open);
  };

  const handleCancelClick = () => {
    onUpdateState({
      editedDescription: task.description,
      editedPriority: task.priority,
      editedProject: task.project,
      editedTags: task.tags,
      isEditing: false,
    });
  };

  const handleEditClick = (description: string) => {
    onUpdateState({
      isEditing: true,
      editedDescription: description,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange} key={index}>
      <DialogTrigger asChild>
        <TableRow
          data-testid={`task-row-${task.id}`}
          id={`task-row-${task.id}`}
          key={index}
          className={`border-b cursor-pointer hover:dark:bg-muted/50 hover:bg-black/15 ${
            selectedIndex === index ? 'dark:bg-muted/50 bg-black/15' : ''
          } ${isUnsynced ? 'border-l-4 border-l-red-500' : ''}   
          }`}
          data-selected={selectedIndex === index}
          onClick={() => {
            onSelectTask(task, index);
          }}
        >
          <TableCell className="py-2" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={selectedTaskUUIDs.includes(task.uuid)}
              disabled={task.status === 'deleted'}
              onChange={(e) => {
                e.stopPropagation();
                onCheckboxChange(task.uuid, e.target.checked);
              }}
            />
          </TableCell>

          {/* Display task details */}
          <TableCell className="py-2">
            <span
              className={`px-3 py-1 rounded-md font-semibold ${
                task.status === 'pending' && isOverdue(task.due)
                  ? 'bg-red-600/80 text-white'
                  : 'dark:text-white text-black'
              }`}
            >
              {task.id}
            </span>
          </TableCell>
          <TableCell className="flex items-center space-x-2 py-2">
            {task.priority === 'H' && (
              <div className="flex items-center justify-center w-3 h-3 bg-red-500 rounded-full border-0 min-w-3"></div>
            )}
            {task.priority === 'M' && (
              <div className="flex items-center justify-center w-3 h-3 bg-yellow-500 rounded-full border-0 min-w-3"></div>
            )}
            {task.priority != 'H' && task.priority != 'M' && (
              <div className="flex items-center justify-center w-3 h-3 bg-green-500 rounded-full border-0 min-w-3"></div>
            )}
            <span className="text-s text-foreground">{task.description}</span>
            {task.project != '' && (
              <Badge variant={'secondary'}>
                <Folder className="pr-2" />
                {task.project === '' ? '' : task.project}
              </Badge>
            )}
          </TableCell>
          <TableCell className="py-2">
            <Badge
              className={
                task.status === 'pending' && isOverdue(task.due)
                  ? 'bg-orange-500 text-white'
                  : ''
              }
              variant={
                task.status === 'deleted'
                  ? 'destructive'
                  : task.status === 'completed'
                    ? 'default'
                    : 'secondary'
              }
            >
              {task.status === 'pending' && isOverdue(task.due)
                ? 'O'
                : task.status === 'completed'
                  ? 'C'
                  : task.status === 'deleted'
                    ? 'D'
                    : 'P'}
            </Badge>
          </TableCell>
        </TableRow>
      </DialogTrigger>
      <DialogContent
        onEscapeKeyDown={(e) => {
          if (isEditingAny) {
            e.preventDefault();
            stopEditing();
            return;
          }
        }}
        tabIndex={0}
        onKeyDown={handleDialogKeyDown}
        className="sm:max-w-[625px] max-h-[90vh] flex flex-col"
      >
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
                <TableRow
                  className={`${focusedField === 'description' ? 'dark:bg-muted/50 bg-black/15' : ''}`}
                >
                  <TableCell>Description:</TableCell>
                  <TableCell>
                    {editState.isEditing ? (
                      <>
                        <div className="flex items-center">
                          <Input
                            aria-label="description"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                saveAndExit(() => {
                                  onSaveDescription(
                                    task,
                                    editState.editedDescription
                                  );
                                });
                              }
                            }}
                            ref={(element) =>
                              (inputRefs.current.description = element)
                            }
                            id={`description-${task.id}`}
                            name={`description-${task.id}`}
                            type="text"
                            value={editState.editedDescription}
                            onChange={(e) =>
                              onUpdateState({
                                editedDescription: e.target.value,
                              })
                            }
                            className="flex-grow mr-2"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="save"
                            onClick={() => {
                              onSaveDescription(
                                task,
                                editState.editedDescription
                              );
                              onUpdateState({ isEditing: false });
                            }}
                          >
                            <CheckIcon className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="cancel"
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
                          ref={(element) =>
                            (editButtonRef.current.description = element)
                          }
                          variant="ghost"
                          size="icon"
                          aria-label="edit"
                          onClick={() => handleEditClick(task.description)}
                        >
                          <PencilIcon className="h-4 w-4 text-gray-500" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
                <TableRow
                  className={`${focusedField === 'due' ? 'dark:bg-muted/50 bg-black/15' : ''}`}
                >
                  <TableCell>Due:</TableCell>
                  <TableCell>
                    {editState.isEditingDueDate ? (
                      <div className="flex items-center gap-2">
                        <DateTimePicker
                          ref={(element) => (inputRefs.current.due = element)}
                          date={
                            editState.editedDueDate &&
                            editState.editedDueDate !== ''
                              ? (() => {
                                  try {
                                    const dateStr =
                                      editState.editedDueDate.includes('T')
                                        ? editState.editedDueDate
                                        : editState.editedDueDate + 'T00:00:00';
                                    const parsed = new Date(dateStr);
                                    return isNaN(parsed.getTime())
                                      ? undefined
                                      : parsed;
                                  } catch {
                                    return undefined;
                                  }
                                })()
                              : undefined
                          }
                          onDateTimeChange={(date, hasTime) =>
                            onUpdateState({
                              editedDueDate: date
                                ? hasTime
                                  ? date.toISOString()
                                  : format(date, 'yyyy-MM-dd')
                                : '',
                            })
                          }
                          placeholder="Select due date and time"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="save"
                          onClick={() => {
                            onSaveDueDate(task, editState.editedDueDate);
                            onUpdateState({ isEditingDueDate: false });
                          }}
                        >
                          <CheckIcon className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="cancel"
                          onClick={() =>
                            onUpdateState({
                              editedDueDate: task.due || '',
                              isEditingDueDate: false,
                            })
                          }
                        >
                          <XIcon className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span>{formattedDate(task.due)}</span>
                        <Button
                          ref={(element) =>
                            (editButtonRef.current.due = element)
                          }
                          variant="ghost"
                          size="icon"
                          aria-label="edit"
                          onClick={() => {
                            onUpdateState({
                              isEditingDueDate: true,
                              editedDueDate: task.due || '',
                            });
                          }}
                        >
                          <PencilIcon className="h-4 w-4 text-gray-500" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
                <TableRow
                  className={`${focusedField === 'start' ? 'dark:bg-muted/50 bg-black/15' : ''}`}
                >
                  <TableCell>Start:</TableCell>
                  <TableCell>
                    {editState.isEditingStartDate ? (
                      <div className="flex items-center gap-2">
                        <DateTimePicker
                          ref={(element: HTMLButtonElement | null) =>
                            (inputRefs.current.start = element)
                          }
                          date={
                            editState.editedStartDate &&
                            editState.editedStartDate !== ''
                              ? (() => {
                                  try {
                                    // Handle YYYY-MM-DD format
                                    const dateStr =
                                      editState.editedStartDate.includes('T')
                                        ? editState.editedStartDate
                                        : editState.editedStartDate +
                                          'T00:00:00';
                                    const parsed = new Date(dateStr);
                                    return isNaN(parsed.getTime())
                                      ? undefined
                                      : parsed;
                                  } catch {
                                    return undefined;
                                  }
                                })()
                              : undefined
                          }
                          onDateTimeChange={(date, hasTime) =>
                            onUpdateState({
                              editedStartDate: date
                                ? hasTime
                                  ? date.toISOString()
                                  : format(date, 'yyyy-MM-dd')
                                : '',
                            })
                          }
                          placeholder="Select start date and time"
                        />

                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="save"
                          onClick={() => {
                            onSaveStartDate(task, editState.editedStartDate);
                            onUpdateState({ isEditingStartDate: false });
                          }}
                        >
                          <CheckIcon className="h-4 w-4 text-green-500" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="cancel"
                          onClick={() =>
                            onUpdateState({
                              editedStartDate: task.start || '',
                              isEditingStartDate: false,
                            })
                          }
                        >
                          <XIcon className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span>{formattedDate(task.start)}</span>
                        <Button
                          ref={(element) =>
                            (editButtonRef.current.start = element)
                          }
                          variant="ghost"
                          size="icon"
                          aria-label="edit"
                          onClick={() => {
                            onUpdateState({
                              isEditingStartDate: true,
                              editedStartDate: task.start || '',
                            });
                          }}
                        >
                          <PencilIcon className="h-4 w-4 text-gray-500" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
                <TableRow
                  className={`${focusedField === 'end' ? 'dark:bg-muted/50 bg-black/15' : ''}`}
                >
                  <TableCell>End:</TableCell>
                  <TableCell>
                    {editState.isEditingEndDate ? (
                      <div className="flex items-center gap-2">
                        <DateTimePicker
                          ref={(element) => (inputRefs.current.end = element)}
                          date={
                            editState.editedEndDate &&
                            editState.editedEndDate !== ''
                              ? (() => {
                                  try {
                                    const dateStr =
                                      editState.editedEndDate.includes('T')
                                        ? editState.editedEndDate
                                        : editState.editedEndDate + 'T00:00:00';
                                    const parsed = new Date(dateStr);
                                    return isNaN(parsed.getTime())
                                      ? undefined
                                      : parsed;
                                  } catch {
                                    return undefined;
                                  }
                                })()
                              : undefined
                          }
                          onDateTimeChange={(date, hasTime) =>
                            onUpdateState({
                              editedEndDate: date
                                ? hasTime
                                  ? date.toISOString()
                                  : format(date, 'yyyy-MM-dd')
                                : '',
                            })
                          }
                          placeholder="Select end date and time"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="save"
                          onClick={() => {
                            onSaveEndDate(task, editState.editedEndDate);
                            onUpdateState({ isEditingEndDate: false });
                          }}
                        >
                          <CheckIcon className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="cancel"
                          onClick={() =>
                            onUpdateState({
                              editedEndDate: task.end || '',
                              isEditingEndDate: false,
                            })
                          }
                        >
                          <XIcon className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span>{formattedDate(task.end)}</span>
                        <Button
                          ref={(element) =>
                            (editButtonRef.current.end = element)
                          }
                          variant="ghost"
                          size="icon"
                          aria-label="edit"
                          onClick={() => {
                            onUpdateState({
                              isEditingEndDate: true,
                              editedEndDate: task.end || '',
                            });
                          }}
                        >
                          <PencilIcon className="h-4 w-4 text-gray-500" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
                <TableRow
                  className={`${focusedField === 'wait' ? 'dark:bg-muted/50 bg-black/15' : ''}`}
                >
                  <TableCell>Wait:</TableCell>
                  <TableCell>
                    {editState.isEditingWaitDate ? (
                      <div className="flex items-center gap-2">
                        <DateTimePicker
                          ref={(element) => (inputRefs.current.wait = element)}
                          date={
                            editState.editedWaitDate &&
                            editState.editedWaitDate !== ''
                              ? (() => {
                                  try {
                                    const dateStr =
                                      editState.editedWaitDate.includes('T')
                                        ? editState.editedWaitDate
                                        : editState.editedWaitDate +
                                          'T00:00:00';
                                    const parsed = new Date(dateStr);
                                    return isNaN(parsed.getTime())
                                      ? undefined
                                      : parsed;
                                  } catch {
                                    return undefined;
                                  }
                                })()
                              : undefined
                          }
                          onDateTimeChange={(date, hasTime) =>
                            onUpdateState({
                              editedWaitDate: date
                                ? hasTime
                                  ? date.toISOString()
                                  : format(date, 'yyyy-MM-dd')
                                : '',
                            })
                          }
                          placeholder="Select wait date and time"
                        />

                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="save"
                          onClick={() => {
                            onSaveWaitDate(task, editState.editedWaitDate);
                            onUpdateState({ isEditingWaitDate: false });
                          }}
                        >
                          <CheckIcon className="h-4 w-4 text-green-500" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="cancel"
                          onClick={() =>
                            onUpdateState({
                              editedWaitDate: task.wait || '',
                              isEditingWaitDate: false,
                            })
                          }
                        >
                          <XIcon className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span>{formattedDate(task.wait)}</span>
                        <Button
                          ref={(element) =>
                            (editButtonRef.current.wait = element)
                          }
                          variant="ghost"
                          size="icon"
                          aria-label="edit"
                          onClick={() => {
                            onUpdateState({
                              isEditingWaitDate: true,
                              editedWaitDate: task?.wait ?? '',
                            });
                          }}
                        >
                          <PencilIcon className="h-4 w-4 text-gray-500" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
                <TableRow
                  className={`${focusedField === 'depends' ? 'dark:bg-muted/50 bg-black/15' : ''}`}
                >
                  <TableCell>Depends:</TableCell>
                  <TableCell>
                    {!editState.isEditingDepends ? (
                      <div className="flex flex-wrap items-center gap-2">
                        {(task.depends || []).map((depUuid) => {
                          const depTask = allTasks.find(
                            (t) => t.uuid === depUuid
                          );
                          return (
                            <Badge
                              key={depUuid}
                              variant="secondary"
                              className="cursor-pointer"
                              onClick={() => {
                                if (depTask) {
                                  onOpenChange(false);
                                  setTimeout(() => {
                                    const depIndex = allTasks.findIndex(
                                      (t) => t.uuid === depTask?.uuid
                                    );
                                    onSelectTask(depTask!, depIndex);
                                    onOpenChange(true);
                                  }, 100);
                                }
                              }}
                            >
                              {depTask?.description || depUuid.substring(0, 8)}
                            </Badge>
                          );
                        })}
                        <Button
                          ref={(element) =>
                            (editButtonRef.current.depends = element)
                          }
                          variant="ghost"
                          size="icon"
                          aria-label="edit"
                          onClick={() => {
                            onUpdateState({
                              isEditingDepends: true,
                              editedDepends: task.depends || [],
                            });

                            setTimeout(() => {
                              onUpdateState({ dependsDropdownOpen: true });
                            }, 0);

                            requestAnimationFrame(() => {
                              inputRefs.current.depends?.focus();
                            });
                          }}
                        >
                          <PencilIcon className="h-4 w-4 text-gray-500" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {editState.editedDepends.map((depUuid) => {
                            const depTask = allTasks.find(
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
                                    onUpdateState({
                                      editedDepends:
                                        editState.editedDepends.filter(
                                          (d) => d !== depUuid
                                        ),
                                    })
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
                              ref={(element) => {
                                editButtonRef.current.depends = element;
                              }}
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                onUpdateState({
                                  dependsDropdownOpen: true,
                                })
                              }
                              className="w-full justify-start"
                            >
                              <span className="text-lg mr-2">+</span>
                              Add Dependency
                            </Button>
                            {editState.dependsDropdownOpen && (
                              <div
                                data-testid="dependency-dropdown"
                                className="absolute left-0 top-full mt-1 z-50 w-full bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto"
                              >
                                <Input
                                  ref={(element) =>
                                    (inputRefs.current.depends = element)
                                  }
                                  type="text"
                                  placeholder="Search tasks..."
                                  value={editState.dependsSearchTerm}
                                  onChange={(e) =>
                                    onUpdateState({
                                      dependsSearchTerm: e.target.value,
                                    })
                                  }
                                  className="m-2 w-[calc(100%-1rem)]"
                                />
                                {allTasks
                                  .filter(
                                    (t) =>
                                      t.uuid !== task.uuid &&
                                      t.status === 'pending' &&
                                      !editState.editedDepends.includes(
                                        t.uuid
                                      ) &&
                                      t.description
                                        .toLowerCase()
                                        .includes(
                                          editState.dependsSearchTerm.toLowerCase()
                                        )
                                  )
                                  .map((t) => (
                                    <div
                                      key={t.uuid}
                                      className="flex items-center gap-2 p-2 hover:bg-accent cursor-pointer"
                                      onClick={() => {
                                        onUpdateState({
                                          editedDepends: [
                                            ...editState.editedDepends,
                                            t.uuid,
                                          ],
                                          dependsSearchTerm: '',
                                        });
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          onUpdateState({
                                            editedDepends:
                                              editState.editedDepends.includes(
                                                t.uuid
                                              )
                                                ? editState.editedDepends.filter(
                                                    (id) => id !== t.uuid
                                                  )
                                                : [
                                                    ...editState.editedDepends,
                                                    t.uuid,
                                                  ],
                                          });
                                        }
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={editState.editedDepends.includes(
                                          t.uuid
                                        )}
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
                            aria-label="save"
                            onClick={() => {
                              onSaveDepends(task, editState.editedDepends);
                              onUpdateState({
                                isEditingDepends: false,
                                dependsDropdownOpen: false,
                              });
                            }}
                          >
                            <CheckIcon className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="cancel"
                            onClick={() => {
                              onUpdateState({
                                isEditingDepends: false,
                                dependsDropdownOpen: false,
                                editedDepends: task.depends || [],
                              });
                            }}
                          >
                            <XIcon className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
                <TableRow
                  className={`${focusedField === 'priority' ? 'dark:bg-muted/50 bg-black/15' : ''}`}
                >
                  <TableCell>Priority:</TableCell>
                  <TableCell>
                    {editState.isEditingPriority ? (
                      <div className="flex items-center">
                        <Select
                          value={editState.editedPriority}
                          onValueChange={(value) =>
                            onUpdateState({
                              editedPriority: value,
                            })
                          }
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
                          aria-label="save"
                          onClick={() => {
                            onSavePriority(task, editState.editedPriority);
                            onUpdateState({ isEditingPriority: false });
                          }}
                        >
                          <CheckIcon className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="cancel"
                          onClick={() => {
                            onUpdateState({
                              editedPriority: task.priority || 'NONE',
                              isEditingPriority: false,
                            });
                          }}
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
                          ref={(element) =>
                            (editButtonRef.current.priority = element)
                          }
                          variant="ghost"
                          size="icon"
                          aria-label="edit"
                          onClick={() => {
                            onUpdateState({
                              editedPriority: task.priority || 'NONE',
                              isEditingPriority: true,
                            });
                          }}
                        >
                          <PencilIcon className="h-4 w-4 text-gray-500" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
                <TableRow
                  className={`${focusedField === 'project' ? 'dark:bg-muted/50 bg-black/15' : ''}`}
                >
                  <TableCell>Project:</TableCell>
                  <TableCell>
                    {editState.isEditingProject ? (
                      <>
                        <div className="col-span-3 space-y-2 w-[300px]">
                          <Select
                            value={
                              isCreatingNewProject
                                ? '__CREATE_NEW__'
                                : editState.editedProject
                            }
                            onValueChange={(value) => {
                              if (value === '__CREATE_NEW__') {
                                setIsCreatingNewProject(true);
                                onUpdateState({ editedProject: '' });
                              } else {
                                const project =
                                  value === '__NONE__' ? '' : value;
                                setIsCreatingNewProject(false);
                                onUpdateState({ editedProject: project });
                                onSaveProject(task, project);
                              }
                            }}
                          >
                            <SelectTrigger
                              id="project"
                              data-testid="project-select"
                            >
                              <SelectValue
                                placeholder={
                                  uniqueProjects.length
                                    ? 'Select a project'
                                    : 'No projects yet'
                                }
                              >
                                {isCreatingNewProject
                                  ? editState.editedProject
                                    ? `New: ${editState.editedProject}`
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
                              <SelectItem value="__NONE__">
                                No project
                              </SelectItem>
                              {uniqueProjects.map((project: string) => (
                                <SelectItem key={project} value={project}>
                                  {project}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {isCreatingNewProject && (
                            <div className="flex gap-4 justify-center items-center">
                              <Input
                                ref={(element) => {
                                  inputRefs.current.project = element;
                                }}
                                id="project-name"
                                placeholder="New project name"
                                value={editState.editedProject}
                                autoFocus
                                onChange={(e) =>
                                  onUpdateState({
                                    editedProject: e.target.value,
                                  })
                                }
                              />
                              <div className="flex justify-center items-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label="save"
                                  onClick={() => {
                                    onSaveProject(
                                      task,
                                      editState.editedProject
                                    );
                                    onUpdateState({ isEditingProject: false });
                                  }}
                                >
                                  <CheckIcon className="h-4 w-4 text-green-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label="cancel"
                                  onClick={() =>
                                    onUpdateState({
                                      editedProject: task.project,
                                      isEditingProject: false,
                                    })
                                  }
                                >
                                  <XIcon className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <span>{task.project}</span>
                        <Button
                          ref={(element) =>
                            (editButtonRef.current.project = element)
                          }
                          variant="ghost"
                          size="icon"
                          aria-label="edit"
                          onClick={() => {
                            onUpdateState({
                              editedProject: task.project,
                              isEditingProject: true,
                            });
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
                <TableRow
                  className={`${focusedField === 'tags' ? 'dark:bg-muted/50 bg-black/15' : ''}`}
                >
                  <TableCell>Tags:</TableCell>
                  <TableCell>
                    {editState.isEditingTags ? (
                      <div>
                        <div className="flex items-center w-full">
                          <Input
                            ref={(element) =>
                              (inputRefs.current.tags = element)
                            }
                            type="text"
                            value={editState.editTagInput}
                            onChange={(e) => {
                              // For allowing only alphanumeric characters
                              if (e.target.value.length > 1) {
                                /^[a-zA-Z0-9]*$/.test(e.target.value.trim())
                                  ? onUpdateState({
                                      editTagInput: e.target.value.trim(),
                                    })
                                  : '';
                              } else {
                                /^[a-zA-Z]*$/.test(e.target.value.trim())
                                  ? onUpdateState({
                                      editTagInput: e.target.value.trim(),
                                    })
                                  : '';
                              }
                            }}
                            placeholder="Add a tag (press enter to add)"
                            className="flex-grow mr-2"
                            onKeyDown={(e) => {
                              if (
                                e.key === 'Enter' &&
                                editState.editTagInput.trim()
                              ) {
                                onUpdateState({
                                  editedTags: [
                                    ...editState.editedTags,
                                    editState.editTagInput.trim(),
                                  ],
                                  editTagInput: '',
                                });
                              }
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Save tags"
                            onClick={() => {
                              onSaveTags(task, editState.editedTags);
                              onUpdateState({
                                isEditingTags: false,
                                editTagInput: '',
                              });
                            }}
                          >
                            <CheckIcon className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Cancel editing tags"
                            onClick={() => {
                              onUpdateState({
                                isEditingTags: false,
                                editedTags: task.tags || [],
                                editTagInput: '',
                              });
                            }}
                          >
                            <XIcon className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                        <div className="mt-2">
                          {editState.editedTags != null &&
                            editState.editedTags.length > 0 && (
                              <div>
                                <div className="flex flex-wrap gap-2 col-span-3">
                                  {editState.editedTags.map((tag, index) => (
                                    <Badge key={index}>
                                      <span>{tag}</span>
                                      <button
                                        type="button"
                                        className="ml-2 text-red-500"
                                        onClick={() =>
                                          onUpdateState({
                                            editedTags:
                                              editState.editedTags.filter(
                                                (t) => t !== tag
                                              ),
                                          })
                                        }
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
                          ref={(element) =>
                            (editButtonRef.current.tags = element)
                          }
                          variant="ghost"
                          size="icon"
                          aria-label="edit"
                          onClick={() =>
                            onUpdateState({
                              isEditingTags: true,
                              editedTags: task.tags || [],
                              editTagInput: '',
                            })
                          }
                        >
                          <PencilIcon className="h-4 w-4 text-gray-500" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
                <TableRow
                  className={`${focusedField === 'entry' ? 'dark:bg-muted/50 bg-black/15' : ''}`}
                >
                  <TableCell>Entry:</TableCell>
                  <TableCell>
                    {editState.isEditingEntryDate ? (
                      <div className="flex items-center gap-2">
                        <DateTimePicker
                          ref={(element) => (inputRefs.current.entry = element)}
                          date={
                            editState.editedEntryDate &&
                            editState.editedEntryDate !== ''
                              ? (() => {
                                  try {
                                    // Handle YYYY-MM-DD format
                                    const dateStr =
                                      editState.editedEntryDate.includes('T')
                                        ? editState.editedEntryDate
                                        : editState.editedEntryDate +
                                          'T00:00:00';
                                    const parsed = new Date(dateStr);
                                    return isNaN(parsed.getTime())
                                      ? undefined
                                      : parsed;
                                  } catch {
                                    return undefined;
                                  }
                                })()
                              : undefined
                          }
                          onDateTimeChange={(date, hasTime) =>
                            onUpdateState({
                              editedEntryDate: date
                                ? hasTime
                                  ? date.toISOString()
                                  : format(date, 'yyyy-MM-dd')
                                : '',
                            })
                          }
                          placeholder="Select entry date and time"
                        />

                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="save"
                          onClick={() => {
                            onSaveEntryDate(task, editState.editedEntryDate);
                            onUpdateState({ isEditingEntryDate: false });
                          }}
                        >
                          <CheckIcon className="h-4 w-4 text-green-500" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="cancel"
                          onClick={() =>
                            onUpdateState({
                              editedEntryDate: task.entry || '',
                              isEditingEntryDate: false,
                            })
                          }
                        >
                          <XIcon className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span>{formattedDate(task.entry)}</span>
                        <Button
                          ref={(element) =>
                            (editButtonRef.current.entry = element)
                          }
                          variant="ghost"
                          size="icon"
                          aria-label="edit"
                          onClick={() => {
                            onUpdateState({
                              isEditingEntryDate: true,
                              editedEntryDate: task.entry || '',
                            });
                          }}
                        >
                          <PencilIcon className="h-4 w-4 text-gray-500" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
                <TableRow
                  className={`${focusedField === 'recur' ? 'dark:bg-muted/50 bg-black/15' : ''}`}
                >
                  <TableCell>Recur:</TableCell>
                  <TableCell>
                    {editState.isEditingRecur ? (
                      <div className="flex items-center gap-2">
                        <Select
                          value={editState.editedRecur || 'none'}
                          onValueChange={(value) =>
                            onUpdateState({ editedRecur: value })
                          }
                        >
                          <SelectTrigger className="flex-grow">
                            <SelectValue placeholder="Select recurrence" />
                          </SelectTrigger>
                          <SelectContent>
                            {!editState.originalRecur && (
                              <SelectItem
                                value="none"
                                className="cursor-pointer hover:bg-accent"
                              >
                                None
                              </SelectItem>
                            )}
                            <SelectItem
                              value="daily"
                              className="cursor-pointer hover:bg-accent"
                            >
                              Daily
                            </SelectItem>
                            <SelectItem
                              value="weekly"
                              className="cursor-pointer hover:bg-accent"
                            >
                              Weekly
                            </SelectItem>
                            <SelectItem
                              value="monthly"
                              className="cursor-pointer hover:bg-accent"
                            >
                              Monthly
                            </SelectItem>
                            <SelectItem
                              value="yearly"
                              className="cursor-pointer hover:bg-accent"
                            >
                              Yearly
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="save"
                          onClick={() =>
                            onSaveRecur(task, editState.editedRecur)
                          }
                        >
                          <CheckIcon className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="cancel"
                          onClick={() =>
                            onUpdateState({
                              isEditingRecur: false,
                              editedRecur: editState.originalRecur,
                            })
                          }
                        >
                          <XIcon className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span>{task.recur || 'None'}</span>
                        <Button
                          ref={(element) =>
                            (editButtonRef.current.recur = element)
                          }
                          variant="ghost"
                          size="icon"
                          aria-label="edit"
                          onClick={() => {
                            onUpdateState({
                              isEditingRecur: true,
                              editedRecur: task.recur || 'none',
                              originalRecur: task.recur || '',
                            });
                          }}
                        >
                          <PencilIcon className="h-4 w-4 text-gray-500" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>RType:</TableCell>
                  <TableCell>
                    <span>{task.rtype || 'None'}</span>
                    {!task.rtype && (
                      <span className="text-xs text-gray-500 ml-2">
                        (Auto-set by recur)
                      </span>
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
                <TableRow
                  className={`${focusedField === 'annotations' ? 'dark:bg-muted/50 bg-black/15' : ''}`}
                >
                  <TableCell>Annotations:</TableCell>
                  <TableCell>
                    {editState.isEditingAnnotations ? (
                      <div>
                        <div className="flex items-center w-full">
                          <Input
                            ref={(element) =>
                              (inputRefs.current.annotations = element)
                            }
                            type="text"
                            value={editState.annotationInput}
                            onChange={(e) => {
                              onUpdateState({
                                annotationInput: e.target.value,
                              });
                            }}
                            placeholder="Add an annotation (press enter to add)"
                            className="flex-grow mr-2"
                            onKeyDown={(e) => {
                              if (
                                e.key === 'Enter' &&
                                editState.annotationInput.trim()
                              ) {
                                const newAnnotation = {
                                  entry: new Date().toISOString(),
                                  description: editState.annotationInput.trim(),
                                };
                                onUpdateState({
                                  editedAnnotations: [
                                    ...editState.editedAnnotations,
                                    newAnnotation,
                                  ],
                                  annotationInput: '',
                                });
                              }
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              onSaveAnnotations(
                                task,
                                editState.editedAnnotations
                              );
                              onUpdateState({
                                isEditingAnnotations: false,
                                annotationInput: '',
                              });
                            }}
                            aria-label="Save annotations"
                          >
                            <CheckIcon className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              onUpdateState({
                                isEditingAnnotations: false,
                                editedAnnotations: task.annotations || [],
                                annotationInput: '',
                              });
                            }}
                            aria-label="Cancel editing annotations"
                          >
                            <XIcon className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                        <div className="mt-2">
                          {editState.editedAnnotations != null &&
                            editState.editedAnnotations.length > 0 && (
                              <div>
                                <div className="flex flex-wrap gap-2 col-span-3">
                                  {editState.editedAnnotations.map(
                                    (annotation, index) => (
                                      <Badge key={index}>
                                        <span>{annotation.description}</span>
                                        <button
                                          type="button"
                                          className="ml-2 text-red-500"
                                          onClick={() =>
                                            onUpdateState({
                                              editedAnnotations:
                                                editState.editedAnnotations.filter(
                                                  (a) => a !== annotation
                                                ),
                                            })
                                          }
                                        >
                                          ✖
                                        </button>
                                      </Badge>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center flex-wrap">
                        {task.annotations && task.annotations.length >= 1 ? (
                          task.annotations.map((annotation, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="mr-2 mt-1"
                            >
                              {annotation.description}
                            </Badge>
                          ))
                        ) : (
                          <span>No Annotations</span>
                        )}
                        <Button
                          ref={(element) =>
                            (editButtonRef.current.annotations = element)
                          }
                          variant="ghost"
                          size="icon"
                          aria-label="edit"
                          onClick={() =>
                            onUpdateState({
                              isEditingAnnotations: true,
                              editedAnnotations: task.annotations || [],
                              annotationInput: '',
                            })
                          }
                        >
                          <PencilIcon className="h-4 w-4 text-gray-500" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </DialogDescription>
        </div>

        <DialogFooter className="flex flex-row justify-end pt-4">
          {task.status == 'pending' ? (
            <Dialog>
              <DialogTrigger asChild className="mr-5">
                <Button
                  id={`mark-task-complete-${task.id}`}
                  aria-label="complete task"
                >
                  Mark As Completed <Key label="c" />
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
                        (onMarkComplete(task.uuid),
                          onUpdateState({ isEditing: false }));
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
                  aria-label="delete task"
                >
                  <Trash2Icon />
                  <Key label="d" />
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
                        (onMarkDeleted(task.uuid),
                          onUpdateState({ isEditing: false }));
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
            <Button className="dark:bg-white bg-black">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
