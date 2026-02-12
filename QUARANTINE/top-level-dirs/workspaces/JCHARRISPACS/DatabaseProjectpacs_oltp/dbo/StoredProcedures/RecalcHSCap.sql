

CREATE PROCEDURE RecalcHSCap
 @input_prop_id         int,
 @input_sup_yr          numeric(4),
 @input_sup_num         int,
 @input_sale_id         int,
 @input_rounding_factor numeric(1),
 @shared_cad_code       varchar(5),
 @debug_flag		varchar(1) = 'F'
AS

--Declare exemption variables
declare @qualify_yr     numeric(4)

--Stored procedure variables
declare @error                  	varchar(255)
declare @exmpt_found            	varchar(1)
declare @first_qualify_yr       	numeric(4)
declare @hs_qualify_yr			numeric(4)
declare @cap_pct                	numeric(2)
declare @cap_year               	numeric(4)
declare @cap_val                	numeric(14)
declare @cap_loss               	numeric(14)
declare @hscap_prev_reappr_yr    	numeric(4)
declare @hscap_base_yr	     		numeric(4)
declare @hscap_base_yr_override  	varchar(1)
declare @prev_yr_sup_num        	int
declare @prev_yr_shared_prop_val        numeric(14)
declare @prev_yr_hs_val         	numeric(14)
declare @prev_yr_hs_val_override        varchar(1)
declare @hscap_prevhsval        	numeric(14)
declare @prev_yr_new_land_hs_val        numeric(14)
declare @prev_yr_land_hs_val    	numeric(14)
declare @prev_yr_new_imp_hs_val         numeric(14)
declare @prev_yr_imprv_hs_val   	numeric(14)
declare @prev_yr_hs_cap_loss    	numeric(14)
declare	@prev_yr_data_exists		varchar(1)
declare @assessed_val           	numeric(14)
declare @appraised_val          	numeric(14)
declare @new_imp_hs_val         	numeric(14)
declare @new_land_hs_val        	numeric(14)
declare @prev_new_imp_hs_val		numeric(14)
declare @prev_new_land_hs_val		numeric(14)
declare @new_hs_val             	numeric(14)
declare @new_hs_val_override    	varchar(1)
declare @hscap_newhsval         	numeric(14)
declare @num_years              	numeric(4)
declare @imprv_hs_val           	numeric(14)
declare @land_hs_val            	numeric(14)
declare @current_hs_val         	numeric(14)
declare @imprv_non_hs_val       	numeric(14)
declare @land_non_hs_val        	numeric(14)
declare @ag_use                 	numeric(14)
declare @timber_use             	numeric(14)
declare @use_shared_prop_val    	varchar(1)
declare @exmpt_1                	varchar(5)
declare @exmpt_2			varchar(5)
declare @new_shared_prop_hsval  	numeric(14)
declare @prev_yr_hs_val_is_0    	varchar(1)
declare @curr_yr_new_hs_val_is_0        varchar(1)

--Initialize the stored procedure variables
set @exmpt_found             = 'F'
set @qualify_yr		     = 0
set @first_qualify_yr        = 0
set @hs_qualify_yr	     = 0
set @cap_year                = 0
set @hscap_prev_reappr_yr    = 0
set @hscap_base_yr	     = 0
set @hscap_base_yr_override  = 'F'
set @prev_yr_sup_num         = 0
set @prev_yr_land_hs_val     = 0
set @prev_yr_imprv_hs_val    = 0
set @prev_yr_hs_cap_loss     = 0
set @prev_yr_hs_val          = 0
set @prev_yr_shared_prop_val = 0
set @prev_yr_data_exists     = 'F'
set @appraised_val           = 0
set @assessed_val            = 0
set @cap_pct                 = 10
set @cap_val                 = 0
set @cap_loss                = 0
set @new_imp_hs_val          = 0
set @new_land_hs_val         = 0
set @prev_new_imp_hs_val     = 0
set @prev_new_land_hs_val    = 0
set @new_hs_val              = 0
set @num_years               = 0
set @imprv_hs_val            = 0
set @land_hs_val             = 0
set @current_hs_val          = 0
set @imprv_non_hs_val        = 0
set @land_non_hs_val         = 0
set @ag_use                  = 0
set @timber_use              = 0
set @hscap_prevhsval         = 0
set @hscap_newhsval          = 0
set @prev_yr_new_land_hs_val = 0
set @prev_yr_new_imp_hs_val  = 0
set @new_shared_prop_hsval   = 0
set @prev_yr_hs_val_is_0     = 'F'
set @curr_yr_new_hs_val_is_0 = 'F'
set @use_shared_prop_val     = case when @shared_cad_code is not null then 'T' else 'F' end
set @exmpt_1 		     = 'HS'
set @exmpt_2		     = 'OV65'

--Loop through all of the owners on the property that have a 'HS' or 'OV65' exemption.  If multiple are found, take the minimum qualify_yr.
DECLARE PROP_OWNER SCROLL CURSOR
FOR select qualify_yr
from property_exemption
where prop_id           = @input_prop_id
and   sup_num           = @input_sup_num
and   exmpt_tax_yr 	= @input_sup_yr
and   owner_tax_yr      = @input_sup_yr
and   ((exmpt_type_cd = @exmpt_1) OR (exmpt_type_cd = @exmpt_2))
order by qualify_yr DESC

OPEN PROP_OWNER
FETCH NEXT FROM PROP_OWNER into @qualify_yr

while (@@FETCH_STATUS = 0)
begin
	set @exmpt_found = 'T'

	if (@qualify_yr is not null)
	begin
		if (@first_qualify_yr = 0)
		begin
			set @first_qualify_yr = @qualify_yr
		end
		else if (@qualify_yr < @first_qualify_yr)
		begin
       			set @first_qualify_yr = @qualify_yr
		end
        end
	else
	begin
		set @first_qualify_yr = 0
	end

        FETCH NEXT FROM PROP_OWNER into @qualify_yr
end

CLOSE PROP_OWNER
DEALLOCATE PROP_OWNER

--Get prev_reapp_yr and hscap_base_yr values from property_val
select @hscap_prev_reappr_yr 	= isnull(hscap_prev_reappr_yr, 0),
       @hscap_base_yr		= isnull(hscap_base_yr, 0),
       @hscap_base_yr_override  = isnull(hscap_base_yr_override, 'F')
from property_val
where   property_val.prop_id     = @input_prop_id
and     property_val.prop_val_yr = @input_sup_yr
and     property_val.sup_num     = @input_sup_num

set @hs_qualify_yr 	= case when @exmpt_found = 'T' then @first_qualify_yr else @hscap_prev_reappr_yr end
set @first_qualify_yr 	= @hs_qualify_yr

if (@hs_qualify_yr = 0)
begin
	set @hs_qualify_yr = null
end

--Set hscap_base_yr
if (@exmpt_found = 'T')
begin
	if (@hscap_base_yr_override = 'F')
	begin
		set @first_qualify_yr = case when (@hscap_prev_reappr_yr > @first_qualify_yr) then @hscap_prev_reappr_yr else @first_qualify_yr end
	end
	else
	begin
		set @first_qualify_yr = @hscap_base_yr
	end
end
else
begin
	set @first_qualify_yr = null
end

if (@debug_flag = 'T') select 'First Qualify Year' = @first_qualify_yr

--They don't qualify for the HS Cap, so update property_val and we are done.
if ((@first_qualify_yr >= @input_sup_yr) or (@exmpt_found = 'F'))
begin
	if (@debug_flag = 'T') select 'DEBUG' = 'Do not qualify'

        update  property_val
        set     property_val.ten_percent_cap  = 0,
		property_val.hscap_qualify_yr = @hs_qualify_yr,
		property_val.hscap_base_yr    = case when @hscap_base_yr_override = 'F' then @first_qualify_yr else @hscap_base_yr end
        from property_val
        where   property_val.prop_id     = @input_prop_id
        and     property_val.prop_val_yr = @input_sup_yr
        and     property_val.sup_num     = @input_sup_num
end
else if ((@first_qualify_yr < @input_sup_yr) and (@first_qualify_yr > 0))
begin
	set @cap_year = case when @first_qualify_yr > 0 then @first_qualify_yr else 0 end

        if (@input_sup_yr >= @cap_year)
        begin
		if (@debug_flag = 'T') select 'DEBUG' = 'Do qualify'

		if exists
		(
			select prop_supp_assoc.sup_num
			from  prop_supp_assoc
			where prop_supp_assoc.prop_id 	   = @input_prop_id
			and   prop_supp_assoc.owner_tax_yr = @cap_year
		)
		begin
			set @prev_yr_data_exists = 'T'

			select @prev_yr_sup_num = prop_supp_assoc.sup_num
			from   prop_supp_assoc
			where  prop_supp_assoc.prop_id 	    = @input_prop_id
			and    prop_supp_assoc.owner_tax_yr = @cap_year
		end
		else
		begin
			--We don't have appraisal value data for the Base Cap Year
			set @prev_yr_data_exists = 'F'
		end

		if (@debug_flag = 'T') select 'prev_yr_data_exists' = @prev_yr_data_exists
		
		if (@prev_yr_data_exists = 'T')
		begin
	                if exists
			(
				select property_val.land_hstd_val,
					property_val.imprv_hstd_val,
					property_val.ten_percent_cap,
					property_val.hscap_prevhsval,
					property_val.hscap_override_prevhsval_flag,
					property_val.hscap_newhsval,
					property_val.hscap_override_newhsval_flag
				from    property_val
				where property_val.prop_id     = @input_prop_id
				and     property_val.prop_val_yr = @cap_year
				and   property_val.sup_num     = @prev_yr_sup_num
			)
	                begin
				select  @prev_yr_land_hs_val            = property_val.land_hstd_val,
					@prev_yr_imprv_hs_val           = property_val.imprv_hstd_val,
					@prev_yr_hs_cap_loss            = property_val.ten_percent_cap,
					@hscap_prevhsval                = property_val.hscap_prevhsval,
					@prev_yr_hs_val_override        = property_val.hscap_override_prevhsval_flag,
					@hscap_newhsval                 = property_val.hscap_newhsval,
					@new_hs_val_override            = property_val.hscap_override_newhsval_flag
				from property_val
				where   property_val.prop_id     = @input_prop_id
				and     property_val.prop_val_yr = @cap_year
				and     property_val.sup_num     = @prev_yr_sup_num

	                end
        	        else
                	begin
	                        --Code added 09/15/99 to cover scenario in which property exists for @input_sup_yr
        	                --but not for @prev_sup_yr - EricZ
                	        set  @prev_yr_land_hs_val            = 0
	                        set  @prev_yr_imprv_hs_val           = 0
        	                set  @prev_yr_hs_cap_loss            = 0
                	        set  @hscap_prevhsval                = 0
                        	set  @prev_yr_hs_val_override        = 0
	                        set  @hscap_newhsval                 = 0
        	                set  @new_hs_val_override            = 0
                	end
		end
                
		if exists
		(
			select property_val.hscap_prevhsval,
				property_val.hscap_override_prevhsval_flag,
				property_val.hscap_newhsval,
				property_val.hscap_override_newhsval_flag
			from    property_val
			where   property_val.prop_id     = @input_prop_id
			and     property_val.prop_val_yr = @input_sup_yr
			and     property_val.sup_num     = @input_sup_num
		)
        	begin
                        select  @hscap_prevhsval                = property_val.hscap_prevhsval,
				@prev_yr_hs_val_override        = property_val.hscap_override_prevhsval_flag,
				@hscap_newhsval                 = property_val.hscap_newhsval,
				@new_hs_val_override            = property_val.hscap_override_newhsval_flag
			from property_val
			where   property_val.prop_id     = @input_prop_id
			and     property_val.prop_val_yr = @input_sup_yr
			and     property_val.sup_num     = @input_sup_num

			if ((@prev_yr_data_exists = 'F') and ((@prev_yr_hs_val_override = 'F') or (@prev_yr_hs_val_override is null)))
			begin
				set @prev_yr_hs_val_override = 'T'

				if exists
				(
					select property_val.imprv_hstd_val,
						property_val.land_hstd_val
					from property_val
					where   property_val.prop_id     = @input_prop_id
					and     property_val.prop_val_yr = @input_sup_yr
					and     property_val.sup_num     = @input_sup_num
				)
		                begin
					set @hscap_prevhsval = 0

       	        		        select @imprv_hs_val        = property_val.imprv_hstd_val,
						@land_hs_val        = property_val.land_hstd_val
					from property_val
					where   property_val.prop_id     = @input_prop_id
					and     property_val.prop_val_yr = @input_sup_yr
					and     property_val.sup_num     = @input_sup_num
		

					set @hscap_prevhsval = case when @imprv_hs_val is not null then @hscap_prevhsval + @imprv_hs_val else @hscap_prevhsval end

					set @hscap_prevhsval = case when @land_hs_val is not null then @hscap_prevhsval + @land_hs_val else @hscap_prevhsval end

					if (@debug_flag = 'T') select 'hscap_prevhsval' = @hscap_prevhsval
       				end

				update property_val set hscap_prevhsval 		= @hscap_prevhsval,
							hscap_override_prevhsval_flag 	= 'T',
							hscap_prevhsval_pacsuser	= pacs_user.pacs_user_id,
							hscap_prevhsval_comment		= 'This value has been populated by the system since the property does not exist for the base cap year.',
							hscap_prevhsval_date		= GetDate()
				from property_val, pacs_user
				where   property_val.prop_id     = @input_prop_id
				and     property_val.prop_val_yr = @input_sup_yr
				and     property_val.sup_num     = @input_sup_num
				and     pacs_user.pacs_user_name = 'System'
			end
       	        end

		if (@debug_flag = 'T') select  prev_yr_land_hs_val            = @prev_yr_land_hs_val
                if (@debug_flag = 'T') select  prev_yr_imprv_hs_val           = @prev_yr_imprv_hs_val
                if (@debug_flag = 'T') select  prev_yr_hs_cap_loss            = @prev_yr_hs_cap_loss
                if (@debug_flag = 'T') select  hscap_prevhsval                = @hscap_prevhsval
                if (@debug_flag = 'T') select  prev_yr_hs_val_override        = @prev_yr_hs_val_override
                if (@debug_flag = 'T') select  hscap_newhsval                 = @hscap_newhsval
                if (@debug_flag = 'T') select  new_hs_val_override            = @new_hs_val_override

                --************************************
                --************************************
                --************************************

                --Calculate the previous year HS Value

                if (@prev_yr_hs_val_override = 'T')
                begin
			set @prev_yr_hs_val = case when @hscap_prevhsval is not null then @prev_yr_hs_val + @hscap_prevhsval else @prev_yr_hs_val end
                end
                else
                begin
                        --Add previous year's Land HS Value
			set @prev_yr_hs_val = case when @prev_yr_land_hs_val is not null then @prev_yr_hs_val + @prev_yr_land_hs_val else @prev_yr_hs_val end

                        --Add previous year's Improvement HS Value
			set @prev_yr_hs_val = case when @prev_yr_imprv_hs_val is not null then @prev_yr_hs_val + @prev_yr_imprv_hs_val else @prev_yr_hs_val end
		
			--Now subtract previous year's HS Cap Loss
			set @prev_yr_hs_val = case when @prev_yr_hs_cap_loss is not null then @prev_yr_hs_val - @prev_yr_hs_cap_loss else @prev_yr_hs_val end
                end

		set @prev_yr_hs_val_is_0 = case when isnull(@prev_yr_hs_val, 0) = 0 then 'T' else 'F' end
                        
                --************************************
                --************************************
                --************************************

                --Figure out HS Cap Percent
		--BEGIN

		if (@cap_year > 0)
		begin
			set @num_years = isnull(@input_sup_yr, 0) - isnull(@cap_year, 0)
		end
		else
		begin
			set @num_years = 1
		end

		if (@debug_flag = 'T') select num_years = @num_years

		if ((@num_years > 0) and (@num_years <= 3))
		begin
			set @cap_pct = @cap_pct * @num_years
		end
		else if (@num_years > 3)
		begin
			set @cap_pct = @cap_pct * 3
		end
		else
		begin
			set @cap_pct = 0
		end

		if (@debug_flag = 'T') select cap_pct = @cap_pct

                set @cap_val = @prev_yr_hs_val * (1 + (@cap_pct / 100))
		--END
		
                if (@new_hs_val_override = 'T')
                begin
                        if (@hscap_newhsval is not null)
                        begin
                                set @cap_val 	= @cap_val + @hscap_newhsval
                                set @new_hs_val = @new_hs_val + @hscap_newhsval
                end
                end
                else
                begin
                        --*********************
      --*********************
                        --*********************
     --*********************
   --*********************




                        --If this is a shared property, grab the New HS Value from the shared_prop record.
                        if (@use_shared_prop_val = 'T')
                        begin
                                if exists
								(
									select new_hs_value
									from    shared_prop
									where   pacs_prop_id    = @input_prop_id
											and     shared_year     = @input_sup_yr
											and     shared_cad_code = @shared_cad_code
											and		sup_num			= @input_sup_num  /*  RK 02042004  */
								)
                                begin
                                        select @new_shared_prop_hsval = new_hs_value 
										from    shared_prop
										where   pacs_prop_id    = @input_prop_id
											and     shared_year     = @input_sup_yr
											and     shared_cad_code = @shared_cad_code
											and		sup_num			= @input_sup_num  /*  RK 02042004  */
                                end

                                if (@new_shared_prop_hsval is not null)
                                begin
                                        set @cap_val    = @cap_val + @new_shared_prop_hsval
                                        set @new_hs_val = @new_hs_val + @new_shared_prop_hsval
                                end
                        end
                        else
                        begin
                                --Get the New Improvment Value for the property
                                if exists
								(
  									select imp_new_val_total from improv_new_value_vw
  									where   prop_id          = @input_prop_id
										and     prop_val_yr      = @input_sup_yr
										and     sup_num          = @input_sup_num
										and     sale_id          = @input_sale_id
										and     imprv_homesite in ('T', 'Y')
  								)
                                begin
		                            select @new_imp_hs_val = sum(imp_new_val_total) from improv_new_value_vw
									where   prop_id          = @input_prop_id
										and     prop_val_yr      = @input_sup_yr
										and     sup_num          = @input_sup_num
										and     sale_id          = @input_sale_id
										and     imprv_homesite in ('T', 'Y')
                                end

								if (@debug_flag = 'T') select new_imp_hs_val = @new_imp_hs_val

								--Get previous New Improvment Value for the property - Added by EricZ 05/06/2002
								if exists
								(
									select imp_new_val_total
									from improv_new_value_vw, prop_supp_assoc
									where improv_new_value_vw.prop_id 	= prop_supp_assoc.prop_id
									and   improv_new_value_vw.prop_val_yr 	= prop_supp_assoc.owner_tax_yr
									and   improv_new_value_vw.sup_num 	= prop_supp_assoc.sup_num
									and   improv_new_value_vw.prop_id 	= @input_prop_id
									and   improv_new_value_vw.prop_val_yr 	> @cap_year
									and   improv_new_value_vw.prop_val_yr 	< @input_sup_yr
									and   improv_new_value_vw.imprv_homesite in ('T', 'Y')
								)
								begin
									select @prev_new_imp_hs_val = sum(imp_new_val_total)
									from improv_new_value_vw, prop_supp_assoc
									where improv_new_value_vw.prop_id 	= prop_supp_assoc.prop_id
										and   improv_new_value_vw.prop_val_yr 	= prop_supp_assoc.owner_tax_yr
										and   improv_new_value_vw.sup_num 	= prop_supp_assoc.sup_num
										and   improv_new_value_vw.prop_id 	= @input_prop_id
										and   improv_new_value_vw.prop_val_yr 	> @cap_year
										and   improv_new_value_vw.prop_val_yr 	< @input_sup_yr
										and   improv_new_value_vw.imprv_homesite in ('T', 'Y')
								end

								if (@debug_flag = 'T') select prev_new_imp_hs_val = @prev_new_imp_hs_val

                                --Get the New Land Value for the property
                                if exists
								(
									select sum_land_new_hs_val from land_detail_new_value_vw
					                where   prop_id         = @input_prop_id
										and     prop_val_yr      = @input_sup_yr
										and     sup_num          = @input_sup_num
										and     sale_id          = @input_sale_id
										and     land_seg_homesite in ('T', 'Y')
										and     effective_tax_year = @input_sup_yr
								)
								begin
			                        select @new_land_hs_val = sum(sum_land_new_hs_val) from land_detail_new_value_vw
									where   prop_id         = @input_prop_id
										and     prop_val_yr      = @input_sup_yr
										and     sup_num          = @input_sup_num
										and     sale_id          = @input_sale_id
										and     land_seg_homesite in ('T', 'Y')
										and     effective_tax_year = @input_sup_yr
                			    end
								
								if (@debug_flag = 'T') select new_land_hs_val = @new_land_hs_val
								
								--Get previous New Land Value for the property - Added by EricZ 05/06/2002
								if exists
								(
									select sum_land_new_hs_val
									from land_detail_new_value_vw, prop_supp_assoc
									where land_detail_new_value_vw.prop_id 		= prop_supp_assoc.prop_id
										and   land_detail_new_value_vw.prop_val_yr 	= prop_supp_assoc.owner_tax_yr
										and   land_detail_new_value_vw.sup_num 		= prop_supp_assoc.sup_num
										and   land_detail_new_value_vw.prop_id 		= @input_prop_id
										and   land_detail_new_value_vw.prop_val_yr 	> @cap_year
										and   land_detail_new_value_vw.prop_val_yr 	< @input_sup_yr
										and   land_detail_new_value_vw.land_seg_homesite in ('T', 'Y')
										and   land_detail_new_value_vw.effective_tax_year > @cap_year
										and   land_detail_new_value_vw.effective_tax_year < @input_sup_yr
								)
								begin
									select @prev_new_land_hs_val = sum(sum_land_new_hs_val)
									from land_detail_new_value_vw, prop_supp_assoc
									where land_detail_new_value_vw.prop_id 		= prop_supp_assoc.prop_id
										and   land_detail_new_value_vw.prop_val_yr 	= prop_supp_assoc.owner_tax_yr
										and   land_detail_new_value_vw.sup_num 		= prop_supp_assoc.sup_num
										and   land_detail_new_value_vw.prop_id 		= @input_prop_id
										and   land_detail_new_value_vw.prop_val_yr 	> @cap_year
										and   land_detail_new_value_vw.prop_val_yr 	< @input_sup_yr
										and   land_detail_new_value_vw.land_seg_homesite in ('T', 'Y')
										and   land_detail_new_value_vw.effective_tax_year > @cap_year
										and   land_detail_new_value_vw.effective_tax_year < @input_sup_yr
								end

								if (@debug_flag = 'T') 	select prev_new_land_hs_val = @prev_new_land_hs_val		

                                if (@new_imp_hs_val is not null)
                                begin
                                        set @cap_val 	= @cap_val + isnull(@new_imp_hs_val, 0) + isnull(@prev_new_imp_hs_val, 0)
                                        set @new_hs_val = @new_hs_val + isnull(@new_imp_hs_val, 0) + isnull(@prev_new_imp_hs_val, 0)
                                end

                                if (@new_land_hs_val is not null)
                                begin
                                        set @cap_val 	= @cap_val + isnull(@new_land_hs_val, 0) + isnull(@prev_new_land_hs_val, 0)
                                        set @new_hs_val = @new_hs_val + isnull(@new_land_hs_val, 0) + isnull(@prev_new_land_hs_val, 0)
	                         	end
		                end

						set @curr_yr_new_hs_val_is_0 = case when isnull(@new_hs_val, 0) = 0 then 'T' else 'F' end
                end
                        
                --Get current year HS/NHS/Ag/Timber Value (appraised value)
                if exists
				(
					select	property_val.imprv_hstd_val,
							property_val.land_hstd_val,
							property_val.imprv_non_hstd_val,
							property_val.land_non_hstd_val,
							property_val.ag_use_val,
							property_val.timber_use
					from property_val
					where   property_val.prop_id     = @input_prop_id
							and     property_val.prop_val_yr = @input_sup_yr
							and     property_val.sup_num     = @input_sup_num
				)
                begin
			        select	@imprv_hs_val        = property_val.imprv_hstd_val,
							@land_hs_val        = property_val.land_hstd_val,
							@imprv_non_hs_val   = property_val.imprv_non_hstd_val,
							@land_non_hs_val    = property_val.land_non_hstd_val,
							@ag_use             = property_val.ag_use_val,
							@timber_use         = property_val.timber_use
					from property_val
					where   property_val.prop_id     = @input_prop_id
							and     property_val.prop_val_yr = @input_sup_yr
							and     property_val.sup_num     = @input_sup_num


					set @current_hs_val = case when @imprv_hs_val is not null then @current_hs_val + @imprv_hs_val else @current_hs_val end

					set @current_hs_val = case when @land_hs_val is not null then @current_hs_val + @land_hs_val else @current_hs_val end
                end

                set @assessed_val = isnull(@cap_val, 0) + isnull(@imprv_non_hs_val, 0) + isnull(@land_non_hs_val, 0) + isnull(@ag_use, 0) + isnull(@timber_use, 0)

                --If the Cap Value is less than the Appraised Value, then the Assessed Value is now the Cap Value
                --Also calculate the HS Cap loss amount and store the value into the property_val table
                if (@cap_val <= @current_hs_val)
                begin                   
                        --Old
			--if ((@curr_yr_new_hs_val_is_0 = 'T') and (@prev_yr_hs_val_is_0 = 'T'))
			--New
					if (@prev_yr_hs_val_is_0 = 'T')
                    begin
			            set @error = 'HS Cap: HS Value of ' + cast(@cap_year as varchar(4)) + ' is 0 and therefore HS Cap Loss is 0.'

                        insert into prop_recalc_errors
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
                                        @input_sale_id,
                                        0, 
                                        0,
                                        0,
                                        @error
                                )

                                set @cap_loss = 0

                                update property_val
                                set     ten_percent_cap = @cap_loss,
                                        hscap_prevhsval = @prev_yr_hs_val,
                                        hscap_newhsval  = @new_hs_val,
										hscap_qualify_yr = @hs_qualify_yr,
										hscap_base_yr    = case when @hscap_base_yr_override = 'F' then @cap_year else @hscap_base_yr end
                                from property_val
                                where   property_val.prop_id     = @input_prop_id
		                 		and     property_val.prop_val_yr = @input_sup_yr
                                and     property_val.sup_num     = @input_sup_num
                        end
                        else
                        begin
                                set @cap_loss = @current_hs_val - @cap_val

				if (@debug_flag = 'T') select cap_loss 		= @cap_loss
				if (@debug_flag = 'T') select assessed_val 	= @assessed_val
				if (@debug_flag = 'T') select hscap_prevhsval 	= @prev_yr_hs_val
				if (@debug_flag = 'T') select hscap_newhsval  	= @new_hs_val

                                update property_val
                                set     ten_percent_cap = @cap_loss,
                                        assessed_val    = @assessed_val,
                                        hscap_prevhsval = @prev_yr_hs_val,
                                        hscap_newhsval  = @new_hs_val,
					hscap_qualify_yr = @hs_qualify_yr,
					hscap_base_yr    = case when @hscap_base_yr_override = 'F' then @first_qualify_yr else @hscap_base_yr end
                                from property_val
                                where   property_val.prop_id     = @input_prop_id
                                and     property_val.prop_val_yr = @input_sup_yr
                                and     property_val.sup_num     = @input_sup_num
                        end
                end
        	else
                begin
			--Old
			--if ((@curr_yr_new_hs_val_is_0 = 'T') and (@prev_yr_hs_val_is_0 = 'T'))
			--New
			if (@prev_yr_hs_val_is_0 = 'T')
                        begin
                                set @error = 'HS Cap: HS Value of ' + cast(@cap_year as varchar(4)) + ' is 0 and therefore HS Cap Loss is 0.'

                                insert into prop_recalc_errors
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
                           		@input_sale_id,
                                        0, 
                                        0,
                                        0,
                                        @error
                                )
                        end

                        set @cap_loss = 0

			if (@debug_flag = 'T') select debug_update = 'debug_update_1'
			if (@debug_flag = 'T') select ten_percent_cap = @cap_loss
			if (@debug_flag = 'T') select hscap_prevhsval  = @prev_yr_hs_val
			if (@debug_flag = 'T') select hscap_newhsval   = @new_hs_val

			update  property_val
			set     ten_percent_cap = @cap_loss,
				hscap_prevhsval = @prev_yr_hs_val,
				hscap_newhsval  = @new_hs_val,
				hscap_qualify_yr = @hs_qualify_yr,
				hscap_base_yr    = case when @hscap_base_yr_override = 'F' then @cap_year else @hscap_base_yr end
			from property_val
			where   property_val.prop_id     = @input_prop_id
			and     property_val.prop_val_yr = @input_sup_yr
			and     property_val.sup_num     = @input_sup_num
                end
        end
        else
        begin
		if (@debug_flag = 'T') select debug_update = 'debug_update_2'

                set @cap_loss = 0

                update  property_val
                set     ten_percent_cap = @cap_loss
                from    property_val
                where   property_val.prop_id     = @input_prop_id
                and     property_val.prop_val_yr = @input_sup_yr
                and     property_val.sup_num     = @input_sup_num
        end
end
else
begin
	if (@debug_flag = 'T') select debug_update = 'debug_update_3'

	set @cap_loss = 0

	update  property_val
        set     property_val.ten_percent_cap  = @cap_loss,
		property_val.hscap_qualify_yr = @hs_qualify_yr,
		property_val.hscap_base_yr    = case when @hscap_base_yr_override = 'F' then @cap_year else @hscap_base_yr end
        from property_val
        where   property_val.prop_id     = @input_prop_id
        and     property_val.prop_val_yr = @input_sup_yr
        and     property_val.sup_num     = @input_sup_num
end

GO

