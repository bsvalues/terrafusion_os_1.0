
/******************************************************************************************
GetCheckPrintData

Takes a comma-separated list of refund IDs and returns data for the
Check Print Report
******************************************************************************************/

create procedure GetCheckPrintData
	@id_string varchar(2048)
as

-- make temporary table
if object_id(N'tempdb..#refund_ids') is not null
	drop table #refund_ids

create table #refund_ids (refund_id int)

-- insert the refund IDs
declare @insert_query varchar(2048)
set @insert_query = 
	'insert #refund_ids (refund_id) ' +
	'select refund_id from refund where refund_id in (' + @id_string + ')'
exec (@insert_query)

-- now build the report data

select r.refund_id, r.check_number, r.refund_amount, r.refund_date, r.refund_to_name, 

case when isnull(r.refund_to_name, '') <> '' then r.refund_to_name + char(13) else '' end + 
case when isnull(r.refund_to_address1, '') <> '' then r.refund_to_address1 + char(13) else '' end + 
case when isnull(r.refund_to_address2, '') <> '' then r.refund_to_address2 + char(13) else '' end + 
case when isnull(r.refund_to_address3, '') <> '' then r.refund_to_address3 + char(13) else '' end + 
case when isnull(r.refund_to_city, '') <> '' then r.refund_to_city + ',' else '' end + 
isnull(r.refund_to_state, '') + ' ' + 
isnull(r.refund_to_zip, '') + ' ' + 
isnull(r.refund_to_country_cd, '') 
as address,

p.prop_id, p.geo_id,

((((((((((case when isnull(s.[situs_num],'')='' then '' else rtrim(ltrim(s.[situs_num]))+' ' end + 
case when isnull(s.[sub_num],'')='' then '' else rtrim(ltrim(s.[sub_num]))+' ' end) + 
case when isnull(s.[situs_street_prefx],'')='' then '' else rtrim(ltrim(s.[situs_street_prefx])) + 
' ' end)+case when s.[situs_street] IS NULL then '' else rtrim(ltrim(s.[situs_street]))+' ' end) + 
case when s.[situs_street_sufix] IS NULL then '' else rtrim(ltrim(s.[situs_street_sufix]))+' ' end) + 
case when isnull(s.[building_num],'')='' then '' else rtrim(ltrim(s.[building_num]))+' ' end) + 
case when s.[situs_unit] IS NULL then '' else rtrim(ltrim(s.[situs_unit])) end) + 
case when s.[situs_city] IS NULL AND s.[situs_state] IS NULL AND s.[situs_zip] IS NULL 
then '' else '  ' end)+case when s.[situs_city] IS NULL then '' else rtrim(ltrim(s.[situs_city])) + 
', ' end)+case when s.[situs_state] IS NULL then '' else rtrim(ltrim(s.[situs_state]))+' ' end) + 
case when s.[situs_zip] IS NULL then '' else rtrim(ltrim(s.[situs_zip])) end) as situs_display, 

owner_account.file_as_name as owner_name, 
case when rp.core_refund_type = 1 then null else primary_year + 1 end as tax_year, 
case when isnull(oc.description,'') <> '' then oc.description else rt.refund_reason end reason 

from #refund_ids

inner join refund r with(nolock)
on r.refund_id = #refund_ids.refund_id

cross apply (
	select top 1
		trans.trans_group_id primary_trans_group_id, 
		rta.prop_id primary_prop_id, 
		rta.year primary_year,
		rta.refund_type_cd primary_refund_type_cd,
		rta.refund_type_year primary_refund_type_year,
		rt.core_refund_type

	from refund_transaction_assoc rta with(nolock)

	inner join coll_transaction trans with(nolock)
	on trans.transaction_id = rta.transaction_id

	left join refund_type rt
	on rt.refund_type_cd = rta.refund_type_cd
	and rt.year = rta.refund_type_year

	where rta.refund_id = r.refund_id
	order by abs(trans.base_amount_pd) desc
) rp

left join property p with(nolock)
on p.prop_id = rp.primary_prop_id

left join prop_supp_assoc psa with(nolock)
on psa.prop_id = p.prop_id
and psa.owner_tax_yr = rp.primary_year

left join owner with(nolock)
on owner.prop_id = psa.prop_id
and owner.owner_tax_yr = psa.owner_tax_yr
and owner.sup_num = psa.sup_num

left join account owner_account with(nolock)
on owner.owner_id = owner_account.acct_id 

outer apply (
	select top 1 *
	from situs with(nolock)
	where situs.prop_id = p.prop_id
	order by case when situs.primary_situs = 'Y' then 1 else 2 end
) s

left join refund_type rt with(nolock)
on	rt.refund_type_cd = rp.primary_refund_type_cd
and rt.year = rp.primary_refund_type_year

left join overpayment_credit oc with(nolock)
on oc.overpmt_credit_id = rp.primary_trans_group_id

order by r.check_number, r.refund_id


-- cleanup
drop table #refund_ids

GO

