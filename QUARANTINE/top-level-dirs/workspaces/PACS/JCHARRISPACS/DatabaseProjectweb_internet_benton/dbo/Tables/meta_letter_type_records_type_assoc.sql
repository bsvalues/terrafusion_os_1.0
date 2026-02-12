CREATE TABLE [dbo].[meta_letter_type_records_type_assoc] (
    [letter_type_cd] VARCHAR (15) NOT NULL,
    [records_uid]    VARCHAR (23) NOT NULL,
    CONSTRAINT [CPK_meta_letter_type_records_type_assoc] PRIMARY KEY CLUSTERED ([letter_type_cd] ASC, [records_uid] ASC) WITH (FILLFACTOR = 100)
);


GO

