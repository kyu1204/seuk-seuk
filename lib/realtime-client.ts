'use client'

import { createBrowserClient } from '@supabase/ssr'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { Database } from './database-types'

type SignaturePayload = RealtimePostgresChangesPayload<{
  [key: string]: any
}>

type DocumentStatusCallback = (data: {
  documentId: string
  totalAreas: number
  signedAreas: number
  isComplete: boolean
  lastSignature?: any
}) => void

interface RealtimeManager {
  subscribeToDocument: (documentId: string, callback: DocumentStatusCallback) => () => void
  subscribeToSignatures: (documentId: string, callback: (signature: any) => void) => () => void
  disconnect: () => void
}

class DocumentRealtimeManager {
  private supabase: ReturnType<typeof createBrowserClient<Database>>
  private channels: Map<string, RealtimeChannel> = new Map()
  private reconnectAttempts: Map<string, number> = new Map()
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000 // Start with 1 second

  constructor() {
    this.supabase = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  /**
   * Subscribe to real-time document status updates
   */
  subscribeToDocument(documentId: string, callback: DocumentStatusCallback): () => void {
    const channelName = `document_${documentId}`
    
    // Remove existing channel if it exists
    this.unsubscribeChannel(channelName)

    const channel = this.supabase
      .channel(channelName)
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'signatures',
          filter: `document_id=eq.${documentId}`
        },
        (payload: SignaturePayload) => {
          console.log('Signature change received:', payload)
          this.handleSignatureChange(documentId, payload, callback)
        }
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public', 
          table: 'signature_areas',
          filter: `document_id=eq.${documentId}`
        },
        (payload) => {
          console.log('Signature area change received:', payload)
          // Refresh document status when signature areas change
          this.refreshDocumentStatus(documentId, callback)
        }
      )
      .subscribe((status) => {
        console.log(`Document ${documentId} subscription status:`, status)
        
        if (status === 'SUBSCRIBED') {
          // Reset reconnect attempts on successful connection
          this.reconnectAttempts.delete(channelName)
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          // Attempt to reconnect
          this.handleChannelError(channelName, () => 
            this.subscribeToDocument(documentId, callback)
          )
        }
      })

    this.channels.set(channelName, channel)

    // Initial status load
    this.refreshDocumentStatus(documentId, callback)

    // Return unsubscribe function
    return () => this.unsubscribeChannel(channelName)
  }

  /**
   * Subscribe to real-time signature changes only
   */
  subscribeToSignatures(documentId: string, callback: (signature: any) => void): () => void {
    const channelName = `signatures_${documentId}`
    
    this.unsubscribeChannel(channelName)

    const channel = this.supabase
      .channel(channelName)
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'signatures',
          filter: `document_id=eq.${documentId}`
        },
        (payload: SignaturePayload) => {
          console.log('New signature:', payload)
          callback(payload.new)
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE', 
          schema: 'public',
          table: 'signatures',
          filter: `document_id=eq.${documentId}`
        },
        (payload: SignaturePayload) => {
          console.log('Updated signature:', payload)
          callback(payload.new)
        }
      )
      .subscribe((status) => {
        console.log(`Signatures ${documentId} subscription status:`, status)
        
        if (status !== 'SUBSCRIBED') {
          this.handleChannelError(channelName, () =>
            this.subscribeToSignatures(documentId, callback)
          )
        }
      })

    this.channels.set(channelName, channel)

    return () => this.unsubscribeChannel(channelName)
  }

  /**
   * Handle signature changes and calculate document status
   */
  private async handleSignatureChange(
    documentId: string, 
    payload: SignaturePayload, 
    callback: DocumentStatusCallback
  ) {
    try {
      // Get updated document status
      await this.refreshDocumentStatus(documentId, callback)
    } catch (error) {
      console.error('Error handling signature change:', error)
    }
  }

  /**
   * Fetch and calculate current document status
   */
  private async refreshDocumentStatus(documentId: string, callback: DocumentStatusCallback) {
    try {
      // Get signature areas count
      const { count: totalAreas, error: areasError } = await this.supabase
        .from('signature_areas')
        .select('*', { count: 'exact', head: true })
        .eq('document_id', documentId)

      if (areasError) {
        console.error('Error fetching signature areas:', areasError)
        return
      }

      // Get signatures count and latest signature
      const { data: signatures, count: signedAreas, error: signaturesError } = await this.supabase
        .from('signatures')
        .select('*', { count: 'exact' })
        .eq('document_id', documentId)
        .order('signed_at', { ascending: false })

      if (signaturesError) {
        console.error('Error fetching signatures:', signaturesError)
        return
      }

      const total = totalAreas || 0
      const signed = signedAreas || 0
      const isComplete = total > 0 && signed >= total
      const lastSignature = signatures?.[0]

      callback({
        documentId,
        totalAreas: total,
        signedAreas: signed,
        isComplete,
        lastSignature
      })

    } catch (error) {
      console.error('Error refreshing document status:', error)
    }
  }

  /**
   * Handle channel connection errors with exponential backoff
   */
  private handleChannelError(channelName: string, reconnectFn: () => void) {
    const attempts = this.reconnectAttempts.get(channelName) || 0
    
    if (attempts >= this.maxReconnectAttempts) {
      console.error(`Max reconnection attempts reached for ${channelName}`)
      return
    }

    const delay = this.reconnectDelay * Math.pow(2, attempts) // Exponential backoff
    this.reconnectAttempts.set(channelName, attempts + 1)

    console.log(`Reconnecting ${channelName} in ${delay}ms (attempt ${attempts + 1})`)
    
    setTimeout(() => {
      this.unsubscribeChannel(channelName)
      reconnectFn()
    }, delay)
  }

  /**
   * Unsubscribe from a specific channel
   */
  private unsubscribeChannel(channelName: string) {
    const channel = this.channels.get(channelName)
    if (channel) {
      this.supabase.removeChannel(channel)
      this.channels.delete(channelName)
      this.reconnectAttempts.delete(channelName)
    }
  }

  /**
   * Disconnect all channels
   */
  disconnect() {
    console.log('Disconnecting all realtime channels')
    this.channels.forEach((channel, name) => {
      this.supabase.removeChannel(channel)
    })
    this.channels.clear()
    this.reconnectAttempts.clear()
  }

  /**
   * Get connection status for debugging
   */
  getStatus() {
    return {
      activeChannels: Array.from(this.channels.keys()),
      reconnectAttempts: Object.fromEntries(this.reconnectAttempts)
    }
  }
}

// Singleton instance
let realtimeManager: DocumentRealtimeManager | null = null

export const getRealtimeManager = (): RealtimeManager => {
  if (!realtimeManager) {
    realtimeManager = new DocumentRealtimeManager()
  }
  return realtimeManager
}

// Cleanup function for component unmount
export const cleanupRealtime = () => {
  if (realtimeManager) {
    realtimeManager.disconnect()
    realtimeManager = null
  }
}

// Hook for easy integration with React components
export const useDocumentRealtime = (documentId: string | null) => {
  const manager = getRealtimeManager()
  
  return {
    subscribeToDocument: (callback: DocumentStatusCallback) => {
      if (!documentId) return () => {}
      return manager.subscribeToDocument(documentId, callback)
    },
    subscribeToSignatures: (callback: (signature: any) => void) => {
      if (!documentId) return () => {}
      return manager.subscribeToSignatures(documentId, callback)
    },
    disconnect: manager.disconnect
  }
}