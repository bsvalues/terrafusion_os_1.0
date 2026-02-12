



CREATE PROCEDURE ptd_aud_cad

@input_entity_id int

as

set nocount on 

/************************************/
/**** create the pct tables *********/
/************************************/
delete from ptd_aud_land_detail
delete from ptd_aud_land_summary
delete from ptd_aud_land_pct

insert into ptd_aud_land_detail
(prop_id, sup_num, prop_val_yr, ag_use_cd, state_land_type_desc, size_acres, ag_val, land_seg_mkt_val)
select psa.prop_id, psa.sup_num, ld.prop_val_yr, ag_use_cd, state_land_type_desc, size_acres, ag_val, land_seg_mkt_val
from ptd_supp_assoc psa,
     land_detail ld,
     land_type
where psa.prop_id = ld.prop_id
and   psa.sup_num = ld.sup_num
and   psa.sup_yr = ld.prop_val_yr
and   ld.sale_id = 0
and   ld.ag_apply = 'T'
and   ld.ag_use_cd in ('1D', '1D1', 'TIM')
and   ld.land_type_cd = land_type.land_type_cd

insert into ptd_aud_land_summary
(prop_id, sup_num, prop_val_yr, sum_size_acres, sum_ag_val, sum_land_seg_mkt_val)
select psa.prop_id, psa.sup_num, ld.prop_val_yr, 
sum(size_acres) as sum_size_acres, sum(ag_val) as sum_ag_val, sum(land_seg_mkt_val) as sum_land_seg_mkt_val
from ptd_supp_assoc psa,
     land_detail ld,
     land_type
where psa.prop_id = ld.prop_id
and   psa.sup_num = ld.sup_num
and   psa.sup_yr = ld.prop_val_yr
and   ld.sale_id = 0
and   ld.ag_apply = 'T'
and   ld.ag_use_cd in ('1D', '1D1', 'TIM')
and   ld.land_type_cd = land_type.land_type_cd
group by psa.prop_id, psa.sup_num, ld.prop_val_yr

insert into ptd_aud_land_pct 
(prop_id, sup_num, prop_val_yr, state_land_type_desc, pct_acreage, pct_ag_val, pct_mkt_val)
select pald.prop_id, pald.sup_num, pald.prop_val_yr, pald.state_land_type_desc, 
case when pals.sum_size_acres > 0 then pald.size_acres/pals.sum_size_acres else 1 end as pct_acreage,
case when pals.sum_ag_val > 0     then pald.ag_val/pals.sum_ag_val else 1 end as pct_ag_val,
case when pals.sum_land_seg_mkt_val > 0 then pald.land_seg_mkt_val/pals.sum_land_seg_mkt_val else 1 end as pct_mkt_val
from ptd_aud_land_detail pald,
     ptd_aud_land_summary pals
where pald.prop_id = pals.prop_id
and   pald.sup_num = pals.sup_num
and   pald.prop_val_yr = pals.prop_val_yr



/*************************************/
/**** apply the percentages **********/
/*************************************/

truncate table ptd_cad


declare @prop_id				int
declare @owner_id				int
declare @entity_id				int
declare @acres_for_category			numeric(11,3)
declare @productivity_value			numeric(11, 0)
declare @market_value_land			numeric(11, 0)
declare @num_land_codes				int
declare @land_type_cd				varchar(4)
declare @ag_use_cd				varchar(4)
declare @total_acres_for_category		numeric(11,3)
declare @total_productivity_value		numeric(11, 0)
declare @total_market_value			numeric(11, 0)

declare ptd_ajr_d scroll cursor
for
select 		poes.prop_id,
		poes.owner_id,
		poes.entity_id,
		sum(ag_acres) 	as total_acres_for_category,
		sum(ag_use_val) as productivity_value,
		sum(ag_market)  as market_value_land
from 	 property_owner_entity_state_cd poes, ptd_supp_assoc psa
where    poes.prop_id = psa.prop_id
and      poes.sup_num = psa.sup_num
and      poes.year    = psa.sup_yr
and 	 poes.state_cd = 'D1'
and      poes.entity_id = @input_entity_id

group by poes.prop_id,
	 poes.owner_id,
	 poes.entity_id

open ptd_ajr_d
fetch next from ptd_ajr_d into @prop_id, @owner_id, @entity_id, 
			       @acres_for_category,
			       @productivity_value, @market_value_land

while (@@FETCH_STATUS = 0)
begin

	select @total_acres_for_category  = @acres_for_category
	select @total_productivity_value  = @productivity_value
	select @total_market_value	  = @market_value_land

	select @num_land_codes = count(*)
	from  ptd_aud_land_pct
	where prop_id = @prop_id

	if (@num_land_codes > 1)
	begin
		declare @count 				int
		declare @temp_acres_for_category	numeric(11, 3)
		declare @temp_productivity_value	numeric(11, 0)
		declare @temp_market_value_land		numeric(11, 0)
		declare @pct_acreage			numeric(28, 20)
		declare @pct_ag_val			numeric(28, 24)
		declare @pct_mkt_val			numeric(28, 24)

		select @count = 1

		declare land_pct scroll cursor
		for select pct_acreage,
			   pct_ag_val,
			   pct_mkt_val,
			   state_land_type_desc
		from ptd_aud_land_pct
		where prop_id = @prop_id

		open land_pct
		fetch next from land_pct into @pct_acreage, @pct_ag_val, @pct_mkt_val, @land_type_cd
		
		while (@@FETCH_STATUS = 0)
		begin
			if (@count < @num_land_codes)
			begin

				select @temp_acres_for_category = @acres_for_category * @pct_acreage
				select @temp_productivity_value = @productivity_value * @pct_ag_val
				select @temp_market_value_land  = @market_value_land  * @pct_mkt_val

				select @total_acres_for_category = @total_acres_for_category - @temp_acres_for_category
				select @total_productivity_value = @total_productivity_value - @temp_productivity_value
				select @total_market_value       = @total_market_value - @temp_market_value_land
			end
			else
			begin
				select @temp_acres_for_category = @total_acres_for_category
				select @temp_productivity_value = @total_productivity_value
				select @temp_market_value_land  = @total_market_value
			end	

			select  @ag_use_cd    = ag_use_cd
			from ptd_aud_land_detail
			where prop_id = @prop_id
			and   state_land_type_desc = @land_type_cd

			if (@ag_use_cd = 'TIM')
			begin
				select @ag_use_cd = 'TIMB'
			end

			insert into ptd_cad
			(
			prop_id,
			owner_id,
			entity_id,
			comptrollers_category_code,
			income_type,
			land_type,
			acres_for_production,
			productivity_value_by_land_type,
			timber_1978_value,
			previous_land_type_for_wildlife_management,
			market_value_of_land_receiving_productivity,
			previous_land_type_of_timber_in_transition
			)
			select 	@prop_id,
				@owner_id,
				@entity_id,
			'D1',
			@ag_use_cd,
			@land_type_cd,
			@temp_acres_for_category,
			@temp_productivity_value,
			0,
			'',
			@temp_market_value_land,
			''

			select @count = @count + 1


			fetch next from land_pct into @pct_acreage, @pct_ag_val, @pct_mkt_val, @land_type_cd
		end

		close land_pct
		deallocate land_pct
	end
	else
	begin

		select @land_type_cd = state_land_type_desc,
		       @ag_use_cd    = ag_use_cd
		from ptd_aud_land_detail
		where prop_id = @prop_id

		if (@ag_use_cd = 'TIM')
		begin
			select @ag_use_cd = 'TIMB'
		end
		
		insert into ptd_cad
		(
			prop_id,
			owner_id,
			entity_id,
			comptrollers_category_code,
			income_type,
			land_type,
			acres_for_production,
			productivity_value_by_land_type,
			timber_1978_value,
			previous_land_type_for_wildlife_management,
			market_value_of_land_receiving_productivity,
			previous_land_type_of_timber_in_transition
		)
		select  @prop_id,
			@owner_id,
			@entity_id,
			'D1',
			@ag_use_cd,
			@land_type_cd,
			@total_acres_for_category,
			@productivity_value,
			0,
			'',
			@market_value_land,
			''
	end
	

	fetch next from ptd_ajr_d into @prop_id, @owner_id, @entity_id, 
			       @acres_for_category, @productivity_value, @market_value_land

end

close ptd_ajr_d
deallocate ptd_ajr_d

GO

