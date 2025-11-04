CREATE TABLE [dbo].[chg_log_trans_selection_fields] (
    [lChangeLogTransSelectID] INT      NOT NULL,
    [iTableID]                SMALLINT NOT NULL,
    [iColumnID]               SMALLINT NOT NULL,
    CONSTRAINT [CPK_chg_log_trans_selection_fields] PRIMARY KEY CLUSTERED ([lChangeLogTransSelectID] ASC, [iTableID] ASC, [iColumnID] ASC),
    CONSTRAINT [CFK_chg_log_trans_selection_fields_lChangeLogTransSelectID] FOREIGN KEY ([lChangeLogTransSelectID]) REFERENCES [dbo].[chg_log_trans_selection] ([lChangeLogTransSelectID])
);


GO

