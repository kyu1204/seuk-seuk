"use server"

import { createCanvas, loadImage } from "canvas"

interface SignatureData {
  areaIndex: number
  signature: string
}

interface Area {
  x: number
  y: number
  width: number
  height: number
}

export async function generateSignedDocument(documentImage: string, signatures: SignatureData[], areas: Area[]) {
  try {
    // Instead of making a fetch request to our own API, let's process the image directly here
    // This eliminates potential network issues and simplifies the flow

    if (!documentImage) {
      throw new Error("Document image is required")
    }

    // Load the document image
    const docImage = await loadImage(documentImage)

    // Create a canvas with the same dimensions as the document
    const canvas = createCanvas(docImage.width, docImage.height)
    const ctx = canvas.getContext("2d")

    // Draw the document image
    ctx.drawImage(docImage, 0, 0)

    // Add each signature to the document
    if (signatures && signatures.length > 0 && areas) {
      for (const signature of signatures) {
        if (signature.areaIndex === undefined || !signature.signature) continue

        const area = areas[signature.areaIndex]
        if (!area) continue

        // Load and draw the signature
        try {
          const signatureImage = await loadImage(signature.signature)
          ctx.drawImage(signatureImage, area.x, area.y, area.width, area.height)
        } catch (err) {
          console.error("Error loading signature:", err)
          // Continue with other signatures even if one fails
        }
      }
    }

    // Convert canvas to data URL
    const dataUrl = canvas.toDataURL("image/png")

    return { success: true, signedDocument: dataUrl }
  } catch (error) {
    console.error("Error in server action:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate signed document",
    }
  }
}
// This file contains a server action for generating signed documents
// Since we're keeping the client-side document generation functionality,
// we can keep this file as it might be useful for future server-side processing
// No changes needed here

