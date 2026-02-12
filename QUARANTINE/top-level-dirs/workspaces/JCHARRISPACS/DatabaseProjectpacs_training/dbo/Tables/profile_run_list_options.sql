CREATE TABLE [dbo].[profile_run_list_options] (
    [run_id]      INT          NOT NULL,
    [option_type] VARCHAR (10) NOT NULL,
    [option_desc] VARCHAR (50) NULL,
    [option_id]   INT          NULL,
    [lKey]        INT          IDENTITY (1, 1) NOT NULL,
    CONSTRAINT [CPK_profile_run_list_options] PRIMARY KEY NONCLUSTERED ([lKey] ASC) WITH (FILLFACTOR = 100)
);


GO

CREATE CLUSTERED INDEX [idx_run_id_option_type_option_id]
    ON [dbo].[profile_run_list_options]([run_id] ASC, [option_type] ASC, [option_id] ASC) WITH (FILLFACTOR = 90);


GO

