
CREATE procedure GetArbitrationCaseInfo

	@input_arbitration_id int,
	@input_year numeric(4,0)

as


	select arb.case_id, arb.prop_id, p.geo_id, IsNull(ARB_SRC.file_as_name, 'UDI Property') file_as_name, pv.legal_desc, arb.final_market
	from arbitration_case_assoc as aca
	with (nolock)
	join _arb_protest as arb
	with (nolock)
	on aca.prop_id = arb.prop_id
	and aca.prop_val_yr = arb.prop_val_yr
	and aca.case_id = arb.case_id
	join property as p
	with (nolock)
	on aca.prop_id = p.prop_id
	join property_val as pv
	with (nolock)
	on aca.prop_id = pv.prop_id
	and aca.prop_val_yr = pv.prop_val_yr
	left join (
		select ABC.arbitration_id, ABC.prop_id, file_as_name
		from (
			select prop_id, arbitration_id, count(prop_id) CNT from (
				select aca.prop_id, aca.arbitration_id
				from arbitration_case_assoc as aca
				inner join property_val pv on pv.prop_id=aca.prop_id and pv.prop_val_yr=aca.prop_val_yr
				inner join owner o on o.prop_id=pv.prop_id and o.sup_num=pv.sup_num and o.owner_tax_yr=pv.prop_val_yr
				inner join account ao on ao.acct_id=o.owner_id
			) Z
			GROUP BY prop_id, arbitration_id
			HAVING count(prop_id)=1
		) ABC inner join
		(
			select aca.prop_id, aca.arbitration_id, ao.file_as_name
			from arbitration_case_assoc as aca
			inner join property_val pv on pv.prop_id=aca.prop_id and pv.prop_val_yr=aca.prop_val_yr
			inner join owner o on o.prop_id=pv.prop_id and o.sup_num=pv.sup_num and o.owner_tax_yr=pv.prop_val_yr
			inner join account ao on ao.acct_id=o.owner_id
		) XYZ
		on ABC.arbitration_id=XYZ.arbitration_id and ABC.prop_id=XYZ.prop_id
	) ARB_SRC
	on arb.prop_id=ARB_SRC.prop_id and aca.arbitration_id=ARB_SRC.arbitration_id
	where aca.arbitration_id = @input_arbitration_id
	and aca.prop_val_yr = @input_year

GO

