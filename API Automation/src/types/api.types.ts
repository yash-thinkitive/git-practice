export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  code: string;
  message: string | null;
  data: {
    accessToken: string;
    expires_in?: number;
    token_type?: string;
    refresh_token?: string;
    user?: {
      id?: string;
      email?: string;
      role?: string;
    };
  };
  path?: string;
  requestId?: string;
  version?: string;
}

export interface Patient {
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE';
  birthDate: string;
  email?: string;
  phone?: string;
}

export interface PatientResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth: string;
  };
}

export interface Provider {
  firstName: string;
  lastName: string;
  email: string;
  role: 'PROVIDER' | 'ADMIN';
  specialization?: string;
}

export interface ProviderResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

export interface AvailabilitySlot {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slotDuration: number;
  minimumNoticeHours: number;
  appointmentType: 'VIRTUAL' | 'IN_PERSON';
}

export interface AvailabilityRequest {
  providerId: string;
  slots: AvailabilitySlot[];
}

export interface AppointmentRequest {
  patientId: string;
  providerId: string;
  appointmentDateTime: string;
  endDateTime: string;
  appointmentType: 'VIRTUAL' | 'IN_PERSON';
  chiefComplaint: string;
  notes?: string;
}

export interface AppointmentResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    patientId: string;
    providerId: string;
    appointmentDateTime: string;
    status: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  status?: number;
  path?: string;
  requestId?: string;
  version?: string;
}

// Additional utility types
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
  };
}

export interface ErrorResponse {
  success: false;
  message: string;
  error?: {
    code: string;
    details?: any;
  };
  status: number;
}