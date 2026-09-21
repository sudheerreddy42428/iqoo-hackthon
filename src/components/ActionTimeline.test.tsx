import { render, screen } from '@testing-library/react';
import { ActionTimeline } from './ActionTimeline';
import { UserAction } from '../types/reprox';
import { vi, describe, it, expect, beforeEach } from 'vitest';
const mockActions: UserAction[] = [
  {
    id: '1',
    type: 'NAVIGATION',
    screen: 'Home',
    description: 'Opened App',
    timestamp: '12:00:00.000',
    epochTime: 1700000000000,
  },
  {
    id: '2',
    type: 'CLICK',
    screen: 'Cart',
    target: 'Checkout Button',
    description: 'User tapped Checkout',
    timestamp: '12:00:01.000',
    epochTime: 1700000001000,
  }
];

let mockActiveCrash: any = null;

vi.mock('../context/InvestigationContext', () => ({
  useInvestigation: () => ({
    get activeCrash() {
      return mockActiveCrash;
    }
  })
}));

describe('ActionTimeline', () => {
  beforeEach(() => {
    mockActiveCrash = null;
  });

  it('renders a list of user actions', () => {
    mockActiveCrash = { recentActions: mockActions };
    render(<ActionTimeline />);
    
    // Check if the screen names are rendered
    expect(screen.getByText(/Home/)).toBeInTheDocument();
    expect(screen.getByText(/Cart/)).toBeInTheDocument();
    
    // Check if descriptions are rendered
    expect(screen.getByText('Opened App')).toBeInTheDocument();
    expect(screen.getByText('User tapped Checkout')).toBeInTheDocument();
  });

  it('displays empty state when no actions are provided', () => {
    mockActiveCrash = { recentActions: [] };
    render(<ActionTimeline />);
    
    expect(screen.getByText(/Buffer is empty/i)).toBeInTheDocument();
  });
});
