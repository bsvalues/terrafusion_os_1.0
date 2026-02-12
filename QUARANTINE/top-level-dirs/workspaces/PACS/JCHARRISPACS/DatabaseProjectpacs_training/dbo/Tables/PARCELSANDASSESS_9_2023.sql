CREATE TABLE [dbo].[PARCELSANDASSESS_9_2023] (
    [OBJECTID]          INT              IDENTITY (1, 1) NOT NULL,
    [Shape]             [sys].[geometry] NULL,
    [Parcel_ID]         NVARCHAR (15)    NULL,
    [Prop_ID]           INT              NULL,
    [CENTROID_X]        NUMERIC (38, 8)  NULL,
    [CENTROID_Y]        NUMERIC (38, 8)  NULL,
    [Image]             NVARCHAR (100)   NULL,
    [Sketch]            NVARCHAR (50)    NULL,
    [owner_name]        NVARCHAR (70)    NULL,
    [prop_id_1]         INT              NULL,
    [geo_id]            NVARCHAR (50)    NULL,
    [legal_desc]        NVARCHAR (255)   NULL,
    [owner_address]     NVARCHAR (296)   NULL,
    [situs_address]     NVARCHAR (173)   NULL,
    [tax_code_area]     NVARCHAR (23)    NULL,
    [ImpVal]            NUMERIC (38, 8)  NULL,
    [LandVal]           NUMERIC (38, 8)  NULL,
    [MarketValue]       NUMERIC (38, 8)  NULL,
    [appraised_val]     NUMERIC (38, 8)  NULL,
    [ag_use_val]        NUMERIC (38, 8)  NULL,
    [neighborhood_name] NVARCHAR (100)   NULL,
    [neighborhood_code] NVARCHAR (10)    NULL,
    [legal_acres]       NUMERIC (38, 8)  NULL,
    [land_sqft]         NUMERIC (38, 8)  NULL,
    [year_blt]          SMALLINT         NULL,
    [primary_use]       NVARCHAR (10)    NULL,
    [cycle]             INT              NULL,
    [Base_Corrected]    NVARCHAR (20)    NULL,
    [DocNumber]         NVARCHAR (255)   NULL,
    [ImagePar]          NVARCHAR (50)    NULL,
    [SketchPar]         NVARCHAR (50)    NULL,
    PRIMARY KEY CLUSTERED ([OBJECTID] ASC)
);


GO

