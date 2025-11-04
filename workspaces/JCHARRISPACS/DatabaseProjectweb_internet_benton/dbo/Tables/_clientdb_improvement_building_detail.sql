CREATE TABLE [dbo].[_clientdb_improvement_building_detail] (
    [prop_id]                INT             NOT NULL,
    [prop_val_yr]            NUMERIC (4)     NOT NULL,
    [imprv_id]               INT             NOT NULL,
    [imprv_type_desc]        VARCHAR (50)    NULL,
    [imprv_state_cd]         CHAR (5)        NOT NULL,
    [living_area]            NUMERIC (38, 1) NULL,
    [imprv_val]              NUMERIC (14)    NOT NULL,
    [imprv_det_id]           INT             NULL,
    [imprv_det_type_cd]      CHAR (10)       NULL,
    [imprv_det_typ_desc]     VARCHAR (50)    NULL,
    [imprv_det_class_cd]     CHAR (10)       NULL,
    [imprv_det_sub_class_cd] VARCHAR (10)    NULL,
    [i_attr_val_cd]          VARCHAR (75)    NULL,
    [yr_built]               NUMERIC (4)     NULL,
    [area]                   NUMERIC (18, 1) NULL,
    [imprv_non_hstd_val]     NUMERIC (14)    NOT NULL,
    [show_values]            VARCHAR (1)     NOT NULL
);


GO

CREATE CLUSTERED INDEX [IX__clientdb_improvement_building_detail]
    ON [dbo].[_clientdb_improvement_building_detail]([prop_val_yr] ASC, [prop_id] ASC, [imprv_id] ASC, [imprv_det_id] ASC);


GO

