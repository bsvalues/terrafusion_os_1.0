CREATE TABLE [dbo].[expression] (
    [expression_id]          INT           NOT NULL,
    [expression_name]        VARCHAR (127) NOT NULL,
    [expression_description] VARCHAR (255) NOT NULL,
    CONSTRAINT [CPK_expression] PRIMARY KEY CLUSTERED ([expression_id] ASC) WITH (FILLFACTOR = 100)
);


GO

