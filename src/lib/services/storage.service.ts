/**
 * S3-compatible Storage Service
 *
 * Uses MinIO for local development and can switch to Liara/AWS in production.
 * Provides upload, delete, and presigned URL generation.
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Initialize S3 client with environment variables
const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || 'admin',
    secretAccessKey: process.env.S3_SECRET_KEY || 'password123',
  },
  forcePathStyle: true, // Required for MinIO
})

const BUCKET_NAME = process.env.S3_BUCKET || 'dangi'

// Flag to track if bucket has been checked/created
let bucketChecked = false

/**
 * Ensure the bucket exists, create if it doesn't
 */
async function ensureBucketExists(): Promise<void> {
  if (bucketChecked) return

  try {
    // Check if bucket exists
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }))
    bucketChecked = true
  } catch (error: unknown) {
    // Bucket doesn't exist, create it
    const err = error as { name?: string }
    if (err.name === 'NotFound' || err.name === 'NoSuchBucket') {
      try {
        await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }))

        // Set bucket policy to allow public read access
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: '*',
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
            },
          ],
        }

        await s3Client.send(
          new PutBucketPolicyCommand({
            Bucket: BUCKET_NAME,
            Policy: JSON.stringify(policy),
          })
        )

        bucketChecked = true
        console.log(`Bucket '${BUCKET_NAME}' created successfully`)
      } catch (createError) {
        console.error('Error creating bucket:', createError)
        throw new Error('خطا در ایجاد فضای ذخیره‌سازی')
      }
    } else {
      // Re-throw if it's a different error
      throw error
    }
  }
}

// Allowed file types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

/**
 * Generate a unique key for the file
 */
function generateFileKey(folder: string, originalName: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const ext = originalName.split('.').pop() || 'jpg'
  return `${folder}/${timestamp}-${random}.${ext}`
}

/**
 * Upload a file to S3
 */
export async function uploadFile(
  file: Buffer | Uint8Array,
  originalName: string,
  contentType: string,
  folder: string = 'receipts'
): Promise<{ key: string; url: string }> {
  // Validate file type
  if (!ALLOWED_TYPES.includes(contentType)) {
    throw new Error('نوع فایل مجاز نیست. فقط JPEG، PNG و WebP پشتیبانی می‌شود.')
  }

  // Validate file size
  if (file.length > MAX_FILE_SIZE) {
    throw new Error('حجم فایل بیشتر از ۱۰ مگابایت است.')
  }

  // Ensure bucket exists before uploading
  await ensureBucketExists()

  const key = generateFileKey(folder, originalName)

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
  })

  await s3Client.send(command)

  // Generate public URL
  const url = `${process.env.S3_ENDPOINT}/${BUCKET_NAME}/${key}`

  return { key, url }
}

/**
 * Delete a file from S3
 */
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  await s3Client.send(command)
}

/**
 * Generate a presigned URL for temporary access
 * Useful for private files
 */
export async function getPresignedUrl(
  key: string,
  expiresIn: number = 3600 // 1 hour
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  return getSignedUrl(s3Client, command, { expiresIn })
}

/**
 * Get public URL for a file
 */
export function getPublicUrl(key: string): string {
  return `${process.env.S3_ENDPOINT}/${BUCKET_NAME}/${key}`
}

/**
 * Extract key from full URL
 */
export function extractKeyFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const path = urlObj.pathname
    // Remove leading slash and bucket name
    const parts = path.split('/')
    if (parts.length > 2) {
      return parts.slice(2).join('/')
    }
    return null
  } catch {
    return null
  }
}
