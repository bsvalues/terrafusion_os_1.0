CREATE TABLE [dbo].[ms_comm_local_mult] (
    [ms_year]     NUMERIC (4)    NOT NULL,
    [local_class] VARCHAR (10)   NOT NULL,
    [local_value] NUMERIC (6, 4) NULL,
    CONSTRAINT [CPK_ms_comm_local_mult] PRIMARY KEY CLUSTERED ([ms_year] ASC, [local_class] ASC) WITH (FILLFACTOR = 100)
);


GO

