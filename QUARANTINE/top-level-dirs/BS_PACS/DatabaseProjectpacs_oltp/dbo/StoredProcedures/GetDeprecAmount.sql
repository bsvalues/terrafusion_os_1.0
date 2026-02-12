


CREATE PROCEDURE GetDeprecAmount

	@input_yr numeric(4,0),
	@input_type_cd char(5),
	@input_deprec_cd char(10),
	@input_age numeric(3,0),
	@unit_price numeric(14,2) output,
	@deprec_pct numeric(5,2) output

AS

declare @type_cd	  char(5)
declare @deprec_cd	  char(5)
declare @deprec_year_max  numeric(3)
declare @depreciation_pct numeric(5,2)

IF EXISTS (select depreciation.type_cd, depreciation.deprec_cd from depreciation
	where type_cd 	= @input_type_cd
	and   deprec_cd	= @input_deprec_cd
	and   year	= @input_yr)

begin
	if (@input_age is not null)
	begin
		--declare a cursor to be used later
		DECLARE DEPREC_DETAIL SCROLL CURSOR
		FOR select deprec_year_max, deprec_year_pct
		from depreciation_detail 
    		where type_cd		= @input_type_cd
		and   deprec_cd		= @input_deprec_cd
		and   year		= @input_yr
	        	order by deprec_year_max

		OPEN DEPREC_DETAIL
		FETCH NEXT FROM DEPREC_DETAIL into @deprec_year_max, @depreciation_pct

		while (@@FETCH_STATUS = 0)
		begin
			if (@input_age <= @deprec_year_max)
			begin
				--select before_unit_price = @unit_price
				--select deprec_pct = @depreciation_pct/100
				
				select @deprec_pct = @depreciation_pct

				select @unit_price = @unit_price * (@depreciation_pct/100)

				--select after_unit_price = @unit_price
				break				
			end

			FETCH NEXT FROM DEPREC_DETAIL into @deprec_year_max, @depreciation_pct
		end
	
		CLOSE DEPREC_DETAIL
		DEALLOCATE DEPREC_DETAIL
	end
end

GO

