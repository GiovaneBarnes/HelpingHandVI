import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { AccountManagement } from './AccountManagement';

const mockProvider = {
  id: 1,
  name: 'Test Provider',
  phone: '123-456-7890',
  island: 'STT',
  description: 'Test description',
  categories: [{ id: 1, name: 'Plumbing' }],
  areas: [{ id: 1, name: 'Test Area' }],
  status: 'OPEN_NOW' as const,
  plan: 'FREE' as const,
  plan_source: 'TRIAL' as const,
  trial_end_at: undefined,
  is_premium_active: false,
  trial_days_left: 30,
  is_trial: true,
  trust_tier: 2,
  last_active_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  lifecycle_status: 'ACTIVE' as const,
  is_disputed: false,
  emergency_boost_eligible: false,
};

describe('AccountManagement', () => {
  const mockOnDeleteAccount = vi.fn();
  const mockOnUpgradePlan = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders account management header', () => {
    render(<AccountManagement provider={mockProvider} />);

    expect(screen.getByText('Account Management')).toBeInTheDocument();
  });

  it('displays free plan information for non-premium users', () => {
    render(<AccountManagement provider={mockProvider} />);

    expect(screen.getByText('Free Plan')).toBeInTheDocument();
    expect(screen.getByText('Upgrade to access premium features like higher visibility and emergency services')).toBeInTheDocument();
    expect(screen.getByText('Upgrade')).toBeInTheDocument();
  });

  it('displays premium plan information for premium users', () => {
    const premiumProvider = { ...mockProvider, is_premium_active: true };
    render(<AccountManagement provider={premiumProvider} />);

    expect(screen.getByText('Premium Plan')).toBeInTheDocument();
    expect(screen.getByText('You have access to all premium features')).toBeInTheDocument();
    expect(screen.queryByText('Upgrade')).not.toBeInTheDocument();
  });

  it('calls onUpgradePlan when upgrade button is clicked', () => {
    render(<AccountManagement provider={mockProvider} onUpgradePlan={mockOnUpgradePlan} />);

    const upgradeButton = screen.getByText('Upgrade');
    fireEvent.click(upgradeButton);

    expect(mockOnUpgradePlan).toHaveBeenCalledTimes(1);
  });

  it('displays trial information when user is on trial', () => {
    render(<AccountManagement provider={mockProvider} />);

    expect(screen.getByText('30 days remaining')).toBeInTheDocument();
  });

  it('does not display trial information when user is not on trial', () => {
    const nonTrialProvider = { ...mockProvider, is_trial: false };
    render(<AccountManagement provider={nonTrialProvider} />);

    expect(screen.queryByText('Trial Active:')).not.toBeInTheDocument();
  });

  it('renders account actions section', () => {
    render(<AccountManagement provider={mockProvider} />);

    expect(screen.getByText('Account Actions')).toBeInTheDocument();
    expect(screen.getByText('Danger Zone')).toBeInTheDocument();
    expect(screen.getByText('Delete Account')).toBeInTheDocument();
  });

  it('displays delete account warning text', () => {
    render(<AccountManagement provider={mockProvider} />);

    expect(screen.getByText(/Deleting your account will permanently remove/)).toBeInTheDocument();
    expect(screen.getByText(/This action cannot be undone/)).toBeInTheDocument();
  });

  it('shows delete confirmation modal when delete button is clicked', () => {
    render(<AccountManagement provider={mockProvider} />);

    const deleteButton = screen.getByText('Delete Account');
    fireEvent.click(deleteButton);

    expect(screen.getByText('Confirm Account Deletion')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getAllByText('Delete Account')).toHaveLength(2);
  });

  it('closes delete confirmation modal when cancel is clicked', () => {
    render(<AccountManagement provider={mockProvider} />);

    const deleteButton = screen.getByText('Delete Account');
    fireEvent.click(deleteButton);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(screen.queryByText('Confirm Account Deletion')).not.toBeInTheDocument();
  });

  it('calls onDeleteAccount when delete is confirmed in modal', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<AccountManagement provider={mockProvider} onDeleteAccount={mockOnDeleteAccount} />);

    const deleteButton = screen.getByText('Delete Account');
    fireEvent.click(deleteButton);

    const confirmDeleteButton = screen.getAllByText('Delete Account')[1];
    fireEvent.click(confirmDeleteButton);

    expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.');
    expect(mockOnDeleteAccount).toHaveBeenCalledTimes(1);

    confirmSpy.mockRestore();
  });

  it('does not call onDeleteAccount when user cancels browser confirm', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<AccountManagement provider={mockProvider} onDeleteAccount={mockOnDeleteAccount} />);

    const deleteButton = screen.getByText('Delete Account');
    fireEvent.click(deleteButton);

    const confirmDeleteButton = screen.getAllByText('Delete Account')[1];
    fireEvent.click(confirmDeleteButton);

    expect(confirmSpy).toHaveBeenCalled();
    expect(mockOnDeleteAccount).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('closes modal after delete confirmation', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<AccountManagement provider={mockProvider} onDeleteAccount={mockOnDeleteAccount} />);

    const deleteButton = screen.getByText('Delete Account');
    fireEvent.click(deleteButton);

    const confirmDeleteButton = screen.getAllByText('Delete Account')[1];
    fireEvent.click(confirmDeleteButton);

    expect(screen.queryByText('Confirm Account Deletion')).not.toBeInTheDocument();

    confirmSpy.mockRestore();
  });

  it('renders identity change notice', () => {
    render(<AccountManagement provider={mockProvider} />);

    expect(screen.getByText('Identity Changes Require Approval')).toBeInTheDocument();
    expect(screen.getByText(/Changes to your business name, primary location/)).toBeInTheDocument();
    expect(screen.getByText('Why?')).toBeInTheDocument();
    expect(screen.getByText(/This protects your established reputation/)).toBeInTheDocument();
  });

  it('does not show modal initially', () => {
    render(<AccountManagement provider={mockProvider} />);

    expect(screen.queryByText('Confirm Account Deletion')).not.toBeInTheDocument();
  });
});