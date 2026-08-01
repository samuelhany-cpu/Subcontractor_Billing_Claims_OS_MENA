import {
  CategoryIdSchema,
  CategoryResponse,
  ClassificationFilterSchema,
  CreateCategoryRequest,
  CreateCategorySchema,
  CreateSubcategoryRequest,
  CreateSubcategorySchema,
  RenameCategoryRequest,
  RenameCategorySchema,
  RenameSubcategoryRequest,
  RenameSubcategorySchema,
  ReorderClassificationsRequest,
  ReorderClassificationsSchema,
  SubcategoryIdSchema,
  SubcategoryResponse,
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
import { parseCategoryRequest } from './category-errors';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly categories: CategoriesService,
    private readonly correlation: CorrelationContext,
  ) {}

  @Get()
  list(@Query('status') status?: string): Promise<readonly CategoryResponse[]> {
    return this.categories.list(
      parseCategoryRequest(ClassificationFilterSchema, status ?? 'ACTIVE'),
    );
  }

  @Post()
  create(@Body() body: unknown): Promise<CategoryResponse> {
    return this.categories.createCategory(
      parseCategoryRequest<CreateCategoryRequest>(CreateCategorySchema, body),
      this.correlation.getCorrelationId(),
    );
  }

  @Post('reorder')
  @HttpCode(HttpStatus.OK)
  reorder(@Body() body: unknown): Promise<readonly CategoryResponse[]> {
    return this.categories.reorderCategories(
      parseCategoryRequest<ReorderClassificationsRequest>(
        ReorderClassificationsSchema,
        body,
      ),
      this.correlation.getCorrelationId(),
    );
  }

  @Patch(':categoryId')
  rename(
    @Param('categoryId') categoryId: string,
    @Body() body: unknown,
  ): Promise<CategoryResponse> {
    return this.categories.renameCategory(
      parseCategoryRequest(CategoryIdSchema, categoryId),
      parseCategoryRequest<RenameCategoryRequest>(RenameCategorySchema, body),
      this.correlation.getCorrelationId(),
    );
  }

  @Post(':categoryId/deactivate')
  @HttpCode(HttpStatus.OK)
  deactivate(@Param('categoryId') categoryId: string) {
    return this.categories.deactivateCategory(
      parseCategoryRequest(CategoryIdSchema, categoryId),
      this.correlation.getCorrelationId(),
    );
  }

  @Post(':categoryId/reactivate')
  @HttpCode(HttpStatus.OK)
  reactivate(@Param('categoryId') categoryId: string) {
    return this.categories.reactivateCategory(
      parseCategoryRequest(CategoryIdSchema, categoryId),
      this.correlation.getCorrelationId(),
    );
  }

  @Post(':categoryId/subcategories')
  createSubcategory(
    @Param('categoryId') categoryId: string,
    @Body() body: unknown,
  ): Promise<SubcategoryResponse> {
    return this.categories.createSubcategory(
      parseCategoryRequest(CategoryIdSchema, categoryId),
      parseCategoryRequest<CreateSubcategoryRequest>(
        CreateSubcategorySchema,
        body,
      ),
      this.correlation.getCorrelationId(),
    );
  }

  @Post(':categoryId/subcategories/reorder')
  @HttpCode(HttpStatus.OK)
  reorderSubcategories(
    @Param('categoryId') categoryId: string,
    @Body() body: unknown,
  ): Promise<readonly SubcategoryResponse[]> {
    return this.categories.reorderSubcategories(
      parseCategoryRequest(CategoryIdSchema, categoryId),
      parseCategoryRequest<ReorderClassificationsRequest>(
        ReorderClassificationsSchema,
        body,
      ),
      this.correlation.getCorrelationId(),
    );
  }
}

@Controller('subcategories')
export class SubcategoriesController {
  constructor(
    private readonly categories: CategoriesService,
    private readonly correlation: CorrelationContext,
  ) {}

  @Patch(':subcategoryId')
  rename(
    @Param('subcategoryId') subcategoryId: string,
    @Body() body: unknown,
  ): Promise<SubcategoryResponse> {
    return this.categories.renameSubcategory(
      parseCategoryRequest(SubcategoryIdSchema, subcategoryId),
      parseCategoryRequest<RenameSubcategoryRequest>(
        RenameSubcategorySchema,
        body,
      ),
      this.correlation.getCorrelationId(),
    );
  }

  @Post(':subcategoryId/deactivate')
  @HttpCode(HttpStatus.OK)
  deactivate(@Param('subcategoryId') subcategoryId: string) {
    return this.categories.deactivateSubcategory(
      parseCategoryRequest(SubcategoryIdSchema, subcategoryId),
      this.correlation.getCorrelationId(),
    );
  }

  @Post(':subcategoryId/reactivate')
  @HttpCode(HttpStatus.OK)
  reactivate(@Param('subcategoryId') subcategoryId: string) {
    return this.categories.reactivateSubcategory(
      parseCategoryRequest(SubcategoryIdSchema, subcategoryId),
      this.correlation.getCorrelationId(),
    );
  }
}
