import type { Request, Response } from 'express';
import { listingsService } from './listings.service.js';
import { sendSuccess } from '../../common/dto/api-response.dto.js';
import { UnprocessableException } from '../../common/exceptions/index.js';
import { ErrorCode } from '../../common/constants/error-codes.enum.js';
import { asyncHandler } from '../../common/utils/async-handler.util.js';
import type {
  CreateListingDto,
  UpdateListingDto,
  ListingsQueryDto,
  PackagingRecommendDto,
} from './listings.schema.js';

export class ListingsController {
  // Wrap all methods with asyncHandler
  browse = asyncHandler(async (req: Request, res: Response) => {
    const query = req.validatedData as ListingsQueryDto;
    const result = await listingsService.browse(query);
    sendSuccess(res, result);
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    if (!id) {
        throw new UnprocessableException('Listing ID is required', ErrorCode.VALIDATION_ERROR);
    }
    const listing = await listingsService.getById(id);
    sendSuccess(res, { listing });
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const dto = req.validatedData as CreateListingDto;
    const listing = await listingsService.create(req.user!, dto);
    sendSuccess(res, { listing }, 201);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const dto = req.validatedData as UpdateListingDto;
    const id = req.params.id as string;
    const listing = await listingsService.update(req.user!, id, dto);
    sendSuccess(res, { listing });
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await listingsService.remove(req.user!, id);
    sendSuccess(res, result);
  });

  uploadImage = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file?.buffer) {
      throw new UnprocessableException('No image file provided.', ErrorCode.VALIDATION_ERROR);
    }
    const result = await listingsService.uploadImage(req.user!, req.file.buffer);
    sendSuccess(res, result, 201);
  });

  recommendPackaging = asyncHandler(async (req: Request, res: Response) => {
    const query = req.validatedData as PackagingRecommendDto;
    const result = await listingsService.recommendPackaging(query);
    sendSuccess(res, result);
  });
}

export const listingsController = new ListingsController();