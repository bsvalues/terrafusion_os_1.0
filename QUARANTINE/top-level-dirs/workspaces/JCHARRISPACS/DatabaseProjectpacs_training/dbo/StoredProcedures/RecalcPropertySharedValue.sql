
CREATE PROCEDURE [dbo].RecalcPropertySharedValue
 @input_prop_id 	int,
 @input_sup_yr  	numeric(4),
 @input_sup_num	int,
 @input_cad_code	char(5),
 @input_rounding_factor	numeric(1),
 @imprv_hs_val		numeric(14) OUTPUT,
 @imprv_nhs_val	numeric(14) OUTPUT,
 @land_hs_val		numeric(14) OUTPUT,
 @land_nhs_val		numeric(14) OUTPUT,
 @ag_use_val		numeric(14) OUTPUT,
 @ag_mkt_val		numeric(14) OUTPUT,
 @ag_loss		numeric(14) OUTPUT,
 @timber_use_val	numeric(14) OUTPUT,
 @timber_mkt_val	numeric(14) OUTPUT,
 @timber_loss		numeric(14) output,
 @other_mkt_val		numeric(14) OUTPUT,
 @new_val_hs		numeric(14) output,
 @new_val_nhs		numeric(14) output

AS

--shared_prop variables
declare	@new_hs_value		numeric(14)

--shared_prop_value_vw variables
declare @record_type		char(2)
declare @shared_value		numeric(14)
declare @ag_use_code		char(5)
declare @ag_use_value		numeric(14)
declare @homesite_flag		char(1)
declare @imp_new_value		numeric(14,2)
declare @land_new_value		numeric(14,2)

declare @error varchar(150)

--shared_prop_value variables
/*declare @imprv_hs_val		numeric(14)
declare @imprv_nhs_val		numeric(14)
declare @land_hs_val		numeric(14)
declare @land_nhs_val		numeric(14)
declare @ag_use_val		numeric(14)
declare @ag_mkt_val		numeric(14)
declare @timber_use_val		numeric(14)
declare @timber_mkt_val		numeric(14) */

--Initialize the variables...
set  @new_hs_value		= 0
set  @imprv_hs_val		= 0
set  @imprv_nhs_val		= 0
set  @land_hs_val		= 0
set  @land_nhs_val		= 0
set  @ag_use_val		= 0
set  @ag_mkt_val		= 0
set  @timber_use_val		= 0
set  @timber_mkt_val		= 0
set  @other_mkt_val		= 0
set @new_val_hs = 0
set @new_val_nhs = 0
set @imp_new_value = 0
set @land_new_value = 0
set @error = ''



--Now loop through the view and increment the appropriate values...
DECLARE SHARED_PROP_VALUE_VW SCROLL CURSOR
FOR select 	rtrim(record_type),
		IsNull(shared_value, 0),
		ag_use_code,
		IsNull(ag_use_value, 0),
		IsNull(homesite_flag, 'F'),
		isnull(imp_new_value, 0),
		isnull(land_new_value, 0)

	 from 	shared_prop_value_vw
	 where 	pacs_prop_id	= @input_prop_id
	 and	shared_year	= @input_sup_yr
	 and	shared_cad_code	= @input_cad_code
	 and	sup_num		= @input_sup_num	

OPEN SHARED_PROP_VALUE_VW
FETCH NEXT FROM SHARED_PROP_VALUE_VW into	@record_type,
						@shared_value,
						@ag_use_code,
						@ag_use_value,
						@homesite_flag,
						@imp_new_value,
						@land_new_value

while (@@FETCH_STATUS = 0)
begin
	--First check to see if the @record_type is a 'L' for Land or a 'I' for Improvement
	if (@record_type = 'I')
	begin
		if (@homesite_flag = 'T')
		begin
			set @imprv_hs_val = @imprv_hs_val + @shared_value
		end
		else
		begin
			set @imprv_nhs_val = @imprv_nhs_val + @shared_value
		end
	end
	else if (@record_type = 'L')
	begin
		if ((@homesite_flag = 'T') AND (@ag_use_code is null))
		begin
			set @land_hs_val = @land_hs_val + @shared_value
		end
		else if ((@homesite_flag = 'F') AND (@ag_use_code is null))
		begin
			set @land_nhs_val = @land_nhs_val + @shared_value
		end

		if ((@ag_use_code = '1D') OR (@ag_use_code = '1D1'))
		begin
			if (@shared_value > 0)
			begin
				set @ag_mkt_val = @ag_mkt_val + @shared_value
			end
			
			if (@ag_use_value > 0)
			begin
				set @ag_use_val = @ag_use_val + @ag_use_value
			end
		end
		else if (@ag_use_code = 'TIM')
		begin
			if (@shared_value > 0)
			begin
				set @timber_mkt_val = @timber_mkt_val + @shared_value
			end
			
			if (@ag_use_value > 0)
			begin
				set @timber_use_val = @timber_use_val + @ag_use_value
			end
		end
	end
	else if (@record_type in ('A', 'MN', 'M', 'P'))
	begin
		if (@shared_value > 0)
		begin
			set @other_mkt_val = @other_mkt_val + @shared_value
		end
	
	end




	FETCH NEXT FROM SHARED_PROP_VALUE_VW into	@record_type,
							@shared_value,
							@ag_use_code,
							@ag_use_value,
							@homesite_flag,
							@imp_new_value,	
							@land_new_value
end

CLOSE SHARED_PROP_VALUE_VW
DEALLOCATE SHARED_PROP_VALUE_VW


set @ag_loss      = @ag_mkt_val - @ag_use_val
set @timber_loss = @timber_mkt_val - @timber_use_val



if (@ag_loss < 0)
begin
	set @ag_loss = 0
end

if (@timber_loss < 0)
begin
	set @timber_loss = 0
end

if @imp_new_value <= @imprv_hs_val
begin
	set @new_val_hs = @imp_new_value
end
else if @imp_new_value <= @imprv_nhs_val
begin
	set @new_val_nhs = @imp_new_value
end
else if @imp_new_value <= @imprv_hs_val + @imprv_nhs_val
begin
	set @new_val_hs = @imprv_hs_val
	set @new_val_nhs = @imp_new_value - @imprv_hs_val
end
else if @imp_new_value <= @imprv_hs_val + @imprv_nhs_val + @land_hs_val + @land_nhs_val
begin
	set @new_val_hs = @imprv_hs_val + @land_hs_val
	set @new_val_nhs = @imprv_nhs_val + @land_nhs_val
end
else
begin
	set @error = 'The improvement new value from the shared cad exceeds the total improvement value.'

	insert 
	into prop_recalc_errors
	(
		prop_id, 
		sup_num, 
		sup_yr, 
		sale_id,
		imprv_id,
		imprv_detail_id,
		land_detail_id,
		error
	)
	values
	(
		@input_prop_id,
		@input_sup_num,
		@input_sup_yr,
		0,
		0,
		0,
		0,
		@error
	)
end

GO

