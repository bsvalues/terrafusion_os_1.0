CREATE TABLE [dbo].[state_code] (
    [state_cd]             CHAR (5)     NOT NULL,
    [state_cd_desc]        VARCHAR (50) NULL,
    [sys_flag]             CHAR (1)     NULL,
    [ptd_state_cd]         VARCHAR (5)  NULL,
    [ptd_state_code]       VARCHAR (5)  NULL,
    [commercial_acct_flag] CHAR (1)     CONSTRAINT [CDF_state_code_commercial_acct_flag] DEFAULT ('F') NOT NULL,
    [allow_website_images] BIT          CONSTRAINT [CDF_state_code_allow_website_images] DEFAULT (0) NOT NULL,
    [sl_ratio_type_cd]     CHAR (5)     NULL,
    CONSTRAINT [CPK_state_code] PRIMARY KEY CLUSTERED ([state_cd] ASC) WITH (FILLFACTOR = 90)
);


GO



create trigger tr_state_code_delete_insert_update_MemTable
on state_code
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
where szTableName = 'state_code'

GO

