// TEMPORARY: Use backend adapter instead of Base44 SDK
// Comment this out to switch back to Base44
export { base44 } from './backendAdapter';

// Original Base44 SDK (commented out for migration)
// import { createClient } from '@base44/sdk';
// import { appParams } from '@/lib/app-params';
//
// const { appId, token, functionsVersion, appBaseUrl } = appParams;
//
// export const base44 = createClient({
//   appId,
//   token,
//   functionsVersion,
//   serverUrl: '',
//   appBaseUrl,
// });
