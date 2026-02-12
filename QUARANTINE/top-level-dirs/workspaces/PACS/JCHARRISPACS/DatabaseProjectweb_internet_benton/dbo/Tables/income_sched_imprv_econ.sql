CREATE TABLE [dbo].[income_sched_imprv_econ] (
    [year]                 NUMERIC (4)     NOT NULL,
    [economic_area]        VARCHAR (10)    NOT NULL,
    [imprv_det_type_cd]    CHAR (10)       NOT NULL,
    [imprv_det_meth_cd]    CHAR (5)        NOT NULL,
    [use_matrix]           BIT             NOT NULL,
    [rent_rate]            NUMERIC (14, 2) NULL,
    [collection_loss]      NUMERIC (5, 2)  NULL,
    [occupancy_rate]       NUMERIC (5, 2)  NULL,
    [secondary_income_rsf] NUMERIC (14, 2) NULL,
    [cap_rate]             NUMERIC (7, 4)  NULL,
    [expense_rsf]          NUMERIC (14, 2) NULL,
    [expense_ratio]        NUMERIC (5, 2)  NULL,
    [do_not_use_tax_rate]  BIT             NOT NULL,
    [rent_rate_period]     CHAR (1)        NOT NULL,
    CONSTRAINT [CPK_income_sched_imprv_econ] PRIMARY KEY CLUSTERED ([year] ASC, [economic_area] ASC, [imprv_det_type_cd] ASC, [imprv_det_meth_cd] ASC)
);


GO

