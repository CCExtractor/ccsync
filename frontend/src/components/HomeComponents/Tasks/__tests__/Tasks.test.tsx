import { render, screen } from '@testing-library/react';
import { Tasks } from '../Tasks'; // Ensure correct path to Tasks component

// Mock props for the Tasks component
const mockProps = {
    email: 'test@example.com',
    encryptionSecret: 'mockEncryptionSecret',
    UUID: 'mockUUID',
};

// Mock fetch function to simulate API calls
global.fetch = jest.fn().mockResolvedValue({ ok: true });

describe('Tasks Component', () => {
    test('renders tasks component', async () => {
        render(<Tasks origin={''} {...mockProps} />);
        expect(screen.getByTestId("tasks")).toBeInTheDocument();
    });
});
