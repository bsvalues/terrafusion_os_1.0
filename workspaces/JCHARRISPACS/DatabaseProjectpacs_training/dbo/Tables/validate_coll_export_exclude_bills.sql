CREATE TABLE [dbo].[validate_coll_export_exclude_bills] (
    [bill_id] INT NOT NULL,
    CONSTRAINT [CPK_validate_coll_export_exclude_bills] PRIMARY KEY CLUSTERED ([bill_id] ASC) WITH (FILLFACTOR = 100)
);


GO

