CREATE TABLE [dbo].[current_use_review_status] (
    [cur_use_cd]   VARCHAR (15) NOT NULL,
    [cur_use_desc] VARCHAR (50) NOT NULL,
    [initial]      BIT          NOT NULL,
    [closed]       BIT          NOT NULL,
    PRIMARY KEY CLUSTERED ([cur_use_cd] ASC),
    CONSTRAINT [CHK_initial_closed] CHECK ([initial]<>(1) AND [closed]<>(1) OR [initial]=(1) AND [closed]<>(1) OR [initial]<>(1) AND [closed]=(1))
);


GO


CREATE TRIGGER tr_current_use_review_status_delete_insert_update_MemTable
	ON current_use_review_status
FOR DELETE, INSERT, UPDATE
	NOT FOR REPLICATION
AS

IF (@@ROWCOUNT = 0)
BEGIN
	RETURN
END

SET NOCOUNT ON

UPDATE table_cache_status
	WITH (ROWLOCK)
SET lDummy = 0
WHERE szTableName = 'current_use_review_status'

GO

