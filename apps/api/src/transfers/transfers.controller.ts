import {
  CreateTransferRequest,
  CreateTransferSchema,
  TransferIdSchema,
  TransferListQuery,
  TransferListQuerySchema,
  TransferListResponse,
  TransferResponse,
  UpdateTransferRequest,
  UpdateTransferSchema,
} from '@claims-os/domain';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { parseRequest } from '../projects/project-errors';
import { TransfersService } from './transfers.service';

@Controller('transfers')
export class TransfersController {
  constructor(private readonly transfers: TransfersService) {}

  @Get()
  list(@Query() query: Record<string, unknown>): Promise<TransferListResponse> {
    return this.transfers.list(
      parseRequest<TransferListQuery>(TransferListQuerySchema, query),
    );
  }

  @Post()
  create(@Body() body: unknown): Promise<TransferResponse> {
    return this.transfers.create(
      parseRequest<CreateTransferRequest>(CreateTransferSchema, body),
    );
  }

  @Get(':transferId')
  get(@Param('transferId') transferId: string): Promise<TransferResponse> {
    return this.transfers.get(parseRequest(TransferIdSchema, transferId));
  }

  @Patch(':transferId')
  update(
    @Param('transferId') transferId: string,
    @Body() body: unknown,
  ): Promise<TransferResponse> {
    return this.transfers.update(
      parseRequest(TransferIdSchema, transferId),
      parseRequest<UpdateTransferRequest>(UpdateTransferSchema, body),
    );
  }

  @Post(':transferId/delete')
  delete(@Param('transferId') transferId: string): Promise<TransferResponse> {
    return this.transfers.delete(parseRequest(TransferIdSchema, transferId));
  }

  @Post(':transferId/restore')
  restore(@Param('transferId') transferId: string): Promise<TransferResponse> {
    return this.transfers.restore(parseRequest(TransferIdSchema, transferId));
  }
}
