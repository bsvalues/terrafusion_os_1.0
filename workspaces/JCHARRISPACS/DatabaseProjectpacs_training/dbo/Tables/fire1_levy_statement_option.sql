CREATE TABLE [dbo].[fire1_levy_statement_option] (
    [year]                  NUMERIC (4)   NOT NULL,
    [tax_district_id]       INT           NOT NULL,
    [levy_cd]               VARCHAR (10)  NOT NULL,
    [separate_levy_display] BIT           NULL,
    [levy_description]      VARCHAR (255) NULL,
    [levy_comment]          VARCHAR (255) NULL
);


GO

