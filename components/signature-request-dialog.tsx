"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, Mail, User, Shield, Clock, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/contexts/language-context"
import { createDocumentShare } from "@/app/actions/document"
import { Tables } from "@/lib/database-types"

type Document = Tables<'documents'>

interface SignatureRequestDialogProps {
  isOpen: boolean
  onClose: () => void
  document: Document
  signatureAreas: Array<{ x: number; y: number; width: number; height: number }>
}

interface Recipient {
  id: string
  name: string
  email: string
  assignedAreaIndex?: number
}

export default function SignatureRequestDialog({
  isOpen,
  onClose,
  document,
  signatureAreas
}: SignatureRequestDialogProps) {
  const { t } = useLanguage()
  const router = useRouter()
  
  // Form states
  const [recipients, setRecipients] = useState<Recipient[]>([
    { id: '1', name: '', email: '', assignedAreaIndex: undefined }
  ])
  const [enablePassword, setEnablePassword] = useState<boolean>(false)
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [expiryDays, setExpiryDays] = useState<number>(30)
  const [maxUses, setMaxUses] = useState<number | undefined>(undefined)
  const [isCreating, setIsCreating] = useState<boolean>(false)

  const addRecipient = () => {
    const newRecipient: Recipient = {
      id: Date.now().toString(),
      name: '',
      email: '',
      assignedAreaIndex: undefined
    }
    setRecipients([...recipients, newRecipient])
  }

  const removeRecipient = (id: string) => {
    if (recipients.length <= 1) return // Keep at least one recipient
    setRecipients(recipients.filter(r => r.id !== id))
  }

  const updateRecipient = (id: string, field: keyof Recipient, value: string | number | undefined) => {
    setRecipients(recipients.map(r => 
      r.id === id ? { ...r, [field]: value } : r
    ))
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateForm = (): string | null => {
    // Check if all recipients have name and valid email
    for (const recipient of recipients) {
      if (!recipient.name.trim()) {
        return t("signatureRequest.validationError")
      }
      if (!recipient.email.trim() || !validateEmail(recipient.email)) {
        return t("signatureRequest.invalidEmail")
      }
    }

    // Check password if enabled
    if (enablePassword) {
      if (!password || !confirmPassword) {
        return t("signatureRequest.validationError")
      }
      if (password !== confirmPassword) {
        return t("signatureRequest.passwordMismatch")
      }
    }

    return null
  }

  const handleSubmit = async () => {
    console.log('🚀 [SignatureRequestDialog] handleSubmit 시작')
    
    const validationError = validateForm()
    if (validationError) {
      toast.error(validationError)
      return
    }

    setIsCreating(true)

    try {
      // Create document share with settings
      const shareOptions = {
        password: enablePassword ? password : undefined,
        expiresInDays: expiryDays,
        maxUses: maxUses
      }

      console.log('📞 [SignatureRequestDialog] createDocumentShare 호출:', {
        documentId: document.id,
        options: shareOptions
      })

      const result = await createDocumentShare(document.id, shareOptions)
      
      console.log('📊 [SignatureRequestDialog] createDocumentShare 결과:', result)

      if (result.success && result.data) {
        console.log('✅ [SignatureRequestDialog] 서명 링크 생성 성공:', result.data)
        toast.success(t("signatureRequest.success"))
        
        // Close dialog and redirect to signing page
        onClose()
        router.push(`/sign/${result.data}`)
      } else {
        console.error('❌ [SignatureRequestDialog] 서명 링크 생성 실패:', result.error)
        toast.error(result.error || t("signatureRequest.error"))
      }
    } catch (error) {
      console.error('❌ [SignatureRequestDialog] 예외 발생:', error)
      toast.error(t("signatureRequest.error"))
    } finally {
      setIsCreating(false)
    }
  }

  const handleCancel = () => {
    // Reset form states
    setRecipients([{ id: '1', name: '', email: '', assignedAreaIndex: undefined }])
    setEnablePassword(false)
    setPassword('')
    setConfirmPassword('')
    setExpiryDays(30)
    setMaxUses(undefined)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {t("signatureRequest.title")}
          </DialogTitle>
          <DialogDescription>
            {t("signatureRequest.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Recipients Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-4 w-4" />
                {t("signatureRequest.recipients")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recipients.map((recipient, index) => (
                <div key={recipient.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">서명자 {index + 1}</span>
                    {recipients.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeRecipient(recipient.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {t("signatureRequest.removeRecipient")}
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor={`name-${recipient.id}`}>
                        {t("signatureRequest.recipientName")}
                      </Label>
                      <Input
                        id={`name-${recipient.id}`}
                        value={recipient.name}
                        onChange={(e) => updateRecipient(recipient.id, 'name', e.target.value)}
                        placeholder={t("signatureRequest.recipientNamePlaceholder")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`email-${recipient.id}`}>
                        {t("signatureRequest.recipientEmail")}
                      </Label>
                      <Input
                        id={`email-${recipient.id}`}
                        type="email"
                        value={recipient.email}
                        onChange={(e) => updateRecipient(recipient.id, 'email', e.target.value)}
                        placeholder={t("signatureRequest.recipientEmailPlaceholder")}
                      />
                    </div>
                  </div>

                  {/* Signature Area Assignment */}
                  {signatureAreas.length > 0 && (
                    <div className="space-y-2">
                      <Label>{t("signatureRequest.assignToArea")}</Label>
                      <Select
                        value={recipient.assignedAreaIndex?.toString() || "unassigned"}
                        onValueChange={(value) => 
                          updateRecipient(recipient.id, 'assignedAreaIndex', 
                            value === "unassigned" ? undefined : parseInt(value)
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("signatureRequest.unassigned")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">{t("signatureRequest.unassigned")}</SelectItem>
                          {signatureAreas.map((_, areaIndex) => (
                            <SelectItem key={areaIndex} value={areaIndex.toString()}>
                              {t("upload.signature")} {areaIndex + 1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              ))}
              
              <Button
                variant="outline"
                onClick={addRecipient}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("signatureRequest.addRecipient")}
              </Button>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-4 w-4" />
                {t("signatureRequest.security")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>{t("signatureRequest.enablePassword")}</Label>
                </div>
                <Switch
                  checked={enablePassword}
                  onCheckedChange={setEnablePassword}
                />
              </div>
              
              {enablePassword && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="password">{t("signatureRequest.password")}</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t("signatureRequest.passwordPlaceholder")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t("signatureRequest.confirmPassword")}</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t("signatureRequest.confirmPasswordPlaceholder")}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expiry Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-4 w-4" />
                {t("signatureRequest.expiry")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="expiryDays">{t("signatureRequest.expiryDays")}</Label>
                  <Input
                    id="expiryDays"
                    type="number"
                    min="1"
                    max="365"
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(parseInt(e.target.value) || 30)}
                    placeholder={t("signatureRequest.expiryDaysPlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxUses">{t("signatureRequest.maxUses")}</Label>
                  <Input
                    id="maxUses"
                    type="number"
                    min="1"
                    value={maxUses || ''}
                    onChange={(e) => setMaxUses(e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder={t("signatureRequest.maxUsesPlaceholder")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isCreating}>
            {t("signatureRequest.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isCreating}>
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isCreating ? t("signatureRequest.creating") : t("signatureRequest.generateLink")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}