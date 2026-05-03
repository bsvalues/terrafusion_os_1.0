-- Fix ComparableSales table: add columns missing due to EnsureCreated pre-migration gap
-- From AddComparableSaleRawPacsCodes (20260403233438)
ALTER TABLE "ComparableSales" ADD COLUMN "PacsChgOfOwnerId" INTEGER NULL;
ALTER TABLE "ComparableSales" ADD COLUMN "ExciseNumber" INTEGER NULL;
ALTER TABLE "ComparableSales" ADD COLUMN "RawSaleQualifier" TEXT NULL;
ALTER TABLE "ComparableSales" ADD COLUMN "RawCountyRatioCd" TEXT NULL;
ALTER TABLE "ComparableSales" ADD COLUMN "RawRatioTypeCd" TEXT NULL;
ALTER TABLE "ComparableSales" ADD COLUMN "RawRatioCd" TEXT NULL;
ALTER TABLE "ComparableSales" ADD COLUMN "RawRatioCdReason" TEXT NULL;
ALTER TABLE "ComparableSales" ADD COLUMN "RawExcludeCalcCd" TEXT NULL;
ALTER TABLE "ComparableSales" ADD COLUMN "RawWacCd" TEXT NULL;
ALTER TABLE "ComparableSales" ADD COLUMN "AdjustedSalePrice" decimal(18,2) NULL;
ALTER TABLE "ComparableSales" ADD COLUMN "SaleAdjustmentAmount" decimal(18,2) NULL;
ALTER TABLE "ComparableSales" ADD COLUMN "RawAdjReason" TEXT NULL;
ALTER TABLE "ComparableSales" ADD COLUMN "RawAdjCode" TEXT NULL;
ALTER TABLE "ComparableSales" ADD COLUMN "SaleExemptionAmount" decimal(18,2) NULL;
ALTER TABLE "ComparableSales" ADD COLUMN "PacsComputedRatio" decimal(18,2) NULL;
ALTER TABLE "ComparableSales" ADD COLUMN "RawSaleTypeCode" TEXT NULL;
ALTER TABLE "ComparableSales" ADD COLUMN "RawFinancingCode" TEXT NULL;
ALTER TABLE "ComparableSales" ADD COLUMN "SuppressOnRatioRptCd" TEXT NULL;
ALTER TABLE "ComparableSales" ADD COLUMN "SuppressOnRatioReason" TEXT NULL;
ALTER TABLE "ComparableSales" ADD COLUMN "IncludeNoCalc" INTEGER NULL;
ALTER TABLE "ComparableSales" ADD COLUMN "LandOnlySale" INTEGER NULL;
ALTER TABLE "ComparableSales" ADD COLUMN "ContinueCurrentUse" INTEGER NULL;
ALTER TABLE "ComparableSales" ADD COLUMN "SalesYear" INTEGER NULL;
ALTER TABLE "ComparableSales" ADD COLUMN "SlLivingArea" decimal(18,2) NULL;
ALTER TABLE "ComparableSales" ADD COLUMN "SlYearBuilt" INTEGER NULL;
ALTER TABLE "ComparableSales" ADD COLUMN "SlLandAcres" decimal(10,4) NULL;
ALTER TABLE "ComparableSales" ADD COLUMN "SlLandSqft" decimal(10,4) NULL;
ALTER TABLE "ComparableSales" ADD COLUMN "RawComment" TEXT NULL;
-- From RefactorQualification3Layer (20260404052159)
ALTER TABLE "ComparableSales" ADD COLUMN "QualificationRecommendation" TEXT NULL;
ALTER TABLE "ComparableSales" ADD COLUMN "RecommendationReason" TEXT NULL;
ALTER TABLE "ComparableSales" ADD COLUMN "RecommendationSource" TEXT NULL;
ALTER TABLE "ComparableSales" ADD COLUMN "RecommendationVersion" TEXT NULL;
ALTER TABLE "ComparableSales" ADD COLUMN "QualificationDecision" TEXT NULL;
ALTER TABLE "ComparableSales" ADD COLUMN "DecisionReason" TEXT NULL;
ALTER TABLE "ComparableSales" ADD COLUMN "DecisionBy" TEXT NULL;
ALTER TABLE "ComparableSales" ADD COLUMN "DecisionAt" TEXT NULL;
ALTER TABLE "ComparableSales" ADD COLUMN "DecisionSource" TEXT NULL;
-- From R2Wave41_ComparableSale_QualityImprvType (20260404160600)
ALTER TABLE "ComparableSales" ADD COLUMN "ImprvTypeCode" TEXT NULL;
