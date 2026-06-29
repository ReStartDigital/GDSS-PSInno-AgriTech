import { type DataSource } from "typeorm";
import { User } from "../entities/User.js"
import { UserRole } from "../../common/constants/enums.js";
import logger from "../../common/utils/logger.js";

export async function run(dataSource: DataSource): Promise<void> {
    const userRepository = dataSource.getRepository(User);

    const count = await userRepository.count();

    if(count > 0){
        logger.warning("⚠️ Users table already has data. Skipping.");
        return;
    }

    logger.info("🚚 Seeding users...");
    const seedUsers = [
        userRepository.create({
            phone: "+233200000001",
            firstName: "Kwame",
            lastName: "Mensah",
            email: "kwame@agritech.com",
            role: UserRole.ADMIN,
            isActive: true,
        }),
        userRepository.create({
            phone: "+233200000002",
            firstName: "Ama",
            lastName: "Osei",
            email: "ama.agent@agritech.com",
            role: UserRole.AGENT,
            isActive: true,
        })
    ];
    await userRepository.save(seedUsers);
    logger.info("✅ Users seeded successfully!");
}