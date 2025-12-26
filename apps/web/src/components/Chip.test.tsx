import { render, screen } from '@testing-library/react';
import { Chip } from './Chip';

describe('Chip', () => {
  it('renders with label', () => {
    render(<Chip label="Test Chip" />);

    const chip = screen.getByText('Test Chip');
    expect(chip).toBeInTheDocument();
  });

  it('has correct default classes', () => {
    render(<Chip label="Default" />);

    const chip = screen.getByText('Default');
    expect(chip).toHaveClass(
      'inline-block',
      'bg-gray-200',
      'text-gray-800',
      'px-2',
      'py-1',
      'rounded-full',
      'text-sm'
    );
  });

  it('applies custom className', () => {
    render(<Chip label="Custom" className="custom-class" />);

    const chip = screen.getByText('Custom');
    expect(chip).toHaveClass('custom-class');
  });

  it('renders different labels', () => {
    const { rerender } = render(<Chip label="First" />);
    expect(screen.getByText('First')).toBeInTheDocument();

    rerender(<Chip label="Second" />);
    expect(screen.getByText('Second')).toBeInTheDocument();
  });
});