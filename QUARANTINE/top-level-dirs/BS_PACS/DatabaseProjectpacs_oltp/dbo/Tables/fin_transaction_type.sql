CREATE TABLE [dbo].[fin_transaction_type] (
    [fin_transaction_type_cd]   VARCHAR (10) NOT NULL,
    [fin_transaction_type_desc] VARCHAR (40) NOT NULL,
    [object_type_cd]            VARCHAR (10) NOT NULL,
    CONSTRAINT [CPK_fin_transaction_type] PRIMARY KEY CLUSTERED ([fin_transaction_type_cd] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_fin_transaction_type_object_type_cd] FOREIGN KEY ([object_type_cd]) REFERENCES [dbo].[object_type] ([object_type_cd])
);


GO

