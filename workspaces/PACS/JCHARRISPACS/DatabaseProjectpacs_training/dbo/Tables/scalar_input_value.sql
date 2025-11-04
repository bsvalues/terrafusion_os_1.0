CREATE TABLE [dbo].[scalar_input_value] (
    [spid]    SMALLINT NOT NULL,
    [dateVal] DATETIME NULL,
    CONSTRAINT [CPK_scalar_input_value] PRIMARY KEY CLUSTERED ([spid] ASC) WITH (FILLFACTOR = 100)
);


GO

