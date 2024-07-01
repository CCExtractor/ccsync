import { render, screen, waitFor } from "@testing-library/react";
import { HomePage } from "../HomePage";

// Mock dependencies
jest.mock("../HomeComponents/Navbar/Navbar", () => ({
    Navbar: () => <div>Mocked Navbar</div>,
}));
jest.mock("../HomeComponents/Hero/Hero", () => ({
    Hero: () => <div>Mocked Hero</div>,
}));
jest.mock("../HomeComponents/Footer/Footer", () => ({
    Footer: () => <div>Mocked Footer</div>,
}));
jest.mock("../HomeComponents/SetupGuide/SetupGuide", () => ({
    SetupGuide: () => <div>Mocked SetupGuide</div>,
}));
jest.mock("../HomeComponents/FAQ/FAQ", () => ({
    FAQ: () => <div>Mocked FAQ</div>,
}));
jest.mock("../HomeComponents/Tasks/Tasks", () => ({
    Tasks: () => <div>Mocked Tasks</div>,
}));

const mockedNavigate = jest.fn();
jest.mock("react-router", () => ({
    useNavigate: () => mockedNavigate,
}));
jest.mock("@/components/utils/URLs", () => ({
    url: {
        backendURL: "http://mocked-backend-url/",
        containerOrigin: "http://mocked-origin/",
        frontendURL: "http://mocked-frontend-url/",
    },
}));

// Mock fetch
global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        json: () =>
            Promise.resolve({
                picture: "mocked-picture-url",
                email: "mocked-email",
                encryption_secret: "mocked-encryption-secret",
                uuid: "mocked-uuid",
                name: "mocked-name",
            }),
    })
) as jest.Mock;

describe("HomePage", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it("renders correctly when user info is fetched successfully", async () => {
        render(
            <HomePage />
        );

        await waitFor(() => {
            expect(screen.getByText("Mocked Navbar")).toBeInTheDocument();
            expect(screen.getByText("Mocked Hero")).toBeInTheDocument();
            expect(screen.getByText("Mocked Tasks")).toBeInTheDocument();
            expect(screen.getByText("Mocked SetupGuide")).toBeInTheDocument();
            expect(screen.getByText("Mocked FAQ")).toBeInTheDocument();
            expect(screen.getByText("Mocked Footer")).toBeInTheDocument();
        });
    });

    it("renders session expired message when user info fetch fails", async () => {
        (fetch as jest.Mock).mockImplementationOnce(() =>
            Promise.resolve({
                ok: false,
            })
        );

        render(
            <HomePage />
        );

        await waitFor(() => {
            expect(screen.getByText("Session has been expired.")).toBeInTheDocument();
        });
    });

    it("navigates to home page on fetch error", async () => {
        (fetch as jest.Mock).mockImplementationOnce(() => Promise.reject("Fetch error"));

        render(
            <HomePage />
        );

        await waitFor(() => {
            expect(mockedNavigate).toHaveBeenCalledWith("/");
        });
    });
});
