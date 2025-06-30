"use client"

import React, { Suspense } from "react"
import ResetPasswordPageInner from "./ResetPasswordPageInner"

// Este es el componente de exportación principal, que envuelve todo en Suspense
export default function ResetPasswordPage(props: any) {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ResetPasswordPageInner {...props} />
    </Suspense>
  )
}