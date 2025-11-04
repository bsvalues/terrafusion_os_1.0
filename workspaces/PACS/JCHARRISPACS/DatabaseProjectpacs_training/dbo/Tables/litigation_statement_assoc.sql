CREATE TABLE [dbo].[litigation_statement_assoc] (
    [litigation_id] INT         NOT NULL,
    [year]          NUMERIC (4) NOT NULL,
    [prop_id]       INT         NOT NULL,
    [statement_id]  INT         NOT NULL,
    CONSTRAINT [CPK_litigation_statement_assoc] PRIMARY KEY CLUSTERED ([litigation_id] ASC, [year] ASC, [prop_id] ASC, [statement_id] ASC),
    CONSTRAINT [CFK_litigation_statement_assoc_litigation] FOREIGN KEY ([litigation_id]) REFERENCES [dbo].[litigation] ([litigation_id])
);


GO

