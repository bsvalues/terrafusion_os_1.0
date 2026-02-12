CREATE TABLE [dbo].[update_owner] (
    [prop_id]       INT         NULL,
    [prev_sup_num]  INT         NULL,
    [prev_year]     NUMERIC (4) NULL,
    [prev_owner_id] INT         NULL,
    [curr_sup_num]  INT         NULL,
    [curr_year]     NUMERIC (4) NULL,
    [curr_owner_id] INT         NULL,
    [lKey]          INT         IDENTITY (1, 1) NOT NULL,
    CONSTRAINT [CPK_update_owner] PRIMARY KEY CLUSTERED ([lKey] ASC) WITH (FILLFACTOR = 100)
);


GO

