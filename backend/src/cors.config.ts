const LOCAL_WEB_PORTS = new Set(['3000', '8081', '19006']);

export function buildCorsOptions() {
  return {
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => callback(null, isAllowedLocalOrigin(origin)),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  };
}

function isAllowedLocalOrigin(origin: string | undefined): boolean {
  if (!origin) {
    return true;
  }

  if (origin.startsWith('exp://')) {
    return isAllowedExpoOrigin(origin);
  }

  try {
    const url = new URL(origin);
    return isAllowedLocalHost(url.hostname) && LOCAL_WEB_PORTS.has(url.port);
  } catch {
    return false;
  }
}

function isAllowedExpoOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    return isAllowedLocalHost(url.hostname) && url.port === '19000';
  } catch {
    return false;
  }
}

function isAllowedLocalHost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)
  );
}
