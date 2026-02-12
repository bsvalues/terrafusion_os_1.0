
CREATE FUNCTION fn_GetBillFeeCodeComments ( @input_prop_id int, @input_year numeric(4,0))
RETURNS varchar(max)
AS
BEGIN
	declare @output_comments   varchar(max)
	declare @single_comment	varchar(500)
	set @output_comments = ''

	DECLARE COMMENTS CURSOR FAST_FORWARD
	FOR select distinct isnull(comment,'')
		from (
			select comment
			from bill with (nolock)
			where year = @input_year
			and prop_id = @input_prop_id
			and comment is not null

			union all 

			select comment
			from fee with (nolock)
			join fee_property_vw as fpv with(nolock) on
				fpv.fee_id = fee.fee_id
			where year = @input_year
			and prop_id = @input_prop_id
			and comment is not null
		) comments

	OPEN COMMENTS
	FETCH NEXT FROM COMMENTS into @single_comment
	
	while (@@FETCH_STATUS = 0)
	begin
	   if (LEN(@output_comments) = 0)
	   begin 
	      set @output_comments = rtrim(@single_comment)
	   end
	   else 
	   begin
	      set @output_comments = @output_comments + ', ' + rtrim(@single_comment)
	   end
  
  	 FETCH NEXT FROM COMMENTS into @single_comment

	end
	CLOSE COMMENTS
	DEALLOCATE COMMENTS
	RETURN (@output_comments)
END

GO

