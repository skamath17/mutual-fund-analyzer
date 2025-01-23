-- CreateTable
CREATE TABLE `FundHouse` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `website` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `FundHouse_name_key`(`name`),
    UNIQUE INDEX `FundHouse_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FundCategory` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `riskLevel` ENUM('VERY_LOW', 'LOW', 'MODERATE', 'HIGH', 'VERY_HIGH') NOT NULL DEFAULT 'MODERATE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `FundCategory_name_key`(`name`),
    UNIQUE INDEX `FundCategory_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TaxCategory` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `holdingPeriod` INTEGER NOT NULL,
    `taxRate` DECIMAL(5, 2) NULL,
    `hasIndexation` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TaxCategory_name_key`(`name`),
    UNIQUE INDEX `TaxCategory_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MutualFund` (
    `id` VARCHAR(191) NOT NULL,
    `schemeCode` VARCHAR(191) NOT NULL,
    `schemeName` VARCHAR(191) NOT NULL,
    `schemeType` VARCHAR(191) NOT NULL,
    `fundHouseId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `taxCategoryId` VARCHAR(191) NOT NULL,
    `isin` VARCHAR(191) NULL,
    `benchmark` VARCHAR(191) NULL,
    `expenseRatio` DECIMAL(5, 2) NULL,
    `minInvestment` DECIMAL(10, 2) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MutualFund_schemeCode_key`(`schemeCode`),
    INDEX `MutualFund_fundHouseId_idx`(`fundHouseId`),
    INDEX `MutualFund_categoryId_idx`(`categoryId`),
    INDEX `MutualFund_taxCategoryId_idx`(`taxCategoryId`),
    INDEX `MutualFund_schemeType_idx`(`schemeType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NAVHistory` (
    `id` VARCHAR(191) NOT NULL,
    `fundId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `nav` DECIMAL(10, 4) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `NAVHistory_fundId_date_idx`(`fundId`, `date`),
    UNIQUE INDEX `NAVHistory_fundId_date_key`(`fundId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarketIndex` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `indexType` ENUM('BROAD_BASED', 'SECTORAL', 'THEMATIC') NOT NULL DEFAULT 'BROAD_BASED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MarketIndex_name_key`(`name`),
    UNIQUE INDEX `MarketIndex_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IndexHistory` (
    `id` VARCHAR(191) NOT NULL,
    `indexId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `open` DECIMAL(10, 2) NOT NULL,
    `high` DECIMAL(10, 2) NOT NULL,
    `low` DECIMAL(10, 2) NOT NULL,
    `close` DECIMAL(10, 2) NOT NULL,
    `volume` BIGINT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `IndexHistory_indexId_date_idx`(`indexId`, `date`),
    UNIQUE INDEX `IndexHistory_indexId_date_key`(`indexId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Holding` (
    `id` VARCHAR(191) NOT NULL,
    `fundId` VARCHAR(191) NOT NULL,
    `companyName` VARCHAR(191) NOT NULL,
    `percentage` DECIMAL(5, 2) NOT NULL,
    `sector` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Holding_fundId_idx`(`fundId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Basket` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BasketAllocation` (
    `id` VARCHAR(191) NOT NULL,
    `basketId` VARCHAR(191) NOT NULL,
    `fundId` VARCHAR(191) NOT NULL,
    `allocation` DECIMAL(5, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `BasketAllocation_basketId_idx`(`basketId`),
    INDEX `BasketAllocation_fundId_idx`(`fundId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MutualFund` ADD CONSTRAINT `MutualFund_fundHouseId_fkey` FOREIGN KEY (`fundHouseId`) REFERENCES `FundHouse`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MutualFund` ADD CONSTRAINT `MutualFund_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `FundCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MutualFund` ADD CONSTRAINT `MutualFund_taxCategoryId_fkey` FOREIGN KEY (`taxCategoryId`) REFERENCES `TaxCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NAVHistory` ADD CONSTRAINT `NAVHistory_fundId_fkey` FOREIGN KEY (`fundId`) REFERENCES `MutualFund`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IndexHistory` ADD CONSTRAINT `IndexHistory_indexId_fkey` FOREIGN KEY (`indexId`) REFERENCES `MarketIndex`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Holding` ADD CONSTRAINT `Holding_fundId_fkey` FOREIGN KEY (`fundId`) REFERENCES `MutualFund`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BasketAllocation` ADD CONSTRAINT `BasketAllocation_basketId_fkey` FOREIGN KEY (`basketId`) REFERENCES `Basket`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BasketAllocation` ADD CONSTRAINT `BasketAllocation_fundId_fkey` FOREIGN KEY (`fundId`) REFERENCES `MutualFund`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

