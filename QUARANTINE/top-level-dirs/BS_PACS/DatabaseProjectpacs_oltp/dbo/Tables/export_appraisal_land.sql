CREATE TABLE [dbo].[export_appraisal_land] (
    [prop_id]             INT              NOT NULL,
    [prop_val_yr]         NUMERIC (4)      NOT NULL,
    [sup_num]             INT              NOT NULL,
    [land_seg_id]         INT              NOT NULL,
    [land_type_cd]        VARCHAR (10)     NULL,
    [land_type_desc]      VARCHAR (50)     NULL,
    [state_cd]            VARCHAR (5)      NULL,
    [land_seg_homesite]   CHAR (1)         NULL,
    [size_acres]          NUMERIC (18, 4)  NULL,
    [size_square_feet]    NUMERIC (18, 2)  NULL,
    [effective_front]     NUMERIC (18, 2)  NULL,
    [effective_depth]     NUMERIC (18, 2)  NULL,
    [mkt_ls_method]       VARCHAR (5)      NULL,
    [mkt_ls_class]        VARCHAR (25)     NULL,
    [land_seg_mkt_val]    NUMERIC (14)     NULL,
    [ag_apply]            CHAR (1)         NULL,
    [ag_ls_method]        VARCHAR (5)      NULL,
    [ag_ls_class]         VARCHAR (25)     NULL,
    [ag_value]            NUMERIC (14)     NULL,
    [land_homesite_pct]   NUMERIC (13, 10) NULL,
    [land_primary_use_cd] VARCHAR (10)     NULL,
    [land_soil_type_cd]   VARCHAR (10)     NULL,
    [land_cu_use_cd]      VARCHAR (10)     NULL,
    [land_cu_sub_use_cd]  VARCHAR (10)     NULL,
    [dataset_id]          INT              NOT NULL,
    [segment_number]      INT              NULL,
    CONSTRAINT [cpk_export_appraisal_land] PRIMARY KEY CLUSTERED ([dataset_id] ASC, [prop_id] ASC, [prop_val_yr] ASC, [sup_num] ASC, [land_seg_id] ASC)
);


GO

