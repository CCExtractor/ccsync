import { render, screen } from '@testing-library/react';
import { Tasks } from '../Tasks'; // Ensure correct path to Tasks component

// Mock props for the Tasks component
const mockProps = {
    email: 'test@example.com',
    encryptionSecret: 'mockEncryptionSecret',
    UUID: 'mockUUID',
    isLoading: false,  // mock the loading state
    setIsLoading: jest.fn(),  // mock the setter function
};

// Mock functions and modules
jest.mock('react-toastify', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));

jest.mock('../tasks-utils', () => ({
    markTaskAsCompleted: jest.fn(),
    markTaskAsDeleted: jest.fn(),
}));

global.fetch = jest.fn().mockResolvedValue({ ok: true });

describe('Tasks Component', () => {
    test('renders tasks component', async () => {
        render(<Tasks origin={''} {...mockProps} />);
        expect(screen.getByTestId("tasks")).toBeInTheDocument();
    });
});
