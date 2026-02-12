CREATE TABLE [dbo].[change_log_keys] (
    [lChangeID]  INT          NOT NULL,
    [iColumnID]  SMALLINT     NOT NULL,
    [szKeyValue] VARCHAR (50) NOT NULL,
    [lKeyValue]  INT          NOT NULL,
    CONSTRAINT [CPK_change_log_keys] PRIMARY KEY CLUSTERED ([lChangeID] ASC, [iColumnID] ASC) WITH (FILLFACTOR = 90)
);


GO

CREATE NONCLUSTERED INDEX [idx_lKeyValue_iColumnID_lChangeID]
    ON [dbo].[change_log_keys]([lKeyValue] ASC, [iColumnID] ASC, [lChangeID] ASC);


GO

