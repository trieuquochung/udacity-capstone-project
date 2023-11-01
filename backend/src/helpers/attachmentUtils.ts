const ATTACHMENT_S3_BUCKET = process.env.ATTACHMENT_S3_BUCKET;
export class AttachmentUtils {
  constructor(
    private readonly attachment_s3_bucket_name = ATTACHMENT_S3_BUCKET
  ) { }

  getAttachmentUrl(todoId: string): string {
    return `https://${this.attachment_s3_bucket_name}.s3.amazoneaws.com/${todoId}`;
  }
}