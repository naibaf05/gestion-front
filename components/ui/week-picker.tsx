"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react"

interface WeekPickerProps {
    value: string // Fecha en formato YYYY-MM-DD
    onChange: (date: string) => void
    className?: string
}

export function WeekPicker({ value, onChange, className }: WeekPickerProps) {
    const [weekStart, setWeekStart] = useState("")
    const [weekEnd, setWeekEnd] = useState("")
    const [calendarOpen, setCalendarOpen] = useState(false)

    // Función para obtener el lunes de la semana
    const getMondayOfWeek = (date: Date): Date => {
        const day = date.getDay()
        const monday = new Date(date)
        monday.setDate(date.getDate() - day + (day === 0 ? -6 : 1))
        return monday
    }

    // Función para obtener el número de semana
    const getWeekNumber = (date: Date): number => {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
    }

    // Función para formatear fecha a string
    const formatDate = (date: Date): string => {
        return new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Bogota',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).format(date)
    }

    // Función para formatear fecha de visualización
    const formatDisplayDate = (dateString: string): string => {
        const [year, month, day] = dateString.split('-')
        return `${day}/${month}`
    }

    // Función para obtener información de la semana basada en una fecha
    const getWeekInfo = (dateString: string) => {
        const date = new Date(dateString + 'T00:00:00')
        const monday = getMondayOfWeek(new Date(date))
        const sunday = new Date(monday)
        sunday.setDate(monday.getDate() + 6)

        const weekNum = getWeekNumber(monday)

        setWeekStart(formatDate(monday))
        setWeekEnd(formatDate(sunday))
    }

    useEffect(() => {
        if (value) {
            getWeekInfo(value)
        }
    }, [value])

    const navigateWeek = (direction: 'prev' | 'next') => {
        const currentDate = new Date(value + 'T00:00:00')
        const newDate = new Date(currentDate)
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7))

        const newDateString = formatDate(newDate)
        onChange(newDateString)
    }

    const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedDate = e.target.value
        if (selectedDate) {
            onChange(selectedDate)
            setCalendarOpen(false)
        }
    }

    return (
        <div className={`flex items-center space-x-2 ${className}`}>
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigateWeek('prev')}
                className="px-2"
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>

            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="flex flex-col items-center min-w-[160px] h-auto py-2 px-3 hover:bg-gray-50">
                        <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">
                                {weekStart && weekEnd && `${formatDisplayDate(weekStart)} - ${formatDisplayDate(weekEnd)}`}
                            </span>
                            <CalendarIcon className="h-4 w-4" />
                        </div>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="center">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Seleccionar fecha:</label>
                        <input
                            type="date"
                            value={value}
                            onChange={handleDateInputChange}
                            className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                        />
                    </div>
                </PopoverContent>
            </Popover>

            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigateWeek('next')}
                className="px-2"
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    )
}
