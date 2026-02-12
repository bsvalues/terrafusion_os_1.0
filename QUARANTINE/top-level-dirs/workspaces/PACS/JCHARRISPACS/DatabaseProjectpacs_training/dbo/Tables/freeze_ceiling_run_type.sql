CREATE TABLE [dbo].[freeze_ceiling_run_type] (
    [run_type_id]          INT          NOT NULL,
    [run_type_description] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_freeze_ceiling_run_type] PRIMARY KEY CLUSTERED ([run_type_id] ASC) WITH (FILLFACTOR = 90)
);


GO

