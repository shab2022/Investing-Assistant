'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface PortfolioUploadProps {
  onUpload: () => void
}

export default function PortfolioUpload({ onUpload }: PortfolioUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError('')
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file')
      return
    }

    setUploading(true)
    setError('')

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const csvContent = e.target?.result as string

        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) {
          throw new Error('Not authenticated')
        }

        const { error } = await supabase.functions.invoke('ingest-csv', {
          body: { csvContent },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        })

        if (error) throw error

        alert('Portfolio uploaded successfully!')
        setFile(null)
        onUpload()
      }

      reader.readAsText(file)
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold text-slate-100">Upload Portfolio (CSV)</h2>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950/80 text-slate-400 border border-slate-800">
          Robinhood positions.csv
        </span>
      </div>

      <p className="text-xs text-slate-400 mb-4">
        Required columns:{' '}
        <span className="text-slate-200">Symbol</span>,{' '}
        <span className="text-slate-200">Quantity</span>{' '}
        <span className="text-slate-500">(optional: Average Cost Basis)</span>.
      </p>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="block w-full text-xs text-slate-400
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-xs file:font-semibold
            file:bg-cyan-500/10 file:text-cyan-400
            hover:file:bg-cyan-500/20
            cursor-pointer"
        />
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-md
            bg-gradient-to-r from-blue-600 to-cyan-500
            hover:from-blue-500 hover:to-cyan-400
            text-white shadow-lg shadow-cyan-900/40
            disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {uploading ? (
            <>
              <span className="mr-2 h-4 w-4 border-2 border-transparent border-t-white rounded-full animate-spin" />
              Uploading...
            </>
          ) : (
            'Upload'
          )}
        </button>
      </div>

      {error && (
        <div className="mt-3 text-red-400 text-xs">
          {error}
        </div>
      )}
    </div>
  )
}
