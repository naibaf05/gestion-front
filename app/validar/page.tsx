"use client"

import { Suspense } from "react"
import ValidarPageInner from "./ValidarPageInner"

export default function ValidarPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ValidarPageInner />
    </Suspense>
  )
}
