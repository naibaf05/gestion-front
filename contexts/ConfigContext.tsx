"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { AppConfig } from "@/types"

interface ConfigContextType {
  config: AppConfig | null
  loading: boolean
  updateConfig: (newConfig: Partial<AppConfig>) => Promise<void>
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined)

const defaultConfig: AppConfig = {
  primaryColor: "#46B171",
  logo: "/logo.png",
  companyName: "Sistema de Trazabilidad",
  version: "1.0.0",
}

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AppConfig>(defaultConfig)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (config) {
      document.documentElement.style.setProperty("--primary-color", config.primaryColor)
    }
  }, [config])

  const updateConfig = async (newConfig: Partial<AppConfig>) => {
    try {
      const updatedConfig = { ...config, ...newConfig }
      setConfig(updatedConfig)
    } catch (error) {
      console.error("Error updating config:", error)
      throw error
    }
  }

  const value = {
    config,
    loading,
    updateConfig,
  }

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
}

export function useConfig() {
  const context = useContext(ConfigContext)
  if (context === undefined) {
    throw new Error("useConfig must be used within a ConfigProvider")
  }
  return context
}
