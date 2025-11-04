CREATE TABLE [dbo].[reet_wac_code] (
    [wac_cd]   VARCHAR (32)  NOT NULL,
    [wac_desc] VARCHAR (100) NOT NULL,
    [sys_flag] CHAR (1)      NULL,
    [inactive] BIT           CONSTRAINT [CDF_reet_wac_code_inactive] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_reet_wac_code] PRIMARY KEY CLUSTERED ([wac_cd] ASC)
);


GO




create trigger tr_reet_wac_code_delete_insert_update_MemTable
on reet_wac_code
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
where szTableName = 'reet_wac_code'

GO

GRANT INSERT
    ON OBJECT::[dbo].[reet_wac_code] TO [simplifile]
    AS [dbo];


GO

GRANT SELECT
    ON OBJECT::[dbo].[reet_wac_code] TO [simplifile]
    AS [dbo];


GO

GRANT SELECT
    ON OBJECT::[dbo].[reet_wac_code] TO PUBLIC
    AS [dbo];


GO

GRANT DELETE
    ON OBJECT::[dbo].[reet_wac_code] TO [simplifile]
    AS [dbo];


GO

GRANT UPDATE
    ON OBJECT::[dbo].[reet_wac_code] TO PUBLIC
    AS [dbo];


GO

GRANT INSERT
    ON OBJECT::[dbo].[reet_wac_code] TO PUBLIC
    AS [dbo];


GO

GRANT DELETE
    ON OBJECT::[dbo].[reet_wac_code] TO PUBLIC
    AS [dbo];


GO

GRANT UPDATE
    ON OBJECT::[dbo].[reet_wac_code] TO [simplifile]
    AS [dbo];


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'REET Wac Inactive Flag', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'reet_wac_code', @level2type = N'COLUMN', @level2name = N'inactive';


GO

