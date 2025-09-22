"use client"

import * as React from "react"
import { format, parse, isValid } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import ReactDatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface CustomDatePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "dd/mm/aaaa",
  disabled = false,
  className
}: CustomDatePickerProps) {
  const [inputValue, setInputValue] = React.useState("")
  const [isValidInput, setIsValidInput] = React.useState(true)
  const [showDatePicker, setShowDatePicker] = React.useState(false)

  // Sincronizar el input con la fecha seleccionada
  React.useEffect(() => {
    if (date) {
      setInputValue(format(date, "dd/MM/yyyy"))
      setIsValidInput(true)
    }
  }, [date])

  const handleDateSelect = (selectedDate: Date | null) => {
    if (selectedDate) {
      onDateChange?.(selectedDate)
      setShowDatePicker(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)

    // Validar el formato de fecha mientras se escribe
    if (value.length === 10) { // dd/mm/yyyy
      const parsedDate = parse(value, "dd/MM/yyyy", new Date())
      if (isValid(parsedDate)) {
        setIsValidInput(true)
        onDateChange?.(parsedDate)
      } else {
        setIsValidInput(false)
      }
    } else if (value.length === 8 && !value.includes('/')) { // ddmmyyyy
      // Permitir formato sin barras y auto-formatear
      const formatted = value.replace(/(\d{2})(\d{2})(\d{4})/, '$1/$2/$3')
      setInputValue(formatted)
      const parsedDate = parse(formatted, "dd/MM/yyyy", new Date())
      if (isValid(parsedDate)) {
        setIsValidInput(true)
        onDateChange?.(parsedDate)
      } else {
        setIsValidInput(false)
      }
    } else if (value === "") {
      setIsValidInput(true)
      onDateChange?.(undefined)
    } else {
      setIsValidInput(value.length < 10) // No marcar como inválido hasta completar
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permitir solo números, barras, backspace, delete, tab, enter
    if (!/[0-9\/]/.test(e.key) && 
        !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault()
    }
  }

  const handleCalendarClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowDatePicker(true)
  }

  const CustomInput = React.forwardRef<HTMLInputElement, any>((props, ref) => (
    <div className="relative flex items-center">
      <Input
        {...props}
        ref={ref}
        className="pr-10"
        readOnly
      />
      <CalendarIcon className="absolute right-2 h-4 w-4 text-gray-500 pointer-events-none" />
    </div>
  ))

  CustomInput.displayName = "CustomInput"

  return (
    <div className={cn("relative", className)}>
      {showDatePicker ? (
        <ReactDatePicker
          selected={date}
          onChange={handleDateSelect}
          onClickOutside={() => setShowDatePicker(false)}
          customInput={<CustomInput />}
          dateFormat="dd/MM/yyyy"
          locale={es}
          showPopperArrow={false}
          popperClassName="z-50"
          disabled={disabled}
          open={true}
          shouldCloseOnSelect={true}
          todayButton="Hoy"
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
        />
      ) : (
        <div className="relative flex items-center">
          <Input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "pr-10",
              !isValidInput && "border-red-500 focus:border-red-500"
            )}
            maxLength={10}
          />
          <button
            type="button"
            onClick={handleCalendarClick}
            className="absolute right-2 p-1 hover:bg-gray-100 rounded"
            disabled={disabled}
          >
            <CalendarIcon className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      )}
    </div>
  )
}