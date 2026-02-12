
			create view dbo.clientdb_property_vw
			as
			select p.*, a.web_suppression, a.confidential_flag, y.certification_dt, 
				case when tmpvw.prop_id is null then 1 else 0 end as all_taxes_paid,
				sale.sale_date,
				ts.township_desc as township, rr.range_desc as Range
			from _clientdb_property as p with (nolock)
			join _clientdb_pacs_year as y	with (nolock)
			on p.prop_val_yr = y.tax_yr
			join account as a	with (nolock)
			on a.acct_id=p.owner_id
			left outer join (
				select distinct prop_id
				from bill with (nolock)
				where isnull(taxes_paid,0) = 0
			) as tmpvw on tmpvw.prop_id = p.prop_id
			outer apply (
				select top 1 dhd.sale_date
				from _clientdb_deed_history_detail dhd with(nolock)
				where dhd.prop_id = p.prop_id
				and dhd.seq_num = 0
				order by dhd.sale_date desc
			) sale
			left join township as ts with (nolock)
			on p.township_code = ts.township_code
			and p.prop_val_yr = ts.township_year
			left join prop_range rr with (nolock)
			on p.range_code = rr.range_code
			and	p.prop_val_yr = rr.range_year
			
			where 
				(a.web_suppression = '0' or a.web_suppression Is Null)

GO

