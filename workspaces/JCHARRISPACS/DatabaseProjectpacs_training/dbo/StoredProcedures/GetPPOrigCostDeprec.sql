


CREATE PROCEDURE GetPPOrigCostDeprec

	@input_yr numeric(4),
	@pp_yr_acquired	numeric(4),
	@pp_deprec_type_cd char(5),
	@pp_deprec_deprec_cd char(10),
	@deprec_pct	numeric(5,2) output,
	@bOutputRS bit = 1

AS


declare @age		  numeric(4)
declare @deprec_year_max  numeric(3)
declare @depreciation_pct numeric(5,2)
declare @error		  varchar(100)
declare @table_found	  char(1)
declare @value_found	  char(1)

select @table_found = 'F'
select @value_found = 'F'


set @deprec_pct = 100


if (@pp_yr_acquired is not null)
begin
	--calculate the age to be used in finding the depreciation percent
	select @age = @input_yr - @pp_yr_acquired

	if (@age > 0)
	begin

		--declare a cursor to be used later
		DECLARE DEPREC_DETAIL SCROLL CURSOR
		FOR select deprec_year_max, deprec_year_pct
		from depreciation_detail 
    		where type_cd		= @pp_deprec_type_cd
		and   deprec_cd		= @pp_deprec_deprec_cd
		and   year		= @input_yr
	        	order by deprec_year_max

		OPEN DEPREC_DETAIL
		FETCH NEXT FROM DEPREC_DETAIL into @deprec_year_max, @depreciation_pct

		while (@@FETCH_STATUS = 0)
		begin
			select @table_found = 'T'


			if (@age <= @deprec_year_max)
			begin
				select @deprec_pct = @depreciation_pct
				select @value_found = 'T'
				break				
			end

			FETCH NEXT FROM DEPREC_DETAIL into @deprec_year_max, @depreciation_pct
		end

		CLOSE DEPREC_DETAIL
		DEALLOCATE DEPREC_DETAIL

		if (@table_found <> 'T')
		begin
			--Now look for the wildcard value depreciation table...
			DECLARE DEPREC_DETAIL SCROLL CURSOR
			FOR select deprec_year_max, deprec_year_pct
			from depreciation_detail 
	    		where type_cd		= '*'
			and   deprec_cd		= @pp_deprec_deprec_cd
			and   year		= @input_yr
		        	order by deprec_year_max

			OPEN DEPREC_DETAIL
			FETCH NEXT FROM DEPREC_DETAIL into @deprec_year_max, @depreciation_pct

			while (@@FETCH_STATUS = 0)
			begin
				select @table_found = 'T'

				if (@age <= @deprec_year_max)
				begin
					select @deprec_pct = @depreciation_pct
					select @value_found = 'T'
					break				

				end

				FETCH NEXT FROM DEPREC_DETAIL into @deprec_year_max, @depreciation_pct
			end

			CLOSE DEPREC_DETAIL
			DEALLOCATE DEPREC_DETAIL
		end
		
		if (@table_found <> 'T')
		begin
			--Now look for the other wildcard depreciation table...
			DECLARE DEPREC_DETAIL SCROLL CURSOR
			FOR select deprec_year_max, deprec_year_pct
			from depreciation_detail 
	    		where type_cd		= @pp_deprec_type_cd
			and   deprec_cd		= '*'
			and   year		= @input_yr
		        	order by deprec_year_max

			OPEN DEPREC_DETAIL
			FETCH NEXT FROM DEPREC_DETAIL into @deprec_year_max, @depreciation_pct

			while (@@FETCH_STATUS = 0)
			begin
				select @table_found = 'T'

				if (@age <= @deprec_year_max)
				begin
					select @deprec_pct = @depreciation_pct
					select @value_found = 'T'
					break				
				end

				FETCH NEXT FROM DEPREC_DETAIL into @deprec_year_max, @depreciation_pct
			end

			CLOSE DEPREC_DETAIL
			DEALLOCATE DEPREC_DETAIL
		end

		if (@table_found <> 'T')
		begin
			--Now look for the pure wildcard depreciation table...
			DECLARE DEPREC_DETAIL SCROLL CURSOR
			FOR select deprec_year_max, deprec_year_pct
			from depreciation_detail 
	    		where type_cd		= '*'
			and   deprec_cd		= '*'
			and   year		= @input_yr
		        order by deprec_year_max

			OPEN DEPREC_DETAIL
			FETCH NEXT FROM DEPREC_DETAIL into @deprec_year_max, @depreciation_pct

			while (@@FETCH_STATUS = 0)
			begin
				if (@age <= @deprec_year_max)
				begin
					select @deprec_pct = @depreciation_pct
					select @value_found = 'T'
					break				
				end

				FETCH NEXT FROM DEPREC_DETAIL into @deprec_year_max, @depreciation_pct
			end

			CLOSE DEPREC_DETAIL
			DEALLOCATE DEPREC_DETAIL
		end
	end

	set nocount off

	if ( @bOutputRS = 1 )
	begin
		select depr_pct = @deprec_pct
	end



end

GO

