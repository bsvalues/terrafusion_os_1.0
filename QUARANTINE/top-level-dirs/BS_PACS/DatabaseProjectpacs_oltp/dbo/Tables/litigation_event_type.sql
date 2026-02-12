CREATE TABLE [dbo].[litigation_event_type] (
    [litigation_event_cd]   VARCHAR (10) NOT NULL,
    [litigation_event_desc] VARCHAR (50) NOT NULL,
    [show_at_prop_level]    BIT          CONSTRAINT [CDF_litigation_event_type_show_at_prop_level] DEFAULT ((0)) NOT NULL,
    [prop_level_event_cd]   CHAR (20)    NULL,
    [default_recheck_days]  INT          NULL,
    CONSTRAINT [CPK_litigation_event_type] PRIMARY KEY CLUSTERED ([litigation_event_cd] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_litigation_event_type] FOREIGN KEY ([prop_level_event_cd]) REFERENCES [dbo].[event_type] ([event_type_cd])
);


GO


create trigger tr_litigation_event_type_delete_insert_update_MemTable
on litigation_event_type
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
where szTableName = 'litigation_event_type'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'identifies the corresponding property level event code', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'litigation_event_type', @level2type = N'COLUMN', @level2name = N'prop_level_event_cd';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The number of days going forward that the recheck date will be set to', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'litigation_event_type', @level2type = N'COLUMN', @level2name = N'default_recheck_days';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'indicates the event is at the property level', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'litigation_event_type', @level2type = N'COLUMN', @level2name = N'show_at_prop_level';


GO

