CREATE TABLE [dbo].[link_sub_type] (
    [link_sub_type_cd]       VARCHAR (5)  NOT NULL,
    [link_sub_type_desc]     VARCHAR (20) NOT NULL,
    [link_type_cd]           VARCHAR (5)  NOT NULL,
    [tax_comparison]         BIT          NULL,
    [state_assessed_utility] BIT          NULL,
    [annexation]             BIT          NULL,
    [u500]                   BIT          NULL,
    [mobile_home]            BIT          NULL,
    [personal_property]      BIT          CONSTRAINT [CDF_link_sub_type_personal_property] DEFAULT ((0)) NOT NULL,
    [use_in_link_summary]    BIT          CONSTRAINT [CDF_link_sub_type_use_in_link_summary] DEFAULT ((0)) NULL,
    CONSTRAINT [CPK_link_sub_type] PRIMARY KEY CLUSTERED ([link_sub_type_cd] ASC, [link_type_cd] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_link_sub_type_link_type_cd] FOREIGN KEY ([link_type_cd]) REFERENCES [dbo].[link_type_code] ([prop_link_type_cd])
);


GO


create trigger tr_link_sub_type_delete_insert_update_MemTable
on link_sub_type
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
where szTableName = 'link_sub_type'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Personal Property Flag', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'link_sub_type', @level2type = N'COLUMN', @level2name = N'personal_property';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Specifies whether to include in link summary or not', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'link_sub_type', @level2type = N'COLUMN', @level2name = N'use_in_link_summary';


GO

