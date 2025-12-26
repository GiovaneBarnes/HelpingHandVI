import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders as button with default props', () => {
    render(<Button>Click me</Button>);

    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass('bg-blue-600', 'text-white');
  });

  it('renders with primary variant', () => {
    render(<Button variant="primary">Primary</Button>);

    const button = screen.getByRole('button', { name: 'Primary' });
    expect(button).toHaveClass('bg-blue-600', 'text-white', 'hover:bg-blue-700');
  });

  it('renders with secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>);

    const button = screen.getByRole('button', { name: 'Secondary' });
    expect(button).toHaveClass('bg-gray-200', 'text-gray-900', 'hover:bg-gray-300');
  });

  it('renders with custom type', () => {
    render(<Button type="submit">Submit</Button>);

    const button = screen.getByRole('button', { name: 'Submit' });
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('renders as link when href is provided', () => {
    render(<Button href="/test">Link Button</Button>);

    const link = screen.getByRole('link', { name: 'Link Button' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test');
    expect(link.tagName).toBe('A');
  });

  it('calls onClick when button is clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole('button', { name: 'Click me' });
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>);

    const button = screen.getByRole('button', { name: 'Custom' });
    expect(button).toHaveClass('custom-class');
  });

  it('has correct base classes', () => {
    render(<Button>Base Classes</Button>);

    const button = screen.getByRole('button', { name: 'Base Classes' });
    expect(button).toHaveClass(
      'px-4',
      'py-2',
      'rounded-md',
      'font-medium',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-offset-2'
    );
  });

  it('renders children correctly', () => {
    render(
      <Button>
        <span>Child Element</span>
        Text
      </Button>
    );

    expect(screen.getByText('Child Element')).toBeInTheDocument();
    expect(screen.getByText('Text')).toBeInTheDocument();
  });
});