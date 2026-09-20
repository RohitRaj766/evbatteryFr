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
  data?: {
    user: User;
    accessToken: string;
  };
}

export type BatteryHealthState = 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'DECOMMISSIONED';

export interface Battery {
  id: string;
  serialNumber: string;
  manufacturer: string;
  modelName: string;
  capacityKwh: number;
  soh: number;
  healthState: BatteryHealthState;
  cycleCount: number;
  manufacturedAt: string;
  decommissionedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  dock?: {
    id: string;
    dockNumber: number;
    station: {
      id: string;
      name: string;
    };
  } | null;
  _count?: {
    swaps: number;
    telemetry: number;
  };
}

export type DockState = 'AVAILABLE' | 'CHARGING' | 'READY' | 'ISOLATED_CUTOFF' | 'MAINTENANCE';

export interface Dock {
  id: string;
  dockNumber: number;
  stationId: string;
  state: DockState;
  batteryId?: string | null;
  currentSoC: number;
  currentSoH: number;
  currentTemp: number;
  lastTelemetryAt?: string | null;
  createdAt: string;
  updatedAt: string;
  battery?: Battery | null;
  station?: Station;
  alarms?: Alarm[];
}

export interface Station {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    docks: number;
    swaps: number;
  };
  docks?: Dock[];
}

export interface TelemetryReading {
  id: string;
  batteryId: string;
  dockId: string;
  temperature: number;
  voltage: number;
  current: number;
  soc: number;
  soh: number;
  createdAt: string;
}

export type AlarmType = 'THERMAL_RUNAWAY' | 'MANUAL_CUTOFF';
export type AlarmStatus = 'ACTIVE' | 'SILENCED' | 'RESOLVED';

export interface Alarm {
  id: string;
  dockId: string;
  batteryId?: string | null;
  type: AlarmType;
  status: AlarmStatus;
  peakTemp: number;
  threshold: number;
  triggeredAt: string;
  silencedAt?: string | null;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  notes?: string | null;
  dock?: Dock;
  resolver?: {
    id: string;
    name: string;
    email: string;
  };
}

export type SwapStatus = 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface Swap {
  id: string;
  stationId: string;
  batteryOutId: string;
  batteryInId?: string | null;
  driverPhone: string;
  driverVehicleId?: string | null;
  status: SwapStatus;
  socAtSwap: number;
  sohAtSwap: number;
  tempAtSwap: number;
  processedBy: string;
  swappedAt: string;
  notes?: string | null;
  station?: {
    id: string;
    name: string;
  };
  battery?: {
    id: string;
    serialNumber: string;
  };
  operator?: {
    id: string;
    name: string;
  };
}

export interface Operator {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: {
    assignments: number;
  };
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
  Role: string[];
  DockState: string[];
  AssignmentStatus: string[];
  AlarmStatus: string[];
  BatteryHealthState: string[];
  SwapStatus: string[];
}
