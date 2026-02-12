CREATE TABLE [dbo].[___taxarea] (
    [bill_id]        INT         NULL,
    [prop_id]        INT         NULL,
    [year]           NUMERIC (4) NULL,
    [transaction_id] INT         NULL,
    [tax_area_id]    INT         NULL
);


GO

CREATE NONCLUSTERED INDEX [ix_tmp]
    ON [dbo].[___taxarea]([transaction_id] ASC);


GO

