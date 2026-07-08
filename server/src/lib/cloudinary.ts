import { HTTP, HttpStatus } from './http'

export const uploadToCloudinary = async (
  file: File,
  cloudName: string,
  uploadPreset: string
) => {
  try {
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`

    const form = new FormData()
    form.append('file', file)
    form.append('upload_preset', uploadPreset)

    const res = await fetch(url, {
      method: 'POST',
      body: form,
    })

    const body = await res.json()

    if (!res.ok) {
      throw HTTP.Error(
        HttpStatus.BAD_REQUEST,
        body?.error?.message ?? 'Cloudinary upload failed'
      )
    }

    return body
  } catch (error) {
    throw HTTP.Error(HttpStatus.BAD_REQUEST, 'Failed to upload on cloudinary')
  }
}
