CREATE TABLE [dbo].[dor_depreciation_schedule] (
    [code]        VARCHAR (25)  NOT NULL,
    [description] VARCHAR (100) NULL,
    CONSTRAINT [CPK_dor_depreciation_schedule] PRIMARY KEY CLUSTERED ([code] ASC)
);


GO

