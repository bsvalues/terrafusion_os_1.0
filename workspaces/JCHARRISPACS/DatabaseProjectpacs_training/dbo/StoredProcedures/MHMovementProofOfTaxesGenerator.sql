
create procedure MHMovementProofOfTaxesGenerator
	@datasetID int,
	@mhmID int
as


insert into ##mhm_proof_of_taxes_report (
	dataset_id,
	mhm_id,
	prop_id,
	current_owner_name,
	current_owner_addr_line1,
	current_owner_addr_line2,
	current_owner_addr_line3,
	current_owner_city,
	current_owner_state,
	current_owner_zip,
	purchaser_type,
	purchaser_name,
	purchaser_addr_line1,
	purchaser_addr_line2,
	purchaser_addr_line3,
	purchaser_addr_city,
	purchaser_addr_state,
	purchaser_addr_zip,
	purchaser_addr_zip_cass,
	purchase_price,
	transporter_desc,
	mbl_hm_make,
	mbl_hm_model,
	mbl_hm_year,
	mbl_hm_sn,
	mbl_hm_sn_2,
	mbl_hm_tip_out,
	situs_display
)
select
	@datasetID,
	@mhmID,
	mhm.prop_id,
	a.file_as_name,
	ad.addr_line1,
	ad.addr_line2,
	ad.addr_line3,
	ad.addr_city,
	ad.addr_state,
	ad.zip,
	mhm.purchaser_type,
	mhm.purchaser_name,
	mhm.purchaser_addr_line1,
	mhm.purchaser_addr_line2,
	mhm.purchaser_addr_line3,
	mhm.purchaser_addr_city,
	mhm.purchaser_addr_state,
	mhm.purchaser_addr_zip,
	mhm.purchaser_addr_zip_cass,
	mhm.purchase_price,
	mhtc.transporter_desc,
	i.mbl_hm_make,
	i.mbl_hm_model,
	i.actual_year_built,
	i.mbl_hm_sn,
	i.mbl_hm_sn_2,
	i.mbl_hm_tip_out,
	s.situs_display
from
	mh_movement mhm with(nolock)
inner join imprv i with(nolock)
	on i.imprv_id = mhm.imprv_id and i.prop_id = mhm.prop_id and i.prop_val_yr = mhm.prop_val_yr and i.sup_num = mhm.sup_num
inner join mhm_transporter_code mhtc with(nolock)
	on mhtc.transporter_cd = mhm.mhm_transporter_cd
inner join (
		select owner_tax_yr, sup_num, prop_id, min(owner_id) as owner_id
		from owner with(nolock)
		group by owner_tax_yr, sup_num, prop_id
) o
	on o.owner_tax_yr = mhm.prop_val_yr and o.sup_num = mhm.sup_num and o.prop_id = mhm.prop_id
inner join account a with(nolock)
	on a.acct_id = case isnull(mhm.real_prop_owner_different, 0) when 1 then real_prop_owner_id when 0 then o.owner_id end
inner join address ad with(nolock)
	on ad.acct_id = a.acct_id
left join situs s with(nolock)
	on s.prop_id = mhm.prop_id and isnull(s.primary_situs, 'N') = 'Y'
where
	mhm.mhm_id = @mhmID


-- Grab the width and height from the highest valued improvement detail
declare @propID int
select @propID = mhm.prop_id
from mh_movement mhm with(nolock)
where mhm.mhm_id = @mhmID

update potr
set width = idw.width, length = idl.length
from ##mhm_proof_of_taxes_report potr
inner join mh_movement mhm with(nolock)
	on mhm.mhm_id = potr.mhm_id
inner join imprv i with(nolock)
	on i.prop_id = mhm.prop_id and i.prop_val_yr = mhm.prop_val_yr and i.sup_num = mhm.sup_num
inner join imprv_type it with(nolock)
	on it.imprv_type_cd = i.imprv_type_cd and it.mobile_home = 'Y'
left join (
	select id.prop_id, id.prop_val_yr, id.imprv_id, id.imprv_det_id, id.sup_num, id.width
	from (
		select id.prop_id, id.prop_val_yr, id.imprv_id, id.imprv_det_id, id.sup_num, id.imprv_det_val, id.width
		from imprv_detail id with(nolock)
		where id.prop_id = @propID and isnull(width, 0) > 0
	) id
	inner join (
		select prop_id, prop_val_yr, imprv_id, sup_num, max(imprv_det_val) as max_value
		from (
			select id.prop_id, id.prop_val_yr, id.imprv_id, id.imprv_det_id, id.sup_num, id.imprv_det_val, id.width
			from imprv_detail id with(nolock)
			where id.prop_id = @propID and isnull(width, 0) > 0
		) as idk
		group by prop_id, prop_val_yr, imprv_id, sup_num
	) id2 on id2.prop_id = id.prop_id and id2.prop_val_yr = id.prop_val_yr and id2.imprv_id = id.imprv_id and id2.sup_num = id.sup_num and id2.max_value = id.imprv_det_val
) idw 
	on idw.prop_id = i.prop_id and idw.prop_val_yr = i.prop_val_yr and idw.sup_num = i.sup_num and idw.imprv_id = i.imprv_id
left join (
	select id.prop_id, id.prop_val_yr, id.imprv_id, id.imprv_det_id, id.sup_num, id.[length]
	from (
		select id.prop_id, id.prop_val_yr, id.imprv_id, id.imprv_det_id, id.sup_num, id.imprv_det_val, id.[length]
		from imprv_detail id with(nolock)
		where id.prop_id = @propID and isnull([length], 0) > 0
	) id
	inner join (
		select prop_id, prop_val_yr, imprv_id, sup_num, max(imprv_det_val) as max_value
		from (
			select id.prop_id, id.prop_val_yr, id.imprv_id, id.imprv_det_id, id.sup_num, id.imprv_det_val, id.[length]
			from imprv_detail id with(nolock)
			where id.prop_id = @propID and isnull([length], 0) > 0
		) as idk
		group by prop_id, prop_val_yr, imprv_id, sup_num
	) id2 on id2.prop_id = id.prop_id and id2.prop_val_yr = id.prop_val_yr and id2.imprv_id = id.imprv_id and id2.sup_num = id.sup_num and id2.max_value = id.imprv_det_val
) idl 
	on idl.prop_id = i.prop_id and idl.prop_val_yr = i.prop_val_yr and idl.sup_num = i.sup_num and idl.imprv_id = i.imprv_id
where 
	potr.dataset_id = @datasetID

GO

