

		-- Alternate version of BuildSQLBill for SP Property Access.
		-- Do not deploy this SP normally. SP ExportPropertyAccess will create it in PA databases.

		CREATE PROCEDURE dbo.BuildSQLBill
		@dataset_id int,
		@segment_id int

		AS 

		set nocount on

		if object_id('tempdb..#result') is not null
			drop table #result
		if object_id('tempdb..#prop_use') is not null
			drop table #prop_use
		if object_id('tempdb..#prop_detail') is not null
			drop table #prop_detail


		create table #result
		(
			bill_id int primary key,
			year numeric(4,0),
			prop_id int,
			current_amount_due numeric(14,2),
			statement_id int,
			is_partial char(1),
			owner_id int,
			prop_type_cd char(5),
			tax_district_id int,
			rollback_id int,
			agency_id int,
			payout_agreement_id int,
			use_bond_interest bit,
			override_penalty_and_interest bit,
			effective_due_date datetime,
			bond_interest_percentage numeric(14,4),
			bond_interest_begin_date datetime,
			bond_interest_end_date datetime,
			code varchar(10),
			bond_interest_frequency varchar(10),
			payment_terms_type_cd varchar(10),
			is_leased_land_property bit,
			calc_penalty_on_bond_interest bit, 
			calc_interest_on_bond_interest bit,
			penalty_interest_property_type_cd varchar(10),
			priority int
		)

		create index py on #result (prop_id, year)


		create table #prop_use
		(
			prop_id int not null, 
			year numeric(4,0) not null, 
			penalty_interest_property_type_cd varchar(10) not null,

			primary key (prop_id, year, penalty_interest_property_type_cd)
		)

		create table #prop_detail
		(
			prop_id int not null, 
			year numeric(4,0) not null, 
			penalty_interest_property_type_cd varchar(10) not null,

			primary key (prop_id, year, penalty_interest_property_type_cd)
		)


		-- Everything else but the PIP codes
		insert #result
		(bill_id, year, prop_id, current_amount_due, statement_id, is_partial, owner_id, prop_type_cd, tax_district_id,
		 rollback_id, agency_id, payout_agreement_id, use_bond_interest, override_penalty_and_interest, effective_due_date,
		  bond_interest_percentage, bond_interest_begin_date, bond_interest_end_date, code, bond_interest_frequency,
		  payment_terms_type_cd, is_leased_land_property, calc_penalty_on_bond_interest, calc_interest_on_bond_interest, 
		  penalty_interest_property_type_cd, priority)

		select
			b.bill_id, b.year, b.prop_id, b.current_amount_due, isnull(b.statement_id, 0) statement_id,
			case when ab.bill_id is not null then 
				case when  ppra.payout_agreement_id is not null then 'F' 
  					when isNull(saso.eligible_for_partial_pay, 0) = 1 and b.effective_due_date > '4/25/2023'	then 'T'
    				when isnull(bfc.partial_payment_indicator, 'F') = 'T' then 'T'
    				when isnull(pc.szConfigValue,0) = 1 then 'T'
    				else 'F'
				end
			when isnull(bfc.partial_payment_indicator, 'F') = 'T' then 'T'
			when isnull(pc.szConfigValue,0) = 1  and ppra.payout_agreement_id is null then 'T'
			else 'F'
		end is_partial,
			isnull(statement_owner.owner_id, isnull(p.col_owner_id, 0)) owner_id, p.prop_type_cd,
			lb.tax_district_id, b.rollback_id, ab.agency_id, paba.payout_agreement_id,
			isnull(pa.use_bond_interest, 0) use_bond_interest, isnull(pa.override_penalty_and_interest, 0) override_penalty_and_interest,
			b.effective_due_date, pa.bond_interest_percentage,
			pa.bond_interest_begin_date, pa.bond_interest_end_date, b.code,pa.bond_interest_frequency, pa.payment_terms_type_cd,
			isnull(pll.is_leased_land_property, 0) is_leased_land_property,
			pa.calc_penalty_on_bond_interest, pa.calc_interest_on_bond_interest, 
			null, -- penalty_interest_property_type_cd
			99999 -- priority, lowest number wins

		from tax_due_calc_list as tdcl with(nolock)
		join bill as b with(nolock) on
			b.bill_id = tdcl.tax_due_id
		join property as p with(nolock) on
			p.prop_id = b.prop_id
		left outer join levy_bill as lb with(nolock) on
			lb.bill_id = b.bill_id
		left outer join assessment_bill as ab with(nolock) on
			ab.bill_id = b.bill_id

		left outer join ( 
			select bill_id, max(payout_agreement_id) as payout_agreement_id
			from payout_agreement_bill_assoc with(Nolock)
			group by bill_id
		) as paba on
			paba.bill_id = b.bill_id
			
		left join (
			select max(payout_agreement_id) payout_agreement_id, year, sup_num, prop_id, is_primary from property_payout_agreement with(nolock) group by year, sup_num, prop_id, is_primary
		) ppra on
		p.prop_id = ppra.prop_id and b.year = ppra.year and b.sup_num = ppra.sup_num
		left outer join payout_agreement as pa with(nolock) on
			pa.payout_agreement_id = paba.payout_agreement_id
		left outer join bill_fee_code as bfc with(nolock) on
			bfc.bill_fee_cd = b.code
		left outer join special_assessment_statement_options as saso with (nolock) on
			saso.agency_id = ab.agency_id and
			saso.year = ab.year
		left join pacs_config pc on
			   pc.szgroup = 'Payment' and szConfigName = 'Allow Universal Partial Payments'
		left outer join property_leased_land_vw as pll with(nolock) on 
			pll.prop_id = p.prop_id and pll.prop_val_yr = b.year

		outer apply (
			select max(wts.run_id) max_run_id
			from wa_tax_statement wts with(nolock) 
			where wts.year = b.year
			and wts.prop_id = b.prop_id
			and wts.statement_id = b.statement_id
		) max_run
		outer apply (
			select top 1 owner_id
			from wa_tax_statement wts with(nolock)
			where wts.year = b.year
			and wts.prop_id = b.prop_id
			and wts.statement_id = b.statement_id
			and wts.run_id = max_run.max_run_id
			order by copy_type
		) statement_owner

		where tdcl.dataset_id = @dataset_id and tdcl.segment_id = @segment_id
		order by b.bill_id asc


		-- HB 1410 Penalty and Interest (PIP) codes

		-- personal properties
		update r
		set penalty_interest_property_type_cd = x.penalty_interest_property_type_cd, [priority] = x.priority 
		from #result r

		outer apply (
			select top 1 pipt.penalty_interest_property_type_cd, pipt.priority 

			from _clientdb_property pv with(nolock)
			join property p with(nolock)
				on p.prop_id = pv.prop_id
			join penalty_interest_property_type pipt with(nolock)
				on pipt.personal = 1
			join penalty_and_interest pai with(nolock)
				on pai.penalty_interest_property_type_cd = pipt.penalty_interest_property_type_cd
				and pai.year = pv.prop_val_yr
			where pv.prop_id = r.prop_id
			and pv.prop_val_yr = r.year
			and ((r.tax_district_id is null) or (pai.ref_id = r.tax_district_id))
			and p.prop_type_cd in ('P','MN')

			and pv.prop_id = r.prop_id
			and pv.prop_val_yr = r.year

			order by pipt.priority
		)x
		where x.priority is not null


		-- vacant properties
		update r
		set penalty_interest_property_type_cd = x.penalty_interest_property_type_cd, [priority] = x.priority 
		from #result r

		outer apply (
			select top 1 pipt.penalty_interest_property_type_cd, pipt.priority 

			from _clientdb_property pv with(nolock)
			join property p with(nolock)
				on p.prop_id = pv.prop_id
			join property_use pu with(nolock) on
				(pu.property_use_cd = pv.property_use_cd or pu.property_use_cd = pv.secondary_use_cd)
			join dor_use_code duc with(nolock)
				on duc.sub_cd = pu.dor_use_code
			join penalty_interest_property_type_dor_use_code piptduc with(nolock)
				on piptduc.sub_cd = duc.sub_cd
			join penalty_interest_property_type pipt with(nolock)
				on pipt.penalty_interest_property_type_cd = piptduc.penalty_interest_property_type_cd
				and pipt.personal = 0
			join penalty_and_interest pai with(nolock)
				on pai.penalty_interest_property_type_cd = pipt.penalty_interest_property_type_cd
				and pai.year = pv.prop_val_yr
			where pv.prop_id = r.prop_id
			and pv.prop_val_yr = r.year
			and ((r.tax_district_id is null) or (pai.ref_id = r.tax_district_id))
			and p.prop_type_cd not in ('P','MN')
			and not exists (
				select 1 from _clientdb_improvement_building_detail id with(nolock)
				where id.prop_id = pv.prop_id
				and id.prop_val_yr = pv.prop_val_yr
				and id.imprv_det_id is not null
			)
			and pv.prop_id = r.prop_id
			and pv.prop_val_yr = r.year
			and pipt.priority < r.priority

			order by pipt.priority
		)x
		where x.priority is not null


		-- Properties with a matching use code, improvement detail type, and PIP type

		-- PIP codes that match by property use
		insert #prop_use (prop_id, year, penalty_interest_property_type_cd)
		select distinct pv.prop_id, pv.prop_val_yr year, piptduc.penalty_interest_property_type_cd 
		from
		(
			select distinct prop_id, year
			from #result
		)py
		join _clientdb_property pv with(nolock)
			on pv.prop_id = py.prop_id
			and pv.prop_val_yr = py.year
		join property_use pu with(nolock) on
			(pu.property_use_cd = pv.property_use_cd or pu.property_use_cd = pv.secondary_use_cd)
		join dor_use_code duc with(nolock)
			on duc.sub_cd = pu.dor_use_code
		join penalty_interest_property_type_dor_use_code piptduc with(nolock)
			on piptduc.sub_cd = duc.sub_cd


		-- PIP codes that match by improvement detail
		insert #prop_detail (prop_id, year, penalty_interest_property_type_cd)
		select distinct pv.prop_id, pv.prop_val_yr year, piptidtc.penalty_interest_property_type_cd 
		from
		(
			select distinct prop_id, year
			from #result
		)py
		join _clientdb_property pv with(nolock)
			on pv.prop_id = py.prop_id
			and pv.prop_val_yr = py.year
		join _clientdb_improvement_building_detail id with(nolock) 
			on pv.prop_id = id.prop_id
			and pv.prop_val_yr = id.prop_val_yr
		join penalty_interest_property_type_imprv_det_type_cd piptidtc with(nolock)
			on piptidtc.imprv_det_type_cd = id.imprv_det_type_cd


		-- Combine queries
		update r
		set penalty_interest_property_type_cd = x.penalty_interest_property_type_cd, [priority] = x.priority 
		from #result r

		outer apply (

			select top 1 pipt.penalty_interest_property_type_cd, pipt.priority 

			from #prop_use pu
			join #prop_detail pd
				on pd.prop_id = pu.prop_id
				and pd.year = pu.year
				and pd.penalty_interest_property_type_cd = pu.penalty_interest_property_type_cd
			join penalty_interest_property_type pipt with(nolock)
				on pipt.penalty_interest_property_type_cd = pu.penalty_interest_property_type_cd
			join penalty_and_interest pai with(nolock)
				on pai.penalty_interest_property_type_cd = pu.penalty_interest_property_type_cd
				and pai.year = pu.year
				and ((r.tax_district_id is null) or (pai.ref_id = r.tax_district_id))
			where pu.prop_id = r.prop_id
			and pu.year = r.year
			and pipt.priority < r.priority

			order by pipt.priority
		)x
		where x.priority is not null


		-- output
		select
			bill_id,
			year,
			prop_id,
			current_amount_due,
			statement_id,
			is_partial,
			owner_id,
			prop_type_cd,
			tax_district_id,
			rollback_id,
			agency_id,
			payout_agreement_id,
			use_bond_interest,
			override_penalty_and_interest,
			effective_due_date,
			bond_interest_percentage,
			bond_interest_begin_date,
			bond_interest_end_date,
			code,
			bond_interest_frequency,
			payment_terms_type_cd,
			is_leased_land_property,
			calc_penalty_on_bond_interest, 
			calc_interest_on_bond_interest,
			penalty_interest_property_type_cd

		from #result

GO

