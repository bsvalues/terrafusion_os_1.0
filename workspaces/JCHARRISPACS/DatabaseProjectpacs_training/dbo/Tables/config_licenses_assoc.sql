CREATE TABLE [dbo].[config_licenses_assoc] (
    [Module]       VARCHAR (20) NOT NULL,
    [Machine_Name] VARCHAR (15) NOT NULL,
    CONSTRAINT [CPK_config_licenses_assoc] PRIMARY KEY CLUSTERED ([Module] ASC, [Machine_Name] ASC) WITH (FILLFACTOR = 100)
);


GO

