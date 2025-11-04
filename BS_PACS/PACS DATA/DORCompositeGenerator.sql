
create procedure DORCompositeGenerator
	@dataset_id int,
	@year int,
	@sup_num int,
	@bRunTaxDistrict bit = 1

as

set nocount on

delete from ##dor_composite_report 
where dataset_id = @dataset_id

if (@bRunTaxDistrict = 1) 
begin
	-- by Tax District
	insert into ##dor_composite_report
	select
		@dataset_id,
		td.tax_district_id,
		td.tax_district_desc,
		sum(isnull(l.levy_rate, 0)),
		0,
		0
	from tax_district td with(nolock)
	left join levy l with(nolock)
		on l.tax_district_id = td.tax_district_id 
		and l.year = @year
	where td.tax_district_type_cd <> 'ST'
	group by td.tax_district_id, td.tax_district_desc

	update dcr
	set 
		ag_val = sum_ag_val,
		acres = sum_acres
	from ##dor_composite_report dcr
	inner join 
	(
		-- PLEASE VERIFY ANY CHANGES HERE ARE CONSIDERED AND/OR CONSISTENT WITH THE DORASSESSEDVALUE STORED PROCEDURE	
		select td.tax_district_id,
		sum(case when au.dfl = 1 and ld.ag_apply = 'T' then case when isnull(ld.ag_val, 0) < isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) then isnull(ld.ag_val, 0) else isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) end /*- isnull(lfi.frz_loss, 0)*/ else 0 end) as sum_ag_val, 
		sum(isnull(ld.size_acres,0)) sum_acres
		from property p with(nolock) 
		cross apply (
			select top 1 *
			from property_val with(nolock)
			where property_val.prop_id = p.prop_id
			and property_val.sup_num <= @sup_num
			and property_val.prop_val_yr = @year
			order by property_val.sup_num desc
		) pv
		join property_use as pu with(nolock) on
			pu.property_use_cd = pv.property_use_cd
		join dor_land_use_code as dor with(nolock) on
			dor.code = pu.dor_use_code
		join property_tax_area pta with(nolock)
			on pv.prop_id = pta.prop_id
			and pv.prop_val_yr = pta.year
			and pv.sup_num = pta.sup_num
		join land_detail ld with(nolock) 
			on pv.prop_id = ld.prop_id 
			and pv.prop_val_yr = ld.prop_val_yr
			and pv.sup_num = ld.sup_num
		join ag_use au with(nolock)
			on au.ag_use_cd = ld.ag_use_cd 
			and au.dfl = 1
		join (
			select distinct tafa.tax_area_id, tafa.tax_district_id, tafa.year
			from tax_area_fund_assoc as tafa with(nolock)
		) as tafa 
			on tafa.year = @year
			and tafa.tax_area_id = pta.tax_area_id
		join tax_district td with(nolock)
			on tafa.tax_district_id = td.tax_district_id
			and td.tax_district_type_cd <> 'ST'
		left outer join wash_prop_owner_exemption as wpoe_u500 with(nolock) on
			wpoe_u500.year = pv.prop_val_yr and
			wpoe_u500.sup_num = pv.sup_num and
			wpoe_u500.prop_id = pv.prop_id and
			wpoe_u500.exmpt_type_cd = 'U500'
		left outer join wash_prop_owner_exemption as wpoe_snr with(nolock) on
			wpoe_snr.year = pv.prop_val_yr and
			wpoe_snr.sup_num = pv.sup_num and
			wpoe_snr.prop_id = pv.prop_id and
			wpoe_snr.exmpt_type_cd = 'SNR/DSBL'
		left outer join wash_prop_owner_exemption as wpoe_ex with(nolock) on
			wpoe_ex.year = pv.prop_val_yr and
			wpoe_ex.sup_num = pv.sup_num and
			wpoe_ex.prop_id = pv.prop_id and
			wpoe_ex.exmpt_type_cd = 'EX'			

		where pv.prop_inactive_dt is null  
			and pv.prop_val_yr = @year
			and ld.sale_id = 0 
			and ld.ag_apply = 'T'
			and wpoe_ex.prop_id is null	

		group by td.tax_district_id
	) tt
	on tt.tax_district_id = dcr.tax_district_id
	where dcr.dataset_id = @dataset_id
end

else begin
	-- by Tax Area
	insert into ##dor_composite_report
	select
		@dataset_id,
		ta.tax_area_id,
		convert(varchar(255), ta.tax_area_id) + ' - ' + ta.tax_area_description,
		sum(isnull(l.levy_rate, 0)),
		0,
		0
	from tax_area ta with(nolock)
	join tax_area_fund_assoc tafa with(nolock) 
		on ta.tax_area_id = tafa.tax_area_id
	join levy l with(nolock) 
		on tafa.levy_cd = l.levy_cd
		and tafa.tax_district_id = l.tax_district_id
		and tafa.year = l.year
	join tax_district td
		on td.tax_district_id = l.tax_district_id
		and td.tax_district_type_cd <> 'ST'
	group by ta.tax_area_id, ta.tax_area_description, l.year
	having l.year = @year
		

	update dcr
	set 
		ag_val = sum_ag_val,
		acres = sum_acres
	from ##dor_composite_report dcr
	inner join 
	(
		-- PLEASE VERIFY ANY CHANGES HERE ARE CONSIDERED AND/OR CONSISTENT WITH THE DORASSESSEDVALUE STORED PROCEDURE	
		select pta.tax_area_id, 
		sum(case when au.dfl = 1 and ld.ag_apply = 'T' then case when isnull(ld.ag_val, 0) < isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) then isnull(ld.ag_val, 0) else isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) end /*- isnull(lfi.frz_loss, 0)*/ else 0 end) as sum_ag_val, 
		sum(isnull(ld.size_acres, 0)) sum_acres 
		from property p with(nolock)
		cross apply (
			select top 1 *
			from property_val with(nolock)
			where property_val.prop_id = p.prop_id
			and property_val.sup_num <= @sup_num
			and property_val.prop_val_yr = @year
			order by property_val.sup_num desc
		) pv
		join property_use as pu with(nolock) on
			pu.property_use_cd = pv.property_use_cd
		join dor_land_use_code as dor with(nolock) on
			dor.code = pu.dor_use_code
		join property_tax_area pta with(nolock)
			on pv.prop_id = pta.prop_id
			and pv.prop_val_yr = pta.year
			and pv.sup_num = pta.sup_num
		join land_detail ld with(nolock) 
			on pv.prop_id = ld.prop_id 
			and pv.prop_val_yr = ld.prop_val_yr
			and pv.sup_num = ld.sup_num
		join ag_use au with(nolock)
			on au.ag_use_cd = ld.ag_use_cd 
			and au.dfl = 1
		left outer join wash_prop_owner_exemption as wpoe_u500 with(nolock) on
			wpoe_u500.year = pv.prop_val_yr and
			wpoe_u500.sup_num = pv.sup_num and
			wpoe_u500.prop_id = pv.prop_id and
			wpoe_u500.exmpt_type_cd = 'U500'
		left outer join wash_prop_owner_exemption as wpoe_snr with(nolock) on
			wpoe_snr.year = pv.prop_val_yr and
			wpoe_snr.sup_num = pv.sup_num and
			wpoe_snr.prop_id = pv.prop_id and
			wpoe_snr.exmpt_type_cd = 'SNR/DSBL'
		left outer join wash_prop_owner_exemption as wpoe_ex with(nolock) on
			wpoe_ex.year = pv.prop_val_yr and
			wpoe_ex.sup_num = pv.sup_num and
			wpoe_ex.prop_id = pv.prop_id and
			wpoe_ex.exmpt_type_cd = 'EX'	
			
		where pv.prop_inactive_dt is null  
			and pv.prop_val_yr = @year
			and ld.sale_id = 0 
			and ld.ag_apply = 'T'
			and wpoe_ex.prop_id is null	
			
		group by pta.tax_area_id
	) tt
	on tt.tax_area_id = dcr.tax_district_id
	where dcr.dataset_id = @dataset_id		
end

GO

