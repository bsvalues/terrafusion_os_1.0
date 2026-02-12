CREATE TABLE [dbo].[calculation_rule] (
    [rule_id]          INT           NOT NULL,
    [rule_name]        VARCHAR (127) NOT NULL,
    [rule_description] VARCHAR (255) NOT NULL,
    CONSTRAINT [CPK_calculation_rule] PRIMARY KEY CLUSTERED ([rule_id] ASC) WITH (FILLFACTOR = 100)
);


GO

