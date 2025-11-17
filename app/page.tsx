'use client'

import { useState, useRef } from 'react'
import { Upload } from 'lucide-react'
import BorderGenerator from '@/components/border-generator'

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header - Title */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 px-6 py-4">
        <h1 className="text-2xl font-bold text-white">Border Generator</h1>
      </div>

      {/* Main Content */}
      <BorderGenerator />
    </main>
  )
}
