




create view dbo.release_mh_lien_vw
as
select
	mhl.lien_id,
	mhl.prop_id,
	mhl.tax_yr,
	mhl.entity_id,
	mhl.mbl_hm_hud_num,
	mhl.mbl_hm_sn,
	mhl.mbl_hm_model,
	mbv.tax_amount
from
	mh_lien as mhl with (nolock)
inner join
	mh_balance_vw as mbv with (nolock)
on
	mhl.prop_id = mbv.prop_id
and	mhl.tax_yr = mbv.tax_yr
and	mhl.entity_id = mbv.entity_id
and	mhl.mbl_hm_hud_num = mbv.mbl_hm_hud_num
and	mhl.mbl_hm_sn = mbv.mbl_hm_sn
where
	mhl.lien_release_date is null

GO

