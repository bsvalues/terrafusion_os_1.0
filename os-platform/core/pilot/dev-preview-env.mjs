export function createPreviewRuntimeEnv(environment = process.env) {
  return {
    ...environment,
    TF_API_PORT: environment.TF_API_PORT || "5046",
    TF_FRONTEND_PORT:
      environment.TF_FRONTEND_PORT || environment.PORT || environment.VITE_PORT || "3102",
  };
}

export function createPreviewBackendEnv(environment = process.env) {
  const explicitPassword = environment.TF_PILOT_PASSWORD;

  if (typeof explicitPassword === "string" && explicitPassword.length > 0) {
    return { ...environment };
  }

  return {
    ...environment,
    TF_PILOT_AUTH_MODE: environment.TF_PILOT_AUTH_MODE || "dev-token",
  };
}
