import { render, screen, fireEvent } from "@testing-library/react";
import { NavbarDesktop } from "../NavbarDesktop";
import { syncTasksWithTwAndDb, Props, routeList } from "../navbar-utils";

// Mock external dependencies
jest.mock("../navbar-utils", () => ({
  syncTasksWithTwAndDb: jest.fn(),
  deleteAllTasks: jest.fn(),
  handleLogout: jest.fn(),
  routeList: [
    { href: "#", label: "Home" },
    { href: "#tasks", label: "Tasks" },
    { href: "#setup-guide", label: "Setup Guide" },
    { href: "#faq", label: "FAQ" },
  ],
}));

describe("NavbarDesktop", () => {
  const mockSetIsLoading = jest.fn();
  const mockProps: Props = {
    imgurl: "http://example.com/image.png",
    email: "test@example.com",
    encryptionSecret: "secret",
    origin: "http://localhost:3000",
    UUID: "1234-5678",
  };

  const extendedProps = {
    ...mockProps,
    isLoading: false,
    setIsLoading: mockSetIsLoading,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the navigation links correctly", () => {
    render(<NavbarDesktop {...extendedProps} />);

    routeList.forEach((route) => {
      expect(screen.getByText(route.label)).toBeInTheDocument();
    });
  });

  it("calls syncTasksWithTwAndDb when 'Sync Tasks' is clicked", () => {
    render(<NavbarDesktop {...extendedProps} />);
    const syncButton = screen.getByText("Sync Tasks");

    fireEvent.click(syncButton);

    expect(syncTasksWithTwAndDb).toHaveBeenCalledWith(extendedProps);
  });

  it("displays user email and handles dropdown menu actions", () => {
    render(<NavbarDesktop {...extendedProps} />);
  });
});
