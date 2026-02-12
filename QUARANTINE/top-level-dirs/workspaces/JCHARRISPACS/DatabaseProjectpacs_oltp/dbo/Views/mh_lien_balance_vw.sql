



create view dbo.mh_lien_balance_vw
as
select
	mhlv.lien_id,
	mhlv.lien_date,
	mhlv.prop_id,
	mhlv.tax_yr,
	mhlv.entity_cd,
	mhlv.entity_name,
	mhlv.taxing_unit_num,
	mhlv.mbl_hm_hud_num,
	mhlv.mbl_hm_sn,
	mhlv.owner_id,
	mhlv.owner_name,
	mbv.tax_amount
from
	dbo.mh_lien_vw as mhlv with (nolock)
inner join
	dbo.mh_balance_vw as mbv with (nolock)
on
	mbv.prop_id = mhlv.prop_id
and	mbv.tax_yr = mhlv.tax_yr
and	mbv.entity_id = mhlv.entity_id
and	mbv.mbl_hm_hud_num = mhlv.mbl_hm_hud_num
and	mbv.mbl_hm_sn = mhlv.mbl_hm_sn
where
	mhlv.lien_release_date is null

GO

