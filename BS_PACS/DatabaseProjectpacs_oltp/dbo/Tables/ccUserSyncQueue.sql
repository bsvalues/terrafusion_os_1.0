CREATE TABLE [dbo].[ccUserSyncQueue] (
    [pacs_user_id]   INT          NOT NULL,
    [pacs_user_name] VARCHAR (30) NULL,
    [password]       BINARY (20)  NULL,
    [action_type]    VARCHAR (1)  NOT NULL,
    [run_id]         INT          NULL,
    CONSTRAINT [CPK_ccUserSyncQueue] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [action_type] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Encrypted password value of the user with changes to be synced', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccUserSyncQueue', @level2type = N'COLUMN', @level2name = N'password';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Id value of the user with changes to be synced', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccUserSyncQueue', @level2type = N'COLUMN', @level2name = N'pacs_user_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'If user record was inserted (I), deleted (D), or updated (U)', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccUserSyncQueue', @level2type = N'COLUMN', @level2name = N'action_type';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'User name value of the user with changes to be synced', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccUserSyncQueue', @level2type = N'COLUMN', @level2name = N'pacs_user_name';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The run id that this entry was created. Related to ccCheckSum_Compare_RunInfo table', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccUserSyncQueue', @level2type = N'COLUMN', @level2name = N'run_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'PACS Mobile User Changes for syncing with Cloud. Table is empty when there is nothing to sync', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccUserSyncQueue';


GO

