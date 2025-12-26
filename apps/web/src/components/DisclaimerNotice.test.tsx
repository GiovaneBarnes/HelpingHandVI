import { render, screen } from '@testing-library/react';
import { DisclaimerNotice } from './DisclaimerNotice';

describe('DisclaimerNotice', () => {
  it('renders both required disclaimer sentences', () => {
    render(<DisclaimerNotice />);

    expect(screen.getByText("We don't guarantee work, pricing, timing, or quality.")).toBeInTheDocument();
    expect(screen.getByText('Confirm details directly with the provider.')).toBeInTheDocument();
  });

  it('renders with full variant by default', () => {
    render(<DisclaimerNotice />);

    expect(screen.getByText('Before you contact')).toBeInTheDocument();
    expect(screen.getByText("We don't guarantee work, pricing, timing, or quality.")).toBeInTheDocument();
  });

  it('renders with compact variant', () => {
    render(<DisclaimerNotice variant="compact" />);

    expect(screen.queryByText('Before you contact')).not.toBeInTheDocument();
    expect(screen.getByText("We don't guarantee work, pricing, timing, or quality.")).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<DisclaimerNotice className="custom-class" />);

    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv).toHaveClass('custom-class');
  });
});