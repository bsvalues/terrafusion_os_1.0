CREATE TABLE [dbo].[recalc_trace_imprv] (
    [lTraceID]     BIGINT        IDENTITY (1, 1) NOT NULL,
    [prop_id]      INT           NOT NULL,
    [prop_val_yr]  NUMERIC (4)   NOT NULL,
    [sup_num]      INT           NOT NULL,
    [imprv_id]     INT           NOT NULL,
    [imprv_det_id] INT           NOT NULL,
    [szText]       VARCHAR (512) NULL,
    CONSTRAINT [CPK_recalc_trace_imprv] PRIMARY KEY NONCLUSTERED ([prop_id] ASC, [prop_val_yr] ASC, [sup_num] ASC, [imprv_id] ASC, [imprv_det_id] ASC, [lTraceID] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CUQ_recalc_trace_imprv_lTraceID] UNIQUE CLUSTERED ([lTraceID] ASC)
);


GO

CREATE NONCLUSTERED INDEX [idx_prop_id_prop_val_yr_sup_num]
    ON [dbo].[recalc_trace_imprv]([prop_id] ASC, [prop_val_yr] ASC, [sup_num] ASC) WITH (FILLFACTOR = 80);


GO

