import { render, screen } from '@testing-library/react';
import { UserDashboard } from '../UserDashboard';
import { AuthProvider } from '../../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Mock des services externes
jest.mock('../../services/AnalyticsService');
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  Area: () => <div data-testid="area" />,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('UserDashboard', () => {
  beforeEach(() => {
    // Mock user context
    const mockUser = {
      id: 'test-user-id',
      full_name: 'Test User',
      email: 'test@example.com'
    };
    
    // Mock useAuth hook
    jest.doMock('../../contexts/AuthContext', () => ({
      useAuth: () => ({ 
        user: mockUser,
        loading: false 
      }),
      AuthProvider: ({ children }: any) => <div>{children}</div>
    }));
  });

  test('affiche le titre du tableau de bord', async () => {
    renderWithProviders(<UserDashboard />);
    
    // Le composant devrait afficher le titre même en cours de chargement
    expect(screen.getByText(/Tableau de bord/i)).toBeInTheDocument();
  });

  test('affiche les boutons d\'export', async () => {
    renderWithProviders(<UserDashboard />);
    
    expect(screen.getByText(/JSON/i)).toBeInTheDocument();
    expect(screen.getByText(/CSV/i)).toBeInTheDocument();
  });

  test('affiche les sélecteurs de période', async () => {
    renderWithProviders(<UserDashboard />);
    
    expect(screen.getByText(/Cette semaine/i)).toBeInTheDocument();
    expect(screen.getByText(/Ce mois/i)).toBeInTheDocument();
    expect(screen.getByText(/Toute la période/i)).toBeInTheDocument();
  });
});