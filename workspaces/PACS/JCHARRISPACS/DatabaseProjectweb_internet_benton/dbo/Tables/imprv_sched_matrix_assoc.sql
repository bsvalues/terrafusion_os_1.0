CREATE TABLE [dbo].[imprv_sched_matrix_assoc] (
    [imprv_det_meth_cd]      CHAR (5)       NOT NULL,
    [imprv_det_type_cd]      CHAR (10)      NOT NULL,
    [imprv_det_class_cd]     CHAR (10)      NOT NULL,
    [imprv_yr]               NUMERIC (4)    NOT NULL,
    [matrix_id]              INT            NOT NULL,
    [matrix_order]           INT            NOT NULL,
    [adj_factor]             NUMERIC (7, 4) NOT NULL,
    [imprv_det_sub_class_cd] VARCHAR (10)   NOT NULL,
    CONSTRAINT [CPK_imprv_sched_matrix_assoc] PRIMARY KEY CLUSTERED ([imprv_yr] ASC, [imprv_det_meth_cd] ASC, [imprv_det_type_cd] ASC, [imprv_det_class_cd] ASC, [imprv_det_sub_class_cd] ASC, [matrix_id] ASC, [matrix_order] ASC) WITH (FILLFACTOR = 90)
);


GO

