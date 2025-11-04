
create FUNCTION fn_GetCalculatedTax ( @input_prop_id int, @input_owner_id int,
			              @input_entity_id int, @input_year int, @input_sup_num int )
RETURNS numeric(14,2)
 
AS


BEGIN

declare @prop_id             		int
declare @owner_id            		int
declare @notice_owner_id		int
declare @entity_id           		int
declare @sup_yr          		numeric(4)
declare @sup_num             		int
declare @sup_group_id        		int
declare @assessed_val        		numeric(14,2)
declare @m_n_o_tax_pct      		numeric(13,10)
declare @i_n_s_tax_pct       		numeric(13,10)
declare @prot_i_n_s_tax_pct  		numeric(13,10)
declare @prev_prot_i_n_s_tax_pct 	numeric(13,10)
declare @statement_date      		datetime
declare @effective_due_date  		datetime
declare @m_n_o_tax_value      		numeric(14,2)
declare @i_n_s_tax_value      		numeric(14,2)
declare @prot_i_n_s_tax_value 		numeric(14,2)
declare @taxable_val       		numeric(14,2)
declare @prot_taxable_val		numeric(14,2)
declare @exemption_amt       		numeric(14,2)
declare @dv_exemption_amt      	 	numeric(14,2)
declare @next_bill_id			int
declare @entity_type			char(5)
declare @system_type			char(1)

declare @imprv_hstd_val			numeric(14)
declare @imprv_non_hstd_val		numeric(14)
declare @land_hstd_val			numeric(14)
declare @land_non_hstd_val		numeric(14)
declare @ag_land_use_val		numeric(14)
declare @timber_use			numeric(14)
declare @ten_percent_cap		numeric(14)
declare @prop_type_cd			char(5)

declare @bill_freeze_m_n_o		numeric(14,2)
declare @bill_freeze_i_n_s		numeric(14,2)
declare @bill_prot_i_n_s		numeric(14,2)
declare @bill_late_ag_penalty		numeric(14,2)

declare @bill_freeze_amt		numeric(14,2)
declare @use_freeze			char(1)
declare @frz_taxable_val		numeric(14,2)

declare @freeze_ceiling			numeric(14,2)
declare @freeze_yr			numeric(4,0)

declare @hs_exmpt_amt			numeric(14,2)
declare @nhs_exmpt_amt			numeric(14,2)

declare @collect_option			char(5)
declare @weed_control			char(1)
declare @weed_control_pct		numeric(4,2)
declare @weed_acres			numeric(14,4)
declare @weed_exmpt			varchar(1)

declare @lIndex int
declare @lEntityID int
declare @lPropID int

set @m_n_o_tax_value = 0
set @i_n_s_tax_value = 0



select
	@prop_id            = poev.prop_id,
       	@owner_id           = poev.owner_id,
	@entity_id          = poev.entity_id,
	@sup_yr             = poev.sup_yr,
	@sup_num            = poev.sup_num,
	@assessed_val       = poev.assessed_val,
	@imprv_hstd_val     = poev.imprv_hstd_val, 
	@land_hstd_val      = poev.land_hstd_val, 
	@ag_land_use_val    = poev.ag_use_val,
	@timber_use	    = poev.timber_use,
	@imprv_non_hstd_val = poev.imprv_non_hstd_val, 
	@land_non_hstd_val  = poev.land_non_hstd_val, 
	@ten_percent_cap    = poev.ten_percent_cap,
	@prop_type_cd       = poev.prop_type_cd
from
	prop_owner_entity_val as poev
where poev.prop_id   = @input_prop_id
and   poev.owner_id  = @input_owner_id
and   poev.entity_id = @input_entity_id
and   poev.sup_num   = @input_sup_num
and   poev.sup_yr    = @input_year
		

if (@@ROWCOUNT = 1)
begin
	if exists
	(
		select
			*
		from
			tax_rate
		where
			entity_id = @entity_id
		and     tax_rate_yr = (@sup_yr)
	)
	begin
 
		/* select the tax rates for the entity */
		select
			@m_n_o_tax_pct = tax_rate.m_n_o_tax_pct,
       			@i_n_s_tax_pct = tax_rate.i_n_s_tax_pct,
       			@prot_i_n_s_tax_pct = tax_rate.prot_i_n_s_tax_pct,
       			@statement_date = tax_rate.stmnt_dt,
      			@effective_due_date = tax_rate.effective_due_dt,
       			@entity_type = entity.entity_type_cd,
       			@collect_option = tax_rate.collect_option,
       			@weed_control = entity.weed_control,
       			@weed_control_pct = tax_rate.weed_control_pct
		from
			tax_rate,
			entity
		where
			tax_rate.entity_id = @entity_id
		and	tax_rate.tax_rate_yr = (@sup_yr)
		and	entity.entity_id = tax_rate.entity_id
	end
	else
	begin
		select
			@m_n_o_tax_pct = 0,
       			@i_n_s_tax_pct = 0,
       			@prot_i_n_s_tax_pct = 0,
       			@statement_date = NULL,
      			@effective_due_date = NULL,
       			@entity_type = 'G',
       			@collect_option = NULL,
       			@weed_control = NULL,
       			@weed_control_pct = NULL
	end

	if (@weed_control is null)
	begin
		set @weed_control = 'F'
	end

	if (@weed_control_pct is null)
	begin
		set @weed_control_pct = 0
	end


	if exists
	(
		select
			*
		from
			tax_rate
		where
			entity_id = @entity_id
		and	tax_rate_yr = @sup_yr - 1
	)
	begin
		/* select the previous prot ins tax rates for the entity */
		select
			@prev_prot_i_n_s_tax_pct = tax_rate.prot_i_n_s_tax_pct
		from
			tax_rate,
			entity
		where
			tax_rate.entity_id = @entity_id
		and	tax_rate.tax_rate_yr = (@sup_yr-1)
		and	entity.entity_id = tax_rate.entity_id
	end
	else
	begin
		select @prev_prot_i_n_s_tax_pct = 0
	end


	set @bill_freeze_amt = 0
	set @frz_taxable_val = 0
    	set @exemption_amt = 0
	set @hs_exmpt_amt = 0
	set @nhs_exmpt_amt = 0

	select
		@assessed_val = assessed_val
	from
		prop_owner_entity_val
	where
		prop_id = @prop_id
	and	owner_id = @owner_id
	and	sup_num = @sup_num
	and	entity_id  = @entity_id
	and	sup_yr = @sup_yr

	select
		@exemption_amt = sum(local_amt + state_amt)
	from
		property_entity_exemption
	where
		prop_id = @prop_id
	and	owner_id = @owner_id
	and	sup_num = @sup_num
	and	entity_id = @entity_id
	and	exmpt_tax_yr = @sup_yr
	and	owner_tax_yr = @sup_yr

	if (@assessed_val is null)
	begin
		set @assessed_val =  0
	end

	if (@exemption_amt is null)
	begin
		set @exemption_amt = 0
	end

   	if (@weed_control = 'F')
	begin
	      	set @taxable_val  = (@assessed_val - @exemption_amt)
	end
	else
	begin
		if exists
		(
			select
				exmpt_type_cd
			from
				property_entity_exemption
			where
				prop_id = @prop_id
			and	owner_id = @owner_id
			and	sup_num = @sup_num
			and	entity_id  = @entity_id
			and	exmpt_tax_yr = @sup_yr
			and	owner_tax_yr = @sup_yr
			and	exmpt_type_cd = 'EX'
		)
		begin
			set @weed_exmpt  = 'T'
			set @taxable_val = 0
		end
		else
		begin
			select
				@taxable_val = weed_taxable_acres
	            	from
				prop_owner_entity_val
			where
				prop_id = @prop_id
			and	owner_id = @owner_id
			and	sup_num = @sup_num
			and	entity_id = @entity_id
			and	sup_yr = @sup_yr
		end
	end

	if (@taxable_val is null)
	begin
		set @taxable_val = 0
	end
			      
	if (@taxable_val < 0)
     	begin 
      		set @taxable_val = 0
      	end
      	if (@m_n_o_tax_pct is null )
      	begin
 		set @m_n_o_tax_pct = 0
      	end
      
      	if (@i_n_s_tax_pct is null)
      	begin
        	set @i_n_s_tax_pct = 0
      	end
      
       
	if (@weed_control = 'F')
	begin
	      	set @m_n_o_tax_value = ((@taxable_val/100) * @m_n_o_tax_pct)
      		set @i_n_s_tax_value = ((@taxable_val/100) * @i_n_s_tax_pct)
	end
	else
	begin
		set @assessed_val = @taxable_val
		set @m_n_o_tax_value = @taxable_val * @weed_control_pct
		set @i_n_s_tax_value = 0
	end
           	
	if (@m_n_o_tax_value is null )
      	begin

 		set @m_n_o_tax_value = 0
      	end
      
      	if (@i_n_s_tax_value is null)
      	begin
        	set @i_n_s_tax_value = 0
      	end


	if (@taxable_val > 0)
	begin
		if (@prot_i_n_s_tax_pct is null)
      		begin
        		set @prot_i_n_s_tax_pct = 0
      		end

		select @bill_prot_i_n_s = ((@prot_taxable_val / 100) * @prot_i_n_s_tax_pct)

		if (@bill_prot_i_n_s is null)
      		begin
        		set @bill_prot_i_n_s = 0
      		end

		set @freeze_yr = null
		set @freeze_ceiling = null
		set @use_freeze = 'F'

		if	(@prop_type_cd = 'R' or @prop_type_cd = 'MH')
		begin
			select top 1
				@freeze_yr = freeze_yr,
				@freeze_ceiling = freeze_ceiling,
				@use_freeze = use_freeze
			from
				property_freeze with (nolock)
			where
				prop_id = @prop_id
			and	owner_id = @owner_id
			and	exmpt_tax_yr = @sup_yr
			and	owner_tax_yr = @sup_yr
			and	sup_num = @sup_num
			and	entity_id = @entity_id

			if (@freeze_yr is not null and @freeze_ceiling is not null and (@use_freeze = 'T') and (convert(int, @freeze_yr) <= @sup_yr))
			begin
				if (((@imprv_hstd_val + @land_hstd_val - @ten_percent_cap) - @exemption_amt) < 0)
				begin
					set @hs_exmpt_amt = (@imprv_hstd_val + @land_hstd_val  - @ten_percent_cap)
					set @nhs_exmpt_amt = (@exemption_amt - (@imprv_hstd_val + @land_hstd_val  - @ten_percent_cap))
				end
				else
				begin
					set @hs_exmpt_amt = @exemption_amt
					set @nhs_exmpt_amt = 0
				end

				set @frz_taxable_val = ((@imprv_hstd_val + @land_hstd_val - @ten_percent_cap) - @hs_exmpt_amt)
				set @bill_freeze_m_n_o = ((@imprv_hstd_val + @land_hstd_val - @ten_percent_cap) - @hs_exmpt_amt) / 100 * @m_n_o_tax_pct
				set @bill_freeze_i_n_s = ((@imprv_hstd_val + @land_hstd_val - @ten_percent_cap) - @hs_exmpt_amt) / 100 * @i_n_s_tax_pct

	      			-- check to see if current taxes are greater then freeze taxes if so, use the freeze values
				if (@freeze_ceiling < (@bill_freeze_m_n_o + @bill_freeze_i_n_s))
				begin
					set @m_n_o_tax_value = @freeze_ceiling * ((@m_n_o_tax_pct) / (@m_n_o_tax_pct + @i_n_s_tax_pct + @prot_i_n_s_tax_pct))
					set @i_n_s_tax_value = @freeze_ceiling * ((@i_n_s_tax_pct) / (@m_n_o_tax_pct + @i_n_s_tax_pct + @prot_i_n_s_tax_pct))
					set @bill_freeze_amt = @freeze_ceiling * ((@m_n_o_tax_pct) / (@m_n_o_tax_pct + @i_n_s_tax_pct + @prot_i_n_s_tax_pct)) +
					  				@freeze_ceiling * ((@i_n_s_tax_pct) / (@m_n_o_tax_pct + @i_n_s_tax_pct + @prot_i_n_s_tax_pct))
	
				end
				else
				begin
					set @m_n_o_tax_value = @bill_freeze_m_n_o
					set @i_n_s_tax_value = @bill_freeze_i_n_s
					set @bill_freeze_amt = @bill_freeze_m_n_o + @bill_freeze_i_n_s
				end

				set @m_n_o_tax_value = @m_n_o_tax_value + ((((@imprv_non_hstd_val + @land_non_hstd_val + @timber_use + @ag_land_use_val) - @nhs_exmpt_amt) / 100) * @m_n_o_tax_pct)
				set @i_n_s_tax_value = @i_n_s_tax_value + ((((@imprv_non_hstd_val + @land_non_hstd_val + @timber_use + @ag_land_use_val) - @nhs_exmpt_amt) / 100) * @i_n_s_tax_pct)
			end
		end

		--calculate prot_ins only if the entity is a school and they have a protected ins rate
		if (@entity_type = 'S')
		begin
			select @dv_exemption_amt = 0

			select
				@dv_exemption_amt = sum(local_amt + state_amt)
	        	from
				property_entity_exemption
			where
				prop_id = @prop_id
			and	owner_id = @owner_id
			and	sup_num = @sup_num
			and	entity_id = @entity_id
			and	owner_tax_yr = @sup_yr
			and	exmpt_tax_yr = @sup_yr
			and	exmpt_type_cd like 'DV%'
			
			if (@dv_exemption_amt is null)
			begin
				select @dv_exemption_amt = 0
			end
	
			set @prot_taxable_val = (@assessed_val - @dv_exemption_amt)
		end
		else
		begin
			set @bill_prot_i_n_s = 0
		end
	end
	else
	begin
		set @bill_prot_i_n_s = 0
	end

	-- throw the protected ins value into the ins value bucket
	set @i_n_s_tax_value = @i_n_s_tax_value + @bill_prot_i_n_s

end


return (@m_n_o_tax_value + @i_n_s_tax_value)

END

GO

