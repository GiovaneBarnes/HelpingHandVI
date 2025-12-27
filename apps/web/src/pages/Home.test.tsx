import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Home } from './Home';

// Mock fetch globally
const fetchMock = vi.fn();
global.fetch = fetchMock;

// Mock console.error
const consoleErrorMock = vi.fn();
console.error = consoleErrorMock;

describe('Home', () => {
  beforeEach(() => {
    fetchMock.mockClear();
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/settings/emergency-mode')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ enabled: false })
        });
      } else if (url.includes('/providers')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: {
              providers: [
                {
                  id: 1,
                  name: 'John Doe',
                  phone: '123-456-7890',
                  island: 'STJ',
                  status: 'TODAY',
                  last_active_at: new Date().toISOString(),
                  lifecycle_status: 'ACTIVE',
                  is_premium_active: false,
                  is_trial: false,
                  profile: {}
                },
                {
                  id: 2,
                  name: 'Jane Smith',
                  phone: '098-765-4321',
                  island: 'STT',
                  status: 'NEXT_3_DAYS',
                  last_active_at: new Date().toISOString(),
                  lifecycle_status: 'ACTIVE',
                  is_premium_active: true,
                  is_trial: false,
                  profile: {}
                }
              ],
              nextCursor: null,
              hasMore: false,
              suggestions: []
            }
          })
        });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });
  });

  const renderHome = () => {
    return render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
  };

  it('renders loading state initially', () => {
    // Override the mock to never resolve for this test
    fetchMock.mockImplementationOnce(() => new Promise(() => {}));

    renderHome();

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders providers when data loads successfully', async () => {
    renderHome();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    expect(screen.getAllByText('St. John')).toHaveLength(2); // One in select, one in provider
    expect(screen.getAllByText('St. Thomas')).toHaveLength(2); // One in select, one in provider
  });

  it('displays error message when API fails', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/providers')) {
        return Promise.reject(new Error('Network error'));
      }
      if (url.includes('/settings/emergency-mode')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ enabled: false })
        });
      } else if (url.includes('/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      } else if (url.includes('/areas')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });

    renderHome();

    await waitFor(() => {
      expect(screen.getByText('Error: Network error')).toBeInTheDocument();
    });
  });

  it('shows premium badge for premium providers', async () => {
    renderHome();

    await waitFor(() => {
      expect(screen.getByText('Premium')).toBeInTheDocument();
    });
  });

  it('shows trial badge for trial providers', async () => {
    // Override mock to return trial provider
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/settings/emergency-mode')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ enabled: false })
        });
      } else if (url.includes('/providers')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: {
              providers: [
                {
                  id: 1,
                  name: 'Trial Provider',
                  phone: '123-456-7890',
                  island: 'STJ',
                  status: 'TODAY',
                  last_active_at: new Date().toISOString(),
                  lifecycle_status: 'ACTIVE',
                  is_premium_active: true,
                  is_trial: true,
                  profile: {}
                }
              ],
              nextCursor: null,
              hasMore: false,
              suggestions: []
            }
          })
        });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    renderHome();

    await waitFor(() => {
      expect(screen.getByText('Trial')).toBeInTheDocument();
    });
  });

  it('renders filter controls', async () => {
    renderHome();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Check that filter selects are rendered
    expect(screen.getByDisplayValue('All Islands')).toBeInTheDocument();
    expect(screen.getByDisplayValue('All Categories')).toBeInTheDocument();
    expect(screen.getByDisplayValue('All Availability')).toBeInTheDocument();
  });

  it('shows emergency mode banner when enabled', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/settings/emergency-mode')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { enabled: true }, error: null })
        });
      } else if (url.includes('/providers')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: {
              providers: [
                {
                  id: 1,
                  name: 'John Doe',
                  phone: '123-456-7890',
                  island: 'STJ',
                  status: 'TODAY',
                  last_active_at: new Date().toISOString(),
                  lifecycle_status: 'ACTIVE',
                  is_premium_active: false,
                  is_trial: false,
                  profile: {}
                }
              ],
              nextCursor: null,
              hasMore: false,
              suggestions: []
            }
          })
        });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    renderHome();

    await waitFor(() => {
      expect(screen.getByText(/High demand/)).toBeInTheDocument();
    });
  });

  it('shows suggestions when no providers match filters', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/settings/emergency-mode')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ enabled: false })
        });
      } else if (url.includes('/providers')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: {
              providers: [],
              nextCursor: null,
              hasMore: false,
              suggestions: [
                {
                  id: 1,
                  label: 'Try removing the island filter',
                  description: 'Show providers from all islands',
                  patch: { island: null }
                }
              ]
            }
          })
        });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    renderHome();

    await waitFor(() => {
      expect(screen.getByText('No matches for these filters.')).toBeInTheDocument();
      expect(screen.getByText('Try removing the island filter')).toBeInTheDocument();
    });
  });

  it('applies suggestion when clicked', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/settings/emergency-mode')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ enabled: false })
        });
      } else if (url.includes('/providers')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: {
              providers: [],
              nextCursor: null,
              hasMore: false,
              suggestions: [
                {
                  id: 1,
                  label: 'Try removing the island filter',
                  description: 'Show providers from all islands',
                  patch: { island: null }
                }
              ]
            }
          })
        });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    renderHome();

    await waitFor(() => {
      expect(screen.getByText('Try removing the island filter')).toBeInTheDocument();
    });

    const suggestionButton = screen.getByText('Try removing the island filter');
    fireEvent.click(suggestionButton);

    // Verify the fetch was called again with updated filters
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/providers?');
    });
  });

  it('shows inactive badge for inactive providers', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/settings/emergency-mode')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ enabled: false })
        });
      } else if (url.includes('/providers')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: {
              providers: [
                {
                  id: 1,
                  name: 'Inactive Provider',
                  phone: '123-456-7890',
                  island: 'STJ',
                  status: 'TODAY',
                  last_active_at: new Date().toISOString(),
                  lifecycle_status: 'INACTIVE',
                  is_premium_active: false,
                  is_trial: false,
                  profile: {}
                }
              ],
              nextCursor: null,
              hasMore: false,
              suggestions: []
            }
          })
        });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    renderHome();

    await waitFor(() => {
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });
  });

  it('shows load more button when hasMore is true', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/settings/emergency-mode')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ enabled: false })
        });
      } else if (url.includes('/providers')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: {
              providers: [
                {
                  id: 1,
                  name: 'John Doe',
                  phone: '123-456-7890',
                  island: 'STJ',
                  status: 'TODAY',
                  last_active_at: new Date().toISOString(),
                  lifecycle_status: 'ACTIVE',
                  is_premium_active: false,
                  is_trial: false,
                  profile: {}
                }
              ],
              nextCursor: 'next-page-cursor',
              hasMore: true,
              suggestions: []
            }
          })
        });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    renderHome();

    await waitFor(() => {
      expect(screen.getByText('Load More')).toBeInTheDocument();
    });
  });

  it('loads more providers when load more is clicked', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/settings/emergency-mode')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ enabled: false })
        });
      } else if (url.includes('/providers')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: {
              providers: [
                {
                  id: 1,
                  name: 'John Doe',
                  phone: '123-456-7890',
                  island: 'STJ',
                  status: 'TODAY',
                  last_active_at: new Date().toISOString(),
                  lifecycle_status: 'ACTIVE',
                  is_premium_active: false,
                  is_trial: false,
                  profile: {}
                }
              ],
              nextCursor: 'next-page-cursor',
              hasMore: true,
              suggestions: []
            }
          })
        });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    renderHome();

    await waitFor(() => {
      expect(screen.getByText('Load More')).toBeInTheDocument();
    });

    // Mock the second call to return additional providers
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/settings/emergency-mode')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ enabled: false })
        });
      } else if (url.includes('/providers')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: {
              providers: [
                {
                  id: 1,
                  name: 'John Doe',
                  phone: '123-456-7890',
                  island: 'STJ',
                  status: 'TODAY',
                  last_active_at: new Date().toISOString(),
                  lifecycle_status: 'ACTIVE',
                  is_premium_active: false,
                  is_trial: false,
                  profile: {}
                },
                {
                  id: 2,
                  name: 'Jane Smith',
                  phone: '098-765-4321',
                  island: 'STT',
                  status: 'NEXT_3_DAYS',
                  last_active_at: new Date().toISOString(),
                  lifecycle_status: 'ACTIVE',
                  is_premium_active: false,
                  is_trial: false,
                  profile: {}
                }
              ],
              nextCursor: null,
              hasMore: false,
              suggestions: []
            }
          })
        });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    const loadMoreButton = screen.getByText('Load More');
    fireEvent.click(loadMoreButton);

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // After loading more, the Load More button should be gone since hasMore is false
    await waitFor(() => {
      expect(screen.queryByText('Load More')).not.toBeInTheDocument();
    });
  });

  it('fetches areas when island is selected', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/settings/emergency-mode')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ enabled: false })
        });
      } else if (url.includes('/areas')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 1, name: 'Charlotte Amalie' },
            { id: 2, name: 'East End' }
          ])
        });
      } else if (url.includes('/providers')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: {
              providers: [
                {
                  id: 1,
                  name: 'John Doe',
                  phone: '123-456-7890',
                  island: 'STJ',
                  status: 'TODAY',
                  last_active_at: new Date().toISOString(),
                  lifecycle_status: 'ACTIVE',
                  is_premium_active: false,
                  is_trial: false,
                  profile: {}
                }
              ],
              nextCursor: null,
              hasMore: false,
              suggestions: []
            }
          })
        });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    renderHome();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const islandSelect = screen.getByDisplayValue('All Islands');
    fireEvent.change(islandSelect, { target: { value: 'STT' } });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/areas?island=STT');
    });

    // Check that area select is enabled and populated
    const areaSelect = screen.getByDisplayValue('All Areas');
    expect(areaSelect).not.toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText('Charlotte Amalie')).toBeInTheDocument();
    });
  });

  it('displays activity time correctly', async () => {
    const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();

    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/settings/emergency-mode')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ enabled: false })
        });
      } else if (url.includes('/providers')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: {
              providers: [
                {
                  id: 1,
                  name: 'Active Provider',
                  phone: '123-456-7890',
                  island: 'STJ',
                  status: 'TODAY',
                  last_active_at: fiveHoursAgo,
                  lifecycle_status: 'ACTIVE',
                  is_premium_active: false,
                  is_trial: false,
                  profile: {}
                },
                {
                  id: 2,
                  name: 'Never Active Provider',
                  phone: '098-765-4321',
                  island: 'STT',
                  status: 'NEXT_3_DAYS',
                  last_active_at: null,
                  lifecycle_status: 'ACTIVE',
                  is_premium_active: false,
                  is_trial: false,
                  profile: {}
                }
              ],
              nextCursor: null,
              hasMore: false,
              suggestions: []
            }
          })
        });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    renderHome();

    await waitFor(() => {
      expect(screen.getByText('Activity: 5 hours ago')).toBeInTheDocument();
      expect(screen.getByText('Activity: Never')).toBeInTheDocument();
    });
  });

  it('renders provider contact buttons', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/settings/emergency-mode')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ enabled: false })
        });
      } else if (url.includes('/providers')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: {
              providers: [
                {
                  id: 1,
                  name: 'Provider with WhatsApp',
                  phone: '123-456-7890',
                  whatsapp: '1234567890',
                  island: 'STJ',
                  status: 'TODAY',
                  last_active_at: new Date().toISOString(),
                  lifecycle_status: 'ACTIVE',
                  is_premium_active: false,
                  is_trial: false,
                  profile: {}
                },
                {
                  id: 2,
                  name: 'Provider without WhatsApp',
                  phone: '098-765-4321',
                  whatsapp: null,
                  island: 'STT',
                  status: 'NEXT_3_DAYS',
                  last_active_at: new Date().toISOString(),
                  lifecycle_status: 'ACTIVE',
                  is_premium_active: false,
                  is_trial: false,
                  profile: {}
                }
              ],
              nextCursor: null,
              hasMore: false,
              suggestions: []
            }
          })
        });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    renderHome();

    await waitFor(() => {
      expect(screen.getByText('Provider with WhatsApp')).toBeInTheDocument();
    });

    // Check that WhatsApp button shows for provider with WhatsApp
    expect(screen.getAllByText('WhatsApp')).toHaveLength(1);

    // Check that SMS button shows for provider without WhatsApp
    expect(screen.getAllByText('SMS')).toHaveLength(1);

    // Check that Call buttons exist for both
    expect(screen.getAllByText('Call')).toHaveLength(2);
  });

  it('renders view details link for each provider', async () => {
    renderHome();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const viewDetailsLinks = screen.getAllByText('View Details');
    expect(viewDetailsLinks).toHaveLength(2);
  });

  it('handles fetch areas error gracefully', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/settings/emergency-mode')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ enabled: false })
        });
      } else if (url.includes('/areas')) {
        return Promise.reject(new Error('Network error'));
      } else if (url.includes('/providers')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: {
              providers: [
                {
                  id: 1,
                  name: 'John Doe',
                  phone: '123-456-7890',
                  island: 'STJ',
                  status: 'TODAY',
                  last_active_at: new Date().toISOString(),
                  lifecycle_status: 'ACTIVE',
                  is_premium_active: false,
                  is_trial: false,
                  profile: {}
                }
              ],
              nextCursor: null,
              hasMore: false,
              suggestions: []
            }
          })
        });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    renderHome();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const islandSelect = screen.getByDisplayValue('All Islands');
    fireEvent.change(islandSelect, { target: { value: 'STT' } });

    // Should not crash, areas dropdown should remain disabled
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/areas?island=STT');
    });
  });

  it('handles fetch emergency mode error gracefully', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/settings/emergency-mode')) {
        return Promise.reject(new Error('Network error'));
      } else if (url.includes('/providers')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: {
              providers: [
                {
                  id: 1,
                  name: 'John Doe',
                  phone: '123-456-7890',
                  island: 'STJ',
                  status: 'TODAY',
                  last_active_at: new Date().toISOString(),
                  lifecycle_status: 'ACTIVE',
                  is_premium_active: false,
                  is_trial: false,
                  profile: {}
                }
              ],
              nextCursor: null,
              hasMore: false,
              suggestions: []
            }
          })
        });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    renderHome();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Should have logged the error
    expect(consoleErrorMock).toHaveBeenCalledWith('Failed to fetch emergency mode');

    // Should not crash and should still render providers
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('applies suggestions when clicked', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/settings/emergency-mode')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ enabled: false })
        });
      } else if (url.includes('/providers')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: {
              providers: [], // No providers to trigger suggestions display
              nextCursor: null,
              hasMore: false,
              suggestions: [
                {
                  id: 1,
                  label: 'Try removing island filter',
                  description: 'Remove the island filter to see more results',
                  patch: { island: null, areaId: null }
                }
              ]
            }
          })
        });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    renderHome();

    await waitFor(() => {
      expect(screen.getByText('No matches for these filters.')).toBeInTheDocument();
    });

    // Click the suggestion
    const suggestionButton = screen.getByText('Try removing island filter');
    fireEvent.click(suggestionButton);

    // Should trigger a re-fetch and show loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('filters by island using canonical codes', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/settings/emergency-mode')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ enabled: false })
        });
      } else if (url.includes('/providers?island=STT')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: {
              providers: [
                {
                  id: 2,
                  name: 'Jane Smith',
                  phone: '098-765-4321',
                  island: 'STT',
                  status: 'NEXT_3_DAYS',
                  last_active_at: new Date().toISOString(),
                  lifecycle_status: 'ACTIVE',
                  is_premium_active: true,
                  is_trial: false,
                  profile: {}
                }
              ],
              nextCursor: null,
              hasMore: false
            }
          })
        });
      } else if (url.includes('/providers') && !url.includes('island=')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: {
              providers: [
                {
                  id: 1,
                  name: 'John Doe',
                  phone: '123-456-7890',
                  island: 'STJ',
                  status: 'TODAY',
                  last_active_at: new Date().toISOString(),
                  lifecycle_status: 'ACTIVE',
                  is_premium_active: false,
                  is_trial: false,
                  profile: {}
                },
                {
                  id: 2,
                  name: 'Jane Smith',
                  phone: '098-765-4321',
                  island: 'STT',
                  status: 'NEXT_3_DAYS',
                  last_active_at: new Date().toISOString(),
                  lifecycle_status: 'ACTIVE',
                  is_premium_active: true,
                  is_trial: false,
                  profile: {}
                }
              ],
              nextCursor: null,
              hasMore: false
            }
          })
        });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    renderHome();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Select St. Thomas (STT)
    const islandSelect = screen.getByDisplayValue('All Islands');
    fireEvent.change(islandSelect, { target: { value: 'STT' } });

    // Should show only Jane Smith (St. Thomas)
    await waitFor(() => {
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });
});