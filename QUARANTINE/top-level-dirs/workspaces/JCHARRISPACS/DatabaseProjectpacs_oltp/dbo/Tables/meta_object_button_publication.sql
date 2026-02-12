CREATE TABLE [dbo].[meta_object_button_publication] (
    [button_id]   INT           NOT NULL,
    [object_type] INT           CONSTRAINT [CDF_meta_object_button_publication_object_type] DEFAULT ((-1)) NOT NULL,
    [sub_type]    INT           CONSTRAINT [CDF_meta_object_button_publication_sub_type] DEFAULT ((-1)) NOT NULL,
    [role]        INT           CONSTRAINT [CDF_meta_object_button_publication_role] DEFAULT ((-1)) NOT NULL,
    [role_type]   INT           CONSTRAINT [CDF_meta_object_button_publication_role_type] DEFAULT ((-1)) NOT NULL,
    [workflow]    INT           CONSTRAINT [CDF_meta_object_button_publication_workflow] DEFAULT ((-1)) NOT NULL,
    [activity]    INT           CONSTRAINT [CDF_meta_object_button_publication_activity] DEFAULT ((-1)) NOT NULL,
    [verb]        INT           NULL,
    [description] VARCHAR (255) NULL,
    CONSTRAINT [CPK_meta_object_button_publication] PRIMARY KEY CLUSTERED ([button_id] ASC, [object_type] ASC, [sub_type] ASC, [role] ASC, [role_type] ASC, [workflow] ASC, [activity] ASC),
    CONSTRAINT [CFK_meta_object_button_publication_button_id] FOREIGN KEY ([button_id]) REFERENCES [dbo].[meta_object_button] ([button_id]),
    CONSTRAINT [CFK_meta_object_button_publication_object_type] FOREIGN KEY ([object_type]) REFERENCES [dbo].[meta_object_type] ([object_type_id]),
    CONSTRAINT [CFK_meta_object_button_publication_sub_type] FOREIGN KEY ([sub_type]) REFERENCES [dbo].[meta_sub_type] ([sub_type_id]),
    CONSTRAINT [CFK_meta_object_button_publication_verb] FOREIGN KEY ([verb]) REFERENCES [dbo].[meta_verb] ([verb_id])
);


GO


create trigger tr_meta_object_button_publication_delete_insert_update_MemTable
on meta_object_button_publication
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
where szTableName = 'meta_object_button_publication'

GO

