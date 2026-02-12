
create procedure dbo.UpdateTransferFreeze

@input_tax_yr			numeric(4),
@input_mode 			char(1) = 'T',
@input_calculate_taxable	bit = 0

as


declare @prop_id     		int
declare @owner_tax_yr 		numeric(4)
declare @sup_num     		int		
declare @land_hstd_val    	numeric(14)
declare @imprv_hstd_val   	numeric(14)
declare @new_val_hs		numeric(14)
declare @new_val_nhs		numeric(14)
declare @new_val_taxable	numeric(14)
declare @ten_percent_cap	numeric(14)
declare @entity_id   		int
declare @owner_id    		int
declare @exmpt_type_cd 		char(5)
declare @use_freeze 		char(1)
declare @transfer_dt            datetime     	
declare @transfer_pct		numeric(9,6)
declare @qualify_yr		numeric(4)

declare @m_n_o_tax_pct   	numeric(13,10)
declare @i_n_s_tax_pct		numeric(13,10)

declare @tax_amt		numeric(14,2)
declare @curr_tax_amt		numeric(14,2)
declare @prev_tax_amt		numeric(14,2)

declare @exemption_amt		numeric(14,2)
declare @hs_exmpt_amt		numeric(14,2)

declare @new_val_tax_amt	numeric(14,2)

declare @poev_frz_assessed	numeric(14,0)
declare @poev_frz_taxable	numeric(14,0)


if (@input_calculate_taxable = 1)
begin
	if exists
	(
		select
			*
		from
			dbo.sysobjects
		where
			id = object_id(N'dbo.tmp_update_freeze_prop_list')
	)
	begin
		truncate table dbo.tmp_update_freeze_prop_list
	end
	else
	begin
		create table dbo.tmp_update_freeze_prop_list
		(
			prop_id int
		)
	end
	
	insert into
		dbo.tmp_update_freeze_prop_list
	(
		prop_id
	)
	select distinct
		psa.prop_id
	from
		entity_prop_assoc as epa with (nolock)
	inner join
		prop_supp_assoc as psa with (nolock)
	on
		epa.prop_id = psa.prop_id
	and	epa.tax_yr = psa.owner_tax_yr
	and	epa.sup_num = psa.sup_num
	inner join
		property_val as pv with (nolock)
	on
		psa.prop_id = pv.prop_id
	and	psa.owner_tax_yr = pv.prop_val_yr
	and	psa.sup_num = pv.sup_num
	and	pv.prop_inactive_dt is null
	inner join
		property_exemption as pe with (nolock)
	on 
		pv.prop_id = pe.prop_id
	and	pv.prop_val_yr = pe.owner_tax_yr
	and	pv.prop_val_yr = pe.exmpt_tax_yr
	and	pv.sup_num = pe.sup_num
	and	(
			pe.qualify_yr = @input_tax_yr
		or	pe.qualify_yr = (@input_tax_yr - 1)
		or	isnull(pv.new_val_hs, 0) > 0
		)
	inner join
		entity_exmpt as ee with (nolock)
	on
		epa.entity_id = ee.entity_id
	and	pe.exmpt_type_cd = ee.exmpt_type_cd
	and	pe.exmpt_tax_yr = ee.exmpt_tax_yr
	and	pe.owner_tax_yr = ee.exmpt_tax_yr
	and	ee.freeze_flag = 1
	left outer join
		property_freeze as pf with (nolock)
	on
		pe.prop_id = pf.prop_id
	and	pe.owner_id = pf.owner_id
	and	pe.owner_tax_yr = pf.owner_tax_yr
	and	pe.exmpt_tax_yr = pf.exmpt_tax_yr
	and	pe.sup_num = pf.sup_num
	and	pe.exmpt_type_cd = pf.exmpt_type_cd
	and	epa.entity_id = pf.entity_id
	where
		epa.tax_yr = @input_tax_yr
	and	epa.sup_num = 0
	
	
	declare @prop_count int
	
	select
		@prop_count = count(*)
	from
		dbo.tmp_update_freeze_prop_list with (nolock)
	
	if (@prop_count > 0)
	begin
		exec CalculateTaxable '', 0, @input_tax_yr, 0, 'select prop_id from dbo.tmp_update_freeze_prop_list with (nolock)'
	end
	
	drop table dbo.tmp_update_freeze_prop_list
end

delete from update_freeze

declare PROPERTY scroll cursor
for
select
	psa.prop_id, 
	psa.owner_tax_yr,
	psa.sup_num,
	isnull(poev.land_hstd_val, 0),
	isnull(poev.imprv_hstd_val, 0),
	isnull(poev.new_val_hs, 0),
	isnull(poev.new_val_nhs, 0),
	isnull(poev.new_val_taxable, 0),
	epa.entity_id, 
	pe.owner_id, 
	pe.exmpt_type_cd, 
	pf.use_freeze, 
	pf.transfer_dt, 
	pf.transfer_pct, 
	isnull(poev.ten_percent_cap, 0),
	tr.m_n_o_tax_pct,
	tr.i_n_s_tax_pct, 
	pe.qualify_yr
from
	entity_prop_assoc as epa with (nolock)
inner join
	prop_supp_assoc as psa with (nolock)
on
	epa.prop_id = psa.prop_id
and	epa.tax_yr = psa.owner_tax_yr
and	epa.sup_num = psa.sup_num
inner join
	property_val as pv with (nolock)
on
	psa.prop_id = pv.prop_id
and	psa.owner_tax_yr = pv.prop_val_yr
and	psa.sup_num = pv.sup_num
and	pv.prop_inactive_dt is null
inner join
	prop_owner_entity_val as poev with (nolock)
on 
	pv.prop_id = poev.prop_id
and	epa.entity_id = poev.entity_id
and	pv.prop_val_yr = poev.sup_yr
and	pv.sup_num = poev.sup_num
inner join
	property_exemption as pe with (nolock)
on 
	poev.prop_id = pe.prop_id
and	poev.owner_id = pe.owner_id
and	poev.sup_yr = pe.owner_tax_yr
and	poev.sup_yr = pe.exmpt_tax_yr
and	poev.sup_num = pe.sup_num
and	(
		pe.qualify_yr = @input_tax_yr
	or	pe.qualify_yr = (@input_tax_yr - 1)
	or	isnull(poev.new_val_hs, 0) > 0
	)
inner join
	owner as o with (nolock)
on
	pe.prop_id = o.prop_id
and	pe.owner_id = o.owner_id
and	pe.owner_tax_yr = o.owner_tax_yr
and	pe.exmpt_tax_yr = o.owner_tax_yr
and	pe.sup_num = o.sup_num
inner join
	tax_rate as tr with (nolock)
on 
	epa.entity_id = tr.entity_id
and	epa.tax_yr = tr.tax_rate_yr
inner join
	entity_exmpt as ee with (nolock)
on
	epa.entity_id = ee.entity_id
and	pe.exmpt_type_cd = ee.exmpt_type_cd
and	pe.exmpt_tax_yr = ee.exmpt_tax_yr
and	pe.owner_tax_yr = ee.exmpt_tax_yr
and	ee.freeze_flag = 1
left outer join
	property_freeze as pf with (nolock)
on
	pe.prop_id = pf.prop_id
and	pe.owner_id = pf.owner_id
and	pe.owner_tax_yr = pf.owner_tax_yr
and	pe.exmpt_tax_yr = pf.exmpt_tax_yr
and	pe.sup_num = pf.sup_num
and	pe.exmpt_type_cd = pf.exmpt_type_cd
and	epa.entity_id = pf.entity_id
where
	epa.tax_yr = @input_tax_yr

declare @run_id int
set @run_id = 0

exec dbo.GetUniqueID 'update_freeze', @run_id output, 1, 0


open PROPERTY

fetch next from PROPERTY
into
	@prop_id,     
	@owner_tax_yr, 
	@sup_num,     
	@land_hstd_val,    
	@imprv_hstd_val,
	@new_val_hs,  
	@new_val_nhs,
	@new_val_taxable,
	@entity_id,   
	@owner_id,    
	@exmpt_type_cd, 
	@use_freeze, 
	@transfer_dt,                 
	@transfer_pct,
	@ten_percent_cap,
	@m_n_o_tax_pct,
	@i_n_s_tax_pct,
	@qualify_yr


while (@@fetch_status = 0)
begin
	select
		@exemption_amt = sum(local_amt + state_amt)
        from
		property_entity_exemption with (nolock)
	where
		prop_id = @prop_id
	and	owner_id = @owner_id
	and	sup_num = @sup_num
	and	entity_id = @entity_id
	and	exmpt_tax_yr = @owner_tax_yr
	and	owner_tax_yr = @owner_tax_yr

	set @exemption_amt = isnull(@exemption_amt, 0)

	if (((@imprv_hstd_val + @land_hstd_val - @ten_percent_cap) - @exemption_amt) < 0)
	begin
		select @hs_exmpt_amt = (@imprv_hstd_val + @land_hstd_val - @ten_percent_cap)
	end
	else
	begin
		select @hs_exmpt_amt = @exemption_amt
	end

	set @tax_amt = ((@imprv_hstd_val + @land_hstd_val - @ten_percent_cap) - @hs_exmpt_amt) / 100 * (@m_n_o_tax_pct + @i_n_s_tax_pct)

	if (@tax_amt < 0)
	begin
		set @tax_amt = 0
	end

	--Set POEV variables...
	set @poev_frz_assessed = (@imprv_hstd_val + @land_hstd_val - @ten_percent_cap )
	set @poev_frz_taxable = (@imprv_hstd_val + @land_hstd_val - @ten_percent_cap ) - @hs_exmpt_amt
	
	if @poev_frz_taxable < 0
	begin
		set @poev_frz_taxable = 0
	end
		
	if (@transfer_dt is not null and @transfer_pct is not null)
	begin
		set @tax_amt = @tax_amt * (@transfer_pct / 100)
	end

	if (@qualify_yr = @input_tax_yr)
	begin
		insert into update_freeze
		(
			prop_id,
			owner_id,
			entity_id,
			sup_num,
			prop_val_yr,
			tax_amt,
			prev_tax_amt,
			poev_assessed,
			poev_taxable,
			exmpt_type_cd,
			pacs_run_id
		)
		select
			@prop_id,
			@owner_id,
			@entity_id,
			@sup_num,
			@owner_tax_yr,
			@tax_amt,
			NULL,
			@poev_frz_assessed,
			@poev_frz_taxable,
			@exmpt_type_cd,
			@run_id
	end
	else if ((@qualify_yr = (@input_tax_yr - 1)) or (@new_val_hs > 0))
	begin
		-- first make sure it actually has a freeze for the input_tax_yr
		if exists
		(
			select
				*
			from
				property_freeze as pf with (nolock)
			join
				prop_supp_assoc as psa with (nolock)
			on
				pf.prop_id = psa.prop_id
			and	pf.owner_tax_yr = psa.owner_tax_yr
			and	pf.exmpt_tax_yr = psa.owner_tax_yr
			and	pf.sup_num = psa.sup_num
			where
				pf.prop_id = @prop_id
			and	pf.owner_id = @owner_id
			and	pf.entity_id = @entity_id
			and	pf.owner_tax_yr = @input_tax_yr
			and	pf.exmpt_tax_yr = @input_tax_yr
			and	pf.exmpt_type_cd = @exmpt_type_cd
			and	pf.use_freeze = 'T'
		)
		begin
			-- select the current amount
			select
				@curr_tax_amt = freeze_ceiling
			from
				property_freeze as pf with (nolock)
			join
				prop_supp_assoc as psa with (nolock)
			on
				pf.prop_id = psa.prop_id
			and	pf.owner_tax_yr = psa.owner_tax_yr
			and	pf.exmpt_tax_yr = psa.owner_tax_yr
			and	pf.sup_num = psa.sup_num
			where
				pf.prop_id = @prop_id
			and	pf.owner_id = @owner_id
			and	pf.entity_id = @entity_id
			and	pf.owner_tax_yr = @input_tax_yr
			and	pf.exmpt_tax_yr = @input_tax_yr
			and	pf.exmpt_type_cd = @exmpt_type_cd
			and	pf.use_freeze = 'T'


			-- select the previous freeze
			set @prev_tax_amt = null

			select
				@prev_tax_amt = freeze_ceiling
			from
				property_freeze as pf with (nolock)
			join
				prop_supp_assoc as psa with (nolock)
			on
				pf.prop_id = psa.prop_id
			and	pf.owner_tax_yr = psa.owner_tax_yr
			and	pf.exmpt_tax_yr = psa.owner_tax_yr
			and	pf.sup_num = psa.sup_num
			where
				pf.prop_id = @prop_id
			and	pf.owner_id = @owner_id
			and	pf.entity_id = @entity_id
			and	pf.owner_tax_yr = (@input_tax_yr - 1)
			and	pf.exmpt_tax_yr = (@input_tax_yr - 1)
			and	pf.exmpt_type_cd = @exmpt_type_cd
			and	pf.use_freeze = 'T'

			if (@prev_tax_amt is null)
			begin
				set @prev_tax_amt = @curr_tax_amt
			end

			if (@qualify_yr = (@input_tax_yr - 1))
			begin
				if (((@imprv_hstd_val + @land_hstd_val - @new_val_hs - @ten_percent_cap) - @exemption_amt) < 0)
				begin
					select @hs_exmpt_amt = (@imprv_hstd_val + @land_hstd_val - @new_val_hs - @ten_percent_cap)
				end
				else
				begin
					select @hs_exmpt_amt = @exemption_amt
				end
			
				set @tax_amt = ((@imprv_hstd_val + @land_hstd_val - @ten_percent_cap) - @new_val_hs - @hs_exmpt_amt) / 100 * (@m_n_o_tax_pct + @i_n_s_tax_pct)
			
				if (@tax_amt < 0)
				begin
					set @tax_amt = 0
				end
			
				if (@transfer_dt is not null and @transfer_pct is not null)
				begin
					set @tax_amt = @tax_amt * (@transfer_pct / 100)
				end
	
				if (@tax_amt < @prev_tax_amt) and (@tax_amt <> @curr_tax_amt)
				begin
					insert into update_freeze
					(
						prop_id,
						owner_id,
						entity_id,
						sup_num,
						prop_val_yr,
						tax_amt,
						prev_tax_amt,
						poev_assessed,
						poev_taxable,
						exmpt_type_cd,
						pacs_run_id
					)
					select
						@prop_id,
						@owner_id,
						@entity_id,
						@sup_num,
						@owner_tax_yr,
						@tax_amt,
						@prev_tax_amt,
						@poev_frz_assessed,
						@poev_frz_taxable,
						@exmpt_type_cd,
						@run_id
				end
				else if (@tax_amt > @prev_tax_amt)
				begin
					set @tax_amt = @prev_tax_amt
				end
			end
	
			if ((@new_val_taxable - @new_val_nhs) > 0)
			begin
				set @new_val_tax_amt = (@new_val_taxable - @new_val_nhs) / 100 * (@m_n_o_tax_pct + @i_n_s_tax_pct)
		
				if (@transfer_dt is not null and @transfer_pct is not null)
				begin
					set @new_val_tax_amt = @new_val_tax_amt * (@transfer_pct / 100)
				end
				
				if (@qualify_yr = (@input_tax_yr - 1))
				begin
					set @tax_amt = @tax_amt + @new_val_tax_amt
				end
				else
				begin
					set @tax_amt = @prev_tax_amt + @new_val_tax_amt
				end

				if exists
				(
					select
						*
					from
						update_freeze with (nolock)
					where
						prop_id = @prop_id
					and	owner_id = @owner_id
					and	entity_id = @entity_id
					and	sup_num = @sup_num
					and	prop_val_yr = @owner_tax_yr
					and	exmpt_type_cd = @exmpt_type_cd
					and	pacs_run_id = @run_id
				)
				begin
					update
						update_freeze
					set
						tax_amt = @tax_amt
					where
						prop_id = @prop_id
					and	owner_id = @owner_id
					and	entity_id = @entity_id
					and	sup_num = @sup_num
					and	prop_val_yr = @owner_tax_yr
					and	exmpt_type_cd = @exmpt_type_cd
					and	pacs_run_id = @run_id
				end
				else
				begin
					insert into update_freeze
					(
						prop_id,
						owner_id,
						entity_id,
						sup_num,
						prop_val_yr,
						tax_amt,
						prev_tax_amt,
						poev_assessed,
						poev_taxable,
						exmpt_type_cd,
						pacs_run_id
					)
					select
						@prop_id,
						@owner_id,
						@entity_id,
						@sup_num,
						@owner_tax_yr,
						@tax_amt,
						@prev_tax_amt,
						@poev_frz_assessed,
						@poev_frz_taxable,
						@exmpt_type_cd,
						@run_id
				end
			end
		end
	end

	FETCH NEXT FROM PROPERTY
	into
		@prop_id,     
		@owner_tax_yr, 
		@sup_num,     
		@land_hstd_val,    
		@imprv_hstd_val,
		@new_val_hs,
		@new_val_nhs,
		@new_val_taxable,  
		@entity_id,   
		@owner_id,    
		@exmpt_type_cd, 
		@use_freeze, 
		@transfer_dt,                 
		@transfer_pct,
		@ten_percent_cap,
		@m_n_o_tax_pct,
		@i_n_s_tax_pct,
		@qualify_yr
end


CLOSE PROPERTY
DEALLOCATE PROPERTY




if (@input_mode = 'P')
begin
	declare @appr_year numeric(4)

	select
		@appr_year = appr_yr
	from
		pacs_system

	-- insert the new freeze or update the existing freeze
	declare UPDATEFREEZE scroll cursor
	for
	select
		prop_id,
		owner_id,
		entity_id,
		sup_num,
		prop_val_yr,
		tax_amt,
		prev_tax_amt,
		poev_assessed,
		poev_taxable,
		exmpt_type_cd,
		pacs_run_id
	from
		update_freeze with (nolock)

	open UPDATEFREEZE
	fetch next from UPDATEFREEZE into
		@prop_id,
		@owner_id,
		@entity_id,
		@sup_num,
		@owner_tax_yr,
		@tax_amt,
		@prev_tax_amt,
		@poev_frz_assessed,
		@poev_frz_taxable,
		@exmpt_type_cd,
		@run_id

	while (@@fetch_status = 0)
	begin
		if exists
		(
			select
				*
			from
				property_freeze with (nolock)
			where
				prop_id = @prop_id
			and	owner_id = @owner_id
			and	owner_tax_yr = @owner_tax_yr
			and	exmpt_tax_yr = @owner_tax_yr
			and	sup_num = @sup_num
			and	entity_id = @entity_id
			and	exmpt_type_cd = @exmpt_type_cd
		)
		begin
			update
				property_freeze
			set
				freeze_ceiling = @tax_amt,
				freeze_yr = case when isnull(freeze_yr, -1) <= 0 then @input_tax_yr else freeze_yr end,
				use_freeze = 'T',
				pacs_freeze = 'T',
				pacs_freeze_date = GetDate(),
				pacs_freeze_ceiling = @tax_amt,
				pacs_freeze_run = @run_id
			where
				prop_id = @prop_id
			and	owner_id = @owner_id
			and	owner_tax_yr = @owner_tax_yr
			and	exmpt_tax_yr = @owner_tax_yr
			and	sup_num = @sup_num
			and	entity_id = @entity_id
			and	exmpt_type_cd = @exmpt_type_cd
		end
		else
		begin
			if not exists
			(
				select
					*
				from
					property_freeze with (nolock)
				where
					prop_id = @prop_id
				and	owner_id = @owner_id
				and	owner_tax_yr = @owner_tax_yr
				and	exmpt_tax_yr = @owner_tax_yr
				and	sup_num = @sup_num
				and	entity_id = @entity_id
			)
			begin
				insert into property_freeze
				(
					prop_id,
					owner_id,
					owner_tax_yr,
					exmpt_tax_yr,
					sup_num,
					entity_id,
					exmpt_type_cd,
					use_freeze,
					freeze_ceiling,
					freeze_yr,
					pacs_freeze,
					pacs_freeze_date,
					pacs_freeze_ceiling,
					pacs_freeze_run,
					freeze_override
				)
				values
				(
					@prop_id,
					@owner_id,
					@owner_tax_yr,
					@owner_tax_yr,
					@sup_num,
					@entity_id,
					@exmpt_type_cd,
					'T',
					@tax_amt,
					@input_tax_yr,
					'T',
					GetDate(),
					@tax_amt,
					@run_id,
					0
				)
			end
		end

		if (@appr_year = (@input_tax_yr + 1))
		begin
			if exists
			(
				select
					*
				from
					property_freeze as pf with (nolock)
				join
					prop_supp_assoc as psa with (nolock)
				on
					pf.prop_id = psa.prop_id
				and	pf.owner_tax_yr = psa.owner_tax_yr
				and	pf.exmpt_tax_yr = psa.owner_tax_yr
				and	pf.sup_num = psa.sup_num
				join
					owner as o with (nolock)
				on
					psa.prop_id = o.prop_id
				and	psa.owner_tax_yr = o.owner_tax_yr
				and	psa.sup_num = o.sup_num
				and	o.owner_id = @owner_id
				join
					entity_prop_assoc as epa with (nolock)
				on
					pf.entity_id = epa.entity_id
				and	pf.prop_id = epa.prop_id
				and	pf.owner_tax_yr = epa.tax_yr
				and	pf.exmpt_tax_yr = epa.tax_yr
				and	pf.sup_num = epa.sup_num
				where
					pf.prop_id = @prop_id
				and	pf.owner_id = @owner_id
				and	pf.owner_tax_yr = (@owner_tax_yr + 1)
				and	pf.exmpt_tax_yr = (@owner_tax_yr + 1)
				and	pf.entity_id = @entity_id
				and	pf.exmpt_type_cd = @exmpt_type_cd
			)
			begin
				update
					property_freeze
				set
					freeze_ceiling = @tax_amt,
					freeze_yr = case when isnull(freeze_yr, -1) <= 0 then @input_tax_yr else freeze_yr end,
					use_freeze = 'T',
					pacs_freeze = 'T',
					pacs_freeze_date = GetDate(),
					pacs_freeze_ceiling = @tax_amt,
					pacs_freeze_run = @run_id
				from
					property_freeze as pf with (nolock)
				join
					prop_supp_assoc as psa with (nolock)
				on
					pf.prop_id = psa.prop_id
				and	pf.owner_tax_yr = psa.owner_tax_yr
				and	pf.exmpt_tax_yr = psa.owner_tax_yr
				and	pf.sup_num = psa.sup_num
				join
					owner as o with (nolock)
				on
					psa.prop_id = o.prop_id
				and	psa.owner_tax_yr = o.owner_tax_yr
				and	psa.sup_num = o.sup_num
				and	o.owner_id = @owner_id
				join
					entity_prop_assoc as epa with (nolock)
				on
					pf.entity_id = epa.entity_id
				and	pf.prop_id = epa.prop_id
				and	pf.owner_tax_yr = epa.tax_yr
				and	pf.exmpt_tax_yr = epa.tax_yr
				and	pf.sup_num = epa.sup_num
				where
					pf.prop_id = @prop_id
				and	pf.owner_id = @owner_id
				and	pf.owner_tax_yr = (@owner_tax_yr + 1)
				and	pf.exmpt_tax_yr = (@owner_tax_yr + 1)
				and	pf.entity_id = @entity_id
				and	pf.exmpt_type_cd = @exmpt_type_cd
			end
			else
			begin
				if not exists
				(
					select
						*
					from
						property_freeze as pf with (nolock)
					join
						prop_supp_assoc as psa with (nolock)
					on
						pf.prop_id = psa.prop_id
					and	pf.owner_tax_yr = psa.owner_tax_yr
					and	pf.exmpt_tax_yr = psa.owner_tax_yr
					and	pf.sup_num = psa.sup_num
					join
						entity_prop_assoc as epa with (nolock)
					on
						pf.entity_id = epa.entity_id
					and	pf.prop_id = epa.prop_id
					and	pf.owner_tax_yr = epa.tax_yr
					and	pf.exmpt_tax_yr = epa.tax_yr
					and	pf.sup_num = epa.sup_num
					where
						pf.prop_id = @prop_id
					and	pf.owner_id = @owner_id
					and	pf.owner_tax_yr = (@owner_tax_yr + 1)
					and	pf.exmpt_tax_yr = (@owner_tax_yr + 1)
					and	pf.entity_id = @entity_id
				)
				begin
					insert into property_freeze
					(
						prop_id,
						owner_id,
						owner_tax_yr,
						exmpt_tax_yr,
						sup_num,
						entity_id,
						exmpt_type_cd,
						use_freeze,
						freeze_ceiling,
						freeze_yr,
						pacs_freeze,
						pacs_freeze_date,
						pacs_freeze_ceiling,
						pacs_freeze_run
					)
					select
						psa.prop_id,
						o.owner_id,
						psa.owner_tax_yr,
						psa.owner_tax_yr,
						psa.sup_num,
						epa.entity_id,
						@exmpt_type_cd,
						'T',
						@tax_amt,
						@input_tax_yr,
						'T',
						GetDate(),
						@tax_amt,
						@run_id
					from
						prop_supp_assoc as psa with (nolock)
					join
						owner as o with (nolock)
					on
						psa.prop_id = o.prop_id
					and	psa.owner_tax_yr = o.owner_tax_yr
					and	psa.sup_num = o.sup_num
					and	o.owner_id = @owner_id
					join
						entity_prop_assoc as epa with (nolock)
					on
						psa.prop_id = epa.prop_id
					and	psa.owner_tax_yr = epa.tax_yr
					and	psa.sup_num = epa.sup_num
					and	epa.entity_id = @entity_id
					where
						psa.prop_id = @prop_id
					and	psa.owner_tax_yr = (@owner_tax_yr + 1)
				end
			end
		end

		
		update
			prop_owner_entity_val
		set
			frz_taxable_val = isnull(@poev_frz_taxable, 0),
			frz_assessed_val = isnull(@poev_frz_assessed, 0),
			freeze_type = @exmpt_type_cd,
			freeze_yr = case when isnull(freeze_yr, -1) <= 0 then @input_tax_yr else freeze_yr end,
			freeze_ceiling = @tax_amt,
			transfer_flag = 'F',
			transfer_pct = 0,
			transfer_freeze_assessed = 0,
			transfer_freeze_taxable = 0,
			transfer_entity_taxable = 0,
			transfer_taxable_adjustment = 0
		where
			prop_id = @prop_id
		and	owner_id = @owner_id
		and	entity_id = @entity_id
		and	sup_yr = @owner_tax_yr
		and	sup_num = @sup_num

		fetch next from UPDATEFREEZE into
			@prop_id,
			@owner_id,
			@entity_id,
			@sup_num,
			@owner_tax_yr,
			@tax_amt,
			@prev_tax_amt,
			@poev_frz_assessed,
			@poev_frz_taxable,
			@exmpt_type_cd,
			@run_id
	end
	
	close UPDATEFREEZE
	deallocate UPDATEFREEZE

end

GO

