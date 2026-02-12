CREATE TABLE [dbo].[import_auditor_data] (
    [import_id]        INT            NOT NULL,
    [import_data_id]   INT            IDENTITY (1, 1) NOT NULL,
    [status]           CHAR (2)       NULL,
    [match]            CHAR (1)       NULL,
    [error]            VARCHAR (255)  NULL,
    [complete]         BIT            NOT NULL,
    [pacs_prop_id]     INT            NULL,
    [pacs_geo_id]      VARCHAR (50)   NULL,
    [pacs_excise_id]   INT            NULL,
    [doc_type]         VARCHAR (5)    NULL,
    [auditor_file_id]  VARCHAR (15)   NULL,
    [prop_id]          INT            NULL,
    [geo_id]           VARCHAR (50)   NULL,
    [excise_id]        INT            NULL,
    [image_url]        VARCHAR (200)  NULL,
    [date_recorded]    DATETIME       NULL,
    [instrument_date]  DATETIME       NULL,
    [sale_date]        DATETIME       NULL,
    [sale_price]       NUMERIC (14)   NULL,
    [taxpayer_name]    VARCHAR (70)   NULL,
    [owner_name]       VARCHAR (70)   NULL,
    [seller_name]      VARCHAR (70)   NULL,
    [sales_comment]    VARCHAR (500)  NULL,
    [document_comment] VARCHAR (500)  NULL,
    [metes_and_bounds] VARCHAR (1000) NULL,
    PRIMARY KEY CLUSTERED ([import_id] ASC, [import_data_id] ASC)
);


GO

