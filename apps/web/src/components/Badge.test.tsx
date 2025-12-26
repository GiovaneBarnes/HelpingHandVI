import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders with default info variant', () => {
    render(<Badge label="Test Badge" />);

    const badge = screen.getByText('Test Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
  });

  it('renders with success variant', () => {
    render(<Badge label="Success" variant="success" />);

    const badge = screen.getByText('Success');
    expect(badge).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('renders with warning variant', () => {
    render(<Badge label="Warning" variant="warning" />);

    const badge = screen.getByText('Warning');
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
  });

  it('renders with error variant', () => {
    render(<Badge label="Error" variant="error" />);

    const badge = screen.getByText('Error');
    expect(badge).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('renders with secondary variant', () => {
    render(<Badge label="Secondary" variant="secondary" />);

    const badge = screen.getByText('Secondary');
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
  });

  it('applies custom className', () => {
    render(<Badge label="Custom" className="custom-class" />);

    const badge = screen.getByText('Custom');
    expect(badge).toHaveClass('custom-class');
  });

  it('has correct base classes', () => {
    render(<Badge label="Base" />);

    const badge = screen.getByText('Base');
    expect(badge).toHaveClass(
      'inline-block',
      'px-2',
      'py-1',
      'rounded-full',
      'text-xs',
      'font-medium'
    );
  });
});