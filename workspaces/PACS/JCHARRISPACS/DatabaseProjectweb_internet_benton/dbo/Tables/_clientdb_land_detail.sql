CREATE TABLE [dbo].[_clientdb_land_detail] (
    [prop_id]          INT             NOT NULL,
    [prop_val_yr]      NUMERIC (4)     NOT NULL,
    [land_seg_id]      INT             NOT NULL,
    [land_type_cd]     CHAR (10)       NOT NULL,
    [land_type_desc]   VARCHAR (50)    NULL,
    [size_acres]       NUMERIC (18, 4) NULL,
    [size_square_feet] NUMERIC (18, 2) NULL,
    [effective_front]  NUMERIC (18, 2) NULL,
    [effective_depth]  NUMERIC (18, 2) NULL,
    [land_seg_mkt_val] NUMERIC (14)    NOT NULL,
    [ag_val]           NUMERIC (14)    NOT NULL,
    [num_lots]         NUMERIC (9, 2)  NULL,
    [show_values]      VARCHAR (1)     NOT NULL
);


GO

CREATE CLUSTERED INDEX [IX__clientdb_land_detail]
    ON [dbo].[_clientdb_land_detail]([prop_val_yr] ASC, [prop_id] ASC);


GO

