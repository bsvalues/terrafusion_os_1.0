CREATE TABLE [dbo].[sales_comp_score_land] (
    [lPacsUserID]      INT NOT NULL,
    [lSchool]          INT NOT NULL,
    [lCity]            INT NOT NULL,
    [lNeighborhood]    INT NOT NULL,
    [lAbsSubdv]        INT NOT NULL,
    [lState]           INT NOT NULL,
    [lLandType]        INT NOT NULL,
    [lLandAreaMax]     INT NOT NULL,
    [lLandAreaDec]     INT NOT NULL,
    [lLandAreaPer]     INT NOT NULL,
    [lZoning]          INT NOT NULL,
    [lSaleRatioCode]   INT NOT NULL,
    [lSaleDateMax]     INT NOT NULL,
    [lSaleDateDec]     INT NOT NULL,
    [lSaleDatePer]     INT NOT NULL,
    [lPrimaryZoning]   INT NULL,
    [lSecondaryZoning] INT NULL,
    [lTaxArea]         INT NULL,
    [lDistanceMax]     INT NULL,
    [lDistanceDec]     INT NULL,
    [lDistancePer]     INT NULL,
    CONSTRAINT [CPK_sales_comp_score_land] PRIMARY KEY CLUSTERED ([lPacsUserID] ASC) WITH (FILLFACTOR = 90)
);


GO

