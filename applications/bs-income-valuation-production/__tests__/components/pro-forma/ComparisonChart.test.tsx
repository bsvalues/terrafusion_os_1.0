import React from 'react';
import { render, screen } from '@testing-library/react';
import ComparisonChart, { Scenario } from '../../../client/src/components/pro-forma/ComparisonChart';

// Mock Recharts components to avoid DOM measurement errors in tests
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  };
});

describe('ComparisonChart Component', () => {
  const mockScenarios: Scenario[] = [
    {
      name: 'Current Property',
      data: {
        propertyInfo: {
          location: 'Kennewick, WA'
        },
        financing: {
          purchasePrice: 450000
        }
      },
      analysis: {
        capRate: 4.2,
        cashOnCash: 6.8,
        roi: 8.5,
        valuation: 510000
      }
    },
    {
      name: 'Alternative Property',
      data: {
        propertyInfo: {
          location: 'Richland, WA'
        },
        financing: {
          purchasePrice: 380000
        }
      },
      analysis: {
        capRate: 5.1,
        cashOnCash: 7.2,
        roi: 9.3,
        valuation: 420000
      }
    },
    {
      name: 'Investment Opportunity',
      data: {
        propertyInfo: {
          location: 'Pasco, WA'
        },
        financing: {
          purchasePrice: 325000
        }
      },
      analysis: {
        capRate: 5.8,
        cashOnCash: 8.4,
        roi: 10.2,
        valuation: 350000
      }
    }
  ];

  test('renders chart title correctly', () => {
    render(
      <ComparisonChart
        scenarios={mockScenarios}
        metricKey="capRate"
        chartType="bar"
        title="Cap Rate Comparison"
      />
    );
    
    expect(screen.getByText('Cap Rate Comparison')).toBeInTheDocument();
  });

  test('renders bar chart when chartType is bar', () => {
    const { container } = render(
      <ComparisonChart
        scenarios={mockScenarios}
        metricKey="capRate"
        chartType="bar"
        title="Cap Rate Comparison"
      />
    );
    
    // Check if BarChart is in the component structure
    expect(container.innerHTML).toContain('BarChart');
  });

  test('renders line chart when chartType is line', () => {
    const { container } = render(
      <ComparisonChart
        scenarios={mockScenarios}
        metricKey="cashOnCash"
        chartType="line"
        title="Cash-on-Cash Return Comparison"
      />
    );
    
    // Check if LineChart is in the component structure
    expect(container.innerHTML).toContain('LineChart');
  });

  test('displays a message when no scenarios are provided', () => {
    render(
      <ComparisonChart
        scenarios={[]}
        metricKey="roi"
        chartType="bar"
        title="ROI Comparison"
      />
    );
    
    expect(screen.getByText('No scenarios to compare')).toBeInTheDocument();
  });

  test('handles different metric keys correctly', () => {
    const { rerender } = render(
      <ComparisonChart
        scenarios={mockScenarios}
        metricKey="capRate"
        chartType="bar"
        title="Cap Rate Comparison"
      />
    );
    
    // Verify capRate metric
    expect(screen.getByText('Cap Rate Comparison')).toBeInTheDocument();
    
    // Re-render with a different metric
    rerender(
      <ComparisonChart
        scenarios={mockScenarios}
        metricKey="roi"
        chartType="bar"
        title="ROI Comparison"
      />
    );
    
    // Verify ROI metric
    expect(screen.getByText('ROI Comparison')).toBeInTheDocument();
  });
});