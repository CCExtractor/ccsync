import { toast } from "react-toastify";
import { formattedDate, getDisplayedPages, handleCopy, sortTasks, sortTasksById } from "../tasks-utils";
import { Task } from "@/components/utils/types";

describe("sortTasks", () => {
  const tasks: Task[] = [
    {
      id: 1,
      status: "pending",
      description: "1",
      project: "1",
      tags: ["1"],
      uuid: "",
      urgency: 0,
      priority: "",
      due: "",
      end: "",
      entry: "",
      modified: "",
      email: "",
    },
    {
      id: 2,
      status: "completed",
      description: "2",
      project: "2",
      tags: ["2"],
      uuid: "",
      urgency: 0,
      priority: "",
      due: "",
      end: "",
      entry: "",
      modified: "",
      email: "",
    },
    {
      id: 3,
      status: "in-progress",
      description: "3",
      project: "3",
      tags: ["3"],
      uuid: "",
      urgency: 0,
      priority: "",
      due: "",
      end: "",
      entry: "",
      modified: "",
      email: "",
    },
  ];

  it("sorts tasks in ascending order by status", () => {
    const sortedTasks = sortTasks(tasks, "asc");
    expect(sortedTasks).toEqual([
      {
        id: 2,
        status: "completed",
        description: "2",
        project: "2",
        tags: ["2"],
        uuid: "",
        urgency: 0,
        priority: "",
        due: "",
        end: "",
        entry: "",
        modified: "",
        email: "",
      },
      {
        id: 3,
        status: "in-progress",
        description: "3",
        project: "3",
        tags: ["3"],
        uuid: "",
        urgency: 0,
        priority: "",
        due: "",
        end: "",
        entry: "",
        modified: "",
        email: "",
      },
      {
        id: 1,
        status: "pending",
        description: "1",
        project: "1",
        tags: ["1"],
        uuid: "",
        urgency: 0,
        priority: "",
        due: "",
        end: "",
        entry: "",
        modified: "",
        email: "",
      },
    ]);
  });

  it("sorts tasks in descending order by status", () => {
    const sortedTasks = sortTasks(tasks, "desc");
    expect(sortedTasks).toEqual([
      {
        id: 1,
        status: "pending",
        description: "1",
        project: "1",
        tags: ["1"],
        uuid: "",
        urgency: 0,
        priority: "",
        due: "",
        end: "",
        entry: "",
        modified: "",
        email: "",
      },
      {
        id: 3,
        status: "in-progress",
        description: "3",
        project: "3",
        tags: ["3"],
        uuid: "",
        urgency: 0,
        priority: "",
        due: "",
        end: "",
        entry: "",
        modified: "",
        email: "",
      },
      {
        id: 2,
        status: "completed",
        description: "2",
        project: "2",
        tags: ["2"],
        uuid: "",
        urgency: 0,
        priority: "",
        due: "",
        end: "",
        entry: "",
        modified: "",
        email: "",
      },
    ]);
  });
});

describe("formattedDate", () => {
  it("formats valid ISO date string correctly", () => {
    const dateString = "2023-06-17T12:00:00Z";
    expect(formattedDate(dateString)).toBe("Jun 17, 2023, 5:30:00 PM");
  });

  it("returns input string if date parsing fails", () => {
    const invalidDateString = "invalid-date-string";
    expect(formattedDate(invalidDateString)).toBe(invalidDateString);
  });
});

describe("sortTasksById", () => {
  const tasks: Task[] = [
    {
      id: 2,
      status: "completed",
      description: "2",
      project: "2",
      tags: ["2"],
      uuid: "",
      urgency: 0,
      priority: "",
      due: "",
      end: "",
      entry: "",
      modified: "",
      email: "",
    },
    {
      id: 3,
      status: "in-progress",
      description: "3",
      project: "3",
      tags: ["3"],
      uuid: "",
      urgency: 0,
      priority: "",
      due: "",
      end: "",
      entry: "",
      modified: "",
      email: "",
    },
    {
      id: 1,
      status: "pending",
      description: "1",
      project: "1",
      tags: ["1"],
      uuid: "",
      urgency: 0,
      priority: "",
      due: "",
      end: "",
      entry: "",
      modified: "",
      email: "",
    },
  ];

  it("sorts tasks in ascending order by id", () => {
    const sortedTasks = sortTasksById(tasks, "asc");
    expect(sortedTasks).toEqual([
      {
        id: 1,
        status: "pending",
        description: "1",
        project: "1",
        tags: ["1"],
        uuid: "",
        urgency: 0,
        priority: "",
        due: "",
        end: "",
        entry: "",
        modified: "",
        email: "",
      },
      {
        id: 2,
        status: "completed",
        description: "2",
        project: "2",
        tags: ["2"],
        uuid: "",
        urgency: 0,
        priority: "",
        due: "",
        end: "",
        entry: "",
        modified: "",
        email: "",
      },
      {
        id: 3,
        status: "in-progress",
        description: "3",
        project: "3",
        tags: ["3"],
        uuid: "",
        urgency: 0,
        priority: "",
        due: "",
        end: "",
        entry: "",
        modified: "",
        email: "",
      },
    ]);
  });

  it("sorts tasks in descending order by id", () => {
    const sortedTasks = sortTasksById(tasks, "desc");
    expect(sortedTasks).toEqual([
      {
        id: 3,
        status: "in-progress",
        description: "3",
        project: "3",
        tags: ["3"],
        uuid: "",
        urgency: 0,
        priority: "",
        due: "",
        end: "",
        entry: "",
        modified: "",
        email: "",
      },
      {
        id: 2,
        status: "completed",
        description: "2",
        project: "2",
        tags: ["2"],
        uuid: "",
        urgency: 0,
        priority: "",
        due: "",
        end: "",
        entry: "",
        modified: "",
        email: "",
      },
      {
        id: 1,
        status: "pending",
        description: "1",
        project: "1",
        tags: ["1"],
        uuid: "",
        urgency: 0,
        priority: "",
        due: "",
        end: "",
        entry: "",
        modified: "",
        email: "",
      },
    ]);
  });
});

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
  },
}));

describe('handleCopy', () => {
  it('shows success toast with correct message', () => {
    const text = 'Sample text';
    handleCopy(text);
    expect(toast.success).toHaveBeenCalledWith(`${text} copied to clipboard!`, {
      position: 'bottom-left',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  });
});

describe('getDisplayedPages', () => {
  it('returns all pages if totalPages is less than or equal to 3', () => {
    expect(getDisplayedPages(1, 1)).toEqual([1]);
    expect(getDisplayedPages(2, 1)).toEqual([1, 2]);
    expect(getDisplayedPages(2, 2)).toEqual([1, 2]);
    expect(getDisplayedPages(3, 1)).toEqual([1, 2, 3]);
    expect(getDisplayedPages(3, 2)).toEqual([1, 2, 3]);
    expect(getDisplayedPages(3, 3)).toEqual([1, 2, 3]);
  });

  it('returns first three pages if currentPage is 1', () => {
    expect(getDisplayedPages(4, 1)).toEqual([1, 2, 3]);
    expect(getDisplayedPages(5, 1)).toEqual([1, 2, 3]);
    expect(getDisplayedPages(6, 1)).toEqual([1, 2, 3]);
  });

  it('returns last three pages if currentPage is the last page', () => {
    expect(getDisplayedPages(4, 4)).toEqual([2, 3, 4]);
    expect(getDisplayedPages(5, 5)).toEqual([3, 4, 5]);
    expect(getDisplayedPages(6, 6)).toEqual([4, 5, 6]);
  });

  it('returns three consecutive pages centered around the currentPage if it is in the middle', () => {
    expect(getDisplayedPages(5, 2)).toEqual([1, 2, 3]);
    expect(getDisplayedPages(5, 3)).toEqual([2, 3, 4]);
    expect(getDisplayedPages(5, 4)).toEqual([3, 4, 5]);
    expect(getDisplayedPages(6, 3)).toEqual([2, 3, 4]);
    expect(getDisplayedPages(6, 4)).toEqual([3, 4, 5]);
  });
});
