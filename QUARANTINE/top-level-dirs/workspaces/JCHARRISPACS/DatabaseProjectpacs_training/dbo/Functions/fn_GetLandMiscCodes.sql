
create function fn_GetLandMiscCodes
(
	@year numeric(4,0),
	@sup_num int,
	@prop_id int
)
returns varchar(511)

as

begin
	
		declare @ret varchar(511)
		set @ret = ''
		
		declare @misc_code varchar(6)
		
		declare curLMC cursor
		for
				select distinct misc_code
				from property_land_misc_code with(nolock)
				where
						prop_val_yr = @year and
						sup_num = @sup_num and
						prop_id = @prop_id and
						sale_id = 0
				order by 1
		for read only

		open curLMC
		fetch next from curLMC into @misc_code
		while ( @@fetch_status = 0 )
		begin
				if ( @ret <> '' )
						set @ret = @ret + ','
				
				set @ret = @ret + @misc_code
				
				fetch next from curLMC into @misc_code
		end
		
		close curLMC
		deallocate curLMC
		
		return @ret
		
end

GO

