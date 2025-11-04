CREATE TABLE [dbo].[SearchTMP] (
    [type]      VARCHAR (5)     NOT NULL,
    [entity_id] INT             NOT NULL,
    [tax_month] INT             NOT NULL,
    [tax_yr]    NUMERIC (4)     NOT NULL,
    [balance]   NUMERIC (14, 2) NULL
);


GO

