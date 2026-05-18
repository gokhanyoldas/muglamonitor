// sentry.ts
import * as Sentry from "@sentry/react";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;
const IS_PROD = import.meta.env.PROD;
const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? "1.0.0";

export function initSentry() {
  if (!SENTRY_DSN) { console.info("[Sentry] VITE_SENTRY_DSN tanımlı değil — error tracking devre dışı"); return; }
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: IS_PROD ? "production" : "development",
    release: `mugla-monitor@${APP_VERSION}`,
    tracesSampleRate: IS_PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: IS_PROD ? 0.01 : 0,
    replaysOnErrorSampleRate: IS_PROD ? 0.1 : 0,
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration({ maskAllText: false, blockAllMedia: true })],
    ignoreErrors: ["ResizeObserver loop limit exceeded", "Network request failed", "Load failed", "Failed to fetch"],
    beforeSend(event) {
      if (event.request?.url) {
        try {
          const u = new URL(event.request.url);
          u.searchParams.delete("token"); u.searchParams.delete("apikey");
          event.request.url = u.toString();
        } catch {}
      }
      return event;
    },
  });
}

export function captureApiError(api: string, error: unknown, context?: Record<string, unknown>) {
  Sentry.withScope((scope) => {
    scope.setTag("api", api); scope.setTag("error_type", "api_failure");
    if (context) scope.setContext("api_context", context);
    Sentry.captureException(error);
  });
}

export function captureEdgeFunctionError(fn: string, error: unknown) {
  Sentry.withScope((scope) => {
    scope.setTag("edge_function", fn); scope.setTag("error_type", "edge_function_error");
    Sentry.captureException(error);
  });
}

export { Sentry };
