import { render, screen, fireEvent } from '@testing-library/react';
import { StatusButtons } from './StatusButtons';

describe('StatusButtons', () => {
  const mockOnStatusChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all three status buttons', () => {
    render(<StatusButtons currentStatus="OPEN_NOW" onStatusChange={mockOnStatusChange} />);

    expect(screen.getByText('Open for Work')).toBeInTheDocument();
    expect(screen.getByText('Busy / Limited')).toBeInTheDocument();
    expect(screen.getByText('Not Taking Work')).toBeInTheDocument();
  });

  it('highlights the current status button with correct styling', () => {
    render(<StatusButtons currentStatus="OPEN_NOW" onStatusChange={mockOnStatusChange} />);

    const openButton = screen.getByText('Open for Work');
    const busyButton = screen.getByText('Busy / Limited');
    const notTakingButton = screen.getByText('Not Taking Work');

    expect(openButton).toHaveClass('bg-green-600', 'text-white');
    expect(busyButton).toHaveClass('bg-gray-200');
    expect(notTakingButton).toHaveClass('bg-gray-200');
  });

  it('highlights BUSY_LIMITED status correctly', () => {
    render(<StatusButtons currentStatus="BUSY_LIMITED" onStatusChange={mockOnStatusChange} />);

    const openButton = screen.getByText('Open for Work');
    const busyButton = screen.getByText('Busy / Limited');
    const notTakingButton = screen.getByText('Not Taking Work');

    expect(openButton).toHaveClass('bg-gray-200');
    expect(busyButton).toHaveClass('bg-yellow-600', 'text-white');
    expect(notTakingButton).toHaveClass('bg-gray-200');
  });

  it('highlights NOT_TAKING_WORK status correctly', () => {
    render(<StatusButtons currentStatus="NOT_TAKING_WORK" onStatusChange={mockOnStatusChange} />);

    const openButton = screen.getByText('Open for Work');
    const busyButton = screen.getByText('Busy / Limited');
    const notTakingButton = screen.getByText('Not Taking Work');

    expect(openButton).toHaveClass('bg-gray-200');
    expect(busyButton).toHaveClass('bg-gray-200');
    expect(notTakingButton).toHaveClass('bg-red-600', 'text-white');
  });

  it('calls onStatusChange with OPEN_NOW when Open for Work button is clicked', () => {
    render(<StatusButtons currentStatus="NOT_TAKING_WORK" onStatusChange={mockOnStatusChange} />);

    const openButton = screen.getByText('Open for Work');
    fireEvent.click(openButton);

    expect(mockOnStatusChange).toHaveBeenCalledWith('OPEN_NOW');
    expect(mockOnStatusChange).toHaveBeenCalledTimes(1);
  });

  it('calls onStatusChange with BUSY_LIMITED when Busy button is clicked', () => {
    render(<StatusButtons currentStatus="OPEN_NOW" onStatusChange={mockOnStatusChange} />);

    const busyButton = screen.getByText('Busy / Limited');
    fireEvent.click(busyButton);

    expect(mockOnStatusChange).toHaveBeenCalledWith('BUSY_LIMITED');
    expect(mockOnStatusChange).toHaveBeenCalledTimes(1);
  });

  it('calls onStatusChange with NOT_TAKING_WORK when Not Taking Work button is clicked', () => {
    render(<StatusButtons currentStatus="OPEN_NOW" onStatusChange={mockOnStatusChange} />);

    const notTakingButton = screen.getByText('Not Taking Work');
    fireEvent.click(notTakingButton);

    expect(mockOnStatusChange).toHaveBeenCalledWith('NOT_TAKING_WORK');
    expect(mockOnStatusChange).toHaveBeenCalledTimes(1);
  });

  it('allows changing from one status to another', () => {
    const { rerender } = render(<StatusButtons currentStatus="OPEN_NOW" onStatusChange={mockOnStatusChange} />);

    // Initially OPEN_NOW is highlighted
    expect(screen.getByText('Open for Work')).toHaveClass('bg-green-600', 'text-white');

    // Click on BUSY_LIMITED
    fireEvent.click(screen.getByText('Busy / Limited'));
    expect(mockOnStatusChange).toHaveBeenCalledWith('BUSY_LIMITED');

    // Rerender with new status
    rerender(<StatusButtons currentStatus="BUSY_LIMITED" onStatusChange={mockOnStatusChange} />);
    expect(screen.getByText('Busy / Limited')).toHaveClass('bg-yellow-600', 'text-white');
    expect(screen.getByText('Open for Work')).toHaveClass('bg-gray-200');
  });

  it('renders buttons in correct order', () => {
    render(<StatusButtons currentStatus="OPEN_NOW" onStatusChange={mockOnStatusChange} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
    expect(buttons[0]).toHaveTextContent('Open for Work');
    expect(buttons[1]).toHaveTextContent('Busy / Limited');
    expect(buttons[2]).toHaveTextContent('Not Taking Work');
  });

  it('has proper button spacing', () => {
    render(<StatusButtons currentStatus="OPEN_NOW" onStatusChange={mockOnStatusChange} />);

    const container = screen.getByText('Open for Work').closest('div');
    expect(container).toHaveClass('flex', 'space-x-4');
  });
});