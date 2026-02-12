CREATE TABLE [dbo].[export_appraisal_imprv_detail] (
    [prop_id]                INT             NOT NULL,
    [prop_val_yr]            NUMERIC (4)     NOT NULL,
    [imprv_id]               INT             NOT NULL,
    [sup_num]                INT             NOT NULL,
    [imprv_det_id]           INT             NOT NULL,
    [imprv_det_type_cd]      VARCHAR (10)    NULL,
    [imprv_det_type_desc]    VARCHAR (50)    NULL,
    [imprv_det_class_cd]     VARCHAR (10)    NULL,
    [imprv_det_sub_class_cd] VARCHAR (10)    NULL,
    [yr_built]               NUMERIC (4)     NULL,
    [depreciation_yr]        NUMERIC (4)     NULL,
    [imprv_det_area]         NUMERIC (18, 1) NULL,
    [imprv_det_val]          NUMERIC (18)    NULL,
    [condition_cd]           VARCHAR (5)     NULL,
    [sketch_cmds]            VARCHAR (1800)  NULL,
    [dataset_id]             INT             NOT NULL,
    [segment_number]         INT             NULL,
    CONSTRAINT [cpk_export_appraisal_imprv_detail] PRIMARY KEY CLUSTERED ([dataset_id] ASC, [prop_id] ASC, [prop_val_yr] ASC, [imprv_id] ASC, [sup_num] ASC, [imprv_det_id] ASC)
);


GO

