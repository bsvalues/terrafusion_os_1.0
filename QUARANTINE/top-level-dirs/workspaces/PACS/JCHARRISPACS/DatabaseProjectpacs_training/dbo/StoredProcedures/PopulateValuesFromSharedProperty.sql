








CREATE PROCEDURE PopulateValuesFromSharedProperty
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
 @timber_loss		numeric(14) output

AS

--shared_prop variables
declare	@new_hs_value		numeric(14)

--shared_prop_value_vw variables
declare @record_type		char(1)
declare @shared_value		numeric(14)
declare @ag_use_code		char(5)
declare @ag_use_value		numeric(14)
declare @homesite_flag		char(1)

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
select  @new_hs_value		= 0
select  @imprv_hs_val		= 0
select  @imprv_nhs_val		= 0
select  @land_hs_val		= 0
select  @land_nhs_val		= 0
select  @ag_use_val		= 0
select  @ag_mkt_val		= 0
select  @timber_use_val		= 0
select  @timber_mkt_val		= 0

--Now loop through the view and increment the appropriate values...
DECLARE SHARED_PROP_VALUE_VW SCROLL CURSOR
FOR select 	record_type,
		IsNull(shared_value, 0),
		ag_use_code,
		IsNull(ag_use_value, 0),
		IsNull(homesite_flag, 'F')

	 from 	shared_prop_value_vw
	 where 	pacs_prop_id	= @input_prop_id
	 and	shared_year	= @input_sup_yr
	 and	shared_cad_code	= @input_cad_code

OPEN SHARED_PROP_VALUE_VW
FETCH NEXT FROM SHARED_PROP_VALUE_VW into	@record_type,
						@shared_value,
						@ag_use_code,
						@ag_use_value,
						@homesite_flag

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

	FETCH NEXT FROM SHARED_PROP_VALUE_VW into	@record_type,
							@shared_value,
							@ag_use_code,
							@ag_use_value,
							@homesite_flag
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

GO

