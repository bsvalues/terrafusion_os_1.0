CREATE TABLE [dbo].[dor_land_use_code] (
    [code]                VARCHAR (10) NOT NULL,
    [dor_report_category] VARCHAR (3)  NOT NULL,
    CONSTRAINT [CPK_dor_land_use_code] PRIMARY KEY CLUSTERED ([code] ASC) WITH (FILLFACTOR = 100)
);


GO

