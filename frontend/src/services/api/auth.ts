import { getHospitalManagementSystem } from '../../api/generated';
import type { LoginRequest, LoginResponse } from '../../types/auth';
import type { UserResponse, RegisterRequest } from '../../api/generated';

const api = getHospitalManagementSystem();

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.loginApiV1AuthLoginPost(credentials);
    return response.data as LoginResponse;
  },

  register: async (data: RegisterRequest): Promise<UserResponse> => {
    const response = await api.registerApiV1AuthRegisterPost(data);
    return response.data as UserResponse;
  },

  getCurrentUser: async (): Promise<UserResponse> => {
    const response = await api.getCurrentUserInfoApiV1AuthMeGet();
    return response.data as UserResponse;
  },
};
