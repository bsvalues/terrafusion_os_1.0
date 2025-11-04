
create procedure MHMovementDecalGenerator
	@datasetID int,
	@mhmID int
as


insert into ##mh_movement_decal_report (
	dataset_id, mbl_hm_make, mbl_hm_model, mbl_hm_year, mbl_hm_sn, mbl_hm_sn_2, transporter_desc, wutc_permit_num, dot_permit_num
)
select
	@datasetID,
	i.mbl_hm_make, i.mbl_hm_model, i.actual_year_built, i.mbl_hm_sn, i.mbl_hm_sn_2,
	mhtc.transporter_desc, mhtc.wutc_permit_num, mhtc.dot_permit_num
from
	mh_movement mhm with(nolock)
inner join imprv i with(nolock)
	on i.imprv_id = mhm.imprv_id and i.prop_id = mhm.prop_id and i.sup_num = mhm.sup_num and i.prop_val_yr = mhm.prop_val_yr
inner join mhm_transporter_code mhtc with(nolock)
	on mhtc.transporter_cd = mhm.mhm_transporter_cd
where
	mhm.mhm_id = @mhmID

GO

