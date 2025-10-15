"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { TERRAFUSION_MODULES, type TerraFusionModule, type ModuleStatus } from "@/lib/modules"

interface ModuleRegistryContextType {
  modules: TerraFusionModule[]
  activeModules: TerraFusionModule[]
  getModule: (id: string) => TerraFusionModule | undefined
  updateModuleStatus: (id: string, status: ModuleStatus) => void
  toggleModule: (id: string) => void
  isModuleEnabled: (id: string) => boolean
  getModulePermissions: (id: string) => string[]
}

const ModuleRegistryContext = createContext<ModuleRegistryContextType | undefined>(undefined)

export function ModuleRegistryProvider({ children }: { children: ReactNode }) {
  const [modules, setModules] = useState<TerraFusionModule[]>(TERRAFUSION_MODULES)

  const activeModules = modules.filter((module) => module.config.enabled && module.status === "active")

  const getModule = (id: string) => modules.find((module) => module.id === id)

  const updateModuleStatus = (id: string, status: ModuleStatus) => {
    setModules((prev) => prev.map((module) => (module.id === id ? { ...module, status } : module)))
  }

  const toggleModule = (id: string) => {
    setModules((prev) =>
      prev.map((module) =>
        module.id === id ? { ...module, config: { ...module.config, enabled: !module.config.enabled } } : module,
      ),
    )
  }

  const isModuleEnabled = (id: string) => {
    const module = getModule(id)
    return module?.config.enabled && module?.status === "active"
  }

  const getModulePermissions = (id: string) => {
    const module = getModule(id)
    return module?.permissions || []
  }

  return (
    <ModuleRegistryContext.Provider
      value={{
        modules,
        activeModules,
        getModule,
        updateModuleStatus,
        toggleModule,
        isModuleEnabled,
        getModulePermissions,
      }}
    >
      {children}
    </ModuleRegistryContext.Provider>
  )
}

export function useModuleRegistry() {
  const context = useContext(ModuleRegistryContext)
  if (context === undefined) {
    throw new Error("useModuleRegistry must be used within a ModuleRegistryProvider")
  }
  return context
}
