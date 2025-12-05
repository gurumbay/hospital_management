import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import { getHospitalManagementSystem } from '../../api/generated';
import { extractErrorMessage } from '../../utils/errorHandling';

// Configure global axios for generated API client
const API_BASE_URL = (import.meta.env as any).VITE_API_BASE_URL || 'http://localhost:8000';

axios.defaults.baseURL = API_BASE_URL;
axios.defaults.timeout = 30000;

// Global request interceptor to add auth token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response interceptor for error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    try {
      const message = extractErrorMessage(error);
      const status = error.response?.status;
      window.dispatchEvent(new CustomEvent('api-error', { detail: { message, status } }));
    } catch (e) {
      // ignore errors extracting message
    }
    return Promise.reject(error);
  }
);

// Legacy ApiClient class for backward compatibility
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  public getAxiosInstance(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient();

// Lazy initialization of generated API client to avoid circular dependencies
let apiInstance: ReturnType<typeof getHospitalManagementSystem> | null = null;

export const getApi = () => {
  if (!apiInstance) {
    apiInstance = getHospitalManagementSystem();
  }
  return apiInstance;
};

// For backward compatibility with direct imports
export function api() {
  return getApi();
}

// Export properties for easier access to generated API functions
Object.defineProperty(api, 'getPatientsApiV1PatientsGet', {
  get: () => getApi().getPatientsApiV1PatientsGet,
});
Object.defineProperty(api, 'createPatientApiV1PatientsPost', {
  get: () => getApi().createPatientApiV1PatientsPost,
});
Object.defineProperty(api, 'updatePatientApiV1PatientsPatientIdPut', {
  get: () => getApi().updatePatientApiV1PatientsPatientIdPut,
});
Object.defineProperty(api, 'deletePatientApiV1PatientsPatientIdDelete', {
  get: () => getApi().deletePatientApiV1PatientsPatientIdDelete,
});
Object.defineProperty(api, 'getWardsApiV1WardsGet', {
  get: () => getApi().getWardsApiV1WardsGet,
});
Object.defineProperty(api, 'getAvailableWardsApiV1WardsAvailableGet', {
  get: () => getApi().getAvailableWardsApiV1WardsAvailableGet,
});
Object.defineProperty(api, 'createWardApiV1WardsPost', {
  get: () => getApi().createWardApiV1WardsPost,
});
Object.defineProperty(api, 'updateWardApiV1WardsWardIdPut', {
  get: () => getApi().updateWardApiV1WardsWardIdPut,
});
Object.defineProperty(api, 'deleteWardApiV1WardsWardIdDelete', {
  get: () => getApi().deleteWardApiV1WardsWardIdDelete,
});
Object.defineProperty(api, 'searchPatientsApiV1PatientsSearchGet', {
  get: () => getApi().searchPatientsApiV1PatientsSearchGet,
});
Object.defineProperty(api, 'getPatientsByDiagnosisApiV1PatientsDiagnosisDiagnosisIdGet', {
  get: () => getApi().getPatientsByDiagnosisApiV1PatientsDiagnosisDiagnosisIdGet,
});
Object.defineProperty(api, 'getPatientsByWardApiV1PatientsWardWardIdGet', {
  get: () => getApi().getPatientsByWardApiV1PatientsWardWardIdGet,
});
Object.defineProperty(api, 'getPatientApiV1PatientsPatientIdGet', {
  get: () => getApi().getPatientApiV1PatientsPatientIdGet,
});
Object.defineProperty(api, 'getDiagnosesApiV1DiagnosesGet', {
  get: () => getApi().getDiagnosesApiV1DiagnosesGet,
});
Object.defineProperty(api, 'createDiagnosisApiV1DiagnosesPost', {
  get: () => getApi().createDiagnosisApiV1DiagnosesPost,
});
Object.defineProperty(api, 'getDiagnosisApiV1DiagnosesDiagnosisIdGet', {
  get: () => getApi().getDiagnosisApiV1DiagnosesDiagnosisIdGet,
});
Object.defineProperty(api, 'updateDiagnosisApiV1DiagnosesDiagnosisIdPut', {
  get: () => getApi().updateDiagnosisApiV1DiagnosesDiagnosisIdPut,
});
Object.defineProperty(api, 'deleteDiagnosisApiV1DiagnosesDiagnosisIdDelete', {
  get: () => getApi().deleteDiagnosisApiV1DiagnosesDiagnosisIdDelete,
});
Object.defineProperty(api, 'loginApiV1AuthLoginPost', {
  get: () => getApi().loginApiV1AuthLoginPost,
});
Object.defineProperty(api, 'registerApiV1AuthRegisterPost', {
  get: () => getApi().registerApiV1AuthRegisterPost,
});
Object.defineProperty(api, 'getCurrentUserInfoApiV1AuthMeGet', {
  get: () => getApi().getCurrentUserInfoApiV1AuthMeGet,
});
Object.defineProperty(api, 'getUsersApiV1UsersGet', {
  get: () => getApi().getUsersApiV1UsersGet,
});
Object.defineProperty(api, 'createUserApiV1UsersPost', {
  get: () => getApi().createUserApiV1UsersPost,
});
Object.defineProperty(api, 'getUserApiV1UsersUserIdGet', {
  get: () => getApi().getUserApiV1UsersUserIdGet,
});
Object.defineProperty(api, 'updateUserApiV1UsersUserIdPut', {
  get: () => getApi().updateUserApiV1UsersUserIdPut,
});
Object.defineProperty(api, 'deleteUserApiV1UsersUserIdDelete', {
  get: () => getApi().deleteUserApiV1UsersUserIdDelete,
});
