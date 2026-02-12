CREATE TABLE [dbo].[imprv_sched_detail] (
    [imprv_det_meth_cd]      CHAR (5)        NOT NULL,
    [imprv_det_type_cd]      CHAR (10)       NOT NULL,
    [imprv_det_class_cd]     CHAR (10)       NOT NULL,
    [imprv_yr]               NUMERIC (4)     NOT NULL,
    [stories]                VARCHAR (5)     NOT NULL,
    [range_max]              NUMERIC (18, 1) NOT NULL,
    [range_price]            NUMERIC (14, 2) NULL,
    [range_pc]               NUMERIC (5, 2)  NULL,
    [range_adj_price]        NUMERIC (14, 2) NULL,
    [range_interpolate_inc]  NUMERIC (14, 6) NULL,
    [imprv_det_sub_class_cd] VARCHAR (10)    NOT NULL,
    CONSTRAINT [CPK_imprv_sched_detail] PRIMARY KEY CLUSTERED ([imprv_yr] ASC, [imprv_det_meth_cd] ASC, [imprv_det_type_cd] ASC, [imprv_det_class_cd] ASC, [imprv_det_sub_class_cd] ASC, [stories] ASC, [range_max] ASC) WITH (FILLFACTOR = 90)
);


GO

