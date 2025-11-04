
create view wash_prop_owner_val_tax_vw
as

-- properties without [wash_prop_owner_proration] records
select
	wpov.year,
	wpov.sup_num,
	wpov.prop_id,
	wpov.owner_id,
	l.tax_district_id,

	td.tax_district_cd,
	l.levy_cd,
	l.levy_description,
	wlr.levy_rate_classified,
	wlr.levy_rate_non_classified,
	
	tax_amt = convert(numeric(14,2), case
		when wpov.destroyed_prop = 1  -- destroyed property proration
		then
			(
				(wpov.taxable_classified * wlr.levy_rate_classified / 1000.0)
				+
				(wpov.taxable_non_classified * wlr.levy_rate_non_classified / 1000.0)
			) * wpov.destroyed_prorate_pct
			+
			(
				(wpov.destroyed_jan1_classified_value * wlr.levy_rate_classified / 1000.0) 
				+
				(wpov.destroyed_jan1_non_classified_value * wlr.levy_rate_non_classified / 1000.0) 
			) * (1.0000 - wpov.destroyed_prorate_pct)
			
		when wpov.prorate_type is not null  -- exemption proration
		then
			(
				(wpov.taxable_classified * wlr.levy_rate_classified / 1000.0)
				+
				(wpov.taxable_non_classified * wlr.levy_rate_non_classified / 1000.0)
			) * dbo.fn_GetProratePct(wpov.prorate_begin, wpov.prorate_end, wpov.year+1)
			+
			(
				wpov.appraised * wlr.levy_rate_non_classified / 1000.0
			) * (1.0000 - dbo.fn_GetProratePct(wpov.prorate_begin, wpov.prorate_end, wpov.year+1))
			
		else  -- no proration
			(wpov.taxable_classified * wlr.levy_rate_classified / 1000.0)
			+
			(wpov.taxable_non_classified * wlr.levy_rate_non_classified / 1000.0)
	end),
	
	tax_wout_ex_amt = convert(numeric(14,2), case
		when wpov.destroyed_prop = 1  -- destroyed property proration
		then
			(
				wpov.appraised * wlr.levy_rate_non_classified / 1000.0
			) * wpov.destroyed_prorate_pct
			+
			(
				wpov.destroyed_jan1_value * wlr.levy_rate_non_classified / 1000.0
			) * (1.0000 - wpov.destroyed_prorate_pct)
			
		else  -- exemption proration or no proration
			wpov.appraised * wlr.levy_rate_non_classified / 1000.0
	end),		
		
	wlr.levy_exemption,
	wpov.taxable_classified,
	wpov.taxable_non_classified,
	taxable = case
		when wlr.levy_exemption = ''
		then (wpov.taxable_classified + wpov.taxable_non_classified)
		else wpov.taxable_non_classified
	end

from wash_prop_owner_val wpov with(nolock)

join wash_prop_owner_tax_district_assoc wpotda with(nolock)
	on wpotda.year = wpov.year
	and wpotda.sup_num = wpov.sup_num
	and wpotda.prop_id = wpov.prop_id
	and wpotda.owner_id = wpov.owner_id

join property p with(nolock) 
	on p.prop_id = wpov.prop_id
	
join property_tax_area pta with(nolock)
	on pta.year = wpov.year 
	and pta.sup_num = wpov.sup_num 
	and pta.prop_id = wpov.prop_id

join tax_area_fund_assoc tafa with(nolock) 
	on tafa.year = wpotda.year 
	and tafa.tax_district_id = wpotda.tax_district_id 
	and tafa.tax_area_id = pta.tax_area_id 

join levy l with(nolock)
	on l.[year] = tafa.[year]
	and l.tax_district_id = tafa.tax_district_id
	and l.levy_cd = tafa.levy_cd

join tax_district td with(nolock)
	on td.tax_district_id = l.tax_district_id

left join property_exemption pe_snr with(nolock)
	on pe_snr.exmpt_tax_yr		= wpov.year
	and pe_snr.owner_tax_yr		= wpov.year
	and pe_snr.prop_id			= wpov.prop_id
	and pe_snr.sup_num			= wpov.sup_num
	and pe_snr.owner_id			= wpov.owner_id
	and pe_snr.exmpt_type_cd	= 'SNR/DSBL'

left join levy_exemption lexreal with(nolock)
	on lexreal.year = l.year
	and lexreal.tax_district_id = l.tax_district_id
	and lexreal.levy_cd = l.levy_cd
	and lexreal.exmpt_type_cd = 'SNR/DSBL'

left join levy_exemption lexpers with(nolock)
	on lexpers.year = l.year
	and lexpers.tax_district_id = l.tax_district_id
	and lexpers.levy_cd = l.levy_cd
	and lexpers.exmpt_type_cd = 'FARM'

cross apply (
	select
		levy_rate_classified = convert(numeric(13,10), case
		when p.prop_type_cd in ('R','MH') and lexreal.exmpt_type_cd is not null then 0
		when p.prop_type_cd in ('P','A') and lexpers.exmpt_type_cd is not null then 0
		when (pe_snr.exmpt_type_cd is not null) and (isnull(l.senior_levy_rate, 0) > 0) then isnull(l.senior_levy_rate, 0)
		else isnull(l.levy_rate, 0)
	end),

	levy_rate_non_classified = isnull(l.levy_rate, 0),

	levy_exemption = case
		when p.prop_type_cd in ('R','MH') and lexreal.exmpt_type_cd is not null then 'SNR/DSBL'
		when p.prop_type_cd in ('P','A') and lexpers.exmpt_type_cd is not null then 'FARM'
		else ''
	end
) wlr

where not exists (
	-- exclude LTIF sponsoring levies
	select 1 from tif_area_levy tal with(nolock)
	where tal.year = l.year
	and tal.linked_tax_district_id = l.tax_district_id
	and tal.linked_levy_cd = l.levy_cd
)

and not exists (
	select 1 from wash_prop_owner_proration wpop with(nolock)
	where wpop.year = wpov.year
	and wpop.sup_num = wpov.sup_num
	and wpop.prop_id = wpov.prop_id
	and wpop.owner_id = wpov.owner_id
)


UNION ALL

	-- properties with [wash_prop_owner_proration] records
select year, sup_num, prop_id, owner_id,
	tax_district_id, tax_district_cd, levy_cd, levy_description,
	levy_rate_classified, levy_rate_non_classified,
	convert(numeric(14,2), sum(tax_amt)) tax_amt, 
	convert(numeric(14,2), sum(tax_wout_ex_amt)) tax_wout_ex_amt, 
	levy_exemption,
	convert(numeric(14,0), sum(taxable_classified)) taxable_classified, 
	convert(numeric(14,0), sum(taxable_non_classified)) taxable_non_classified, 
	convert(numeric(14,0), sum(taxable)) taxable
	
from
(
	select 
		wpov_current.year,
		wpov_current.sup_num,
		wpov_current.prop_id,
		wpov_current.owner_id,
		l.tax_district_id,
		td.tax_district_cd,
		l.levy_cd,
		l.levy_description,
		wlr.levy_rate_classified,
		wlr.levy_rate_non_classified,
		
		tax_amt =  
			(
				(wpov_past.taxable_classified * wlr.levy_rate_classified / 1000.0) + 
				(wpov_past.taxable_non_classified * wlr.levy_rate_non_classified / 1000.0) 
			) * wpop.ex_value_pct
			+
			(wpov_past.appraised * wlr.levy_rate_non_classified / 1000.0) * wpop.no_ex_value_pct,
		
		tax_wout_ex_amt = (wpov_past.appraised * wlr.levy_rate_non_classified / 1000.0) * 
											(wpop.ex_value_pct + wpop.no_ex_value_pct),
		
		wlr.levy_exemption,
		wpov_past.taxable_classified * (wpop.ex_value_pct + wpop.no_ex_value_pct) taxable_classified,
		wpov_past.taxable_non_classified  * (wpop.ex_value_pct + wpop.no_ex_value_pct) taxable_non_classified,
		taxable = case
			when wlr.levy_exemption = ''
			then (wpov_past.taxable_classified + wpov_past.taxable_non_classified)
			else wpov_past.taxable_non_classified
		end * (wpop.ex_value_pct + wpop.no_ex_value_pct)
		
	from wash_prop_owner_val wpov_current with(nolock)

	join wash_prop_owner_proration wpop with(nolock)
		on wpop.year = wpov_current.year
		and wpop.sup_num = wpov_current.sup_num
		and wpop.prop_id = wpov_current.prop_id
		and wpop.owner_id = wpov_current.owner_id

	join wash_prop_owner_val wpov_past with(nolock)
		on wpov_past.year = wpop.year
		and wpov_past.sup_num = wpop.past_sup_num
		and wpov_past.prop_id = wpop.prop_id
		and wpov_past.owner_id = wpop.past_owner_id

	join wash_prop_owner_levy_assoc wpola with(nolock)
		on wpola.year = wpov_past.year
		and wpola.sup_num = wpov_past.sup_num
		and wpola.prop_id = wpov_past.prop_id
		and wpola.owner_id = wpov_past.owner_id
		and wpola.pending = 0

	join property p with(nolock) 
		on p.prop_id = wpov_current.prop_id
		
	join levy l with(nolock)
		on l.[year] = wpola.year
		and l.tax_district_id = wpola.tax_district_id
		and l.levy_cd = wpola.levy_cd

	join tax_district td with(nolock)
		on td.tax_district_id = l.tax_district_id

	left join property_exemption pe_snr with(nolock)
		on pe_snr.exmpt_tax_yr		= wpola.year
		and pe_snr.owner_tax_yr		= wpola.year
		and pe_snr.prop_id			= wpola.prop_id
		and pe_snr.sup_num			= wpola.sup_num
		and pe_snr.owner_id			= wpola.owner_id
		and pe_snr.exmpt_type_cd	= 'SNR/DSBL'

	left join levy_exemption lexreal with(nolock)
		on lexreal.year = l.year
		and lexreal.tax_district_id = l.tax_district_id
		and lexreal.levy_cd = l.levy_cd
		and lexreal.exmpt_type_cd = 'SNR/DSBL'

	left join levy_exemption lexpers with(nolock)
		on lexpers.year = l.year
		and lexpers.tax_district_id = l.tax_district_id
		and lexpers.levy_cd = l.levy_cd
		and lexpers.exmpt_type_cd = 'FARM'

	cross apply (
		select
			levy_rate_classified = convert(numeric(13,10), case
			when p.prop_type_cd in ('R','MH') and lexreal.exmpt_type_cd is not null then 0
			when p.prop_type_cd in ('P','A') and lexpers.exmpt_type_cd is not null then 0
			when (pe_snr.exmpt_type_cd is not null) and (isnull(l.senior_levy_rate, 0) > 0) then isnull(l.senior_levy_rate, 0)
			else isnull(l.levy_rate, 0)
		end),

		levy_rate_non_classified = isnull(l.levy_rate, 0),

		levy_exemption = case
			when p.prop_type_cd in ('R','MH') and lexreal.exmpt_type_cd is not null then 'SNR/DSBL'
			when p.prop_type_cd in ('P','A') and lexpers.exmpt_type_cd is not null then 'FARM'
			else ''
		end
	) wlr

	where not exists (
		-- exclude LTIF sponsoring levies
		select 1 from tif_area_levy tal with(nolock)
		where tal.year = l.year
		and tal.linked_tax_district_id = l.tax_district_id
		and tal.linked_levy_cd = l.levy_cd
	)	

)q

group by year, sup_num, prop_id, owner_id,
	tax_district_id, tax_district_cd, levy_cd, levy_description,
	levy_rate_classified, levy_rate_non_classified,
	levy_exemption

GO

