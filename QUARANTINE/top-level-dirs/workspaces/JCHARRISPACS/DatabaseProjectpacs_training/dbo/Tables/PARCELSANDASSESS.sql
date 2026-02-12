CREATE TABLE [dbo].[PARCELSANDASSESS] (
    [OBJECTID]          INT              IDENTITY (1, 1) NOT NULL,
    [Shape]             [sys].[geometry] NULL,
    [Parcel_ID]         NVARCHAR (15)    NULL,
    [Prop_ID]           INT              NULL,
    [CENTROID_X]        NUMERIC (38, 8)  NULL,
    [CENTROID_Y]        NUMERIC (38, 8)  NULL,
    [owner_name]        NVARCHAR (70)    NULL,
    [prop_id_1]         INT              NULL,
    [geo_id]            NVARCHAR (50)    NULL,
    [legal_desc]        NVARCHAR (255)   NULL,
    [owner_address]     NVARCHAR (296)   NULL,
    [situs_address]     NVARCHAR (123)   NULL,
    [tax_code_area]     NVARCHAR (23)    NULL,
    [appraised_val]     NUMERIC (38, 8)  NULL,
    [neighborhood_name] NVARCHAR (100)   NULL,
    [neighborhood_code] NVARCHAR (10)    NULL,
    [legal_acres]       NUMERIC (38, 8)  NULL,
    [year_blt]          SMALLINT         NULL,
    [primary_use]       NVARCHAR (10)    NULL,
    [cycle]             INT              NULL,
    PRIMARY KEY CLUSTERED ([OBJECTID] ASC)
);


GO

CREATE SPATIAL INDEX [FDO_Shape]
    ON [dbo].[PARCELSANDASSESS] ([Shape])
    WITH  (
            BOUNDING_BOX = (XMAX = 120779100, XMIN = -117498300, YMAX = 98059600, YMIN = -98850300),
            CELLS_PER_OBJECT = 16
          );


GO

