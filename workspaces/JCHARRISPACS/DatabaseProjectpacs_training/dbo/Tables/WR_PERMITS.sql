CREATE TABLE [dbo].[WR_PERMITS] (
    [OBJECTID]             INT              IDENTITY (1, 1) NOT NULL,
    [Shape]                [sys].[geometry] NULL,
    [Parcel_ID]            NVARCHAR (15)    NULL,
    [Prop_ID]              INT              NULL,
    [CENTROID_X]           NUMERIC (38, 8)  NULL,
    [CENTROID_Y]           NUMERIC (38, 8)  NULL,
    [OBJECTID_]            INT              NULL,
    [PermitNo]             INT              NULL,
    [CustomerLastName]     NVARCHAR (MAX)   NULL,
    [CustomerFirstName]    NVARCHAR (MAX)   NULL,
    [ContractorLastName]   NVARCHAR (MAX)   NULL,
    [ServiceAddress]       NVARCHAR (MAX)   NULL,
    [LotOwnerName]         NVARCHAR (MAX)   NULL,
    [LotOwnerAddress]      NVARCHAR (MAX)   NULL,
    [TaxLot]               NVARCHAR (20)    NULL,
    [PermitType]           NVARCHAR (MAX)   NULL,
    [Description]          NVARCHAR (MAX)   NULL,
    [ProjectCost]          NUMERIC (38, 8)  NULL,
    [PermitStatus]         NVARCHAR (MAX)   NULL,
    [ORIG_FID]             INT              NULL,
    [DateIssued]           DATETIME2 (7)    NULL,
    [DateIssued_Converted] DATETIME2 (7)    NULL,
    PRIMARY KEY CLUSTERED ([OBJECTID] ASC)
);


GO

CREATE SPATIAL INDEX [FDO_Shape]
    ON [dbo].[WR_PERMITS] ([Shape])
    WITH  (
            BOUNDING_BOX = (XMAX = 120779100, XMIN = -117498300, YMAX = 98059600, YMIN = -98850300),
            CELLS_PER_OBJECT = 16
          );


GO

