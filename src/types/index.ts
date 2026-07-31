export type UserRole = 'ADMIN' | 'OPERATOR' | 'DRIVER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user: User;
  accessToken: string;
  refreshToken?: string;
}

export type BatteryStatus = 'CHARGING' | 'READY' | 'IN_USE' | 'DECOMMISSIONED' | 'MAINTENANCE';
export type HealthStatus = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'DEGRADED';

export interface Battery {
  id: string;
  serialNumber: string;
  model: string;
  capacityKwh: number;
  sohPercentage: number;
  socPercentage: number;
  cycleCount: number;
  status: BatteryStatus;
  healthStatus: HealthStatus;
  currentStationId?: string | null;
  currentDockId?: string | null;
  currentDock?: {
    id: string;
    dockNumber: number;
    station: {
      id: string;
      name: string;
    };
  } | null;
  createdAt: string;
  updatedAt: string;
}

export type DockStatus = 'AVAILABLE' | 'OCCUPIED' | 'DISABLED';

export interface Dock {
  id: string;
  stationId: string;
  dockNumber: number;
  status: DockStatus;
  isThermalCutoff: boolean;
  batteryId?: string | null;
  battery?: Battery | null;
}

export interface Station {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  totalDocks: number;
  availableDocks: number;
  isActive: boolean;
  docks?: Dock[];
  createdAt: string;
  updatedAt: string;
}

export interface TelemetryReading {
  id: string;
  batteryId: string;
  dockId?: string | null;
  temperatureCelsius: number;
  voltageVolts: number;
  currentAmperes: number;
  socPercentage: number;
  sohPercentage: number;
  timestamp: string;
}

export type AlarmLevel = 'INFO' | 'WARNING' | 'CRITICAL';
export type AlarmStatus = 'TRIGGERED' | 'SILENCED' | 'RESOLVED';

export interface Alarm {
  id: string;
  batteryId: string;
  stationId?: string | null;
  dockId?: string | null;
  alarmLevel: AlarmLevel;
  status: AlarmStatus;
  temperatureCelsius: number;
  message: string;
  silencedAt?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  battery?: {
    serialNumber: string;
  };
  station?: {
    name: string;
  };
}

export type SwapStatus = 'COMPLETED' | 'FAILED' | 'PENDING';

export interface Swap {
  id: string;
  driverId: string;
  stationId: string;
  oldBatteryId: string;
  newBatteryId: string;
  status: SwapStatus;
  sohAtSwap: number;
  createdAt: string;
  driver?: {
    name: string;
    email: string;
  };
  station?: {
    name: string;
  };
  oldBattery?: {
    serialNumber: string;
  };
  newBattery?: {
    serialNumber: string;
  };
}

export interface Operator {
  id: string;
  userId: string;
  operatorCode: string;
  assignedStationCount?: number;
  user: User;
  createdAt: string;
}

export interface OperatorAssignment {
  id: string;
  operatorId: string;
  stationId: string;
  assignedAt: string;
  shiftStart?: string | null;
  shiftEnd?: string | null;
  isPrimary: boolean;
  station?: Station;
  operator?: Operator;
}

export interface SystemEnums {
  userRoles: string[];
  batteryStatuses: string[];
  healthStatuses: string[];
  dockStatuses: string[];
  alarmLevels: string[];
  alarmStatuses: string[];
  swapStatuses: string[];
}
