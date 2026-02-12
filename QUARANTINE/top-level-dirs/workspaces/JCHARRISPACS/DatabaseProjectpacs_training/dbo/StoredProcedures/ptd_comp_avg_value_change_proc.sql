


CREATE  procedure ptd_comp_avg_value_change_proc

@input_yr	numeric(4),
@input_sup_num	int

WITH RECOMPILE

AS

SET NOCOUNT ON

truncate table ptd_comp_avg_value_change_supp_assoc
truncate table ptd_comp_avg_value_change

insert into ptd_comp_avg_value_change_supp_assoc
select distinct poev.prop_id, poev.sup_yr, max(poev.sup_num) as sup_num
from prop_owner_entity_val poev with (nolock)
where poev.sup_num <= @input_sup_num
	and poev.sup_yr  =  @input_yr
group by poev.prop_id, poev.sup_yr

if object_id('tempdb..#tmp_poesc') is not null
begin
	drop table #tmp_poesc
end

select poesc.prop_id,
	poesc.sup_num,
	poesc.year,
	poesc.entity_id,
	poesc.state_cd,
	poesc.market
into #tmp_poesc
from property_owner_entity_state_cd poesc with (nolock),
	ptd_comp_avg_value_change_entity pcavce with (nolock)
where poesc.year = @input_yr
	and poesc.entity_id = pcavce.entity_id


CREATE CLUSTERED INDEX IDX_#tmp_poesc ON #tmp_poesc
	(
	prop_id,
	sup_num,
	[year],
	entity_id,
	state_cd
	) WITH FILLFACTOR = 100 ON [PRIMARY]

insert into ptd_comp_avg_value_change
(
	arb_set_prev_value,
	prev_category,
	curr_category,
	prop_id,
	prev_market_value,
	curr_market_value,
	new_value,
	prev_partial_comp,
	sale_price,
	sale_dt,
	legal_desc,
	entity_cd,
	deed_type,
	sale_type
)
select
	'F',
	NULL,
	(select top 1 poesc2.state_cd
		from #tmp_poesc poesc2 with (nolock)
		where poesc2.prop_id = poev.prop_id
		and   poesc2.sup_num = poev.sup_num
		and   poesc2.year    = poev.sup_yr
		and   poesc2.entity_id = poev.entity_id
		order by poesc2.market desc),
	poev.prop_id,
	NULL,
	(select top 1 poesc3.market
		from #tmp_poesc poesc3 with (nolock)
		where poesc3.prop_id = poev.prop_id
		and   poesc3.sup_num = poev.sup_num
		and   poesc3.year    = poev.sup_yr
		and   poesc3.entity_id = poev.entity_id
		order by poesc3.market desc),
	NULL,
	'F',
	NULL,
	NULL,
	pv.legal_desc,
	e.entity_cd,
	NULL,
	NULL
from prop_owner_entity_val poev with (nolock),
     ptd_comp_avg_value_change_supp_assoc psa with (nolock),
     property_val pv with (nolock),
     ptd_comp_avg_value_change_entity with (nolock),
     entity e with (nolock)
where poev.prop_id = psa.prop_id
	and   poev.sup_num = psa.sup_num
	and   poev.sup_yr  = psa.sup_yr
	and   psa.prop_id = pv.prop_id
	and   psa.sup_num = pv.sup_num
	and   psa.sup_yr  = pv.prop_val_yr
	and   pv.prop_inactive_dt is null
	and   poev.entity_id = e.entity_id
	and   poev.entity_id = ptd_comp_avg_value_change_entity.entity_id
order by e.entity_cd

delete from ptd_comp_avg_value_change
where curr_category not in
(
	select state_cd
	from ptd_comp_avg_value_change_state_cd with (nolock)
)
or curr_category is null

--NEW VALUE
if object_id('tempdb..#tmp') is not null
begin
	drop table #tmp
end

select poesc.prop_id,
	poesc.sup_num,
	poesc.year,
	poesc.entity_id,
	poesc.state_cd,
	sum(isnull(poesc.new_val, 0)) as new_val
into #tmp
from property_owner_entity_state_cd poesc with (nolock),
	ptd_comp_avg_value_change_supp_assoc psa with (nolock)
where poesc.prop_id = psa.prop_id
and poesc.sup_num = psa.sup_num
and poesc.year = psa.sup_yr
and poesc.entity_id in
(
	select entity_id
	from ptd_comp_avg_value_change_entity with (nolock)
)
and poesc.prop_id in
(
	select prop_id
	from ptd_comp_avg_value_change with (nolock)
)
group by poesc.prop_id,
	poesc.sup_num,
	poesc.year,
	poesc.entity_id,
	poesc.state_cd

update ptd_comp_avg_value_change
set ptd_comp_avg_value_change.new_value = #tmp.new_val
from #tmp, entity e with (nolock)
where ptd_comp_avg_value_change.prop_id = #tmp.prop_id
	and ptd_comp_avg_value_change.curr_category = #tmp.state_cd
	and ptd_comp_avg_value_change.entity_cd = e.entity_cd
	and e.entity_id = #tmp.entity_id

--PREVIOUS VALUE
if object_id('tempdb..#tmp2') is not null
begin
	drop table #tmp2
end

if object_id('tempdb..#tmp_poesc2') is not null
begin
	drop table #tmp_poesc2
end

select poesc.prop_id,
	poesc.sup_num,
	poesc.year,
	poesc.entity_id,
	poesc.state_cd,
	poesc.market
into #tmp_poesc2
from property_owner_entity_state_cd poesc with (nolock),
	ptd_comp_avg_value_change_entity pcavce with (nolock)
where poesc.year = @input_yr - 1
	and poesc.entity_id = pcavce.entity_id

CREATE CLUSTERED INDEX IDX_#tmp_poesc ON #tmp_poesc2
	(
	prop_id,
	sup_num,
	[year],
	entity_id,
	state_cd
	) WITH FILLFACTOR = 100 ON [PRIMARY]

select poesc.prop_id,
	poesc.state_cd,
	poesc.entity_id,
	(select top 1 state_cd
		from #tmp_poesc2 poesc2 with (nolock),
			prop_supp_assoc psa2 with (nolock)
		where poesc2.prop_id = psa2.prop_id
		and poesc2.sup_num = psa2.sup_num
		and poesc2.year = psa2.owner_tax_yr
		and poesc2.entity_id = poesc.entity_id
		and poesc2.year = (@input_yr - 1)
		and poesc2.prop_id = pcavc.prop_id
		order by poesc2.market desc) as prev_state_cd,
	(select top 1 market
		from #tmp_poesc2 poesc3 with (nolock),
			prop_supp_assoc psa3 with (nolock)
		where poesc3.prop_id = psa3.prop_id
		and poesc3.sup_num = psa3.sup_num
		and poesc3.year = psa3.owner_tax_yr
		and poesc3.entity_id = poesc.entity_id
		and poesc3.year = (@input_yr - 1)
		and poesc3.prop_id = pcavc.prop_id
		order by poesc3.market desc) as prev_market
into #tmp2
from property_owner_entity_state_cd poesc with (nolock),
	ptd_comp_avg_value_change pcavc with (nolock)
where poesc.year = @input_yr
and poesc.prop_id = pcavc.prop_id
and poesc.entity_id in
(
	select entity_id
	from ptd_comp_avg_value_change_entity with (nolock)
)

update ptd_comp_avg_value_change
set ptd_comp_avg_value_change.prev_category = #tmp2.prev_state_cd,
	ptd_comp_avg_value_change.prev_market_value = #tmp2.prev_market
from #tmp2, entity e with (nolock)
where ptd_comp_avg_value_change.prop_id = #tmp2.prop_id
	and ptd_comp_avg_value_change.curr_category = #tmp2.state_cd
	and ptd_comp_avg_value_change.entity_cd = e.entity_cd
	and e.entity_id = #tmp2.entity_id

if object_id('tempdb..#tmp3') is not null
begin
	drop table #tmp3
end

select
	prop_id,
	(select top 1 sale.sl_price
		from sale with (nolock), chg_of_owner_prop_assoc with (nolock), chg_of_owner with (nolock)
		where sale.chg_of_owner_id = chg_of_owner_prop_assoc.chg_of_owner_id
			and sale.chg_of_owner_id = chg_of_owner.chg_of_owner_id
			and  chg_of_owner_prop_assoc.prop_id = ptd_comp_avg_value_change.prop_id
		order by sl_dt desc) as sl_price,
	(select top 1 sale.sl_type_cd
		from sale with (nolock), chg_of_owner_prop_assoc with (nolock), chg_of_owner with (nolock)
		where sale.chg_of_owner_id = chg_of_owner_prop_assoc.chg_of_owner_id
			and sale.chg_of_owner_id = chg_of_owner.chg_of_owner_id
			and  chg_of_owner_prop_assoc.prop_id = ptd_comp_avg_value_change.prop_id
		order by sl_dt desc) as sl_type_cd,
	(select top 1 sale.sl_dt
		from sale with (nolock), chg_of_owner_prop_assoc with (nolock), chg_of_owner with (nolock)
		where sale.chg_of_owner_id = chg_of_owner_prop_assoc.chg_of_owner_id
			and sale.chg_of_owner_id = chg_of_owner.chg_of_owner_id
			and  chg_of_owner_prop_assoc.prop_id = ptd_comp_avg_value_change.prop_id
		order by sl_dt desc) as sl_dt,
	(select top 1 chg_of_owner.deed_type_cd
		from sale with (nolock), chg_of_owner_prop_assoc with (nolock), chg_of_owner with (nolock)
		where sale.chg_of_owner_id = chg_of_owner_prop_assoc.chg_of_owner_id
			and sale.chg_of_owner_id = chg_of_owner.chg_of_owner_id
			and  chg_of_owner_prop_assoc.prop_id = ptd_comp_avg_value_change.prop_id
		order by sl_dt desc) as deed_type_cd
into #tmp3
from ptd_comp_avg_value_change

update ptd_comp_avg_value_change
set ptd_comp_avg_value_change.sale_price = #tmp3.sl_price,
	ptd_comp_avg_value_change.sale_dt = #tmp3.sl_dt,
	ptd_comp_avg_value_change.deed_type = #tmp3.deed_type_cd,
	ptd_comp_avg_value_change.sale_type = #tmp3.sl_type_cd
from #tmp3
where ptd_comp_avg_value_change.prop_id = #tmp3.prop_id

--PREVIOUS PARTIAL COMPLETE
if object_id('tempdb..#tmp4') is not null
begin
	drop table #tmp4
end

--EricZ; 05/04/2005 - Reported by Wichita CAD, HelpSTAR #24608
--This is commented out due to being incorrect.  Since the percent complete inherits from the imprv, we need to check
--if the imprv_detail override = 'T', and only then should the imprv_detail percent complete be used; otherwise always use
--the imprv percent complete.
--
--OLD BEGIN
		/*
		select
			impd.prop_id,
			case when (impd.percent_complete is not null
					and impd.percent_complete < 100
					and impd.percent_complete > 0) then 'T'
				else 'F'
				end as prev_partial_comp
		into #tmp4
		from imprv_detail impd with (nolock),
			prop_supp_assoc psa with (nolock),
			ptd_comp_avg_value_change pcavc with (nolock)
		where impd.prop_id = psa.prop_id
			and impd.sup_num = psa.sup_num
			and impd.prop_val_yr = psa.owner_tax_yr
			and psa.owner_tax_yr = (@input_yr - 1)
			and psa.prop_id = pcavc.prop_id
		*/

--
--OLD END

--
--NEW BEGIN
select distinct
	impd.prop_id,
	case when isnull((case when isnull(impd.percent_complete_override, 'F') = 'T'
							then impd.percent_complete
							else imp.percent_complete end), 0) between 0.01 and 99.99
		then 'T'
		else 'F' end as prev_partial_comp
into #tmp4
from imprv_detail impd with (nolock),
	imprv imp with (nolock),
	prop_supp_assoc psa with (nolock),
	ptd_comp_avg_value_change pcavc with (nolock)
where impd.prop_id = psa.prop_id
	and impd.sup_num = psa.sup_num
	and impd.prop_val_yr = psa.owner_tax_yr
	and impd.prop_id = imp.prop_id
	and impd.sup_num = imp.sup_num
	and impd.prop_val_yr = imp.prop_val_yr
	and impd.imprv_id = imp.imprv_id
	and psa.owner_tax_yr = (@input_yr - 1)
	and psa.prop_id = pcavc.prop_id

--
--NEW END

if object_id('tempdb..#tmp5') is not null
begin
	drop table #tmp5
end

select distinct prop_id
into #tmp5
from #tmp4
where prev_partial_comp = 'T'

update ptd_comp_avg_value_change
set ptd_comp_avg_value_change.prev_partial_comp = 'T'
from #tmp5
where ptd_comp_avg_value_change.prop_id = #tmp5.prop_id

if object_id('tempdb..#tmp_poesc') is not null
begin
	drop table #tmp_poesc
end

if object_id('tempdb..#tmp_poesc2') is not null
begin
	drop table #tmp_poesc2
end

if object_id('tempdb..#tmp') is not null
begin
	drop table #tmp
end

if object_id('tempdb..#tmp2') is not null
begin
	drop table #tmp2
end

if object_id('tempdb..#tmp3') is not null
begin
	drop table #tmp3
end

if object_id('tempdb..#tmp4') is not null
begin
	drop table #tmp4
end

if object_id('tempdb..#tmp5') is not null
begin
	drop table #tmp5
end

GO

