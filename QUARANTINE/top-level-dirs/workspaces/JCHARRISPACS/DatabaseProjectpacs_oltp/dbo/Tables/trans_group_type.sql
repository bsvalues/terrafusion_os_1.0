CREATE TABLE [dbo].[trans_group_type] (
    [trans_group_type_cd]   VARCHAR (10) NOT NULL,
    [trans_group_type_desc] VARCHAR (50) NULL,
    [core_object_type_cd]   VARCHAR (20) NULL,
    [allow_variance]        BIT          CONSTRAINT [CDF_trans_group_type_allow_variance] DEFAULT ((1)) NOT NULL,
    PRIMARY KEY CLUSTERED ([trans_group_type_cd] ASC),
    CONSTRAINT [CFK_trans_group_type_core_object_type_cd] FOREIGN KEY ([core_object_type_cd]) REFERENCES [dbo].[core_object_type] ([core_object_type_cd])
);


GO


create trigger tr_trans_group_type_delete_insert_update_MemTable
on trans_group_type
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
where szTableName = 'trans_group_type'

GO

