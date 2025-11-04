CREATE TABLE [dbo].[lawsuit_cost] (
    [lawsuit_id]            INT             NOT NULL,
    [cost_id]               INT             IDENTITY (100000, 1) NOT NULL,
    [cost_cd]               CHAR (5)        NULL,
    [cost_amt]              NUMERIC (14, 2) NULL,
    [cost_date]             DATETIME        NULL,
    [cost_payee_contact_id] INT             NULL,
    [cost_payee]            VARCHAR (70)    NULL,
    CONSTRAINT [CPK_lawsuit_cost] PRIMARY KEY CLUSTERED ([lawsuit_id] ASC, [cost_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_lawsuit_cost_cost_cd] FOREIGN KEY ([cost_cd]) REFERENCES [dbo].[lawsuit_cost_type] ([cost_cd])
);


GO

