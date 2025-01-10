import { Task } from "@/components/utils/types";
import { url } from "@/components/utils/URLs";
import { format, parseISO } from "date-fns";
import { toast } from "react-toastify";

export type Props = {
  email: string;
  encryptionSecret: string;
  origin: string;
  UUID: string;
};

export const sortTasks = (tasks: Task[], order: "asc" | "desc") => {
  return tasks.sort((a, b) => {
    if (a.status < b.status) return order === "asc" ? -1 : 1;
    if (a.status > b.status) return order === "asc" ? 1 : -1;
    return 0;
  });
};

export const markTaskAsCompleted = async (
  email: string,
  encryptionSecret: string,
  UUID: string,
  taskuuid: string
) => {
  try {
    const backendURL = url.backendURL + `complete-task`;

    const response = await fetch(backendURL, {
      method: "POST",
      body: JSON.stringify({
        email: email,
        encryptionSecret: encryptionSecret,
        UUID: UUID,
        taskuuid: taskuuid,
      }),
    });

    if (response) {
      console.log("Task marked as completed successfully!");
      toast.success("Task marked as completed successfully!", {
        position: "bottom-left",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } else {
      toast.error("Error in marked the task as completed. Please try again.", {
        position: "bottom-left",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      console.error("Failed to mark task as completed");
    }
  } catch (error) {
    console.error("Error marking task as completed:", error);
  }
};

export const markTaskAsDeleted = async (
  email: string,
  encryptionSecret: string,
  UUID: string,
  taskuuid: string
) => {
  try {
    const backendURL = url.backendURL + `delete-task`;

    const response = await fetch(backendURL, {
      method: "POST",
      body: JSON.stringify({
        email: email,
        encryptionSecret: encryptionSecret,
        UUID: UUID,
        taskuuid: taskuuid,
      }),
    });

    if (response) {
      console.log("Task marked as deleted successfully!");
      toast.success("Task marked as deleted successfully!", {
        position: "bottom-left",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } else {
      toast.error("Error in marked the task as deleted. Please try again.", {
        position: "bottom-left",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      console.error("Failed to mark task as deleted");
    }
  } catch (error) {
    console.error("Error marking task as deleted:", error);
  }
};

export const getDisplayedPages = (totalPages: number, currentPage: number) => {
  const pages: number[] = [];
  if (totalPages <= 3) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    if (currentPage === 1) {
      pages.push(currentPage, currentPage + 1, currentPage + 2);
    } else if (currentPage === totalPages) {
      pages.push(currentPage - 2, currentPage - 1, currentPage);
    } else {
      pages.push(currentPage - 1, currentPage, currentPage + 1);
    }
  }
  return pages;
};

export const formattedDate = (dateString: string) => {
  try {
    return format(parseISO(dateString), "PPpp");
  } catch (error) {
    return dateString;
  }
};

export const sortTasksById = (tasks: Task[], order: "asc" | "desc") => {
  return tasks.sort((a, b) => {
    if (order === "asc") {
      return a.id < b.id ? -1 : 1;
    } else {
      return b.id < a.id ? -1 : 1;
    }
  });
};

export const handleCopy = (text: string) => {
  toast.success(`${text} copied to clipboard!`, {
    position: "bottom-left",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  });
};

export const handleDate = (v: string) => {
  const date = new Date(v);
  const isValid = !isNaN(date.getTime()) && v === date.toISOString().split('T')[0];

  if (!isValid) {
    toast.error("Invalid Date Format. Please use the YYYY-MM-DD format.", {
      position: "bottom-left",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
    return false;
  }
  return true;
};
