"use client"

import * as React from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, BarChart3, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MonthlySedeData, SedeInfo } from "@/types"

export interface DashboardChartDataPoint {
  name: string
  value: number
}

export interface DashboardChartConfig {
  title: string
  description?: string
  xAxisLabel?: string
  yAxisLabel?: string
  color?: string
}

export interface DashboardBarChartProps {
  data: MonthlySedeData[]
  sedes: SedeInfo[]
  config: DashboardChartConfig
  loading?: boolean
  error?: string | null
  onRefresh?: () => void
  className?: string
  height?: number
  metricOptions?: Array<{ value: string; label: string }>
  selectedMetric?: string
  onMetricChange?: (metric: string) => void
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-card p-3 shadow-md min-w-[200px]">
        <div className="space-y-2">
          <p className="font-medium text-card-foreground border-b pb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-sm" 
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className="text-sm text-muted-foreground">{entry.dataKey}</span>
              </div>
              <span className="font-semibold text-foreground">
                {entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

export function DashboardBarChart({
  data,
  sedes,
  config,
  loading = false,
  error = null,
  onRefresh,
  className,
  height = 350,
  metricOptions,
  selectedMetric,
  onMetricChange
}: DashboardBarChartProps) {

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            {config.title}
          </CardTitle>
          {config.description && (
            <CardDescription className="text-sm text-muted-foreground">
              {config.description}
            </CardDescription>
          )}
        </div>
        <div className="flex items-center gap-2">
          {metricOptions && onMetricChange && (
            <Select value={selectedMetric} onValueChange={onMetricChange}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Seleccionar métrica" />
              </SelectTrigger>
              <SelectContent>
                {metricOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              className="h-9"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {loading ? (
          <div className="flex items-center justify-center" style={{ height }}>
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="h-12 w-12 rounded-full border-4 border-primary/20"></div>
                <Loader2 className="absolute top-0 left-0 h-12 w-12 animate-spin text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Cargando datos del gráfico...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center" style={{ height }}>
            <div className="text-center space-y-4">
              <div className="p-4 rounded-full bg-destructive/10 w-fit mx-auto">
                <BarChart3 className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-medium text-destructive mb-1">Error al cargar el gráfico</p>
                <p className="text-xs text-muted-foreground">{error}</p>
              </div>
              {onRefresh && (
                <Button variant="outline" size="sm" onClick={onRefresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reintentar
                </Button>
              )}
            </div>
          </div>
        ) : data && data.length > 0 && sedes ? (
          <div className="w-full" style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 20,
                }}
                barCategoryGap="25%"
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  className="stroke-muted/30" 
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 12,
                  }}
                  className="text-xs"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 12,
                  }}
                  className="text-xs"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="rect"
                />
                {sedes.map((sede) => (
                  <Bar
                    key={sede.id}
                    dataKey={sede.name}
                    fill={sede.color}
                    radius={[4, 4, 0, 0]}
                    name={sede.name}
                    className="drop-shadow-sm"
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center" style={{ height }}>
            <div className="text-center space-y-4">
              <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto">
                <BarChart3 className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">No hay datos disponibles</p>
                <p className="text-xs text-muted-foreground">Los datos del gráfico aparecerán aquí</p>
              </div>
              {onRefresh && (
                <Button variant="outline" size="sm" onClick={onRefresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Cargar datos
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}