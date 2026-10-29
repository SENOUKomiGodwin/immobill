import { getAccessToken } from '@base44/sdk';

const isNode = typeof window === 'undefined';

const isClearAccessTokenRequested = (): boolean =>
  !isNode && new URLSearchParams(window.location.search).get('clear_access_token') === 'true';

const clearStoredAccessToken = (): void => {
  window.localStorage.removeItem('base44_access_token');
  window.localStorage.removeItem('token');
};

export interface AppParams {
  appId: string | undefined;
  token: string | null | undefined;
  functionsVersion: string | undefined;
  appBaseUrl: string | undefined;
}

const getAppParams = (): AppParams => {
  if (isClearAccessTokenRequested()) {
    clearStoredAccessToken();
  }
  return {
    appId: import.meta.env.VITE_BASE44_APP_ID,
    token: getAccessToken(),
    functionsVersion:
      (!isNode && new URLSearchParams(window.location.search).get('functions_version')?.trim()) ||
      import.meta.env.VITE_BASE44_FUNCTIONS_VERSION,
    appBaseUrl: import.meta.env.VITE_BASE44_APP_BASE_URL,
  };
};

export const appParams: AppParams = {
  ...getAppParams(),
};
