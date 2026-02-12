
			create view dbo.clientdb_taxing_jurisdiction_detail_vw
			as
			select t.*, y.certification_dt, max_freeze, a.confidential_flag, 
			ta.tax_area_number + ' - ' + ta.tax_area_description as tax_area 
			from _clientdb_taxing_jurisdiction_detail as t with (nolock) 
			join (select prop_id, sup_yr, max(isnull(freeze_ceiling,-1)) as max_freeze
				from _clientdb_taxing_jurisdiction_detail with (nolock) group  by prop_id, sup_yr) 
			as t1  on
			t.prop_id = t1.prop_id and
			t.sup_yr = t1.sup_yr
			join _clientdb_pacs_year as y	with (nolock)
			on t.sup_yr = y.tax_yr
			join account as a	with (nolock)
			on a.acct_id=t.owner_id
			left join tax_area as ta 	with (nolock)
			on t.tax_area_id = ta.tax_area_id

GO

