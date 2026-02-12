CREATE TABLE [dbo].[comp_sales_corp_score] (
    [lPacsUserID]          INT NOT NULL,
    [lAge]                 INT NOT NULL,
    [lBldgSize]            INT NOT NULL,
    [lCVA]                 INT NOT NULL,
    [lLandSize]            INT NOT NULL,
    [lLocation]            INT NOT NULL,
    [lTimeSale]            INT NOT NULL,
    [lQuality]             INT NOT NULL,
    [lRegion]              INT NOT NULL,
    [lAbstractSubdivision] INT NOT NULL,
    [lNeighborhood]        INT NOT NULL,
    [lSubset]              INT NOT NULL,
    [lSchool]              INT NOT NULL,
    [lCity]                INT NOT NULL,
    [lStateCode]           INT NOT NULL,
    [lNRA]                 INT NOT NULL,
    [lPrimaryUse]          INT NULL,
    [lSecondaryUse]        INT NULL,
    [lTaxArea]             INT NULL,
    [lSubClassMax]         INT NULL,
    [lSubClassDec]         INT NULL,
    [lSubClassPer]         INT NULL,
    [lDistanceMax]         INT NULL,
    [lDistanceDec]         INT NULL,
    [lDistancePer]         INT NULL,
    [lActualYearMax]       INT NULL,
    [lActualYearDec]       INT NULL,
    [lActualYearPer]       INT NULL,
    [lSaleMonthsMax]       INT NULL,
    [lSaleMonthsDec]       INT NULL,
    [lSaleMonthsPer]       INT NULL,
    CONSTRAINT [CPK_comp_sales_corp_score] PRIMARY KEY CLUSTERED ([lPacsUserID] ASC) WITH (FILLFACTOR = 100)
);


GO

