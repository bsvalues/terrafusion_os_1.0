CREATE TABLE [dbo].[fin_event_code] (
    [event_cd]          VARCHAR (15) NOT NULL,
    [event_description] VARCHAR (50) NOT NULL,
    [event_panel_cd]    VARCHAR (10) NOT NULL,
    [allow_multiple]    BIT          NULL,
    [mapped_column]     VARCHAR (50) NULL,
    [enabled]           BIT          CONSTRAINT [CDF_fin_event_code_enabled] DEFAULT ((1)) NULL,
    CONSTRAINT [CPK_fin_event_code] PRIMARY KEY CLUSTERED ([event_cd] ASC),
    CONSTRAINT [CFK_fin_event_code_event_panel_cd] FOREIGN KEY ([event_panel_cd]) REFERENCES [dbo].[fin_event_panel] ([event_panel_cd])
);


GO


create trigger tr_fin_event_code_delete_insert_update_MemTable
on fin_event_code
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
where szTableName = 'fin_event_code'

GO

