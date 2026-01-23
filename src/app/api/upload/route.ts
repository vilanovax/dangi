import { NextRequest, NextResponse } from 'next/server'
import { uploadFile } from '@/lib/services/storage.service'

/**
 * Upload file to S3-compatible storage
 *
 * Supports images (JPEG, PNG, WebP) up to 10MB.
 * Returns the public URL of the uploaded file.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folder = (formData.get('folder') as string) || 'receipts'

    if (!file) {
      return NextResponse.json({ error: 'فایلی انتخاب نشده' }, { status: 400 })
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to S3
    const result = await uploadFile(buffer, file.name, file.type, folder)

    return NextResponse.json(
      {
        url: result.url,
        key: result.key,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error uploading file:', error)
    const message = error instanceof Error ? error.message : 'خطا در آپلود فایل'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
