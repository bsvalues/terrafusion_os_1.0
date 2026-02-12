CREATE TABLE [dbo].[reet_import_reject_code] (
    [reet_import_reject_cd]   VARCHAR (10)  NOT NULL,
    [reet_import_reject_desc] VARCHAR (100) NOT NULL,
    CONSTRAINT [CPK_reet_import_reject_cd] PRIMARY KEY CLUSTERED ([reet_import_reject_cd] ASC)
);


GO


CREATE TRIGGER tr_reet_import_reject_code_delete_insert_update_MemTable
ON reet_import_reject_code
FOR DELETE, INSERT, UPDATE
NOT FOR replication
AS 

IF ( @@rowcount = 0 )
begin
RETURN
end 

SET nocount ON 

UPDATE table_cache_status WITH(rowlock)
SET lDummy = 0
WHERE szTableName = 'reet_import_reject_code'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'REET Import Reject Code', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'reet_import_reject_code';


GO

