CREATE TABLE [dbo].[depreciation] (
    [type_cd]      CHAR (10)    NOT NULL,
    [deprec_cd]    CHAR (10)    NOT NULL,
    [year]         NUMERIC (4)  NOT NULL,
    [prop_type_cd] CHAR (5)     NOT NULL,
    [description]  VARCHAR (50) NULL,
    [pp_type_cd]   AS           (case when [prop_type_cd]='P' then [type_cd]  end) PERSISTED,
    [dor_schedule] VARCHAR (25) NULL,
    CONSTRAINT [CPK_depreciation] PRIMARY KEY CLUSTERED ([type_cd] ASC, [deprec_cd] ASC, [year] ASC, [prop_type_cd] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_depreciation_pp_type] FOREIGN KEY ([pp_type_cd]) REFERENCES [dbo].[pp_type] ([pp_type_cd])
);


GO

CREATE NONCLUSTERED INDEX [idx_prop_type_cd]
    ON [dbo].[depreciation]([prop_type_cd] ASC) WITH (FILLFACTOR = 90);


GO

create trigger tr_depreciation_delete_insert_update_MemTable
on dbo.depreciation
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
where szTableName = 'depreciation'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Provides the column necessary for FK constraint to pp_type table', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'depreciation', @level2type = N'COLUMN', @level2name = N'pp_type_cd';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'DOR Schedule associated with this depreciation record', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'depreciation', @level2type = N'COLUMN', @level2name = N'dor_schedule';


GO

