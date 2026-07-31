import axios from 'axios';
import {
  AuthResponse,
  User,
  Battery,
  Station,
  TelemetryReading,
  Alarm,
  Swap,
  Operator,
  OperatorAssignment,
  SystemEnums
} from '@/types';

export const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX || '/api/v1';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || API_PREFIX;

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptor to attach access token
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Interceptor for token auto-refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && typeof window !== 'undefined') {
      originalRequest._retry = true;
      try {
        const refreshRes = await axios.post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true });
        if (refreshRes.data?.data?.accessToken) {
          const newToken = refreshRes.data.data.accessToken;
          localStorage.setItem('accessToken', newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (err) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
      }
    }
    return Promise.reject(error);
  }
);

// ─── API Methods ─────────────────────────────────────────────────────────────

export const api = {
  // Health
  getHealth: async () => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
    const res = await axios.get(`${backendUrl}/health`);
    return res.data;
  },

  // Auth
  auth: {
    register: async (data: any): Promise<AuthResponse> => {
      const res = await apiClient.post('/auth/register', data);
      const payload = res.data?.data || res.data;
      return {
        success: res.data?.success ?? true,
        message: res.data?.message,
        user: payload?.user,
        accessToken: payload?.accessToken,
      };
    },
    login: async (data: any): Promise<AuthResponse> => {
      const res = await apiClient.post('/auth/login', data);
      const payload = res.data?.data || res.data;
      return {
        success: res.data?.success ?? true,
        message: res.data?.message,
        user: payload?.user,
        accessToken: payload?.accessToken,
      };
    },
    logout: async () => {
      const res = await apiClient.post('/auth/logout');
      return res.data;
    },
    logoutAll: async () => {
      const res = await apiClient.post('/auth/logout-all');
      return res.data;
    },
    getMe: async (): Promise<{ success: boolean; user: User }> => {
      const res = await apiClient.get('/auth/me');
      const rawUser = res.data?.data?.user || res.data?.user;
      const formattedUser = rawUser ? {
        id: rawUser.id || rawUser.sub,
        email: rawUser.email,
        name: rawUser.name || rawUser.email?.split('@')[0] || 'User',
        role: rawUser.role,
        avatarUrl: rawUser.avatarUrl,
        createdAt: rawUser.createdAt || new Date().toISOString(),
        updatedAt: rawUser.updatedAt || new Date().toISOString(),
      } : null;
      return {
        success: res.data?.success ?? true,
        user: formattedUser as User,
      };
    },
    setPassword: async (password: string) => {
      const res = await apiClient.post('/auth/set-password', { password });
      return res.data;
    },
  },

  // Batteries
  batteries: {
    list: async (params?: { status?: string; healthStatus?: string; search?: string }): Promise<{ success: boolean; data: Battery[] }> => {
      const res = await apiClient.get('/batteries', { params });
      return res.data;
    },
    getById: async (id: string): Promise<{ success: boolean; data: Battery }> => {
      const res = await apiClient.get(`/batteries/${id}`);
      return res.data;
    },
    create: async (data: { serialNumber: string; model: string; capacityKwh: number; sohPercentage?: number }): Promise<{ success: boolean; data: Battery }> => {
      const res = await apiClient.post('/batteries', data);
      return res.data;
    },
    decommission: async (id: string, reason: string): Promise<{ success: boolean; data: Battery }> => {
      const res = await apiClient.patch(`/batteries/${id}/decommission`, { reason });
      return res.data;
    },
  },

  // Stations & Docks
  stations: {
    list: async (): Promise<{ success: boolean; data: Station[] }> => {
      const res = await apiClient.get('/stations');
      return res.data;
    },
    getNearest: async (lat: number, lng: number): Promise<{ success: boolean; data: Station & { distanceKm: number } }> => {
      const res = await apiClient.get('/stations/nearest', { params: { lat, lng } });
      return res.data;
    },
    getById: async (id: string): Promise<{ success: boolean; data: Station }> => {
      const res = await apiClient.get(`/stations/${id}`);
      return res.data;
    },
    create: async (data: { name: string; location: string; latitude: number; longitude: number; totalDocks: number }): Promise<{ success: boolean; data: Station }> => {
      const res = await apiClient.post('/stations', data);
      return res.data;
    },
    addDock: async (stationId: string, dockNumber: number): Promise<{ success: boolean; data: any }> => {
      const res = await apiClient.post(`/stations/${stationId}/docks`, { dockNumber });
      return res.data;
    },
    recommendSwap: async (stationId: string): Promise<{ success: boolean; data: { recommendedBattery: Battery; dockId: string } }> => {
      const res = await apiClient.get(`/stations/${stationId}/recommend-swap`);
      return res.data;
    },
    insertBattery: async (stationId: string, dockId: string, batteryId: string): Promise<any> => {
      const res = await apiClient.patch(`/stations/${stationId}/docks/${dockId}/insert`, { batteryId });
      return res.data;
    },
    removeBattery: async (stationId: string, dockId: string): Promise<any> => {
      const res = await apiClient.patch(`/stations/${stationId}/docks/${dockId}/remove`);
      return res.data;
    },
    triggerCutoff: async (stationId: string, dockId: string): Promise<any> => {
      const res = await apiClient.patch(`/stations/${stationId}/docks/${dockId}/cutoff`);
      return res.data;
    },
  },

  // Telemetry
  telemetry: {
    ingest: async (data: any): Promise<{ success: boolean; data: TelemetryReading }> => {
      const payload = {
        batteryId: data.batteryId,
        dockId: data.dockId,
        voltage: Number(data.voltage ?? data.voltageVolts ?? 50),
        current: Number(data.current ?? data.currentAmperes ?? 10),
        temperature: Number(data.temperature ?? data.temperatureCelsius ?? 25),
        soc: Number(data.soc ?? data.socPercentage ?? 80),
        soh: Number(data.soh ?? data.sohPercentage ?? 95),
      };
      const res = await apiClient.post('/telemetry', payload);
      return res.data;
    },
    getHistory: async (batteryId: string, limit = 50): Promise<{ success: boolean; data: TelemetryReading[] }> => {
      const res = await apiClient.get(`/telemetry/${batteryId}/history`, { params: { limit } });
      const rawData = res.data?.data || res.data || [];
      const mapped = Array.isArray(rawData) ? rawData.map((t: any) => ({
        ...t,
        temperatureCelsius: Number(t.temperatureCelsius ?? t.temperature ?? 25),
        temperature: Number(t.temperature ?? t.temperatureCelsius ?? 25),
        voltageVolts: Number(t.voltageVolts ?? t.voltage ?? 0),
        voltage: Number(t.voltage ?? t.voltageVolts ?? 0),
        currentAmperes: Number(t.currentAmperes ?? t.current ?? 0),
        current: Number(t.current ?? t.currentAmperes ?? 0),
        socPercentage: Number(t.socPercentage ?? t.soc ?? 0),
        soc: Number(t.soc ?? t.socPercentage ?? 0),
        sohPercentage: Number(t.sohPercentage ?? t.soh ?? 0),
        soh: Number(t.soh ?? t.sohPercentage ?? 0),
      })) : [];
      return { success: res.data?.success ?? true, data: mapped };
    },
  },

  // Alarms
  alarms: {
    list: async (params?: { level?: string; status?: string }): Promise<{ success: boolean; data: Alarm[] }> => {
      const res = await apiClient.get('/alarms', { params });
      return res.data;
    },
    getById: async (id: string): Promise<{ success: boolean; data: Alarm }> => {
      const res = await apiClient.get(`/alarms/${id}`);
      return res.data;
    },
    silence: async (id: string): Promise<{ success: boolean; data: Alarm }> => {
      const res = await apiClient.patch(`/alarms/${id}/silence`);
      return res.data;
    },
    resolve: async (id: string): Promise<{ success: boolean; data: Alarm }> => {
      const res = await apiClient.patch(`/alarms/${id}/resolve`);
      return res.data;
    },
  },

  // Swaps
  swaps: {
    list: async (params?: { stationId?: string; driverId?: string }): Promise<{ success: boolean; data: Swap[] }> => {
      const res = await apiClient.get('/swaps', { params });
      return res.data;
    },
    create: async (data: { driverId: string; stationId: string; oldBatteryId: string; newBatteryId: string; driverVehicleId: string; driverPhone?: string }): Promise<{ success: boolean; data: Swap }> => {
      const payload = {
        stationId: data.stationId,
        batteryOutId: data.newBatteryId,
        batteryInId: data.oldBatteryId,
        driverVehicleId: data.driverVehicleId,
        driverPhone: data.driverPhone || 'N/A',
      };
      const res = await apiClient.post('/swaps', payload);
      return res.data;
    },
  },

  // Operators
  operators: {
    list: async (): Promise<{ success: boolean; data: Operator[] }> => {
      const res = await apiClient.get('/operators');
      return res.data;
    },
    create: async (data: { userId: string; operatorCode: string }): Promise<{ success: boolean; data: Operator }> => {
      const res = await apiClient.post('/operators', data);
      return res.data;
    },
  },

  // Assignments
  assignments: {
    assignToStation: async (stationId: string, data: { operatorId: string; shiftStart?: string; shiftEnd?: string; isPrimary?: boolean }): Promise<{ success: boolean; data: OperatorAssignment }> => {
      const res = await apiClient.post(`/stations/${stationId}/operators`, data);
      return res.data;
    },
    getStationOperators: async (stationId: string): Promise<{ success: boolean; data: OperatorAssignment[] }> => {
      const res = await apiClient.get(`/stations/${stationId}/operators`);
      return res.data;
    },
    getOperatorStations: async (operatorId: string): Promise<{ success: boolean; data: OperatorAssignment[] }> => {
      const res = await apiClient.get(`/operators/${operatorId}/stations`);
      return res.data;
    },
    updateAssignment: async (stationId: string, operatorId: string, data: { shiftStart?: string; shiftEnd?: string; isPrimary?: boolean }): Promise<{ success: boolean; data: OperatorAssignment }> => {
      const res = await apiClient.patch(`/stations/${stationId}/operators/${operatorId}`, data);
      return res.data;
    },
    removeAssignment: async (stationId: string, operatorId: string): Promise<{ success: boolean }> => {
      const res = await apiClient.delete(`/stations/${stationId}/operators/${operatorId}`);
      return res.data;
    },
  },

  // Enums
  enums: {
    getEnums: async (): Promise<{ success: boolean; data: SystemEnums }> => {
      const res = await apiClient.get('/enums');
      return res.data;
    },
  },
};
