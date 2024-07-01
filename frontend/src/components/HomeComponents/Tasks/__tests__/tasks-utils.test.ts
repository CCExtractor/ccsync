import { toast } from "react-toastify";
import {
  formattedDate,
  getDisplayedPages,
  handleCopy,
  handleDate,
  sortTasks,
  sortTasksById,
  markTaskAsCompleted,
  markTaskAsDeleted,
} from "../tasks-utils";
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

jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe("handleCopy", () => {
  it("shows success toast with correct message", () => {
    const text = "Sample text";
    handleCopy(text);
    expect(toast.success).toHaveBeenCalledWith(`${text} copied to clipboard!`, {
      position: "bottom-left",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  });
});

describe("getDisplayedPages", () => {
  it("returns all pages if totalPages is less than or equal to 3", () => {
    expect(getDisplayedPages(1, 1)).toEqual([1]);
    expect(getDisplayedPages(2, 1)).toEqual([1, 2]);
    expect(getDisplayedPages(2, 2)).toEqual([1, 2]);
    expect(getDisplayedPages(3, 1)).toEqual([1, 2, 3]);
    expect(getDisplayedPages(3, 2)).toEqual([1, 2, 3]);
    expect(getDisplayedPages(3, 3)).toEqual([1, 2, 3]);
  });

  it("returns first three pages if currentPage is 1", () => {
    expect(getDisplayedPages(4, 1)).toEqual([1, 2, 3]);
    expect(getDisplayedPages(5, 1)).toEqual([1, 2, 3]);
    expect(getDisplayedPages(6, 1)).toEqual([1, 2, 3]);
  });

  it("returns last three pages if currentPage is the last page", () => {
    expect(getDisplayedPages(4, 4)).toEqual([2, 3, 4]);
    expect(getDisplayedPages(5, 5)).toEqual([3, 4, 5]);
    expect(getDisplayedPages(6, 6)).toEqual([4, 5, 6]);
  });

  it("returns three consecutive pages centered around the currentPage if it is in the middle", () => {
    expect(getDisplayedPages(5, 2)).toEqual([1, 2, 3]);
    expect(getDisplayedPages(5, 3)).toEqual([2, 3, 4]);
    expect(getDisplayedPages(5, 4)).toEqual([3, 4, 5]);
    expect(getDisplayedPages(6, 3)).toEqual([2, 3, 4]);
    expect(getDisplayedPages(6, 4)).toEqual([3, 4, 5]);
  });
});

describe("handleDate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return true for valid date format YYYY-MM-DD", () => {
    const validDate = "2023-06-21";
    const result = handleDate(validDate);
    expect(result).toBe(true);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("should return false and show error toast for invalid date format", () => {
    const invalidDate = "06/21/2023";
    const result = handleDate(invalidDate);
    expect(result).toBe(false);
    expect(toast.error).toHaveBeenCalledWith(
      "Invalid Date Format. Please use the YYYY-MM-DD format.",
      {
        position: "bottom-left",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      }
    );
  });

  it("should return true and show no toast for empty date string", () => {
    const emptyDate = "";
    const result = handleDate(emptyDate);
    expect(result).toBe(true);
  });

  it("should return false and show error toast for date with invalid characters", () => {
    const invalidDate = "2023-06-21a";
    const result = handleDate(invalidDate);
    expect(result).toBe(false);
    expect(toast.error).toHaveBeenCalledWith(
      "Invalid Date Format. Please use the YYYY-MM-DD format.",
      {
        position: "bottom-left",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      }
    );
  });
});

import { url } from "@/components/utils/URLs";
// Mock fetch and toast
global.fetch = jest.fn();
jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe("markTaskAsCompleted", () => {
  const email = "test@example.com";
  const encryptionSecret = "secret";
  const UUID = "user-uuid";
  const taskuuid = "task-uuid";
  const backendURL = `${url.backendURL}complete-task`;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("marks task as completed successfully", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    await markTaskAsCompleted(email, encryptionSecret, UUID, taskuuid);

    expect(fetch).toHaveBeenCalledWith(backendURL, {
      method: "POST",
      body: JSON.stringify({
        email: email,
        encryptionSecret: encryptionSecret,
        UUID: UUID,
        taskuuid: taskuuid,
      }),
    });
    expect(toast.success).toHaveBeenCalledWith(
      "Task marked as completed successfully!",
      {
        position: "bottom-left",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      }
    );
  });
});

global.fetch = jest.fn();
jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe("markTaskAsDeleted", () => {
  const email = "test@example.com";
  const encryptionSecret = "secret";
  const UUID = "user-uuid";
  const taskuuid = "task-uuid";
  const backendURL = `${url.backendURL}delete-task`;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("marks task as deleted successfully", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    await markTaskAsDeleted(email, encryptionSecret, UUID, taskuuid);

    expect(fetch).toHaveBeenCalledWith(backendURL, {
      method: "POST",
      body: JSON.stringify({
        email: email,
        encryptionSecret: encryptionSecret,
        UUID: UUID,
        taskuuid: taskuuid,
      }),
    });
    expect(toast.success).toHaveBeenCalledWith(
      "Task marked as deleted successfully!",
      {
        position: "bottom-left",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      }
    );
  });
});
