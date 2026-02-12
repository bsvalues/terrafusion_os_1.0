CREATE TABLE [dbo].[fin_account_type] (
    [account_type_cd]          VARCHAR (25)  NOT NULL,
    [account_type_description] VARCHAR (255) NOT NULL,
    [core_account_type_id]     INT           NOT NULL,
    CONSTRAINT [CPK_fin_account_type] PRIMARY KEY CLUSTERED ([account_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

