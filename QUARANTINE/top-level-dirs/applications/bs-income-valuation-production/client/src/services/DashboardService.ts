import { Dashboard, Widget, WidgetPosition } from '../../../shared/schema';
import { BaseService } from './BaseService';

/**
 * Interface for dashboard widget configuration with optional data
 */
export interface DashboardWidget extends Widget {
  data?: any;
}

/**
 * Interface for dashboard configuration (for create/update)
 */
export interface DashboardConfig {
  name: string;
  widgets: DashboardWidget[];
  description?: string;
}

/**
 * Interface for available widget types
 */
export interface WidgetType {
  type: string;
  name: string;
  description: string;
  defaultSize?: WidgetPosition;
  category?: string;
  previewImage?: string;
}

/**
 * Service for managing user dashboards
 */
export class DashboardService extends BaseService {
  /**
   * Save a new dashboard configuration for a user
   * @param userId User ID
   * @param config Dashboard configuration
   * @returns Saved dashboard with ID
   */
  static async saveUserDashboard(userId: number, config: DashboardConfig): Promise<Dashboard> {
    return this.post<Dashboard>('/api/dashboards', {
      userId,
      ...config,
    }, 'Failed to save dashboard');
  }

  /**
   * Get all dashboards for a user
   * @param userId User ID
   * @returns Array of user dashboards (without widget data)
   */
  static async getUserDashboards(userId: number): Promise<Dashboard[]> {
    try {
      return await this.get<Dashboard[]>(`/api/dashboards?userId=${userId}`, 'Failed to fetch dashboards');
    } catch (error) {
      console.error('Error fetching dashboards:', error);
      // Return empty array instead of throwing to make UI handling easier
      return [];
    }
  }

  /**
   * Get dashboard data with populated widgets
   * @param dashboardId Dashboard ID
   * @returns Dashboard with populated widget data
   */
  static async getDashboardData(dashboardId: string): Promise<Dashboard> {
    return this.get<Dashboard>(
      `/api/dashboards/${dashboardId}/data`,
      'Failed to fetch dashboard data'
    );
  }

  /**
   * Update an existing dashboard
   * @param dashboardId Dashboard ID
   * @param config Updated dashboard configuration
   * @returns Updated dashboard
   */
  static async updateDashboard(dashboardId: string, config: Partial<DashboardConfig>): Promise<Dashboard> {
    return this.patch<Dashboard>(
      `/api/dashboards/${dashboardId}`,
      config,
      'Failed to update dashboard'
    );
  }

  /**
   * Delete a dashboard
   * @param dashboardId Dashboard ID
   * @returns Success status
   */
  static async deleteDashboard(dashboardId: string): Promise<{ success: boolean }> {
    try {
      return await this.delete<{ success: boolean }>(
        `/api/dashboards/${dashboardId}`,
        'Failed to delete dashboard'
      );
    } catch (error) {
      console.error('Error deleting dashboard:', error);
      return { success: false };
    }
  }

  /**
   * Get available widget types for dashboard
   * @returns Array of available widget types
   */
  static async getAvailableWidgets(): Promise<WidgetType[]> {
    try {
      return await this.get<WidgetType[]>('/api/dashboards/widgets', 'Failed to fetch available widgets');
    } catch (error) {
      console.error('Error fetching available widgets:', error);
      return [];
    }
  }

  /**
   * Update widget position in a dashboard
   * @param dashboardId Dashboard ID
   * @param widgetId Widget ID
   * @param position New position
   * @returns Updated dashboard
   */
  static async updateWidgetPosition(
    dashboardId: string,
    widgetId: string,
    position: WidgetPosition
  ): Promise<Dashboard> {
    return this.patch<Dashboard>(
      `/api/dashboards/${dashboardId}/widgets/${widgetId}/position`,
      position,
      'Failed to update widget position'
    );
  }

  /**
   * Add widget to dashboard
   * @param dashboardId Dashboard ID
   * @param widget Widget configuration
   * @returns Updated dashboard
   */
  static async addWidget(dashboardId: string, widget: Omit<DashboardWidget, 'id'>): Promise<Dashboard> {
    return this.post<Dashboard>(
      `/api/dashboards/${dashboardId}/widgets`,
      widget,
      'Failed to add widget'
    );
  }

  /**
   * Remove widget from dashboard
   * @param dashboardId Dashboard ID
   * @param widgetId Widget ID
   * @returns Updated dashboard
   */
  static async removeWidget(dashboardId: string, widgetId: string): Promise<Dashboard> {
    return this.delete<Dashboard>(
      `/api/dashboards/${dashboardId}/widgets/${widgetId}`,
      'Failed to remove widget'
    );
  }

  /**
   * Update widget settings
   * @param dashboardId Dashboard ID
   * @param widgetId Widget ID
   * @param settings Widget settings
   * @returns Updated dashboard
   */
  static async updateWidgetSettings(
    dashboardId: string,
    widgetId: string,
    settings: Record<string, any>
  ): Promise<Dashboard> {
    return this.patch<Dashboard>(
      `/api/dashboards/${dashboardId}/widgets/${widgetId}/settings`,
      settings,
      'Failed to update widget settings'
    );
  }
}