CREATE TABLE [dbo].[export_appraisal_imprv] (
    [prop_id]                INT              NOT NULL,
    [prop_val_yr]            NUMERIC (4)      NOT NULL,
    [imprv_id]               INT              NOT NULL,
    [sup_num]                INT              NOT NULL,
    [imprv_type_cd]          VARCHAR (5)      NULL,
    [imprv_type_desc]        VARCHAR (50)     NULL,
    [imprv_state_cd]         VARCHAR (5)      NULL,
    [imprv_homesite]         CHAR (1)         NULL,
    [imprv_val]              NUMERIC (14)     NULL,
    [imprv_homesite_pct]     NUMERIC (13, 10) NULL,
    [imprv_primary_use_cd]   VARCHAR (10)     NULL,
    [imprv_secondary_use_cd] VARCHAR (10)     NULL,
    [first_imprv_detail_id]  INT              NULL,
    [dataset_id]             INT              NOT NULL,
    [segment_number]         INT              NULL,
    CONSTRAINT [cpk_export_appraisal_imprv] PRIMARY KEY CLUSTERED ([dataset_id] ASC, [prop_id] ASC, [prop_val_yr] ASC, [imprv_id] ASC, [sup_num] ASC)
);


GO

