import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardService } from '@/services/DashboardService';

describe('DashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Mock fetch for API calls
    global.fetch = vi.fn();
  });
  
  const mockUserId = 1;
  
  const mockDashboardConfig = {
    name: 'Executive Overview',
    widgets: [
      { 
        id: 'widget1',
        type: 'valuation_trend', 
        title: 'Valuation Trend',
        position: { x: 0, y: 0, w: 2, h: 1 }
      },
      { 
        id: 'widget2',
        type: 'income_breakdown', 
        title: 'Income Breakdown',
        position: { x: 0, y: 1, w: 1, h: 1 }
      }
    ]
  };
  
  const mockDashboardData = {
    id: 'dashboard1',
    name: 'Executive Overview',
    userId: mockUserId,
    widgets: [
      { 
        id: 'widget1',
        type: 'valuation_trend', 
        title: 'Valuation Trend',
        position: { x: 0, y: 0, w: 2, h: 1 },
        data: [
          { date: '2023-01', value: 100000 },
          { date: '2023-02', value: 110000 },
          { date: '2023-03', value: 105000 }
        ]
      },
      { 
        id: 'widget2',
        type: 'income_breakdown', 
        title: 'Income Breakdown',
        position: { x: 0, y: 1, w: 1, h: 1 },
        data: [
          { source: 'Rental', value: 60000 },
          { source: 'Business', value: 30000 },
          { source: 'Investment', value: 10000 }
        ]
      }
    ],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-15')
  };
  
  describe('saveUserDashboard', () => {
    it('should save user dashboard configuration', async () => {
      // Setup mock response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'dashboard1', ...mockDashboardConfig })
      });
      
      const result = await DashboardService.saveUserDashboard(mockUserId, mockDashboardConfig);
      
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Executive Overview');
      expect(result.widgets).toHaveLength(2);
      
      // Verify API was called correctly
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/dashboards',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            userId: mockUserId,
            ...mockDashboardConfig
          })
        })
      );
    });
    
    it('should handle errors when saving dashboard', async () => {
      // Setup mock error response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' })
      });
      
      await expect(DashboardService.saveUserDashboard(mockUserId, mockDashboardConfig))
        .rejects.toThrow('Failed to save dashboard: Server error');
      
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('getUserDashboards', () => {
    it('should retrieve user dashboards', async () => {
      // Setup mock response with multiple dashboards
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          { id: 'dashboard1', name: 'Executive Overview' },
          { id: 'dashboard2', name: 'Financial Metrics' }
        ])
      });
      
      const dashboards = await DashboardService.getUserDashboards(mockUserId);
      
      expect(dashboards).toHaveLength(2);
      expect(dashboards[0].name).toBe('Executive Overview');
      expect(dashboards[1].name).toBe('Financial Metrics');
      
      // Verify API was called correctly
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/dashboards?userId=${mockUserId}`,
        expect.objectContaining({ method: 'GET' })
      );
    });
    
    it('should return empty array when user has no dashboards', async () => {
      // Setup mock empty response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ([])
      });
      
      const dashboards = await DashboardService.getUserDashboards(mockUserId);
      
      expect(dashboards).toEqual([]);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('getDashboardData', () => {
    it('should retrieve dashboard with widget data', async () => {
      // Setup mock response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDashboardData
      });
      
      const dashboard = await DashboardService.getDashboardData('dashboard1');
      
      expect(dashboard.id).toBe('dashboard1');
      expect(dashboard.widgets).toHaveLength(2);
      expect(dashboard.widgets[0].data).toBeDefined();
      expect(dashboard.widgets[0].type).toBe('valuation_trend');
      expect(dashboard.widgets[1].type).toBe('income_breakdown');
      
      // Verify API was called correctly
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/dashboards/dashboard1/data',
        expect.objectContaining({ method: 'GET' })
      );
    });
    
    it('should handle errors when retrieving dashboard data', async () => {
      // Setup mock error response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Dashboard not found' })
      });
      
      await expect(DashboardService.getDashboardData('nonexistent'))
        .rejects.toThrow('Failed to fetch dashboard data: Dashboard not found');
      
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('updateDashboard', () => {
    it('should update dashboard configuration', async () => {
      // Setup mock response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          id: 'dashboard1',
          name: 'Updated Dashboard',
          widgets: mockDashboardConfig.widgets
        })
      });
      
      const updatedConfig = {
        name: 'Updated Dashboard',
        widgets: mockDashboardConfig.widgets
      };
      
      const result = await DashboardService.updateDashboard('dashboard1', updatedConfig);
      
      expect(result.name).toBe('Updated Dashboard');
      
      // Verify API was called correctly
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/dashboards/dashboard1',
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(updatedConfig)
        })
      );
    });
  });
  
  describe('deleteDashboard', () => {
    it('should delete a dashboard', async () => {
      // Setup mock response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });
      
      const result = await DashboardService.deleteDashboard('dashboard1');
      
      expect(result.success).toBe(true);
      
      // Verify API was called correctly
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/dashboards/dashboard1',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });
  
  describe('getAvailableWidgets', () => {
    it('should retrieve available widget types', async () => {
      const availableWidgets = [
        { type: 'valuation_trend', name: 'Valuation Trend', description: 'Shows valuation changes over time' },
        { type: 'income_breakdown', name: 'Income Breakdown', description: 'Displays income sources distribution' },
        { type: 'metrics_summary', name: 'Metrics Summary', description: 'Key financial metrics at a glance' }
      ];
      
      // Setup mock response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => availableWidgets
      });
      
      const widgets = await DashboardService.getAvailableWidgets();
      
      expect(widgets).toHaveLength(3);
      expect(widgets[0].type).toBe('valuation_trend');
      expect(widgets[1].name).toBe('Income Breakdown');
      
      // Verify API was called correctly
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/dashboards/widgets',
        expect.objectContaining({ method: 'GET' })
      );
    });
  });
});