CREATE TABLE [dbo].[update_agent] (
    [prop_id]       INT         NULL,
    [owner_id]      INT         NULL,
    [prev_year]     NUMERIC (4) NULL,
    [prev_agent_id] INT         NULL,
    [curr_year]     NUMERIC (4) NULL,
    [curr_agent_id] INT         NULL,
    [lKey]          INT         IDENTITY (1, 1) NOT NULL,
    CONSTRAINT [CPK_update_agent] PRIMARY KEY CLUSTERED ([lKey] ASC) WITH (FILLFACTOR = 100)
);


GO

