CREATE TABLE [dbo].[ms_comm_cost_mult] (
    [ms_year]      NUMERIC (4)    NOT NULL,
    [cost_class]   VARCHAR (10)   NOT NULL,
    [cost_section] VARCHAR (10)   NOT NULL,
    [cost_value]   NUMERIC (6, 4) NULL,
    CONSTRAINT [CPK_ms_comm_cost_mult] PRIMARY KEY CLUSTERED ([ms_year] ASC, [cost_class] ASC, [cost_section] ASC) WITH (FILLFACTOR = 100)
);


GO

