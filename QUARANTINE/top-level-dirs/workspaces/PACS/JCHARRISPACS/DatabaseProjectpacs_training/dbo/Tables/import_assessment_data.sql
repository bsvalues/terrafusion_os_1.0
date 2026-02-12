CREATE TABLE [dbo].[import_assessment_data] (
    [import_id]                INT             NOT NULL,
    [import_data_id]           INT             IDENTITY (1, 1) NOT NULL,
    [prop_id]                  INT             NULL,
    [geo_id]                   CHAR (25)       NULL,
    [bill_amount]              NUMERIC (14, 2) NULL,
    [number_spaces]            NUMERIC (4)     NULL,
    [number_units]             NUMERIC (4)     NULL,
    [impervious_surface_acres] NUMERIC (18, 4) NULL,
    [assessment_use_cd]        CHAR (10)       NULL,
    [benefit_acres]            NUMERIC (18, 4) NULL,
    [match]                    CHAR (1)        NULL,
    [error]                    VARCHAR (255)   NULL,
    [complete]                 BIT             NOT NULL,
    [pacs_geo_id]              VARCHAR (50)    NULL,
    [pacs_property_id]         INT             NULL,
    CONSTRAINT [CPK_import_assessment_data] PRIMARY KEY CLUSTERED ([import_id] ASC, [import_data_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_import_assessment_data_import_id] FOREIGN KEY ([import_id]) REFERENCES [dbo].[import_assessment] ([import_id])
);


GO

