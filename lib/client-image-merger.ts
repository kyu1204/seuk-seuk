"use client"

interface MergeImageOptions {
  src: string
  x?: number
  y?: number
  width?: number
  height?: number
}

/**
 * A client-side utility to merge images using the browser's Canvas API
 * This is a fallback in case the merge-images library doesn't work
 */
export async function mergeImagesClient(images: MergeImageOptions[]): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      if (!images || images.length === 0) {
        reject(new Error("No images to merge"))
        return
      }

      // Create a canvas element
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        reject(new Error("Could not get canvas context"))
        return
      }

      // Load the first image to set canvas dimensions
      const firstImage = new Image()
      firstImage.crossOrigin = "anonymous"

      firstImage.onload = async () => {
        // Set canvas dimensions based on the first image
        canvas.width = firstImage.width
        canvas.height = firstImage.height

        // Draw the first image
        ctx.drawImage(firstImage, 0, 0)

        // Draw the rest of the images
        for (let i = 1; i < images.length; i++) {
          const img = new Image()
          img.crossOrigin = "anonymous"

          await new Promise<void>((imgResolve, imgReject) => {
            img.onload = () => {
              const { x = 0, y = 0, width, height } = images[i]

              if (width && height) {
                ctx.drawImage(img, x, y, width, height)
              } else {
                ctx.drawImage(img, x, y)
              }

              imgResolve()
            }

            img.onerror = () => {
              console.error(`Failed to load image at index ${i}`)
              imgReject(new Error(`Failed to load image at index ${i}`))
            }

            img.src = images[i].src
          })
        }

        // Convert canvas to data URL
        const dataUrl = canvas.toDataURL("image/png")
        resolve(dataUrl)
      }

      firstImage.onerror = () => {
        reject(new Error("Failed to load the first image"))
      }

      firstImage.src = images[0].src
    } catch (error) {
      reject(error)
    }
  })
}

