import { SelectQueryBuilder, type ObjectLiteral } from "typeorm";

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function paginate<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  { page, limit }: PaginationParams,
): Promise<PaginatedResult<T>> {
  const [data, total] = await qb
    .skip((page - 1) * limit)
    .take(limit)
    .getManyAndCount();

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
