CREATE TABLE [dbo].[fin_core_account_type] (
    [core_account_type_id]          INT          NOT NULL,
    [core_account_type_description] VARCHAR (50) NULL,
    CONSTRAINT [CPK_fin_core_account_type] PRIMARY KEY CLUSTERED ([core_account_type_id] ASC) WITH (FILLFACTOR = 100)
);


GO

