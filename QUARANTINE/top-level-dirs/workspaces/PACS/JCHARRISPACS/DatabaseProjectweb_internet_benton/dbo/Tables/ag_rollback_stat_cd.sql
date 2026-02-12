CREATE TABLE [dbo].[ag_rollback_stat_cd] (
    [status_cd]   CHAR (5)  NOT NULL,
    [status_desc] CHAR (50) NOT NULL,
    [sys_flag]    CHAR (1)  NULL,
    CONSTRAINT [CPK_ag_rollback_stat_cd] PRIMARY KEY CLUSTERED ([status_cd] ASC)
);


GO

