import {
  AgreementInputSchema,
  AgreementRequest,
  AgreementResponse,
  CreatePayeeRequest,
  CreatePayeeSchema,
  PayeeDetailResponse,
  PayeeIdSchema,
  PayeeListQuery,
  PayeeListQuerySchema,
  PayeeResponse,
  ProjectIdSchema,
  UpdatePayeeRequest,
  UpdatePayeeSchema,
} from '@claims-os/domain';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CorrelationContext } from '../observability/correlation-context';
import { parsePayeeRequest } from './payee-errors';
import { PayeesService } from './payees.service';

@Controller('payees')
export class PayeesController {
  constructor(
    private readonly payees: PayeesService,
    private readonly correlation: CorrelationContext,
  ) {}

  @Get()
  list(
    @Query('status') status?: string,
    @Query('search') search?: string,
  ): Promise<readonly PayeeResponse[]> {
    return this.payees.list(
      parsePayeeRequest<PayeeListQuery>(PayeeListQuerySchema, {
        status: status ?? 'ACTIVE',
        ...(search === undefined ? {} : { search }),
      }),
    );
  }

  @Post()
  create(@Body() body: unknown): Promise<PayeeResponse> {
    return this.payees.create(
      parsePayeeRequest<CreatePayeeRequest>(CreatePayeeSchema, body),
      this.correlation.getCorrelationId(),
    );
  }

  @Get(':payeeId')
  get(@Param('payeeId') payeeId: string): Promise<PayeeDetailResponse> {
    return this.payees.get(parsePayeeRequest(PayeeIdSchema, payeeId));
  }

  @Patch(':payeeId')
  update(
    @Param('payeeId') payeeId: string,
    @Body() body: unknown,
  ): Promise<PayeeResponse> {
    return this.payees.update(
      parsePayeeRequest(PayeeIdSchema, payeeId),
      parsePayeeRequest<UpdatePayeeRequest>(UpdatePayeeSchema, body),
      this.correlation.getCorrelationId(),
    );
  }

  @Post(':payeeId/deactivate')
  @HttpCode(HttpStatus.OK)
  deactivate(@Param('payeeId') payeeId: string): Promise<PayeeResponse> {
    return this.payees.deactivate(
      parsePayeeRequest(PayeeIdSchema, payeeId),
      this.correlation.getCorrelationId(),
    );
  }

  @Post(':payeeId/reactivate')
  @HttpCode(HttpStatus.OK)
  reactivate(@Param('payeeId') payeeId: string): Promise<PayeeResponse> {
    return this.payees.reactivate(
      parsePayeeRequest(PayeeIdSchema, payeeId),
      this.correlation.getCorrelationId(),
    );
  }
}

@Controller('projects/:projectId/payees/:payeeId/agreement')
export class AgreementsController {
  constructor(
    private readonly payees: PayeesService,
    private readonly correlation: CorrelationContext,
  ) {}

  @Get()
  get(
    @Param('projectId') projectId: string,
    @Param('payeeId') payeeId: string,
  ): Promise<AgreementResponse> {
    return this.payees.getAgreement(
      parsePayeeRequest(ProjectIdSchema, projectId),
      parsePayeeRequest(PayeeIdSchema, payeeId),
    );
  }

  @Post()
  create(
    @Param('projectId') projectId: string,
    @Param('payeeId') payeeId: string,
    @Body() body: unknown,
  ): Promise<AgreementResponse> {
    return this.payees.createAgreement(
      parsePayeeRequest(ProjectIdSchema, projectId),
      parsePayeeRequest(PayeeIdSchema, payeeId),
      parsePayeeRequest<AgreementRequest>(AgreementInputSchema, body),
      this.correlation.getCorrelationId(),
    );
  }

  @Patch()
  update(
    @Param('projectId') projectId: string,
    @Param('payeeId') payeeId: string,
    @Body() body: unknown,
  ): Promise<AgreementResponse> {
    return this.payees.updateAgreement(
      parsePayeeRequest(ProjectIdSchema, projectId),
      parsePayeeRequest(PayeeIdSchema, payeeId),
      parsePayeeRequest<AgreementRequest>(AgreementInputSchema, body),
      this.correlation.getCorrelationId(),
    );
  }
}
