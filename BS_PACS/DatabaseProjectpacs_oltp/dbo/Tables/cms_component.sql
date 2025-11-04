CREATE TABLE [dbo].[cms_component] (
    [year]             NUMERIC (4)     NOT NULL,
    [system]           VARCHAR (5)     NOT NULL,
    [code]             VARCHAR (5)     NOT NULL,
    [name]             VARCHAR (50)    NULL,
    [percent_required] BIT             NOT NULL,
    [percent_min]      NUMERIC (5, 2)  NULL,
    [percent_max]      NUMERIC (5, 2)  NULL,
    [climate_required] BIT             NOT NULL,
    [units_required]   BIT             NOT NULL,
    [units_min]        NUMERIC (10, 2) NULL,
    [units_max]        NUMERIC (10, 2) NULL,
    [stops_required]   BIT             NOT NULL,
    [stops_min]        INT             NULL,
    [stops_max]        INT             NULL,
    CONSTRAINT [CPK_cms_component] PRIMARY KEY CLUSTERED ([year] ASC, [system] ASC, [code] ASC)
);


GO

