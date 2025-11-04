CREATE TABLE [dbo].[imprv_sched] (
    [imprv_det_meth_cd]                 CHAR (5)       NOT NULL,
    [imprv_det_type_cd]                 CHAR (10)      NOT NULL,
    [imprv_det_class_cd]                CHAR (10)      NOT NULL,
    [imprv_yr]                          NUMERIC (4)    NOT NULL,
    [imprv_pc_of_base]                  NUMERIC (5, 2) NULL,
    [imprv_interpolate]                 CHAR (1)       NULL,
    [imprv_use_mult]                    CHAR (1)       NULL,
    [imprv_sched_area_type_cd]          CHAR (10)      NULL,
    [imprv_sched_mult_type]             CHAR (2)       NULL,
    [imprv_sched_mult_form]             CHAR (1)       NULL,
    [imprv_sched_mult_quality_cd]       VARCHAR (10)   NULL,
    [imprv_sched_mult_section_cd]       VARCHAR (10)   NULL,
    [imprv_sched_mult_local_quality_cd] VARCHAR (10)   NULL,
    [imprv_sched_deprec_cd]             CHAR (10)      NULL,
    [imprv_sched_slope_intercept]       BIT            NULL,
    [imprv_sched_value_type]            CHAR (1)       NULL,
    [imprv_det_sub_class_cd]            VARCHAR (10)   NOT NULL,
    CONSTRAINT [CPK_imprv_sched] PRIMARY KEY CLUSTERED ([imprv_yr] ASC, [imprv_det_meth_cd] ASC, [imprv_det_type_cd] ASC, [imprv_det_class_cd] ASC, [imprv_det_sub_class_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

CREATE NONCLUSTERED INDEX [idx_imprv_sched_mult_local_quality_cd]
    ON [dbo].[imprv_sched]([imprv_sched_mult_local_quality_cd] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_imprv_sched_mult_section_cd]
    ON [dbo].[imprv_sched]([imprv_sched_mult_section_cd] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_imprv_det_meth_cd]
    ON [dbo].[imprv_sched]([imprv_det_meth_cd] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_imprv_sched_deprec_cd]
    ON [dbo].[imprv_sched]([imprv_sched_deprec_cd] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_imprv_det_class_cd]
    ON [dbo].[imprv_sched]([imprv_det_class_cd] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_imprv_sched_mult_quality_cd]
    ON [dbo].[imprv_sched]([imprv_sched_mult_quality_cd] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_imprv_det_type_cd]
    ON [dbo].[imprv_sched]([imprv_det_type_cd] ASC) WITH (FILLFACTOR = 90);


GO

