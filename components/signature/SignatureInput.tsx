'use client'

import { useState, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { useLanguage } from '@/contexts/language-context'
import SignatureCanvas, { SignatureCanvasRef } from './SignatureCanvas'

interface SignatureInputProps {
  onSignatureComplete: (signatureData: string, signatureType: 'draw' | 'type' | 'upload') => void
  onCancel: () => void
  existingSignature?: string
  existingSignatureType?: 'draw' | 'type' | 'upload'
}

const SIGNATURE_FONTS = [
  'Caveat',
  'Dancing Script', 
  'Great Vibes',
  'Kaushan Script',
  'Pacifico',
  'Sacramento'
]

export default function SignatureInput({ 
  onSignatureComplete, 
  onCancel,
  existingSignature,
  existingSignatureType = 'draw'
}: SignatureInputProps) {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState(existingSignatureType)
  const [hasDrawnSignature, setHasDrawnSignature] = useState(!!existingSignature && existingSignatureType === 'draw')
  const [typedText, setTypedText] = useState(existingSignatureType === 'type' ? 'John Doe' : '')
  const [selectedFont, setSelectedFont] = useState(SIGNATURE_FONTS[0])
  const [uploadedImage, setUploadedImage] = useState<string | null>(
    existingSignatureType === 'upload' ? existingSignature || null : null
  )
  const [canvasRef, setCanvasRef] = useState<SignatureCanvasRef | null>(null)

  // Handle drawing signature
  const handleDrawingComplete = useCallback(() => {
    if (canvasRef && hasDrawnSignature) {
      const dataUrl = canvasRef.getDataURL('image/png', 0.95)
      if (dataUrl) {
        onSignatureComplete(dataUrl, 'draw')
      }
    }
  }, [canvasRef, hasDrawnSignature, onSignatureComplete])

  // Handle typed signature
  const handleTypedSignature = useCallback(() => {
    if (!typedText.trim()) return

    // Create canvas for typed signature
    const canvas = document.createElement('canvas')
    canvas.width = 400
    canvas.height = 100
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      // Set font and styling
      ctx.font = `36px ${selectedFont}, cursive`
      ctx.fillStyle = '#000000'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      // Add background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Draw text
      ctx.fillStyle = '#000000'
      ctx.fillText(typedText, canvas.width / 2, canvas.height / 2)
      
      const dataUrl = canvas.toDataURL('image/png')
      onSignatureComplete(dataUrl, 'type')
    }
  }, [typedText, selectedFont, onSignatureComplete])

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setUploadedImage(dataUrl)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleUploadedSignature = useCallback(() => {
    if (uploadedImage) {
      onSignatureComplete(uploadedImage, 'upload')
    }
  }, [uploadedImage, onSignatureComplete])

  // Check if current tab has valid signature
  const hasValidSignature = () => {
    switch (activeTab) {
      case 'draw':
        return hasDrawnSignature
      case 'type':
        return typedText.trim().length > 0
      case 'upload':
        return !!uploadedImage
      default:
        return false
    }
  }

  const handleComplete = () => {
    switch (activeTab) {
      case 'draw':
        handleDrawingComplete()
        break
      case 'type':
        handleTypedSignature()
        break
      case 'upload':
        handleUploadedSignature()
        break
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab as any} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="draw">Draw</TabsTrigger>
          <TabsTrigger value="type">Type</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
        </TabsList>
        
        <TabsContent value="draw" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="border rounded-md p-2">
                <SignatureCanvas
                  ref={setCanvasRef}
                  width={500}
                  height={200}
                  onSignatureChange={setHasDrawnSignature}
                  existingSignature={activeTab === 'draw' ? existingSignature : undefined}
                  backgroundColor="white"
                />
              </div>
              <p className="text-sm text-muted-foreground text-center mt-2">
                {t('signature.instruction')}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="type" className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signature-text">Your Name</Label>
                <Input
                  id="signature-text"
                  value={typedText}
                  onChange={(e) => setTypedText(e.target.value)}
                  placeholder="Enter your full name"
                  className="text-lg"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signature-font">Font Style</Label>
                <Select value={selectedFont} onValueChange={setSelectedFont}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SIGNATURE_FONTS.map((font) => (
                      <SelectItem key={font} value={font}>
                        <span style={{ fontFamily: `${font}, cursive` }}>{font}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {typedText && (
                <div className="border rounded-md p-4 bg-white text-center">
                  <div
                    style={{ 
                      fontFamily: `${selectedFont}, cursive`,
                      fontSize: '36px',
                      color: '#000000'
                    }}
                  >
                    {typedText}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signature-upload">Upload Signature Image</Label>
                <Input
                  id="signature-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                />
                <p className="text-sm text-muted-foreground">
                  Supported formats: PNG, JPG, GIF. Max size: 5MB
                </p>
              </div>
              
              {uploadedImage && (
                <div className="border rounded-md p-4 bg-white text-center">
                  <img
                    src={uploadedImage}
                    alt="Uploaded signature"
                    className="max-w-full max-h-32 mx-auto"
                    style={{ objectFit: 'contain' }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-between gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        
        <Button 
          onClick={handleComplete} 
          disabled={!hasValidSignature()}
          className="min-w-24"
        >
          Complete
        </Button>
      </div>
    </div>
  )
}