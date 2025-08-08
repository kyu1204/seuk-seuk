'use client'

import { useEffect, useState } from 'react'
import { getCurrentUserClient } from '@/app/auth/queries'
import { getUserDocumentsClient } from '@/app/dashboard/queries'
import { listFiles } from '@/lib/storage/queries'
import type { User } from '@supabase/supabase-js'

export default function TestPage() {
  const [user, setUser] = useState<User | null>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [storageFiles, setStorageFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function testConnection() {
      try {
        setLoading(true)
        setError(null)

        // Test 1: Get current user
        console.log('Testing user authentication...')
        const currentUser = await getCurrentUserClient()
        setUser(currentUser)
        console.log('Current user:', currentUser)

        if (currentUser) {
          // Test 2: Get user documents
          console.log('Testing document queries...')
          try {
            const userDocs = await getUserDocumentsClient()
            setDocuments(userDocs)
            console.log('User documents:', userDocs)
          } catch (docError) {
            console.log('No documents found or permission error:', docError)
            setDocuments([])
          }

          // Test 3: Test storage access
          console.log('Testing storage access...')
          try {
            const files = await listFiles('documents', currentUser.id)
            setStorageFiles(files)
            console.log('Storage files:', files)
          } catch (storageError) {
            console.log('No storage files found or permission error:', storageError)
            setStorageFiles([])
          }
        }

      } catch (err) {
        console.error('Test error:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    testConnection()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <div className="space-y-6">
        <div className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-2">Authentication Test</h2>
          {user ? (
            <div>
              <p className="text-green-600">✅ User authenticated</p>
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Created:</strong> {user.created_at}</p>
            </div>
          ) : (
            <p className="text-red-600">❌ No user authenticated</p>
          )}
        </div>

        <div className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-2">Database Query Test</h2>
          <p><strong>Documents Count:</strong> {documents.length}</p>
          {documents.length > 0 ? (
            <div>
              <p className="text-green-600">✅ Database queries working</p>
              <ul className="mt-2">
                {documents.map((doc) => (
                  <li key={doc.id} className="text-sm">
                    {doc.title} ({doc.status})
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-yellow-600">⚠️ No documents found (this is normal for new users)</p>
          )}
        </div>

        <div className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-2">Storage Access Test</h2>
          <p><strong>Files Count:</strong> {storageFiles.length}</p>
          {storageFiles.length > 0 ? (
            <div>
              <p className="text-green-600">✅ Storage access working</p>
              <ul className="mt-2">
                {storageFiles.map((file, index) => (
                  <li key={index} className="text-sm">
                    {file.name} ({file.metadata?.size} bytes)
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-yellow-600">⚠️ No files found (this is normal for new users)</p>
          )}
        </div>
      </div>
    </div>
  )
}