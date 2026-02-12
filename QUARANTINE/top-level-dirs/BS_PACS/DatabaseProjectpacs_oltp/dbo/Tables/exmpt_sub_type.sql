CREATE TABLE [dbo].[exmpt_sub_type] (
    [exmpt_sub_type_cd]   VARCHAR (10) NOT NULL,
    [exmpt_sub_type_desc] VARCHAR (30) NOT NULL,
    [exmpt_type_cd]       VARCHAR (10) NULL,
    [disability]          BIT          CONSTRAINT [CDF_exmpt_sub_type_disability] DEFAULT ('false') NOT NULL,
    CONSTRAINT [CPK_exmpt_sub_type] PRIMARY KEY CLUSTERED ([exmpt_sub_type_cd] ASC),
    CONSTRAINT [CFK_exmpt_sub_type_exmpt_type_cd] FOREIGN KEY ([exmpt_type_cd]) REFERENCES [dbo].[exmpt_type] ([exmpt_type_cd])
);


GO


create trigger [dbo].[tr_exmpt_sub_type_delete_insert_update_MemTable]
on [dbo].[exmpt_sub_type]
for delete, insert, update
not for replication
as

if ( @@rowcount = 0 )
   return
   
set nocount on

update table_cache_status with(rowlock)
set lDummy = 0
where szTableName = 'exmpt_sub_type'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Indicates if the exempt sup type is associated with a disability', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'exmpt_sub_type', @level2type = N'COLUMN', @level2name = N'disability';


GO

