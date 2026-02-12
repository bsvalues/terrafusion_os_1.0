CREATE TABLE [dbo].[meta_records_object_type] (
    [records_uid]  VARCHAR (23)  NOT NULL,
    [records_name] VARCHAR (255) NOT NULL,
    CONSTRAINT [CPK_meta_records_object_type] PRIMARY KEY CLUSTERED ([records_uid] ASC) WITH (FILLFACTOR = 100)
);


GO

