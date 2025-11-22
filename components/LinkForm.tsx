'use client'

import { useState } from 'react'

interface LinkFormProps {
  onLinkCreated: () => void
}

export default function LinkForm({ onLinkCreated }: LinkFormProps) {
  const [targetUrl, setTargetUrl] = useState('')
  const [customCode, setCustomCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [createdLink, setCreatedLink] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setCreatedLink(null)

    if (!targetUrl) {
      setError('Please enter a URL')
      return
    }

    // Validate URL format
    try {
      new URL(targetUrl)
    } catch {
      setError('Please enter a valid URL (include http:// or https://)')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl,
          code: customCode || undefined
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create link')
      }

      setSuccess('Link created successfully!')
      setCreatedLink(data.data)
      setTargetUrl('')
      setCustomCode('')
      onLinkCreated()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  return (
    <div className="bg-white rounded-lg shadow-xl p-6 md:p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        ✨ Create Short Link
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Target URL Input */}
        <div>
          <label htmlFor="targetUrl" className="block text-sm font-medium text-gray-700 mb-2">
            Target URL *
          </label>
          <input
  type="text"
  id="targetUrl"
  value={targetUrl}
  onChange={(e) => setTargetUrl(e.target.value)}
  placeholder="https://example.com/very/long/url"
  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
  disabled={loading}
/>

        </div>

        {/* Custom Code Input (Optional) */}
        <div>
          <label htmlFor="customCode" className="block text-sm font-medium text-gray-700 mb-2">
            Custom Short Code (optional)
          </label>
          <input
            type="text"
            id="customCode"
            value={customCode}
            onChange={(e) => setCustomCode(e.target.value)}
            placeholder="my-custom-code"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={loading}
          />
          <p className="mt-1 text-sm text-gray-500">
            Leave empty to generate a random code
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Creating...' : '🚀 Shorten URL'}
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          ❌ {error}
        </div>
      )}

      {/* Success Message */}
      {success && createdLink && (
        <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          <p className="font-semibold mb-2">✅ {success}</p>
          <div className="bg-white p-3 rounded border border-green-300">
            <p className="text-sm text-gray-600 mb-1">Your short link:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-indigo-600 font-mono text-sm break-all">
                {typeof window !== 'undefined' && `${window.location.origin}/${createdLink.code}`}
              </code>
              <button
                onClick={() => copyToClipboard(`${window.location.origin}/${createdLink.code}`)}
                className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
