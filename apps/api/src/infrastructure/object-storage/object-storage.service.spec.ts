import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { InfrastructureDependencyError } from '../infrastructure-error';
import {
  ObjectStorageService,
  ObjectStorageSigner,
} from './object-storage.service';

describe('ObjectStorageService', () => {
  function createFixture() {
    const send = jest
      .fn<Promise<Record<string, never>>, [unknown]>()
      .mockResolvedValue({});
    const destroy = jest.fn();
    const client = { destroy, send } as unknown as S3Client;
    const signer = jest
      .fn<ReturnType<ObjectStorageSigner>, Parameters<ObjectStorageSigner>>()
      .mockResolvedValue(
        'https://signed.example.test/object?signature=redacted',
      );
    const service = new ObjectStorageService(
      client,
      'claims-private-test',
      signer,
    );

    return { destroy, send, signer, service };
  }

  it('checks private bucket availability', async () => {
    const { send, service } = createFixture();

    await service.checkReadiness();

    expect(send.mock.calls[0]?.[0]).toBeInstanceOf(HeadBucketCommand);
  });

  it('generates server-controlled object keys for uploads', async () => {
    const { send, service } = createFixture();

    const objectKey = await service.putPrivateObject({
      namespace: 'Tenant Evidence',
      body: 'test content',
      contentType: 'text/plain',
    });

    expect(objectKey).toMatch(
      /^tenant-evidence\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    const command = send.mock.calls[0]?.[0];
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect((command as PutObjectCommand).input).toMatchObject({
      Bucket: 'claims-private-test',
      Key: objectKey,
      ContentType: 'text/plain',
    });
  });

  it('supports private reads, deletion, and short-lived signed reads', async () => {
    const { send, signer, service } = createFixture();

    await service.getPrivateObject('tenant/object-id');
    await service.deletePrivateObject('tenant/object-id');
    const signedUrl = await service.createSignedReadUrl('tenant/object-id', 60);

    expect(send.mock.calls[0]?.[0]).toBeInstanceOf(GetObjectCommand);
    expect(send.mock.calls[1]?.[0]).toBeInstanceOf(DeleteObjectCommand);
    expect(signer).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(GetObjectCommand),
      { expiresIn: 60 },
    );
    expect(signedUrl).toContain('https://signed.example.test/');
  });

  it('rejects invalid signed URL durations', async () => {
    const { service } = createFixture();

    await expect(
      service.createSignedReadUrl('tenant/object-id', 901),
    ).rejects.toThrow(RangeError);
  });

  it('translates provider errors without leaking provider details', async () => {
    const { send, service } = createFixture();
    send.mockRejectedValueOnce(
      new Error('access key claims_local_minio is invalid'),
    );

    await expect(service.checkReadiness()).rejects.toEqual(
      new InfrastructureDependencyError('object-storage'),
    );
  });

  it('releases the S3 client during application shutdown', () => {
    const { destroy, service } = createFixture();

    service.onApplicationShutdown();

    expect(destroy).toHaveBeenCalledTimes(1);
  });
});
