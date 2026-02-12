CREATE TABLE [dbo].[cad_productivity_codes] (
    [cad_code]               VARCHAR (5) NOT NULL,
    [cad_productivity_code]  VARCHAR (5) NOT NULL,
    [pacs_productivity_code] VARCHAR (5) NOT NULL,
    CONSTRAINT [CPK_cad_productivity_codes] PRIMARY KEY CLUSTERED ([cad_code] ASC, [cad_productivity_code] ASC) WITH (FILLFACTOR = 100)
);


GO

