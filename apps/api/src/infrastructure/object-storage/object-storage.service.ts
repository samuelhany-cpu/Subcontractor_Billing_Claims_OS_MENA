import {
  DeleteObjectCommand,
  GetObjectCommand,
  GetObjectOutput,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { InfrastructureDependencyError } from '../infrastructure-error';

export const OBJECT_STORAGE_CLIENT = Symbol('OBJECT_STORAGE_CLIENT');
export const OBJECT_STORAGE_SIGNER = Symbol('OBJECT_STORAGE_SIGNER');
export const OBJECT_STORAGE_BUCKET = Symbol('OBJECT_STORAGE_BUCKET');

export type ObjectStorageSigner = (
  client: S3Client,
  command: GetObjectCommand,
  options: { readonly expiresIn: number },
) => Promise<string>;

export interface PutPrivateObjectInput {
  readonly namespace: string;
  readonly body: string | Uint8Array;
  readonly contentType: string;
}

export interface PrivateObjectStorage {
  checkReadiness(): Promise<void>;
  putPrivateObject(input: PutPrivateObjectInput): Promise<string>;
  getPrivateObject(objectKey: string): Promise<GetObjectOutput['Body']>;
  deletePrivateObject(objectKey: string): Promise<void>;
  createSignedReadUrl(
    objectKey: string,
    expiresInSeconds: number,
  ): Promise<string>;
}

@Injectable()
export class ObjectStorageService implements PrivateObjectStorage {
  constructor(
    private readonly client: S3Client,
    private readonly bucket: string,
    private readonly signer: ObjectStorageSigner = getSignedUrl,
  ) {}

  async checkReadiness(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      throw new InfrastructureDependencyError('object-storage');
    }
  }

  async putPrivateObject(input: PutPrivateObjectInput): Promise<string> {
    const namespace = this.normalizeNamespace(input.namespace);
    const objectKey = `${namespace}/${randomUUID()}`;

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: objectKey,
          Body: input.body,
          ContentType: input.contentType,
        }),
      );
    } catch {
      throw new InfrastructureDependencyError('object-storage');
    }

    return objectKey;
  }

  async getPrivateObject(objectKey: string): Promise<GetObjectOutput['Body']> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: objectKey,
        }),
      );
      return response.Body;
    } catch {
      throw new InfrastructureDependencyError('object-storage');
    }
  }

  async deletePrivateObject(objectKey: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: objectKey,
        }),
      );
    } catch {
      throw new InfrastructureDependencyError('object-storage');
    }
  }

  async createSignedReadUrl(
    objectKey: string,
    expiresInSeconds: number,
  ): Promise<string> {
    if (
      !Number.isInteger(expiresInSeconds) ||
      expiresInSeconds < 1 ||
      expiresInSeconds > 900
    ) {
      throw new RangeError(
        'Signed URL expiry must be between 1 and 900 seconds',
      );
    }

    try {
      return await this.signer(
        this.client,
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: objectKey,
        }),
        { expiresIn: expiresInSeconds },
      );
    } catch {
      throw new InfrastructureDependencyError('object-storage');
    }
  }

  private normalizeNamespace(namespace: string): string {
    const normalized = namespace
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9/-]+/g, '-')
      .replace(/\/+/g, '/')
      .replace(/^\/|\/$/g, '');

    if (normalized.length === 0 || normalized.includes('..')) {
      throw new Error('Object namespace is invalid');
    }

    return normalized;
  }
}
