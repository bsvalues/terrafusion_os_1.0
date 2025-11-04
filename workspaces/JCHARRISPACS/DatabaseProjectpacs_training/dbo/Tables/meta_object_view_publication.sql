CREATE TABLE [dbo].[meta_object_view_publication] (
    [meta_object_view_id] INT NOT NULL,
    [object_type]         INT NOT NULL,
    [sub_type]            INT NOT NULL,
    [role]                INT NOT NULL,
    [role_type]           INT NOT NULL,
    [workflow]            INT NOT NULL,
    [activity]            INT NOT NULL,
    [system]              BIT CONSTRAINT [CDF_meta_object_view_publication_system] DEFAULT ((1)) NOT NULL,
    CONSTRAINT [CPK_meta_object_view_publication] PRIMARY KEY CLUSTERED ([meta_object_view_id] ASC, [object_type] ASC, [sub_type] ASC, [role] ASC, [role_type] ASC, [workflow] ASC, [activity] ASC),
    CONSTRAINT [CFK_meta_object_view_publication_meta_object_view_id] FOREIGN KEY ([meta_object_view_id]) REFERENCES [dbo].[meta_object_view] ([meta_object_view_id]),
    CONSTRAINT [CFK_meta_object_view_publication_object_type] FOREIGN KEY ([object_type]) REFERENCES [dbo].[meta_object_type] ([object_type_id]),
    CONSTRAINT [CFK_meta_object_view_publication_sub_type] FOREIGN KEY ([sub_type]) REFERENCES [dbo].[meta_sub_type] ([sub_type_id])
);


GO


create trigger tr_meta_object_view_publication_delete_insert_update_MemTable
on meta_object_view_publication
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
where szTableName = 'meta_object_view_publication'

GO

