


CREATE PROCEDURE CreateNoticeBills
   @input_notice_yr	numeric(4),
   @input_notice_num	int
 
AS
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

/* please note that we will only calculate taxable on those items that are as of supplement 0. The query
only select as of supplement #0 properties */
	

declare @strEntities varchar(8000)
declare @strSQL varchar(8000)

/* please note that we will only calculate taxable on those items that are as of supplement 0. The query
only select as of supplement #0 properties */

/* Make the entity list */
declare curListEntity cursor
for
select distinct
	entity_prop_assoc.entity_id
from
	appr_notice_prop_list,
	entity_prop_assoc
where
	appr_notice_prop_list.prop_id = entity_prop_assoc.prop_id
and	appr_notice_prop_list.sup_num = entity_prop_assoc.sup_num
and	appr_notice_prop_list.sup_yr  = entity_prop_assoc.tax_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	appr_notice_prop_list.notice_yr     = @input_notice_yr
and	not exists
	(
	select
		*
	from
		appr_notice_selection_criteria_omit_entity
	where
		appr_notice_selection_criteria_omit_entity.notice_num = appr_notice_prop_list.notice_num
	and	appr_notice_selection_criteria_omit_entity.notice_yr = appr_notice_prop_list.notice_yr
	and	appr_notice_selection_criteria_omit_entity.entity_id = entity_prop_assoc.entity_id
	)
order by
	entity_prop_assoc.entity_id
for read only

open curListEntity
fetch next from curListEntity into @lEntityID

set @strEntities = ''
set @lIndex = 0
while ( @@fetch_status = 0 )
begin
	if ( @lIndex > 0 )
	begin
		set @strEntities = @strEntities + ','
	end

	set @strEntities = @strEntities + convert(varchar(12), @lEntityID)

	set @lIndex = @lIndex + 1

	fetch next from curListEntity into @lEntityID
end

close curListEntity
deallocate curListEntity


/**************************************************************/
/*                    Supplement 0			      */
/* run calculate taxable for sup 0, if sup 0 is not certified */
/**************************************************************/


if exists (select  * From pacs_year where tax_yr = @input_notice_yr
		and certification_dt is null)
begin

	/* Make the property list */
	delete create_notice_bills_prop_list with(tablockx)
	set @strSQL = 'insert create_notice_bills_prop_list (prop_id) select 	distinct appr_notice_prop_list.prop_id '
	set @strSQL = @strSQL + ' from  appr_notice_prop_list, entity_prop_assoc'
	set @strSQL = @strSQL + ' where appr_notice_prop_list.prop_id = entity_prop_assoc.prop_id'
	set @strSQL = @strSQL + ' and   appr_notice_prop_list.sup_num = entity_prop_assoc.sup_num'
	set @strSQL = @strSQL + ' and   appr_notice_prop_list.sup_yr = entity_prop_assoc.tax_yr'
	set @strSQL = @strSQL + ' and   appr_notice_prop_list.sup_num = 0 '
	set @strSQL = @strSQL + ' and   appr_notice_prop_list.notice_num = ' + convert(varchar(12), @input_notice_num)
	set @strSQL = @strSQL + ' and   appr_notice_prop_list.notice_yr  = ' + convert(varchar(4), @input_notice_yr)
	set @strSQL = @strSQL + ' and   not exists (select *'
	set @strSQL = @strSQL + ' from appr_notice_selection_criteria_omit_entity'
	set @strSQL = @strSQL + ' where appr_notice_selection_criteria_omit_entity.notice_num = appr_notice_prop_list.notice_num'
	set @strSQL = @strSQL + ' and	appr_notice_selection_criteria_omit_entity.notice_yr = appr_notice_prop_list.notice_yr'
	set @strSQL = @strSQL + ' and	appr_notice_selection_criteria_omit_entity.entity_id = entity_prop_assoc.entity_id)'
	set @strSQL = @strSQL + ' order by appr_notice_prop_list.prop_id'

	exec (@strSQL)

	declare @tempSQL 	varchar(2000)
	set @tempSQL = 'select prop_id from create_notice_bills_prop_list'

	declare @count_props int
	set @count_props = 0

	select @count_props = count(*) from create_notice_bills_prop_list
	
	if (@count_props > 0)	
	begin
		exec CalculateTaxable @strEntities, 0, @input_notice_yr, 0, @tempSQL
	end

end


/**************************************************************/
/*                    Supplement > 0			      */
/* run calculate taxable for sup > 0, where the supplement    */
/* has not been accepted.  				      */
/**************************************************************/

declare @t_prop_id	int
declare @t_sup_num	int
declare @t_notice_yr	numeric(4)

declare prop_cursor cursor scroll for
select  anpl.prop_id,
	anpl.sup_num,
	anpl.notice_yr
from appr_notice_prop_list anpl
where anpl.notice_num = @input_notice_num
and   anpl.notice_yr  = @input_notice_yr
and   anpl.sup_num    > 0
and   exists (select  * From sup_group sg, supplement s
		where sg.sup_group_id = s.sup_group_id
		and   sg.status_cd not in ('A', 'BC')
		and   s.sup_num = anpl.sup_num
		and   s.sup_tax_yr = anpl.notice_yr)

open prop_cursor
fetch next from prop_cursor into @t_prop_id, @t_sup_num, @t_notice_yr

while (@@FETCH_STATUS = 0)
begin

	exec CalculateTaxable '', @t_sup_num, @t_notice_yr, @t_prop_id

	fetch next from prop_cursor into @t_prop_id, @t_sup_num, @t_notice_yr

end

close prop_cursor
deallocate prop_cursor


/**************************************************************/
/*                    Future Year Layer			      */
/* run calculate taxable for properties in future layer       */
/**************************************************************/


set @count_props = 0

delete create_notice_bills_prop_list with(tablock)


set @strSQL = 'insert create_notice_bills_prop_list (prop_id) select 	distinct appr_notice_prop_list.prop_id '
set @strSQL = @strSQL + ' from  appr_notice_prop_list, entity_prop_assoc'
set @strSQL = @strSQL + ' where appr_notice_prop_list.prop_id    = entity_prop_assoc.prop_id'
set @strSQL = @strSQL + ' and   appr_notice_prop_list.sup_num    = entity_prop_assoc.sup_num'
set @strSQL = @strSQL + ' and   appr_notice_prop_list.sup_yr     = entity_prop_assoc.tax_yr'
set @strSQL = @strSQL + ' and   appr_notice_prop_list.sup_num    = 32767 '
set @strSQL = @strSQL + ' and   appr_notice_prop_list.notice_num = ' + convert(varchar(12), @input_notice_num)
set @strSQL = @strSQL + ' and   appr_notice_prop_list.notice_yr  = ' + convert(varchar(4), @input_notice_yr)
set @strSQL = @strSQL + ' and   not exists (select *'
set @strSQL = @strSQL + ' from appr_notice_selection_criteria_omit_entity'
set @strSQL = @strSQL + ' where appr_notice_selection_criteria_omit_entity.notice_num = appr_notice_prop_list.notice_num'
set @strSQL = @strSQL + ' and     appr_notice_selection_criteria_omit_entity.notice_yr     = appr_notice_prop_list.notice_yr'
set @strSQL = @strSQL + ' and     appr_notice_selection_criteria_omit_entity.entity_id      = entity_prop_assoc.entity_id)'
set @strSQL = @strSQL + ' order by appr_notice_prop_list.prop_id'

exec (@strSQL)

set @tempSQL = 'select prop_id from create_notice_bills_prop_list'

select @count_props = count(*) from create_notice_bills_prop_list

if (@count_props > 0)	
begin
	exec CalculateTaxable @strEntities, 32767, @input_notice_yr, 0, @tempSQL
end


--26532



DECLARE APPR_NOTICE SCROLL CURSOR 
FOR
select
	appr_notice_prop_list.prop_id,
       	appr_notice_prop_list.owner_id,
	appr_notice_prop_list.notice_owner_id,
	entity_prop_assoc.entity_id,
	appr_notice_prop_list.sup_yr,
	appr_notice_prop_list.sup_num,
	poev.assessed_val,
	poev.imprv_hstd_val, 
	poev.land_hstd_val, 
	poev.ag_use_val,
	poev.timber_use,
	poev.imprv_non_hstd_val, 
	poev.land_non_hstd_val, 
	poev.ten_percent_cap,
	appr_notice_prop_list.prop_type_cd
from
	appr_notice_prop_list,
	entity_prop_assoc,
	prop_owner_entity_val as poev
where
	appr_notice_prop_list.prop_id = entity_prop_assoc.prop_id
and	appr_notice_prop_list.sup_num = entity_prop_assoc.sup_num
and	appr_notice_prop_list.sup_yr  = entity_prop_assoc.tax_yr
and	appr_notice_prop_list.prop_id = poev.prop_id
and	appr_notice_prop_list.notice_owner_id = poev.owner_id
and	appr_notice_prop_list.sup_num = poev.sup_num
and	appr_notice_prop_list.sup_yr = poev.sup_yr
and	entity_prop_assoc.entity_id = poev.entity_id
and	appr_notice_prop_list.notice_num = @input_notice_num
and	appr_notice_prop_list.notice_yr = @input_notice_yr
and	not exists
	(
	select
		*
	from
		appr_notice_selection_criteria_omit_entity
	where
		appr_notice_selection_criteria_omit_entity.notice_num = appr_notice_prop_list.notice_num
	and     appr_notice_selection_criteria_omit_entity.notice_yr = appr_notice_prop_list.notice_yr
	and     appr_notice_selection_criteria_omit_entity.entity_id = entity_prop_assoc.entity_id
	)
		

OPEN APPR_NOTICE
FETCH NEXT FROM APPR_NOTICE
into
	@prop_id,
	@owner_id,
	@notice_owner_id,
	@entity_id,
	@sup_yr,
	@sup_num,
	@assessed_val,
	@imprv_hstd_val,
	@land_hstd_val,
	@ag_land_use_val,
	@timber_use,
	@imprv_non_hstd_val,
	@land_non_hstd_val,
	@ten_percent_cap,
	@prop_type_cd



while (@@FETCH_STATUS = 0)
begin
	if exists
	(
		select
			*
		from
			tax_rate
		where
			entity_id = @entity_id
		and     tax_rate_yr = @sup_yr
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
		and	tax_rate.tax_rate_yr = @sup_yr
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
		select @weed_control = 'F'
	end

	if (@weed_control_pct is null)
	begin
		select @weed_control_pct = 0
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


	select @bill_freeze_amt = 0
	select @frz_taxable_val = 0
     	select @exemption_amt = 0
	select @hs_exmpt_amt = 0
	select @nhs_exmpt_amt = 0

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
		select @assessed_val =  0
	end

	if (@exemption_amt is null)
	begin
		select @exemption_amt = 0
	end

   	if (@weed_control = 'F')
	begin
	      	select @taxable_val  = (@assessed_val - @exemption_amt)
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
		select @taxable_val = 0
	end
			      
	if (@taxable_val < 0)
     	begin 
      		select @taxable_val = 0
      	end
      	if (@m_n_o_tax_pct is null )
      	begin
 		select @m_n_o_tax_pct = 0
      	end
      
      	if (@i_n_s_tax_pct is null)
      	begin
        	select @i_n_s_tax_pct = 0
      	end
      
       
	if (@weed_control = 'F')
	begin
	      	select @m_n_o_tax_value = ((@taxable_val/100) * @m_n_o_tax_pct)
      		select @i_n_s_tax_value = ((@taxable_val/100) * @i_n_s_tax_pct)
	end
	else
	begin
		select @assessed_val = @taxable_val
		select @m_n_o_tax_value = @taxable_val * @weed_control_pct
		select @i_n_s_tax_value = 0
	end
           	
	if (@m_n_o_tax_value is null )
      	begin

 		select @m_n_o_tax_value = 0
      	end
      
      	if (@i_n_s_tax_value is null)
      	begin
        	select @i_n_s_tax_value = 0
      	end

	select @freeze_yr = null
	select @freeze_ceiling = null
	select @use_freeze = 'F'

	select top 1
		@freeze_yr = pf.freeze_yr,
		@freeze_ceiling = pf.freeze_ceiling,
		@use_freeze = pf.use_freeze
	from
		property_freeze as pf with (nolock)
	inner join
		prop_supp_assoc as psa with (nolock)
	on
		psa.prop_id = pf.prop_id
	and	psa.owner_tax_yr = pf.owner_tax_yr
	and	psa.owner_tax_yr = pf.exmpt_tax_yr
	and	psa.sup_num = pf.sup_num
	inner join
		property_val as pv with (nolock)
	on
		pv.prop_id = psa.prop_id
	and	pv.prop_val_yr = psa.owner_tax_yr
	and	pv.sup_num = psa.sup_num
	and	pv.prop_inactive_dt is null
	inner join
		property_exemption as pe with (nolock)
	on
		pe.prop_id = pf.prop_id
	and	pe.owner_id = pf.owner_id
	and	pe.owner_tax_yr = pf.owner_tax_yr
	and	pe.exmpt_tax_yr = pf.exmpt_tax_yr
	and	pe.sup_num = pf.sup_num
	and	pe.exmpt_type_cd = pf.exmpt_type_cd
	inner join
		entity_prop_assoc as epa with (nolock)
	on
		epa.entity_id = pf.entity_id
	and	epa.prop_id = pf.prop_id
	and	epa.tax_yr = pf.owner_tax_yr
	and	epa.tax_yr = pf.exmpt_tax_yr
	and	epa.sup_num = pf.sup_num
	inner join
		entity_exmpt as ee with (nolock)
	on
		ee.entity_id = pf.entity_id
	and	ee.exmpt_type_cd = pf.exmpt_type_cd
	and	ee.exmpt_tax_yr = pf.owner_tax_yr
	and	ee.exmpt_tax_yr = pf.exmpt_tax_yr
	and	ee.freeze_flag = 1
	inner join
		owner as o with (nolock)
	on
		o.prop_id = pf.prop_id
	and	o.owner_id = pf.owner_id
	and	o.owner_tax_yr = pf.owner_tax_yr
	and	o.owner_tax_yr = pf.exmpt_tax_yr
	and	o.sup_num = pf.sup_num
	where
		pf.prop_id = @prop_id
	and	pf.owner_id = @owner_id
	and	pf.exmpt_tax_yr = @sup_yr
	and	pf.owner_tax_yr = @sup_yr
	and	pf.sup_num = @sup_num
	and	pf.entity_id = @entity_id

	if (@taxable_val > 0)
	begin
		if (@prot_i_n_s_tax_pct is null)
      		begin
        		select @prot_i_n_s_tax_pct = 0
      		end

		select @bill_prot_i_n_s = ((@prot_taxable_val / 100) * @prot_i_n_s_tax_pct)

		if (@bill_prot_i_n_s is null)
      		begin
        		select @bill_prot_i_n_s = 0
      		end

		if	(@prop_type_cd = 'R' or @prop_type_cd = 'MH')
		begin
			if (@freeze_yr is not null and @freeze_ceiling is not null and (@use_freeze = 'T') and (convert(int, @freeze_yr) <= @sup_yr))
			begin
				if (((@imprv_hstd_val + @land_hstd_val - @ten_percent_cap) - @exemption_amt) < 0)
				begin
					select @hs_exmpt_amt = (@imprv_hstd_val + @land_hstd_val  - @ten_percent_cap)
					select @nhs_exmpt_amt = (@exemption_amt - (@imprv_hstd_val + @land_hstd_val  - @ten_percent_cap))
				end
				else
				begin
					select @hs_exmpt_amt = @exemption_amt
					select @nhs_exmpt_amt = 0
				end

				select @frz_taxable_val = ((@imprv_hstd_val + @land_hstd_val - @ten_percent_cap) - @hs_exmpt_amt)
				select @bill_freeze_m_n_o = ((@imprv_hstd_val + @land_hstd_val - @ten_percent_cap) - @hs_exmpt_amt) / 100 * @m_n_o_tax_pct
				select @bill_freeze_i_n_s = ((@imprv_hstd_val + @land_hstd_val - @ten_percent_cap) - @hs_exmpt_amt) / 100 * @i_n_s_tax_pct

	      			-- check to see if current taxes are greater then freeze taxes if so, use the freeze values
				if (@freeze_ceiling < (@bill_freeze_m_n_o + @bill_freeze_i_n_s))
				begin
					select @m_n_o_tax_value = @freeze_ceiling * ((@m_n_o_tax_pct) / (@m_n_o_tax_pct + @i_n_s_tax_pct + @prot_i_n_s_tax_pct))
					select @i_n_s_tax_value = @freeze_ceiling * ((@i_n_s_tax_pct) / (@m_n_o_tax_pct + @i_n_s_tax_pct + @prot_i_n_s_tax_pct))
					select @bill_freeze_amt = @freeze_ceiling * ((@m_n_o_tax_pct) / (@m_n_o_tax_pct + @i_n_s_tax_pct + @prot_i_n_s_tax_pct)) +
					  				@freeze_ceiling * ((@i_n_s_tax_pct) / (@m_n_o_tax_pct + @i_n_s_tax_pct + @prot_i_n_s_tax_pct))
	
				end
				else
				begin
					select @m_n_o_tax_value = @bill_freeze_m_n_o
					select @i_n_s_tax_value = @bill_freeze_i_n_s
					select @bill_freeze_amt = @bill_freeze_m_n_o + @bill_freeze_i_n_s
				end

				select @m_n_o_tax_value = @m_n_o_tax_value + ((((@imprv_non_hstd_val + @land_non_hstd_val + @timber_use + @ag_land_use_val) - @nhs_exmpt_amt) / 100) * @m_n_o_tax_pct)
				select @i_n_s_tax_value = @i_n_s_tax_value + ((((@imprv_non_hstd_val + @land_non_hstd_val + @timber_use + @ag_land_use_val) - @nhs_exmpt_amt) / 100) * @i_n_s_tax_pct)
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
	
			select @prot_taxable_val = (@assessed_val - @dv_exemption_amt)
		end
		else
		begin
			select @bill_prot_i_n_s = 0
		end
	end
	else
	begin
		select @bill_prot_i_n_s = 0
	end

	-- throw the protected ins value into the ins value bucket
	select @i_n_s_tax_value = @i_n_s_tax_value + @bill_prot_i_n_s

	insert into appr_notice_prop_list_bill
	(
		notice_yr,
		notice_num,
		prop_id,
		sup_num,
		sup_yr,
		owner_id,
		entity_id,
		bill_m_n_o,
		bill_i_n_s,
		assessed_val,
		taxable_val,
		tax_rate,
		freeze_yr,
		freeze_ceiling,
		use_freeze
	)
	values
	(
		@input_notice_yr,
		@input_notice_num,
		@prop_id,
		@sup_num,
		@sup_yr,
		@owner_id,
		@entity_id,
		@m_n_o_tax_value,
	        @i_n_s_tax_value,
		@assessed_val,
		@taxable_val,
		@m_n_o_tax_pct + @i_n_s_tax_pct,
		@freeze_yr,
		@freeze_ceiling,
		@use_freeze
	)
	
	FETCH NEXT FROM APPR_NOTICE
	into
		@prop_id,
		@owner_id,
		@notice_owner_id,
		@entity_id,
		@sup_yr,
		@sup_num,
		@assessed_val,
		@imprv_hstd_val,
		@land_hstd_val,
		@ag_land_use_val,
		@timber_use,
		@imprv_non_hstd_val,
		@land_non_hstd_val,
		@ten_percent_cap,
		@prop_type_cd
end

CLOSE APPR_NOTICE
DEALLOCATE APPR_NOTICE

GO

