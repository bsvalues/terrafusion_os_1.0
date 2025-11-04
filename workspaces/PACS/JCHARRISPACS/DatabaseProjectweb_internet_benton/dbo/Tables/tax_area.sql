CREATE TABLE [dbo].[tax_area] (
    [tax_area_id]            INT            NOT NULL,
    [tax_area_number]        VARCHAR (23)   NOT NULL,
    [tax_area_state]         VARCHAR (50)   NULL,
    [tax_area_description]   VARCHAR (255)  NOT NULL,
    [comment]                VARCHAR (2048) NULL,
    [is_inactive_after_year] BIT            NOT NULL,
    [inactive_after_year]    NUMERIC (4)    NULL,
    CONSTRAINT [CPK_tax_area] PRIMARY KEY CLUSTERED ([tax_area_id] ASC) WITH (FILLFACTOR = 100)
);


GO

