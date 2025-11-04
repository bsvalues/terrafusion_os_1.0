

CREATE VIEW building_permit_audit_prt_vw
AS
------------------------------------------------------------
--Declare @CurrentTaxYear Numeric(4,0);
--Set @CurrentTaxYear = 2006;


SELECT 
		bp.bldg_permit_id AS [Permit ID], 	
		pbpa.prop_id AS PID

		,(	select	Sum(imp_new_val) as NewlyConstructed
			from dbo.imprv i with (NoLock)
			where (			(pv.sup_num = i.sup_num) 
							AND (pv.prop_val_yr = i.prop_val_yr) 
							AND (pv.prop_id = i.prop_id)
						)
		) AS NC, 
		
		bp.bldg_permit_type_cd AS [Permit Type], 
		bp.bldg_permit_active AS Active, 
		bp.bldg_permit_cmnt AS [BP Comments], 
		bp.bldg_permit_num AS [Case #], 

		a.file_as_name AS Taxpayer, 
		bp.bldg_permit_cad_status AS Status, 
		bp.bldg_permit_issue_dt AS Issued, 
		bp.bldg_permit_dt_complete AS [Completed Date], 
		pv.next_appraisal_dt AS [Next Appraisal Date], 
		bp.bldg_permit_val AS Valuation, 
		dbo.fn_GetGroupCodes(pbpa.prop_id) AS [Group Codes], 
		sit.situs_display AS Situs,
		pv.hood_cd AS NH, 
		pv.imprv_hstd_val + pv.imprv_non_hstd_val AS [Imp Value], 
		pv.prop_val_yr AS [year] 		

FROM									dbo.building_permit AS bp WITH (nolock) 
					LEFT JOIN   dbo.prop_building_permit_assoc AS pbpa WITH (nolock) ON (bp.bldg_permit_id = pbpa.bldg_permit_id)
					LEFT JOIN		dbo.prop_supp_assoc psa WITH (nolock) on (		
--																																		(@CurrentTaxYear = psa.owner_tax_yr)
--																																And 
																																		(pbpa.prop_id = psa.prop_id)
																																) --If there is no supplement number for current system year, 
																																	--there is no information on property at all. Is that possible?
																																	--If so, how should it be reflected in the report?
					LEFT JOIN		dbo.property_val AS pv WITH (nolock) on (			(pbpa.prop_id = pv.prop_id)	
																																And (psa.owner_tax_yr = pv.prop_val_yr)
																																And (psa.sup_num = pv.sup_num)
																															)
					LEFT JOIN		dbo.owner AS o WITH (nolock) ON (			(pbpa.prop_id =  o.prop_id)

																												And (psa.owner_tax_yr =o.owner_tax_yr)
																												And (psa.sup_num = o.sup_num)
																											) --If there are several owners for the combination of the owner_tax_yr, sup_num, prop_id,
																												--Then the info about property is repeated, but the report contains Tax Payer name,
																												--which can explain that to the user
					LEFT JOIN		dbo.account AS a WITH (nolock) ON (o.owner_id = a.acct_id)
					LEFT JOIN		dbo.situs AS sit WITH (nolock) ON (			(pbpa.prop_id = sit.prop_id)
																												 And	('Y' = UPPER(sit.primary_situs))
																												);

GO

