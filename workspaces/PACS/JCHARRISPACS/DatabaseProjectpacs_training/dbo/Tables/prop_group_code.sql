CREATE TABLE [dbo].[prop_group_code] (
    [group_cd]           VARCHAR (20)  NOT NULL,
    [group_desc]         VARCHAR (50)  NULL,
    [sys_flag]           VARCHAR (1)   NULL,
    [alert_user]         CHAR (1)      NULL,
    [comments]           VARCHAR (500) NULL,
    [alert_reet_present] CHAR (1)      NULL,
    [create_id]          INT           DEFAULT ((0)) NOT NULL,
    [create_dt]          DATETIME      DEFAULT (getdate()) NOT NULL,
    [alert_role]         CHAR (1)      CONSTRAINT [CDF_prop_group_code_alert_role] DEFAULT ('B') NOT NULL,
    [notify_comment]     VARCHAR (80)  NULL,
    [inactive]           BIT           CONSTRAINT [CDF_prop_group_code_inactive] DEFAULT ((0)) NOT NULL,
    [mh_movement]        BIT           CONSTRAINT [CDF_prop_group_code_mh_movement] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_prop_group_code] PRIMARY KEY CLUSTERED ([group_cd] ASC) WITH (FILLFACTOR = 100)
);


GO



create trigger tr_prop_group_code_delete_insert_update_MemTable
on prop_group_code
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
where szTableName = 'prop_group_code'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The notification comment displayed when the notify flag is true.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'prop_group_code', @level2type = N'COLUMN', @level2name = N'notify_comment';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Specifies which user role to alert. T for Treasurer, A for Assessor, B for both or N for none', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'prop_group_code', @level2type = N'COLUMN', @level2name = N'alert_role';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Identifies a MH Movement code', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'prop_group_code', @level2type = N'COLUMN', @level2name = N'mh_movement';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Indicates if a group code is active or not.  Codes not active are not included in lists.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'prop_group_code', @level2type = N'COLUMN', @level2name = N'inactive';


GO

