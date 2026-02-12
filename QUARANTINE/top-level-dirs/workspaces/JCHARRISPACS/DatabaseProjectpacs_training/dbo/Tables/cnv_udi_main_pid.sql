CREATE TABLE [dbo].[cnv_udi_main_pid] (
    [parent_prop_id]     INT NOT NULL,
    [main_child_prop_id] INT NOT NULL,
    CONSTRAINT [CPK_cnv_udi_main_pid] PRIMARY KEY CLUSTERED ([parent_prop_id] ASC) WITH (FILLFACTOR = 100)
);


GO

