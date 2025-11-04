CREATE TABLE [dbo].[event_type] (
    [event_type_cd]        CHAR (20)    NOT NULL,
    [event_type_desc]      VARCHAR (50) NULL,
    [sys_flag]             CHAR (1)     NULL,
    [event_type_flag]      CHAR (1)     NULL,
    [system_type]          CHAR (5)     NULL,
    [event_user_right]     CHAR (1)     NULL,
    [acct_type_cd]         VARCHAR (5)  NULL,
    [boe_indicator]        BIT          CONSTRAINT [CDF_event_type_boe_indicator] DEFAULT ((0)) NOT NULL,
    [event_source_cd]      VARCHAR (20) CONSTRAINT [CDF_event_type_event_source_cd] DEFAULT ('NONE') NOT NULL,
    [inactive]             BIT          CONSTRAINT [CDF_event_type_inactive] DEFAULT ((0)) NOT NULL,
    [default_recheck_days] INT          NULL,
    CONSTRAINT [CPK_event_type] PRIMARY KEY CLUSTERED ([event_type_cd] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [FK_event_source_cd] FOREIGN KEY ([event_source_cd]) REFERENCES [dbo].[event_source_type] ([event_source_cd])
);


GO



create trigger tr_event_type_delete_insert_update_MemTable
on event_type
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
where szTableName = 'event_type'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Specifies whether the event type is inactive', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'event_type', @level2type = N'COLUMN', @level2name = N'inactive';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Stores the event_source_cd', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'event_type', @level2type = N'COLUMN', @level2name = N'event_source_cd';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The number of days going forward that the recheck date will be set to', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'event_type', @level2type = N'COLUMN', @level2name = N'default_recheck_days';


GO

