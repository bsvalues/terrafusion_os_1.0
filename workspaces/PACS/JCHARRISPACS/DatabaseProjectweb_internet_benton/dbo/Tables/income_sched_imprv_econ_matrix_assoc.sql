CREATE TABLE [dbo].[income_sched_imprv_econ_matrix_assoc] (
    [year]              NUMERIC (4)    NOT NULL,
    [economic_area]     VARCHAR (10)   NOT NULL,
    [imprv_det_type_cd] CHAR (10)      NOT NULL,
    [imprv_det_meth_cd] CHAR (5)       NOT NULL,
    [matrix_id]         INT            NOT NULL,
    [matrix_order]      INT            NOT NULL,
    [adj_factor]        NUMERIC (7, 4) NOT NULL,
    CONSTRAINT [CPK_income_sched_imprv_econ_matrix_assoc] PRIMARY KEY CLUSTERED ([year] ASC, [economic_area] ASC, [imprv_det_type_cd] ASC, [imprv_det_meth_cd] ASC, [matrix_id] ASC, [matrix_order] ASC)
);


GO

