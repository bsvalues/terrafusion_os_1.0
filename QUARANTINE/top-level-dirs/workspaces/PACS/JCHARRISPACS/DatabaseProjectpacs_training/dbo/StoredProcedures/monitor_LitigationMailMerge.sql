
CREATE PROCEDURE [dbo].[monitor_LitigationMailMerge]



@litigation_id		int



as 




select distinct lsa.prop_id, p.geo_id, s.situs_display, a.file_as_name,ad.addr_line1, 
	ad.addr_line2, ad.addr_line3,
	ad.addr_city, ad.addr_state, ad.addr_zip
from litigation_statement_assoc lsa with(nolock)
join property p with(nolock)
	on p.prop_id = lsa.prop_id
left join situs s with(Nolock)
	on s.prop_id = p.prop_id
	and s.primary_situs = 'Y'
join account a with(nolock)
	on a.acct_id = p.col_owner_id
join address ad with(nolock)
	on ad.acct_id = a.acct_id
	and primary_addr = 'Y'
where lsa.litigation_id = @litigation_id
order by lsa.prop_id

GO

