CREATE TABLE [dbo].[fee_litigation_assoc] (
    [fee_id]        INT NOT NULL,
    [litigation_id] INT NOT NULL,
    CONSTRAINT [CPK_fee_litigation_assoc] PRIMARY KEY CLUSTERED ([fee_id] ASC, [litigation_id] ASC) WITH (FILLFACTOR = 90)
);


GO

