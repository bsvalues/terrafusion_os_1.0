


CREATE     procedure InsertMetaLetterReaderType
@ReaderUID		varchar(15),
@ReaderTableName 	varchar(255),
@RecordsType		varchar(511)

as

declare @recordCount	int

select @recordCount = count(*)
from   meta_letter_reader_type with(nolock)
where  reader_uid = @ReaderUID

-- insert only if the record is not already present.
if (@recordCount < 1) 
begin
	insert into meta_letter_reader_type
	(
		reader_uid,
		reader_table_name,
		records_type
	)
	values
	(
		@ReaderUID,
		@ReaderTableName,
		@RecordsType
	)
end

GO

