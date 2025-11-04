CREATE TABLE [dbo].[chg_log_user] (
    [machine]      VARCHAR (50) NOT NULL,
    [pacs_user_id] INT          NOT NULL,
    [log_changes]  INT          NULL,
    [hostid]       INT          NOT NULL,
    CONSTRAINT [CPK_chg_log_user] PRIMARY KEY CLUSTERED ([machine] ASC, [hostid] ASC)
);


GO

