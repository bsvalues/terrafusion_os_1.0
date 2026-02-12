CREATE TABLE [dbo].[forms_ocr_document] (
    [document_id]   INT           IDENTITY (1, 1) NOT FOR REPLICATION NOT NULL,
    [form_id]       INT           NOT NULL,
    [document_name] VARCHAR (100) NOT NULL,
    CONSTRAINT [CPK_forms_ocr_document] PRIMARY KEY CLUSTERED ([document_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_forms_ocr_document_forms_maintenance] FOREIGN KEY ([form_id]) REFERENCES [dbo].[forms_maintenance] ([lKey]) ON DELETE CASCADE
);


GO

