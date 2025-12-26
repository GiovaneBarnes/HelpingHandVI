import { describe, it, expect, vi } from 'vitest';

// Mock ReactDOM before importing main.tsx
const mockRender = vi.fn();
const mockCreateRoot = vi.fn(() => ({ render: mockRender }));

vi.mock('react-dom/client', () => ({
  default: {
    createRoot: mockCreateRoot,
  },
}));

// Mock the App component
vi.mock('./App.tsx', () => ({
  default: () => <div>App Component</div>,
}));

// Mock CSS import
vi.mock('./index.css', () => ({}));

describe('main.tsx', () => {
  it('can be imported without errors', async () => {
    // Mock document.getElementById
    const mockRoot = document.createElement('div');
    mockRoot.id = 'root';
    const mockGetElementById = vi.spyOn(document, 'getElementById');
    mockGetElementById.mockReturnValue(mockRoot);

    // Import main.tsx which will execute the code
    await import('./main.tsx');

    // Verify that createRoot was called with the root element
    expect(mockCreateRoot).toHaveBeenCalledWith(mockRoot);

    // Verify that render was called
    expect(mockRender).toHaveBeenCalled();

    // Restore mocks
    mockGetElementById.mockRestore();
  });
});