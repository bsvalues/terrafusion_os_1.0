CREATE TABLE [dbo].[rebuild_index_excluded] (
    [obj_name] [sysname] NOT NULL,
    CONSTRAINT [CPK_rebuild_index_excluded] PRIMARY KEY CLUSTERED ([obj_name] ASC)
);


GO

