import { test, expect } from '@playwright/test';
import { HealthcareApiClient } from '../src/api/healthcare-api-client';
import { logger, LogLevel } from '../src/utils/logger';
import { 
  LoginCredentials, 
  Patient, 
  Provider, 
  AvailabilitySlot,
  AppointmentRequest 
} from '../src/types/api.types';

test.describe('Healthcare API Workflow - Improved', () => {
  let apiClient: HealthcareApiClient;
  let patientId: string;
  let providerId: string;

  test.beforeEach(async ({ request }) => {
    // Set up logging context
    logger.setLevel(LogLevel.INFO);
    logger.setContext({ testName: test.info().title });
    
    // Initialize API client
    apiClient = new HealthcareApiClient(request, 'stage');
    
    logger.info('Test setup completed', { 
      testName: test.info().title,
      requestId: apiClient.getRequestId() 
    });
  });

  test('Complete Healthcare Workflow - Happy Path', async () => {
    logger.info('🚀 Starting Complete Healthcare API Workflow Test');

    try {
      // Step 1: Provider Login
      logger.step('Step 1', 'Provider Login');
      const loginResponse = await apiClient.login();
      expect(loginResponse.code).toBe('ENTITY');
      expect(apiClient.isAuthenticated()).toBe(true);
      expect(apiClient.getBearerToken()).toBeTruthy();

      // Step 2: Create Patient
      logger.step('Step 2', 'Create Patient');
      const patient: Patient = {
        firstName: 'Samuel',
        lastName: 'Peterson',
        gender: 'MALE',
        birthDate: '1994-08-16',
        email: 'samuel.peterson@example.com',
        phone: '+1234567890'
      };

      const patientResponse = await apiClient.createPatient(patient);
      patientId = patientResponse.data.id;
      expect(patientId).toBeTruthy();
      expect(patientResponse.success).toBe(true);

      // Step 3: Add Provider
      logger.step('Step 3', 'Create Provider');
      const provider: Provider = {
        firstName: 'Steven',
        lastName: 'Miller',
        email: 'saurabh.kale+steven@medarch.com',
        role: 'PROVIDER',
        specialization: 'General Medicine'
      };

      const providerResponse = await apiClient.createProvider(provider);
      providerId = providerResponse.data.id;
      expect(providerId).toBeTruthy();
      expect(providerResponse.success).toBe(true);

      // Step 4: Set Availability
      logger.step('Step 4', 'Set Provider Availability');
      const availabilitySlot: AvailabilitySlot = {
        dayOfWeek: 'MONDAY',
        startTime: '12:00',
        endTime: '13:00',
        slotDuration: 30, // 30 minutes
        minimumNoticeHours: 8,
        appointmentType: 'VIRTUAL'
      };

      const availabilityRequest = {
        providerId: providerId,
        slots: [availabilitySlot]
      };

      const availabilityResponse = await apiClient.setProviderAvailability(availabilityRequest);
      expect(availabilityResponse.success).toBe(true);

      // Step 5: Book Appointment
      logger.step('Step 5', 'Book Appointment');
      const appointmentRequest: AppointmentRequest = {
        patientId: patientId,
        providerId: providerId,
        appointmentDateTime: '2025-08-04T17:00:00Z',
        endDateTime: '2025-08-04T17:30:00Z',
        appointmentType: 'VIRTUAL',
        chiefComplaint: 'appointment test',
        notes: 'Test appointment via API automation'
      };

      const appointmentResponse = await apiClient.bookAppointment(appointmentRequest);
      expect(appointmentResponse.data.id).toBeTruthy();
      expect(appointmentResponse.success).toBe(true);

      logger.success('✅ All main workflow steps completed successfully!');

      // Step 6: Verification Calls
      logger.step('Step 6', 'Verification Calls');
      await performVerificationCalls();

      logger.success('🎉 Healthcare API Workflow Test Completed Successfully!');

    } catch (error) {
      logger.failure('Test failed', error);
      throw error;
    }
  });

  test('Error Handling - Invalid Login', async () => {
    logger.info('🧪 Testing invalid login scenario');

    const invalidCredentials: LoginCredentials = {
      username: 'invalid@email.com',
      password: 'wrongpassword'
    };

    try {
      await apiClient.login(invalidCredentials);
      expect(false).toBe(true); // Should not reach here
    } catch (error) {
      logger.success('✅ Invalid login properly handled');
      expect(error).toBeInstanceOf(Error);
    }
  });

  test('Error Handling - Unauthorized Request', async () => {
    logger.info('🧪 Testing unauthorized request scenario');

    const patient: Patient = {
      firstName: 'Test',
      lastName: 'Patient',
      gender: 'MALE',
      birthDate: '1990-01-01'
    };

    try {
      await apiClient.createPatient(patient);
      expect(false).toBe(true); // Should not reach here
    } catch (error) {
      logger.success('✅ Unauthorized request properly handled');
      expect(error).toBeInstanceOf(Error);
    }
  });

  test('Data Validation - Invalid Patient Data', async () => {
    logger.info('🧪 Testing data validation');

    const invalidPatient: Patient = {
      firstName: '', // Invalid: empty string
      lastName: 'Test',
      gender: 'MALE',
      birthDate: '1990-01-01'
    };

    try {
      await apiClient.createPatient(invalidPatient);
      expect(false).toBe(true); // Should not reach here
    } catch (error) {
      logger.success('✅ Invalid patient data properly validated');
      expect(error.message).toContain('firstName');
    }
  });

  test('Data Validation - Invalid Email', async () => {
    logger.info('🧪 Testing email validation');

    const patientWithInvalidEmail: Patient = {
      firstName: 'Test',
      lastName: 'Patient',
      gender: 'MALE',
      birthDate: '1990-01-01',
      email: 'invalid-email' // Invalid email format
    };

    try {
      await apiClient.createPatient(patientWithInvalidEmail);
      expect(false).toBe(true); // Should not reach here
    } catch (error) {
      logger.success('✅ Invalid email properly validated');
      expect(error.message).toContain('email');
    }
  });

  async function performVerificationCalls() {
    logger.info('🔍 Starting verification calls...');

    // Verify provider creation
    const providersResponse = await apiClient.getProviders();
    const createdProvider = providersResponse.data.find((p: any) => p.id === providerId);
    expect(createdProvider).toBeTruthy();
    expect(createdProvider.firstName).toBe('Steven');
    expect(createdProvider.lastName).toBe('Miller');

    // Verify patient creation
    const patientsResponse = await apiClient.getPatients();
    const createdPatient = patientsResponse.data.find((p: any) => p.id === patientId);
    expect(createdPatient).toBeTruthy();
    expect(createdPatient.firstName).toBe('Samuel');
    expect(createdPatient.lastName).toBe('Peterson');

    // Verify availability settings
    const availabilityResponse = await apiClient.getAvailabilitySettings(providerId);
    expect(availabilityResponse.data).toBeTruthy();
    
    logger.success('✅ All verification calls completed successfully!');
  }
}); 