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
  const mockProps: Props = {
    imgurl: "http://example.com/image.png",
    email: "test@example.com",
    encryptionSecret: "secret",
    origin: "http://localhost:3000",
    UUID: "1234-5678",
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the navigation links correctly", () => {
    render(<NavbarDesktop {...mockProps} />);

    routeList.forEach((route) => {
      expect(screen.getByText(route.label)).toBeInTheDocument();
    });
  });

  it("calls syncTasksWithTwAndDb when 'Sync Tasks' is clicked", () => {
    render(<NavbarDesktop {...mockProps} />);
    const syncButton = screen.getByText("Sync Tasks");

    fireEvent.click(syncButton);

    expect(syncTasksWithTwAndDb).toHaveBeenCalledWith(mockProps);
  });

  it("displays user email and handles dropdown menu actions", () => {
    render(<NavbarDesktop {...mockProps} />);
  });
});
