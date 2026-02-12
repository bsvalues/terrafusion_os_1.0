
CREATE   procedure InsertRecordField
@RecordType	varchar(511),
@TableName	varchar(127),
@ColumnName	varchar(127),
@ColumnDesc	varchar(255),
@ColumnTip 	varchar(255) = null,
@SampleData 	varchar(2047) = null,
@ShowInLetter 	bit = null

as

declare @recordCount	int

select @recordCount = count(*)
from   meta_object_fields with(nolock)
where  records_type = @RecordType and
	table_name = @TableName and
	column_name = @ColumnName

if (@recordCount = 0) 
begin
	insert into meta_object_fields
	(
		records_type,
		table_name,
		column_name,
		column_desc,
		column_tip,
		sample_data,
		show_in_letter
	)
	values
	(
		@RecordType,
		@TableName,
		@ColumnName,
		@ColumnDesc,
		@ColumnTip,
		@SampleData,
		@ShowInLetter
	)
end

GO

