type CloudinaryUploadResponse = {
  secure_url?: string
  public_id?: string
  error?: {
    message?: string
  }
}

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]

export function useImageUpload() {
  const config = useRuntimeConfig()

  function getCloudinaryCloudName() {
    return String(config.public.cloudinaryCloudName || '')
  }

  function getCloudinaryUploadPreset() {
    return String(config.public.cloudinaryUploadPreset || '')
  }

  function validateImageFile(file: File) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error('Use uma imagem JPG, PNG ou WEBP.')
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new Error('A imagem deve ter no máximo 5MB.')
    }
  }

  function isCloudinaryImageUrl(url: string | null | undefined): boolean {
    if (!url) return false

    const cloudName = getCloudinaryCloudName()

    if (!cloudName) return false

    try {
      const parsed = new URL(url)

      return (
        parsed.protocol === 'https:' &&
        parsed.hostname === 'res.cloudinary.com' &&
        parsed.pathname.startsWith(`/${cloudName}/image/upload/`)
      )
    } catch {
      return false
    }
  }

  async function uploadImage(file: File): Promise<string> {
    validateImageFile(file)

    const cloudName = getCloudinaryCloudName()
    const uploadPreset = getCloudinaryUploadPreset()

    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary não configurado. Verifique as variáveis de ambiente.')
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', uploadPreset)

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    )

    const data = await response.json() as CloudinaryUploadResponse

    if (!response.ok) {
      throw new Error(data.error?.message || 'Erro ao enviar imagem.')
    }

    if (!data.secure_url) {
      throw new Error('Cloudinary não retornou uma URL válida.')
    }

    if (!isCloudinaryImageUrl(data.secure_url)) {
      throw new Error('O Cloudinary retornou uma URL inesperada.')
    }

    return data.secure_url
  }

  return {
    uploadImage,
    validateImageFile,
    isCloudinaryImageUrl,
  }
}