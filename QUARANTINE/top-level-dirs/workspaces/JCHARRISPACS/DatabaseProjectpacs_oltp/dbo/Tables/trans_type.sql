CREATE TABLE [dbo].[trans_type] (
    [trans_type_id]   INT          NOT NULL,
    [trans_type_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_trans_type] PRIMARY KEY CLUSTERED ([trans_type_id] ASC) WITH (FILLFACTOR = 90)
);


GO

