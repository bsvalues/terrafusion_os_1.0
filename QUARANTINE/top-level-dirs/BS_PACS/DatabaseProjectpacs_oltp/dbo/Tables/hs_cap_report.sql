CREATE TABLE [dbo].[hs_cap_report] (
    [entity_id]           INT          NOT NULL,
    [entity_cd]           CHAR (5)     NOT NULL,
    [entity_name]         VARCHAR (70) NULL,
    [prop_id]             INT          NOT NULL,
    [geo_id]              VARCHAR (50) NULL,
    [owner_name]          VARCHAR (70) NULL,
    [curr_land_hstd_val]  NUMERIC (14) NULL,
    [curr_imprv_hstd_val] NUMERIC (14) NULL,
    [prev_land_hstd_val]  NUMERIC (14) NULL,
    [prev_imprv_hstd_val] NUMERIC (14) NULL,
    [hs_cap_amount]       NUMERIC (14) NULL,
    [ten_percent_cap]     NUMERIC (14) NULL
);


GO

