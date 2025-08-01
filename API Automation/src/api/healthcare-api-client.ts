import { APIRequestContext } from '@playwright/test';
import { getConfig, EnvironmentConfig } from '../config/environment';
import { logger } from '../utils/logger';
import { RetryHandler } from '../utils/retry';
import { Validator, ValidationError } from '../utils/validator';
import { 
  LoginCredentials, 
  LoginResponse, 
  Patient, 
  PatientResponse,
  Provider,
  ProviderResponse,
  AvailabilityRequest,
  AppointmentRequest,
  AppointmentResponse,
  ApiResponse
} from '../types/api.types';

export class HealthcareApiClient {
  private request: APIRequestContext;
  private config: EnvironmentConfig;
  private bearerToken: string = '';
  private requestId: string = '';

  constructor(request: APIRequestContext, environment: 'stage' | 'dev' = 'stage') {
    this.request = request;
    this.config = getConfig(environment);
    this.requestId = this.generateRequestId();
    
    logger.setContext({ 
      requestId: this.requestId,
      environment: environment 
    });
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getHeaders(includeAuth: boolean = false): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Connection': 'keep-alive',
      'Content-Type': 'application/json',
      'Origin': `https://${this.config.tenantId}.uat.provider.ecarehealth.com`,
      'Referer': `https://${this.config.tenantId}.uat.provider.ecarehealth.com/`,
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-site',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
      'X-TENANT-ID': this.config.tenantId,
      'sec-ch-ua': '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'X-Request-ID': this.requestId
    };

    if (includeAuth && this.bearerToken) {
      headers['Authorization'] = `Bearer ${this.bearerToken}`;
    }

    return headers;
  }

  private async safeJsonParse(response: any): Promise<any> {
    try {
      const text = await response.text();
      if (!text || text.trim() === "") {
        logger.error('Empty response body', { status: response.status() });
        return { 
          success: false, 
          message: 'Empty response body', 
          data: null, 
          status: response.status() 
        };
      }
      return JSON.parse(text);
    } catch (err) {
      logger.error('Failed to parse JSON response', { 
        status: response.status(),
        error: err 
      });
      try {
        const raw = await response.text();
        logger.debug('Raw response', { raw });
      } catch {}
      return { 
        success: false, 
        message: 'Invalid JSON response', 
        data: null, 
        status: response.status() 
      };
    }
  }

  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    endpoint: string,
    data?: any,
    includeAuth: boolean = false
  ): Promise<T> {
    const url = `${this.config.baseURL}${endpoint}`;
    
    logger.debug(`Making ${method} request`, { 
      url, 
      includeAuth, 
      hasData: !!data 
    });

    const requestOptions: any = {
      headers: this.getHeaders(includeAuth),
      timeout: this.config.timeouts.request
    };

    if (data) {
      requestOptions.data = data;
    }

    return RetryHandler.execute(async () => {
      const response = await this.request[method.toLowerCase()](url, requestOptions);
      const responseBody = await this.safeJsonParse(response);
      
      logger.debug(`Response received`, { 
        status: response.status(),
        success: responseBody.success,
        hasData: !!responseBody.data 
      });

      if (response.status() >= 400) {
        const error = new Error(`HTTP ${response.status()}: ${responseBody.message || 'Unknown error'}`);
        (error as any).status = response.status();
        (error as any).responseBody = responseBody;
        throw error;
      }

      return responseBody;
    }, {
      maxAttempts: this.config.retry.maxAttempts,
      delayMs: this.config.retry.delayMs
    });
  }

  async login(credentials?: LoginCredentials): Promise<LoginResponse> {
    const creds = credentials || this.config.credentials;
    
    logger.step('Login', 'Attempting provider login');
    
    // Validate credentials
    Validator.validateString(creds.username, 'username');
    Validator.validateString(creds.password, 'password');
    Validator.validateEmail(creds.username);

    const loginData = {
      ...creds,
      xTENANTID: this.config.tenantId
    };

    const response = await this.makeRequest<LoginResponse>('POST', '/login', loginData);
    
    if (response.data?.accessToken) {
      this.bearerToken = response.data.accessToken;
      logger.success('Login successful', { 
        userId: response.data.user?.id,
        role: response.data.user?.role 
      });
    } else {
      logger.failure('Login failed - no access token received', response);
      throw new Error('Login failed - no access token received');
    }
    
    return response;
  }

  async createPatient(patient: Patient): Promise<PatientResponse> {
    logger.step('Create Patient', `Creating patient: ${patient.firstName} ${patient.lastName}`);
    
    // Validate patient data
    Validator.validateString(patient.firstName, 'firstName', 1, 50);
    Validator.validateString(patient.lastName, 'lastName', 1, 50);
    Validator.validateEnum(patient.gender, ['MALE', 'FEMALE'], 'gender');
    Validator.validateDate(patient.birthDate, 'birthDate');
    
    if (patient.email) {
      Validator.validateEmail(patient.email);
    }
    
    if (patient.phone) {
      Validator.validatePhone(patient.phone);
    }

    const response = await this.makeRequest<PatientResponse>('POST', '/patient', patient, true);
    
    logger.success('Patient created successfully', { 
      patientId: response.data?.id,
      name: `${patient.firstName} ${patient.lastName}` 
    });
    
    return response;
  }

  async createProvider(provider: Provider): Promise<ProviderResponse> {
    logger.step('Create Provider', `Creating provider: ${provider.firstName} ${provider.lastName}`);
    
    // Validate provider data
    Validator.validateString(provider.firstName, 'firstName', 1, 50);
    Validator.validateString(provider.lastName, 'lastName', 1, 50);
    Validator.validateEmail(provider.email);
    Validator.validateEnum(provider.role, ['PROVIDER', 'ADMIN'], 'role');

    const response = await this.makeRequest<ProviderResponse>('POST', '/provider', provider, true);
    
    logger.success('Provider created successfully', { 
      providerId: response.data?.id,
      name: `${provider.firstName} ${provider.lastName}` 
    });
    
    return response;
  }

  async setProviderAvailability(availabilityRequest: AvailabilityRequest): Promise<ApiResponse> {
    logger.step('Set Availability', `Setting availability for provider: ${availabilityRequest.providerId}`);
    
    // Validate availability request
    Validator.validateString(availabilityRequest.providerId, 'providerId');
    Validator.validateArray(availabilityRequest.slots, 'slots', 1);
    
    for (const slot of availabilityRequest.slots) {
      Validator.validateString(slot.dayOfWeek, 'dayOfWeek');
      Validator.validateString(slot.startTime, 'startTime');
      Validator.validateString(slot.endTime, 'endTime');
      Validator.validateEnum(slot.appointmentType, ['VIRTUAL', 'IN_PERSON'], 'appointmentType');
    }

    const response = await this.makeRequest<ApiResponse>('POST', '/provider/availability-setting', availabilityRequest, true);
    
    logger.success('Provider availability set successfully', { 
      providerId: availabilityRequest.providerId,
      slotsCount: availabilityRequest.slots.length 
    });
    
    return response;
  }

  async bookAppointment(appointmentRequest: AppointmentRequest): Promise<AppointmentResponse> {
    logger.step('Book Appointment', `Booking appointment for patient: ${appointmentRequest.patientId}`);
    
    // Validate appointment request
    Validator.validateString(appointmentRequest.patientId, 'patientId');
    Validator.validateString(appointmentRequest.providerId, 'providerId');
    Validator.validateDate(appointmentRequest.appointmentDateTime, 'appointmentDateTime');
    Validator.validateDate(appointmentRequest.endDateTime, 'endDateTime');
    Validator.validateEnum(appointmentRequest.appointmentType, ['VIRTUAL', 'IN_PERSON'], 'appointmentType');
    Validator.validateString(appointmentRequest.chiefComplaint, 'chiefComplaint', 1, 500);

    const response = await this.makeRequest<AppointmentResponse>('POST', '/appointment', appointmentRequest, true);
    
    logger.success('Appointment booked successfully', { 
      appointmentId: response.data?.id,
      patientId: appointmentRequest.patientId,
      providerId: appointmentRequest.providerId 
    });
    
    return response;
  }

  // Verification methods
  async getProviders(page: number = 0, size: number = 20): Promise<ApiResponse> {
    logger.step('Get Providers', `Fetching providers list (page: ${page}, size: ${size})`);
    
    const response = await this.makeRequest<ApiResponse>('GET', `/provider?page=${page}&size=${size}`, undefined, true);
    
    logger.success('Providers list retrieved', { 
      count: response.data?.length || 0,
      page,
      size 
    });
    
    return response;
  }

  async getPatients(page: number = 0, size: number = 20, searchString: string = ""): Promise<ApiResponse> {
    logger.step('Get Patients', `Fetching patients list (page: ${page}, size: ${size})`);
    
    const endpoint = searchString 
      ? `/patient?page=${page}&size=${size}&search=${encodeURIComponent(searchString)}`
      : `/patient?page=${page}&size=${size}`;
    
    const response = await this.makeRequest<ApiResponse>('GET', endpoint, undefined, true);
    
    logger.success('Patients list retrieved', { 
      count: response.data?.length || 0,
      page,
      size,
      searchString 
    });
    
    return response;
  }

  async getAvailabilitySettings(providerId: string): Promise<ApiResponse> {
    logger.step('Get Availability', `Fetching availability settings for provider: ${providerId}`);
    
    Validator.validateString(providerId, 'providerId');

    const response = await this.makeRequest<ApiResponse>('GET', `/provider/${providerId}/availability-setting`, undefined, true);
    
    logger.success('Availability settings retrieved', { providerId });
    
    return response;
  }

  // Utility methods
  getBearerToken(): string {
    return this.bearerToken;
  }

  isAuthenticated(): boolean {
    return !!this.bearerToken;
  }

  getRequestId(): string {
    return this.requestId;
  }

  setContext(context: Record<string, any>): void {
    logger.setContext(context);
  }
} 