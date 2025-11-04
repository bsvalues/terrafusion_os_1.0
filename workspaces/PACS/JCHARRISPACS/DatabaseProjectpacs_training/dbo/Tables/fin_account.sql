CREATE TABLE [dbo].[fin_account] (
    [fin_account_id]           INT           NOT NULL,
    [account_number]           VARCHAR (259) NOT NULL,
    [account_description]      VARCHAR (100) NULL,
    [account_type_cd]          VARCHAR (25)  NOT NULL,
    [active]                   BIT           NOT NULL,
    [create_date]              DATETIME      NOT NULL,
    [last_update_date]         DATETIME      NULL,
    [has_mr_offset]            BIT           CONSTRAINT [CDF_fin_account_has_mr_offset] DEFAULT ((0)) NOT NULL,
    [mr_offset_fin_account_id] INT           NULL,
    CONSTRAINT [CPK_fin_account] PRIMARY KEY CLUSTERED ([fin_account_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_fin_account_account_type_cd] FOREIGN KEY ([account_type_cd]) REFERENCES [dbo].[fin_account_type] ([account_type_cd]),
    CONSTRAINT [CUQ_fin_account_account_number] UNIQUE NONCLUSTERED ([account_number] ASC) WITH (FILLFACTOR = 90)
);


GO


create trigger tr_fin_account_delete_insert_update_MemTable
on fin_account
for delete, insert, update
not for replication
as

if ( @@rowcount = 0 )
begin
	return
end

set nocount on

update table_cache_status with(rowlock)
set lDummy = 0
where szTableName = 'fin_account'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'the fin_account_id of the MR Offset Account Number for the record', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'fin_account', @level2type = N'COLUMN', @level2name = N'mr_offset_fin_account_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Indicates if the Offset Account combo box on the Account Number Details dialog is enabled', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'fin_account', @level2type = N'COLUMN', @level2name = N'has_mr_offset';


GO

