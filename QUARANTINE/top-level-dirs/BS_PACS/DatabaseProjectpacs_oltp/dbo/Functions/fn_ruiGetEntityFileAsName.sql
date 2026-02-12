
CREATE  FUNCTION fn_ruiGetEntityFileAsName ( @input_entity_cd char(5) )
RETURNS varchar(70)
AS
BEGIN
	declare @output_file_as_name   varchar(70)	 
	set @output_file_as_name = ''
	--
	select top 1 @output_file_as_name=ev.file_as_name from entity_vw ev where ev.entity_cd = @input_entity_cd
	select @output_file_as_name = ISNULL( @output_file_as_name,'' ) 
	--	 
	RETURN (@output_file_as_name)
END

GO

