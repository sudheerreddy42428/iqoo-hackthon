import React from 'react';
import { render, screen } from '@testing-library/react';
import { ActionTimeline } from './ActionTimeline';
import { UserAction } from '../types/reprox';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
const mockActions: UserAction[] = [
  {
    id: '1',
    type: 'NAVIGATION',
    screen: 'Home',
    description: 'Opened App',
    timestamp: Date.now(),
  },
  {
    id: '2',
    type: 'CLICK',
    screen: 'Cart',
    target: 'Checkout Button',
    description: 'User tapped Checkout',
    timestamp: Date.now() + 1000,
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
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Cart')).toBeInTheDocument();
    
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
