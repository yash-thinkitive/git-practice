export interface EnvironmentConfig {
  baseURL: string;
  tenantId: string;
  credentials: {
    username: string;
    password: string;
  };
  timeouts: {
    request: number;
    navigation: number;
    assertion: number;
  };
  retry: {
    maxAttempts: number;
    delayMs: number;
  };
}

export const environments = {
  stage: {
    baseURL: 'https://stage-api.ecarehealth.com/api/master',
    tenantId: 'stage_aithinkitive',
    credentials: {
      username: 'rose.gomez@jourrapide.com',
      password: 'Pass@123'
    },
    timeouts: {
      request: 30000,
      navigation: 60000,
      assertion: 10000
    },
    retry: {
      maxAttempts: 3,
      delayMs: 1000
    }
  },
  dev: {
    baseURL: 'https://dev-api.ecarehealth.com/api/master',
    tenantId: 'dev_aithinkitive',
    credentials: {
      username: process.env.DEV_USERNAME || 'test@example.com',
      password: process.env.DEV_PASSWORD || 'testpass'
    },
    timeouts: {
      request: 30000,
      navigation: 60000,
      assertion: 10000
    },
    retry: {
      maxAttempts: 3,
      delayMs: 1000
    }
  }
} as const;

export type Environment = keyof typeof environments;

export function getConfig(environment: Environment = 'stage'): EnvironmentConfig {
  return environments[environment];
} 