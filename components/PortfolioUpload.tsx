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

        const { data: { session } } = await supabase.auth.getSession()
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
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Upload Portfolio (CSV)</h2>
      <p className="text-sm text-gray-600 mb-4">
        Upload a Robinhood positions.csv file. Required columns: Symbol, Quantity (optional: Average Cost Basis)
      </p>

      <div className="flex items-center space-x-4">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>

      {error && (
        <div className="mt-4 text-red-600 text-sm">{error}</div>
      )}
    </div>
  )
}

