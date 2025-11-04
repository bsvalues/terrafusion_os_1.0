CREATE TABLE [dbo].[pacs_data_entry_field] (
    [field_id]             INT            NOT NULL,
    [field_type]           INT            NOT NULL,
    [field_name]           NVARCHAR (100) NULL,
    [pacs_table_name]      VARCHAR (50)   NOT NULL,
    [pacs_column_name]     VARCHAR (50)   NOT NULL,
    [field_data_type]      INT            NOT NULL,
    [code_table_name]      VARCHAR (50)   NULL,
    [code_column_name]     NVARCHAR (30)  NULL,
    [desc_column_name]     NVARCHAR (30)  NULL,
    [secondary_table_name] NVARCHAR (50)  NULL,
    [input_parms]          NVARCHAR (150) NULL,
    [required]             BIT            CONSTRAINT [CDF_pacs_data_entry_field_required] DEFAULT ((0)) NOT NULL,
    [override_field]       NVARCHAR (100) NULL,
    [code_allows_null]     BIT            NULL,
    [is_year]              BIT            CONSTRAINT [CDF_pacs_data_entry_field_is_year] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_pacs_data_entry_field] PRIMARY KEY CLUSTERED ([field_id] ASC),
    CONSTRAINT [CFK_pacs_data_entry_field_pacs_data_entry_field_type] FOREIGN KEY ([field_type]) REFERENCES [dbo].[pacs_data_entry_field_type] ([field_type])
);


GO




create trigger tr_pacs_data_entry_field_delete_insert_update_MemTable
on pacs_data_entry_field
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
where szTableName = 'pacs_data_entry_field'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Table name where group codes are retrieved', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_data_entry_field', @level2type = N'COLUMN', @level2name = N'code_table_name';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Field Description used in the Grid', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_data_entry_field', @level2type = N'COLUMN', @level2name = N'field_name';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Keeps up with wether a field is a year', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_data_entry_field', @level2type = N'COLUMN', @level2name = N'is_year';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Parms needed to retrieve group codes from a table (i.e. year)', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_data_entry_field', @level2type = N'COLUMN', @level2name = N'input_parms';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Column Name of the Table the group code is retrieved', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_data_entry_field', @level2type = N'COLUMN', @level2name = N'code_column_name';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Table where the field data is retrieved', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_data_entry_field', @level2type = N'COLUMN', @level2name = N'pacs_table_name';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'All Valid Fields for Pacs Data Entry Template and Grids', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_data_entry_field';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Field is required for a new record', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_data_entry_field', @level2type = N'COLUMN', @level2name = N'required';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Column Name of the actual field in property, improvements, or land details', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_data_entry_field', @level2type = N'COLUMN', @level2name = N'pacs_column_name';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Primary Key for a Valid Field', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_data_entry_field', @level2type = N'COLUMN', @level2name = N'field_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Field has an override', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_data_entry_field', @level2type = N'COLUMN', @level2name = N'override_field';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Group Code Description Column Name', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_data_entry_field', @level2type = N'COLUMN', @level2name = N'desc_column_name';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The data type of the field', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_data_entry_field', @level2type = N'COLUMN', @level2name = N'field_data_type';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The type of field (property, improvement, improvement details, improvement attribute, or land details)', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_data_entry_field', @level2type = N'COLUMN', @level2name = N'field_type';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Does the code type allow null values.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_data_entry_field', @level2type = N'COLUMN', @level2name = N'code_allows_null';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Secondary Table codes are retrieved', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_data_entry_field', @level2type = N'COLUMN', @level2name = N'secondary_table_name';


GO

