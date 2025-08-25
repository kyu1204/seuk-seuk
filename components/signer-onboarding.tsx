"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import {
  CheckCircle,
  FileText,
  PenTool,
  Send,
  ArrowRight,
  X
} from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface SignerOnboardingProps {
  isOpen: boolean
  onClose: () => void
  onStart: () => void
  documentTitle: string
  totalSignatureAreas: number
}

export default function SignerOnboarding({
  isOpen,
  onClose,
  onStart,
  documentTitle,
  totalSignatureAreas
}: SignerOnboardingProps) {
  const { t } = useLanguage()
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      icon: FileText,
      title: t("signer.onboarding.step1.title"),
      description: t("signer.onboarding.step1.description"),
      detail: t("signer.onboarding.step1.detail")
    },
    {
      icon: PenTool,
      title: t("signer.onboarding.step2.title"),
      description: t("signer.onboarding.step2.description", { count: totalSignatureAreas }),
      detail: t("signer.onboarding.step2.detail")
    },
    {
      icon: Send,
      title: t("signer.onboarding.step3.title"),
      description: t("signer.onboarding.step3.description"),
      detail: t("signer.onboarding.step3.detail")
    }
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onStart()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={() => { }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">
              {t("signer.onboarding.title")}
            </DialogTitle>
          </div>
          <DialogDescription>
            {t("signer.onboarding.subtitle", { title: documentTitle })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center space-x-2">
            {steps.map((_, index) => (
              <div key={index} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${index <= currentStep
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                    }`}
                >
                  {index < currentStep ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 h-0.5 mx-2 transition-colors ${index < currentStep ? "bg-primary" : "bg-muted"
                      }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Current Step Content */}
          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  {React.createElement(steps[currentStep].icon, {
                    className: "w-8 h-8 text-primary"
                  })}
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    {steps[currentStep].title}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {steps[currentStep].description}
                  </p>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    💡 {steps[currentStep].detail}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              {t("common.previous")}
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={onClose}
              >
                {t("signer.onboarding.skipGuide")}
              </Button>

              <Button
                onClick={handleNext}
                className="gap-2"
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    {t("signer.onboarding.startSigning")}
                    <Send className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    {t("common.next")}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}