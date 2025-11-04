
create procedure MHMovementTaxCertificateGenerator
	@datasetID int,
	@mhmID int
as


insert into ##mhm_tax_certificate_report (
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
	purchaser_addr_full,
	purchase_price,
	real_prop_owner_different,
	real_prop_owner_name,
	transporter_desc,
	wutc_permit_num,  --New Column
	dot_permit_num,	  --New Column	
	mbl_hm_make,
	mbl_hm_model,
	mbl_hm_year,
	mbl_hm_sn,
	mbl_hm_sn_2,
	mbl_hm_tip_out,
	move_to_county,
	move_to_street,
	move_to_city,
	move_to_state,
	move_to_zip,
	situs_display,
	comment,
	tax_area_number,
	assessments
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
	(case when isnull([purchaser_name],'')='' then '' else rtrim(ltrim([purchaser_name]))+', ' end + case when isnull([purchaser_addr_line1],'')='' then '' else rtrim(ltrim([purchaser_addr_line1]))+', ' end + case when isnull([purchaser_addr_line2],'')='' then '' else rtrim(ltrim([purchaser_addr_line2]))+', ' end + case when isnull([purchaser_addr_line3],'')='' then '' else rtrim(ltrim([purchaser_addr_line3]))+', ' end + (case when purchaser_addr_city IS NULL AND purchaser_addr_state IS NULL AND purchaser_addr_zip IS NULL then '' else ' ' end)+case when purchaser_addr_city IS NULL then '' else rtrim(ltrim([situs_city]))+', ' end+case when purchaser_addr_state IS NULL then '' else rtrim(ltrim(purchaser_addr_state))+' ' end+case when purchaser_addr_zip IS NULL then '' else rtrim(ltrim(purchaser_addr_zip)) end),
	mhm.purchase_price,
	mhm.real_prop_owner_different,
	a2.file_as_name,
	mhtc.transporter_desc,
	mhtc.wutc_permit_num, --New Column
	mhtc.dot_permit_num,  --New Column
	i.mbl_hm_make,
	i.mbl_hm_model,
	i.actual_year_built,
	i.mbl_hm_sn,
	i.mbl_hm_sn_2,
	i.mbl_hm_tip_out,
	mhm.move_to_county,
	case when isnull(move_to_num,'')='' then '' else rtrim(ltrim(move_to_num))+' ' end+case when isnull(move_to_street_prefix,'')='' then '' else rtrim(ltrim(move_to_street_prefix))+' ' end+case when move_to_street IS NULL then '' else rtrim(ltrim(move_to_street))+' ' end+case when move_to_street_suffix IS NULL then '' else rtrim(ltrim(move_to_street_suffix))+' ' end+case when move_to_street_unit IS NULL then '' else rtrim(ltrim(move_to_street_unit)) end,
	mhm.move_to_city,
	mhm.move_to_state,
	mhm.move_to_zip,
	(((((((((case when isnull([situs_num],'')='' then '' else rtrim(ltrim([situs_num]))+' ' end+case when isnull([sub_num],'')='' then '' else rtrim(ltrim([sub_num]))+' ' end)+case when isnull([situs_street_prefx],'')='' then '' else rtrim(ltrim([situs_street_prefx]))+' ' end)+case when [situs_street] IS NULL then '' else rtrim(ltrim([situs_street]))+' ' end)+case when [situs_street_sufix] IS NULL then '' else rtrim(ltrim([situs_street_sufix]))+' ' end)+case when isnull([building_num],'')='' then '' else rtrim(ltrim([building_num]))+' ' end)+case when [situs_unit] IS NULL then '' else rtrim(ltrim([situs_unit])) end)+case when [situs_city] IS NULL AND [situs_state] IS NULL AND [situs_zip] IS NULL then '' else ' ' end)+case when [situs_city] IS NULL then '' else rtrim(ltrim([situs_city]))+', ' end)+case when [situs_state] IS NULL then '' else rtrim(ltrim([situs_state]))+' ' end)+case when [situs_zip] IS NULL then '' else rtrim(ltrim([situs_zip])) end,
	mhm.comment,
	ta.tax_area_number,
	''
from
	mh_movement mhm with(nolock)
inner join imprv i with(nolock)
	on i.imprv_id = mhm.imprv_id and i.prop_id = mhm.prop_id and i.sup_num = mhm.sup_num and i.prop_val_yr = mhm.prop_val_yr
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
inner join account a2 with(nolock)
	on a2.acct_id = o.owner_id
left join situs s with(nolock)
	on s.prop_id = mhm.prop_id and s.primary_situs = 'Y'
inner join dbo.property_tax_area as pta with(nolock)
	on pta.prop_id = mhm.prop_id and pta.[year] = mhm.prop_val_yr and pta.sup_num = mhm.sup_num
inner join dbo.tax_area as ta with(nolock) on pta.tax_area_id = ta.tax_area_id
where
	mhm.mhm_id = @mhmID

-- Populate the Special Assessments
declare @assessments varchar(max)

select @assessments = (
		select assessment_cd + ', '
		from mh_movement mhm with(nolock)
		inner join property_special_assessment psa with(nolock)
				on psa.prop_id = mhm.prop_id and psa.[year] = mhm.prop_val_yr and psa.sup_num = mhm.sup_num
		inner join special_assessment_agency saa with(nolock)
				on saa.agency_id = psa.agency_id
		where mhm.mhm_id = @mhmID
		order by assessment_cd
			for xml path('')
	)
from mh_movement mhm with(nolock)
where mhm.mhm_id = @mhmID

update ##mhm_tax_certificate_report
set assessments = case when len(@assessments) > 1 then left(@assessments, len(@assessments)-1) else @assessments end
where dataset_id = @datasetID


-- Grab the width and height from the highest valued improvement detail
declare @propID int
select @propID = mhm.prop_id
from mh_movement mhm with(nolock)
where mhm.mhm_id = @mhmID

update tcr
set width = idw.width, length = idl.length
from ##mhm_tax_certificate_report tcr
inner join mh_movement mhm with(nolock)
	on mhm.mhm_id = tcr.mhm_id
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
	tcr.dataset_id = @datasetID

GO

