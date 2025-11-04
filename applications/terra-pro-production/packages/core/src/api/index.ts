export * from "./gateway";
export * from "./schema";

import { Router } from "express";
import { ExtensionPointManager } from "../plugins/extension-point";
import { ApiExtension } from "../plugins/types";

/**
 * Register an API extension
 * @param id Extension ID
 * @param basePath Base path for the router
 * @param router Express router
 * @param middleware Optional middleware to apply to all routes
 */
export function registerApiExtension(
  id: string,
  basePath: string,
  router: Router,
  middleware: any[] = []
): void {
  // Get the extension point manager
  const extensionPointManager = ExtensionPointManager.getInstance();

  // Get the API extension point
  const apiExtensionPoint = extensionPointManager.getExtensionPoint<ApiExtension>("core.api");

  if (!apiExtensionPoint) {
    throw new Error("API extension point not registered");
  }

  // Register the API extension
  apiExtensionPoint.register({
    id,
    basePath,
    router,
    middleware,
  });
}
