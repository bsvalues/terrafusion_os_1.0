CREATE TABLE [dbo].[tax_area] (
    [tax_area_id]            INT            NOT NULL,
    [tax_area_number]        VARCHAR (23)   NOT NULL,
    [tax_area_state]         VARCHAR (50)   NULL,
    [tax_area_description]   VARCHAR (255)  NOT NULL,
    [comment]                VARCHAR (2048) NULL,
    [is_inactive_after_year] BIT            CONSTRAINT [CDF_tax_area_is_inactive_after_year] DEFAULT ((0)) NOT NULL,
    [inactive_after_year]    NUMERIC (4)    NULL,
    CONSTRAINT [CPK_tax_area] PRIMARY KEY CLUSTERED ([tax_area_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CUQ_tax_area_tax_area_number] UNIQUE NONCLUSTERED ([tax_area_number] ASC)
);


GO



create trigger tr_tax_area_delete_insert_update_MemTable
on tax_area
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
where szTableName = 'tax_area'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Whether or not this Tax Area becomes inactive after a certain year', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'tax_area', @level2type = N'COLUMN', @level2name = N'is_inactive_after_year';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The year after which this Tax Area becomes inactive', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'tax_area', @level2type = N'COLUMN', @level2name = N'inactive_after_year';


GO

