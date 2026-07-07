import { DataSource, Repository } from "typeorm";
import { OrderEntity } from "../../database/entities/Order.js";
import { OrderStatus } from "../../common/constants/roles.enums.js";

export class OrdersRepository {
  private repo: Repository<OrderEntity>;

  constructor(private dataSource: DataSource) {
    this.repo = this.dataSource.getRepository(OrderEntity);
  }

  async create(orderData: Partial<OrderEntity>): Promise<OrderEntity> {
    const order = this.repo.create(orderData);
    return this.repo.save(order);
  }

  async findById(id: string): Promise<OrderEntity | null> {
    return this.repo.findOne({
      where: { id },
      relations: {
        buyer: true,
        farmer: true,
        listing: true,
        packagingType: true,
      },
    });
  }

  async findByBuyer(
    buyerId: string,
    limit = 20,
    page = 1,
  ): Promise<[OrderEntity[], number]> {
    return this.repo.findAndCount({
      where: { buyerId },
      relations: { farmer: true, listing: true },
      order: { createdAt: "DESC" },
      take: limit,
      skip: (page - 1) * limit,
    });
  }

  async findByFarmer(
    farmerId: string,
    limit = 20,
    page = 1,
  ): Promise<[OrderEntity[], number]> {
    return this.repo.findAndCount({
      where: { farmerId },
      relations: { buyer: true, listing: true },
      order: { createdAt: "DESC" },
      take: limit,
      skip: (page - 1) * limit,
    });
  }

  async updateStatus(
    id: string,
    status: OrderStatus,
    additionalFields: Partial<OrderEntity> = {},
  ): Promise<void> {
    await this.repo.update(id, {
      status,
      ...additionalFields,
    });
  }
  /**
   * Fetches a paginated slice of orders contextually filtered by market role
   */
  async findAndCountByRole(
    userId: string,
    role: string,
    limit: number,
    offset: number
  ): Promise<{ orders: OrderEntity[]; total: number }> {
    // Determine column ownership based on role strategy
    const whereCondition = role === 'buyer' 
      ? { buyerId: userId } 
      : { farmerId: userId };

    const [orders, total] = await this.repo.findAndCount({
      where: whereCondition,
      relations: {listing:{farmer: true}}, // Include relational joins if needed for the dashboard
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { orders, total };
  }
  async findByShortIdAndFarmer(shortId: string, farmerId: string): Promise<OrderEntity | null> {
    return await this.repo.findOne({
      where: {
        id: shortId, // Swap for numeric short-code matching column if tracking via an incremental token sequence
        farmerId,
        status: OrderStatus.PENDING_SMS_CONFIRMATION
      }
    });
  }
}
