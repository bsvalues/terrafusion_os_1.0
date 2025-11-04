




create view dbo.create_mh_lien_vw
as
select distinct
	mbv.prop_id,
	mbv.tax_yr,
	mbv.entity_id,
	mbv.entity_cd,
	mbv.entity_name,
	mbv.taxing_unit_num,
	mbv.owner_id,
	mbv.owner_name,
	mbv.mbl_hm_hud_num,
	mbv.mbl_hm_sn,
	mbv.mbl_hm_model,
	mbv.tax_amount
from
	mh_balance_vw as mbv with (nolock)
where not exists
(
	select
		*
	from
		dbo.mh_lien as mhl with (nolock)
	where
		mhl.prop_id = mbv.prop_id
	and	mhl.tax_yr = mbv.tax_yr
	and	mhl.entity_id = mbv.entity_id
	and	mhl.mbl_hm_hud_num = left(isnull(mbv.mbl_hm_hud_num, ''), 10)
	and	mhl.mbl_hm_sn = left(isnull(mbv.mbl_hm_sn, ''), 26)
	and	mhl.lien_release_date is null
)

GO

