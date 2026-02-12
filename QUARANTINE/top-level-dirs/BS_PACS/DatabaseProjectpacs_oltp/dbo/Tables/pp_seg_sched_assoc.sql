CREATE TABLE [dbo].[pp_seg_sched_assoc] (
    [prop_id]         INT             NOT NULL,
    [pp_seg_id]       INT             NOT NULL,
    [prop_val_yr]     NUMERIC (4)     NOT NULL,
    [sup_num]         INT             NOT NULL,
    [sale_id]         INT             NOT NULL,
    [pp_sched_id]     INT             NOT NULL,
    [value_method]    CHAR (5)        NOT NULL,
    [table_code]      CHAR (5)        NOT NULL,
    [segment_type]    VARCHAR (10)    NOT NULL,
    [active_flag]     CHAR (1)        NULL,
    [unit_price]      NUMERIC (14, 2) NULL,
    [flat_price_flag] CHAR (1)        NULL,
    [tsRowVersion]    ROWVERSION      NOT NULL,
    CONSTRAINT [CPK_pp_seg_sched_assoc] PRIMARY KEY CLUSTERED ([prop_val_yr] ASC, [sup_num] ASC, [prop_id] ASC, [pp_seg_id] ASC, [pp_sched_id] ASC) WITH (FILLFACTOR = 90)
);


GO

CREATE NONCLUSTERED INDEX [idx_prop_id]
    ON [dbo].[pp_seg_sched_assoc]([prop_id] ASC) WITH (FILLFACTOR = 90);


GO

