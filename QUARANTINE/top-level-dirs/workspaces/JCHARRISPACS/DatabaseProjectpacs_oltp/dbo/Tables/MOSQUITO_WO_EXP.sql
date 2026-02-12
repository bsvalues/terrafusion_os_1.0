CREATE TABLE [dbo].[MOSQUITO_WO_EXP] (
    [OBJECTID_1]   INT             IDENTITY (1, 1) NOT NULL,
    [OBJECTID]     INT             NULL,
    [Parcel_ID]    NVARCHAR (15)   NULL,
    [Prop_ID]      INT             NULL,
    [CENTROID_X]   NUMERIC (38, 8) NULL,
    [CENTROID_Y]   NUMERIC (38, 8) NULL,
    [Image]        NVARCHAR (100)  NULL,
    [Sketch]       NVARCHAR (50)   NULL,
    [owner_name]   NVARCHAR (70)   NULL,
    [prop_id_1]    INT             NULL,
    [geo_id]       NVARCHAR (50)   NULL,
    [legal_desc]   NVARCHAR (254)  NULL,
    [owner_addr]   NVARCHAR (254)  NULL,
    [situs_addr]   NVARCHAR (123)  NULL,
    [tax_code_a]   NVARCHAR (23)   NULL,
    [ImpVal]       NUMERIC (38, 8) NULL,
    [LandVal]      NUMERIC (38, 8) NULL,
    [MarketValu]   NUMERIC (38, 8) NULL,
    [appraised_]   NUMERIC (38, 8) NULL,
    [ag_use_val]   NUMERIC (38, 8) NULL,
    [neighborho]   NVARCHAR (100)  NULL,
    [neighbor_1]   NVARCHAR (10)   NULL,
    [legal_acre]   NUMERIC (38, 8) NULL,
    [land_sqft]    NUMERIC (38, 8) NULL,
    [year_blt]     INT             NULL,
    [primary_us]   NVARCHAR (10)   NULL,
    [cycle]        INT             NULL,
    [Shape_Leng]   NUMERIC (38, 8) NULL,
    [Shape_Length] NUMERIC (38, 8) NULL,
    [Shape_Area]   NUMERIC (38, 8) NULL,
    PRIMARY KEY CLUSTERED ([OBJECTID_1] ASC)
);


GO

