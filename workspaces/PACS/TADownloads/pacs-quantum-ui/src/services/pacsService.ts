/**
 * TrueAutomation/PACS Service Client
 * Elite Quantum AI Power User Interface - Backend Integration
 */

import axios, { AxiosInstance } from 'axios';
import type {
  AccountDTO,
  PropertyDTO,
  PACSSearchDTO,
  PayImportedPaymentRunDTO,
  REETExportDTO,
  SqlQueryResult,
  TaskQueryMappingDTO,
  TaskQueryDTO,
  PacsUserDTO,
} from '../types/pacs';

export class PACSService {
  private client: AxiosInstance;

  constructor(baseUrl: string = '/api') {
    // baseUrl is used in client creation below
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.debug(`[PACS Service] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[PACS Service] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('[PACS Service] Response error:', error);
        return Promise.reject(error);
      }
    );
  }

  // Account Management
  async getAccounts(criteria?: PACSSearchDTO): Promise<AccountDTO[]> {
    if (criteria) {
      const response = await this.client.post<AccountDTO[]>('/pacs/accounts/search', criteria);
      return response.data;
    }
    const response = await this.client.get<AccountDTO[]>('/pacs/accounts');
    return response.data;
  }

  async getAccount(id: number): Promise<AccountDTO> {
    const response = await this.client.get<AccountDTO>(`/pacs/accounts/${id}`);
    return response.data;
  }

  async getAccountsByFileAsName(fileAsName: string, matchCondition: string = 'Equal'): Promise<AccountDTO[]> {
    const response = await this.client.get<AccountDTO[]>('/pacs/accounts/by-file-as-name', {
      params: { fileAsName, matchCondition },
    });
    return response.data;
  }

  async getAccountsByFileAsNameOrFirstName(name: string, matchCondition: string = 'Like'): Promise<AccountDTO[]> {
    const response = await this.client.get<AccountDTO[]>('/pacs/accounts/by-file-as-name-or-first-name', {
      params: { name, matchCondition },
    });
    return response.data;
  }

  async getAccountsByFileAsNameOrLastName(name: string, matchCondition: string = 'Like'): Promise<AccountDTO[]> {
    const response = await this.client.get<AccountDTO[]>('/pacs/accounts/by-file-as-name-or-last-name', {
      params: { name, matchCondition },
    });
    return response.data;
  }

  // Property Management
  async getProperties(criteria?: PACSSearchDTO): Promise<PropertyDTO[]> {
    if (criteria) {
      const response = await this.client.post<PropertyDTO[]>('/pacs/properties/search', criteria);
      return response.data;
    }
    const response = await this.client.get<PropertyDTO[]>('/pacs/properties');
    return response.data;
  }

  async getProperty(id: number): Promise<PropertyDTO> {
    const response = await this.client.get<PropertyDTO>(`/pacs/properties/${id}`);
    return response.data;
  }

  // Payment Management
  async executePaymentImport(filePath: string): Promise<PayImportedPaymentRunDTO> {
    const response = await this.client.post<PayImportedPaymentRunDTO>('/pacs/payments/import', {
      filePath,
    });
    return response.data;
  }

  // REET Export
  async executeREETExport(
    filePath: string,
    asOfDate: Date,
    validate: boolean = false
  ): Promise<REETExportDTO> {
    const response = await this.client.post<REETExportDTO>('/pacs/reet/export', {
      filePath,
      asOfDate: asOfDate.toISOString(),
      validate,
    });
    return response.data;
  }

  // TAMT Command Execution
  async executeTAMTCommand(
    commandName: string,
    parameters: Record<string, any>,
    waitForCompletion: boolean = true
  ): Promise<any> {
    const response = await this.client.post('/pacs/tamt/execute', {
      commandName,
      parameters,
      waitForCompletion,
    });
    return response.data;
  }

  // SQL Query Execution
  async executeSqlQuery(query: string): Promise<SqlQueryResult> {
    const response = await this.client.post<SqlQueryResult>('/pacs/queries/execute', {
      query,
    });
    return response.data;
  }

  async exportQueryToExcel(query: string, filePath: string, sheetName: string): Promise<void> {
    await this.client.post('/pacs/queries/export-excel', {
      query,
      filePath,
      sheetName,
    });
  }

  // Task Query Management
  async getTaskQueries(): Promise<TaskQueryDTO[]> {
    const response = await this.client.get<TaskQueryDTO[]>('/pacs/task-queries');
    return response.data;
  }

  async getTaskQuery(id: string): Promise<TaskQueryDTO> {
    const response = await this.client.get<TaskQueryDTO>(`/pacs/task-queries/${id}`);
    return response.data;
  }

  async getUnmappedQueries(): Promise<TaskQueryDTO[]> {
    const response = await this.client.get<TaskQueryDTO[]>('/pacs/task-queries/unmapped');
    return response.data;
  }

  async executeTaskQuery(id: string): Promise<SqlQueryResult> {
    const response = await this.client.post<SqlQueryResult>(`/pacs/task-queries/${id}/execute`);
    return response.data;
  }

  // Task Query Mapping Management
  async getTaskQueryMappings(): Promise<TaskQueryMappingDTO[]> {
    const response = await this.client.get<TaskQueryMappingDTO[]>('/pacs/task-query-mappings');
    return response.data;
  }

  async getTaskQueryMapping(id: string): Promise<TaskQueryMappingDTO> {
    const response = await this.client.get<TaskQueryMappingDTO>(`/pacs/task-query-mappings/${id}`);
    return response.data;
  }

  async createTaskQueryMapping(mapping: TaskQueryMappingDTO): Promise<TaskQueryMappingDTO> {
    const response = await this.client.post<TaskQueryMappingDTO>('/pacs/task-query-mappings', mapping);
    return response.data;
  }

  async updateTaskQueryMapping(mapping: TaskQueryMappingDTO): Promise<void> {
    await this.client.put(`/pacs/task-query-mappings/${mapping.id}`, mapping);
  }

  async deleteTaskQueryMapping(id: string): Promise<void> {
    await this.client.delete(`/pacs/task-query-mappings/${id}`);
  }

  async executeTaskQueryMapping(id: string): Promise<SqlQueryResult> {
    const response = await this.client.post<SqlQueryResult>(`/pacs/task-query-mappings/${id}/execute`);
    return response.data;
  }

  // User Management
  async getPacsUsers(): Promise<PacsUserDTO[]> {
    const response = await this.client.get<PacsUserDTO[]>('/pacs/users');
    return response.data;
  }

  async getPacsUser(id: number): Promise<PacsUserDTO> {
    const response = await this.client.get<PacsUserDTO>(`/pacs/users/${id}`);
    return response.data;
  }

  async syncPACSUserData(): Promise<boolean> {
    const response = await this.client.post<{ success: boolean }>('/pacs/users/sync');
    return response.data.success;
  }

  // Service Health
  async checkServiceAvailable(): Promise<boolean> {
    try {
      const response = await this.client.get<{ available: boolean }>('/pacs/health');
      return response.data.available;
    } catch {
      return false;
    }
  }

  // Service Bus Messaging
  async sendMessageToBus(messageType: string, parameters: Record<string, any>): Promise<void> {
    await this.client.post('/pacs/bus/send', {
      messageType,
      parameters,
    });
  }
}

// Singleton instance
export const pacsService = new PACSService();

