import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ProfileForm } from './ProfileForm';

// Mock fetch globally
global.fetch = vi.fn();

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

const mockCategories = [
  { id: 1, name: 'Plumbing' },
  { id: 2, name: 'Electrical' },
  { id: 3, name: 'Handyman' },
];

describe('ProfileForm', () => {
  const mockOnSave = vi.fn();
  const mockOnRequestChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockCategories),
    });
  });

  it('renders with provider data', () => {
    render(
      <ProfileForm
        provider={mockProvider}
        onSave={mockOnSave}
        onRequestChange={mockOnRequestChange}
      />
    );

    expect(screen.getByText('Test Provider')).toBeInTheDocument();
    expect(screen.getByText('STT')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123-456-7890')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
  });

  it('shows character count for description', () => {
    render(
      <ProfileForm
        provider={mockProvider}
        onSave={mockOnSave}
        onRequestChange={mockOnRequestChange}
      />
    );

    expect(screen.getByText('16/200 characters')).toBeInTheDocument();
  });

  it('updates phone number', () => {
    render(
      <ProfileForm
        provider={mockProvider}
        onSave={mockOnSave}
        onRequestChange={mockOnRequestChange}
      />
    );

    const phoneInput = screen.getByDisplayValue('123-456-7890');
    fireEvent.change(phoneInput, { target: { value: '987-654-3210' } });

    expect(phoneInput).toHaveValue('987-654-3210');
  });

  it('updates description', () => {
    render(
      <ProfileForm
        provider={mockProvider}
        onSave={mockOnSave}
        onRequestChange={mockOnRequestChange}
      />
    );

    const descriptionTextarea = screen.getByDisplayValue('Test description');
    fireEvent.change(descriptionTextarea, { target: { value: 'Updated description' } });

    expect(descriptionTextarea).toHaveValue('Updated description');
    expect(screen.getByText('19/200 characters')).toBeInTheDocument();
  });

  it('renders categories checkboxes', async () => {
    render(
      <ProfileForm
        provider={mockProvider}
        onSave={mockOnSave}
        onRequestChange={mockOnRequestChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Plumbing')).toBeInTheDocument();
      expect(screen.getByText('Electrical')).toBeInTheDocument();
      expect(screen.getByText('Handyman')).toBeInTheDocument();
    });

    const plumbingCheckbox = screen.getByLabelText('Plumbing');
    expect(plumbingCheckbox).toBeChecked();
  });

  it('saves changes successfully', async () => {
    mockOnSave.mockResolvedValueOnce(undefined);

    render(
      <ProfileForm
        provider={mockProvider}
        onSave={mockOnSave}
        onRequestChange={mockOnRequestChange}
      />
    );

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Plumbing')).toBeInTheDocument();
    });

    const phoneInput = screen.getByDisplayValue('123-456-7890');
    fireEvent.change(phoneInput, { target: { value: '987-654-3210' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    expect(saveButton).toHaveTextContent('Saving...');

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        phone: '987-654-3210',
        description: 'Test description',
        categories: [{ id: 1, name: 'Plumbing' }],
        contact_preference: 'BOTH',
      });
    });

    expect(screen.getByText('Profile updated successfully')).toBeInTheDocument();
  });

  it('handles save error', async () => {
    mockOnSave.mockRejectedValueOnce(new Error('Save failed'));

    render(
      <ProfileForm
        provider={mockProvider}
        onSave={mockOnSave}
        onRequestChange={mockOnRequestChange}
      />
    );

    // Change a value to trigger save
    const phoneInput = screen.getByDisplayValue('123-456-7890');
    fireEvent.change(phoneInput, { target: { value: '999-999-9999' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to update profile')).toBeInTheDocument();
    });
  });

  it('opens name change request modal', () => {
    render(
      <ProfileForm
        provider={mockProvider}
        onSave={mockOnSave}
        onRequestChange={mockOnRequestChange}
      />
    );

    const nameChangeButton = screen.getByText('Request Name Change');
    fireEvent.click(nameChangeButton);

    expect(screen.getByText('Request Business Name Change')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Provider')).toBeInTheDocument();
  });

  it('opens island change request modal', () => {
    render(
      <ProfileForm
        provider={mockProvider}
        onSave={mockOnSave}
        onRequestChange={mockOnRequestChange}
      />
    );

    const islandChangeButton = screen.getByText('Request Location Change');
    fireEvent.click(islandChangeButton);

    expect(screen.getByRole('heading', { name: 'Request Location Change' })).toBeInTheDocument();
    // Look for STT in the modal specifically
    const modal = screen.getByRole('heading', { name: 'Request Location Change' }).closest('.bg-white');
    expect(modal).toHaveTextContent('STT');
  });

  it('submits name change request successfully', async () => {
    mockOnRequestChange.mockResolvedValueOnce(undefined);

    render(
      <ProfileForm
        provider={mockProvider}
        onSave={mockOnSave}
        onRequestChange={mockOnRequestChange}
      />
    );

    // Open modal
    const nameChangeButton = screen.getByText('Request Name Change');
    fireEvent.click(nameChangeButton);

    // Fill form
    const nameInput = screen.getByDisplayValue('Test Provider');
    fireEvent.change(nameInput, { target: { value: 'New Business Name' } });

    const reasonTextarea = screen.getByPlaceholderText('Please explain why you need this change...');
    fireEvent.change(reasonTextarea, { target: { value: 'Need to rebrand' } });

    // Submit
    const submitButton = screen.getByText('Submit Request');
    fireEvent.click(submitButton);

    expect(submitButton).toHaveTextContent('Submitting...');

    await waitFor(() => {
      expect(mockOnRequestChange).toHaveBeenCalledWith('name', 'New Business Name', 'Need to rebrand');
    });

    expect(screen.getByText('Change request submitted successfully')).toBeInTheDocument();
    expect(screen.queryByText('Request Business Name Change')).not.toBeInTheDocument();
  });

  it('submits island change request successfully', async () => {
    mockOnRequestChange.mockResolvedValueOnce(undefined);

    render(
      <ProfileForm
        provider={mockProvider}
        onSave={mockOnSave}
        onRequestChange={mockOnRequestChange}
      />
    );

    // Open modal
    const islandChangeButton = screen.getByText('Request Location Change');
    fireEvent.click(islandChangeButton);

    // Fill form - select starts with STT, change to STJ
    const modal = screen.getByRole('heading', { name: 'Request Location Change' }).closest('.bg-white');
    expect(modal).not.toBeNull();
    const islandSelect = modal!.querySelector('select') as HTMLSelectElement;
    fireEvent.change(islandSelect, { target: { value: 'STJ' } });

    const reasonTextarea = screen.getByPlaceholderText('Please explain why you need this change...');
    fireEvent.change(reasonTextarea, { target: { value: 'Moving to St. John' } });

    // Submit
    const submitButton = screen.getByText('Submit Request');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnRequestChange).toHaveBeenCalledWith('island', 'STJ', 'Moving to St. John');
    });

    expect(screen.getByText('Change request submitted successfully')).toBeInTheDocument();
  });

  it('handles request change error', async () => {
    mockOnRequestChange.mockRejectedValue(new Error('Request failed'));

    render(
      <ProfileForm
        provider={mockProvider}
        onSave={mockOnSave}
        onRequestChange={mockOnRequestChange}
      />
    );

    // Open modal
    const nameChangeButton = screen.getByText('Request Name Change');
    fireEvent.click(nameChangeButton);

    // Fill form
    const nameInput = screen.getByDisplayValue('Test Provider');
    fireEvent.change(nameInput, { target: { value: 'New Name' } });

    const reasonTextarea = screen.getByPlaceholderText('Please explain why you need this change...');
    fireEvent.change(reasonTextarea, { target: { value: 'Test reason' } });

    // Submit
    const submitButton = screen.getByText('Submit Request');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to submit change request')).toBeInTheDocument();
    });
  });

  it('cancels request modal', () => {
    render(
      <ProfileForm
        provider={mockProvider}
        onSave={mockOnSave}
        onRequestChange={mockOnRequestChange}
      />
    );

    // Open modal
    const nameChangeButton = screen.getByText('Request Name Change');
    fireEvent.click(nameChangeButton);

    expect(screen.getByText('Request Business Name Change')).toBeInTheDocument();

    // Cancel
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(screen.queryByText('Request Business Name Change')).not.toBeInTheDocument();
  });

  it('disables submit button when form is invalid', () => {
    render(
      <ProfileForm
        provider={mockProvider}
        onSave={mockOnSave}
        onRequestChange={mockOnRequestChange}
      />
    );

    // Open modal
    const nameChangeButton = screen.getByText('Request Name Change');
    fireEvent.click(nameChangeButton);

    // Fill only name, leave reason empty
    const nameInput = screen.getByDisplayValue('Test Provider');
    fireEvent.change(nameInput, { target: { value: 'New Name' } });

    const submitButton = screen.getByText('Submit Request');
    expect(submitButton).toBeDisabled();
  });

  it('shows current values in modal', () => {
    render(
      <ProfileForm
        provider={mockProvider}
        onSave={mockOnSave}
        onRequestChange={mockOnRequestChange}
      />
    );

    // Open name change modal
    const nameChangeButton = screen.getByText('Request Name Change');
    fireEvent.click(nameChangeButton);

    expect(screen.getByText('Current Name')).toBeInTheDocument();
    expect(screen.getAllByText('Test Provider')).toHaveLength(2); // One in protected info, one in modal
  });
});