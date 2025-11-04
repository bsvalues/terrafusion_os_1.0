

create view dbo.mh_lien_vw
as
select distinct
	mhl.prop_id,
	mhl.tax_yr,
	mhl.entity_id,
	isnull(e.taxing_unit_num, '') as taxing_unit_num,
	ltrim(rtrim(isnull(e.entity_cd, ''))) as entity_cd,
	isnull(acct_entity.file_as_name, '') as entity_name,
	mhl.mbl_hm_hud_num,
	mhl.mbl_hm_sn,
	mhl.lien_id,
	mhl.lien_date,
	mhl.lien_pacs_user_id,
	mhl.lien_export_run_id,
	mhl.mbl_hm_model,
	mhl.tax_amount,
	mhl.lien_release_date,
	mhl.lien_release_pacs_user_id,
	mhl.lien_release_run_id,
	p.col_owner_id as owner_id,
	isnull(acct_owner.file_as_name, '') as owner_name,
	ltrim(rtrim(isnull(addr_owner.addr_line1, '') + ' ' + isnull(addr_owner.addr_line2, '') + ' ' + isnull(addr_owner.addr_line3, ''))) as owner_address,
	isnull(addr_owner.addr_city, '') as owner_city,
	isnull(addr_owner.addr_state, '') as owner_state,
	isnull(addr_owner.country_cd, '') as owner_country_cd,
	isnull(addr_owner.is_international, 0) as owner_is_international,
	isnull(addr_zip, '') as owner_zip,
	case when (s.situs_num is null) then '' else (rtrim(ltrim(s.situs_num)) + ' ') end + case when (s.situs_street_prefx is null) then '' else (rtrim(ltrim(s.situs_street_prefx)) + ' ') end + case when (s.situs_street is null) then '' else (rtrim(ltrim(s.situs_street)) + ' ') end + case when (s.situs_street_sufix is null) then '' else (rtrim(ltrim(s.situs_street_sufix)) + ' ') end + case when (s.situs_unit is null) then '' else (rtrim(ltrim(s.situs_unit))) end as situs_address,
	isnull(s.situs_city, '') as situs_city,
	isnull(s.situs_state, '') as situs_state,
	isnull(s.situs_zip, '') as situs_zip
from
	dbo.mh_lien as mhl with (nolock)
inner join
	dbo.property as p with (nolock)
on
	p.prop_id = mhl.prop_id
inner join
	dbo.account as acct_owner with (nolock)
on
	acct_owner.acct_id = p.col_owner_id
inner join
	dbo.entity as e with (nolock)
on
	e.entity_id = mhl.entity_id
inner join
	dbo.account as acct_entity with (nolock)
on
	acct_entity.acct_id = e.entity_id
left outer join
	dbo.situs as s with (nolock)
on
	s.prop_id = mhl.prop_id
and	s.primary_situs = 'Y'
left outer join
	dbo.address as addr_owner with (nolock)
on
	addr_owner.acct_id = acct_owner.acct_id
and	addr_owner.primary_addr = 'Y'

GO

