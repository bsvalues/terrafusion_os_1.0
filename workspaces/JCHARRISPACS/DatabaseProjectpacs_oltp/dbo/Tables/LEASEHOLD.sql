CREATE TABLE [dbo].[LEASEHOLD] (
    [OBJECTID]   INT              IDENTITY (1, 1) NOT NULL,
    [Shape]      [sys].[geometry] NULL,
    [Join_Count] INT              NULL,
    [TARGET_FID] INT              NULL,
    [JOIN_FID]   INT              NULL,
    [PIN]        NVARCHAR (15)    NULL,
    [created_us] NVARCHAR (254)   NULL,
    [created_da] DATETIME2 (7)    NULL,
    [last_edite] NVARCHAR (254)   NULL,
    [last_edi_1] DATETIME2 (7)    NULL,
    [Parcel_ID]  NVARCHAR (15)    NULL,
    [Prop_ID]    INT              NULL,
    [CENTROID_X] NUMERIC (38, 8)  NULL,
    [CENTROID_Y] NUMERIC (38, 8)  NULL,
    [owner_name] NVARCHAR (70)    NULL,
    [prop_id_1]  INT              NULL,
    [geo_id]     NVARCHAR (50)    NULL,
    [legal_desc] NVARCHAR (254)   NULL,
    [owner_addr] NVARCHAR (254)   NULL,
    [situs_addr] NVARCHAR (123)   NULL,
    [tax_code_a] NVARCHAR (23)    NULL,
    [appraised_] NUMERIC (38, 8)  NULL,
    [neighborho] NVARCHAR (100)   NULL,
    [neighbor_1] NVARCHAR (10)    NULL,
    [legal_acre] NUMERIC (38, 8)  NULL,
    [year_blt]   INT              NULL,
    [primary_us] NVARCHAR (10)    NULL,
    [cycle]      INT              NULL,
    PRIMARY KEY CLUSTERED ([OBJECTID] ASC)
);


GO

CREATE SPATIAL INDEX [FDO_Shape]
    ON [dbo].[LEASEHOLD] ([Shape])
    WITH  (
            BOUNDING_BOX = (XMAX = 120779100, XMIN = -117498300, YMAX = 98059600, YMIN = -98850300),
            CELLS_PER_OBJECT = 16
          );


GO

