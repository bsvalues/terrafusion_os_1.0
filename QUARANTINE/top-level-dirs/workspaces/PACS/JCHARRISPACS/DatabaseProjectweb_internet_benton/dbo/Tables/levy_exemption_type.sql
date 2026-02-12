CREATE TABLE [dbo].[levy_exemption_type] (
    [levy_exemption_type_cd]   VARCHAR (10) NOT NULL,
    [levy_exemption_type_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_levy_exemption_type] PRIMARY KEY CLUSTERED ([levy_exemption_type_cd] ASC)
);


GO

