CREATE TABLE [dbo].[forms_ocr_zones] (
    [document_id]    INT           NOT NULL,
    [pageNo]         INT           DEFAULT ((0)) NOT NULL,
    [zone_id]        INT           NOT NULL,
    [field_name]     VARCHAR (50)  NOT NULL,
    [left]           INT           NOT NULL,
    [top]            INT           NOT NULL,
    [width]          INT           NOT NULL,
    [height]         INT           NOT NULL,
    [isOMR]          BIT           DEFAULT ((0)) NOT NULL,
    [isKey]          BIT           DEFAULT ((0)) NOT NULL,
    [defaultValue]   VARCHAR (250) NULL,
    [parent_zone_id] INT           NULL,
    [record_type]    INT           DEFAULT ((0)) NOT NULL,
    [value_field]    BIT           DEFAULT ((1)) NOT NULL,
    CONSTRAINT [CPK_forms_ocr_zones] PRIMARY KEY CLUSTERED ([document_id] ASC, [pageNo] ASC, [zone_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_forms_ocr_zones_forms_ocr_document] FOREIGN KEY ([document_id]) REFERENCES [dbo].[forms_ocr_document] ([document_id]) ON DELETE CASCADE
);


GO

