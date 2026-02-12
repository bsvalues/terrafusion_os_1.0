CREATE TABLE [dbo].[ptd_acreage_labels] (
    [code]  VARCHAR (10) NOT NULL,
    [label] VARCHAR (70) NULL,
    CONSTRAINT [CPK_ptd_acreage_labels] PRIMARY KEY CLUSTERED ([code] ASC) WITH (FILLFACTOR = 100)
);


GO

