
create procedure LayerCopyRendition
	@lYear_From numeric(4,0),
	@lSupNum_From int,
	@lPropID_From int,
	@lYear_To numeric(4,0),
	@lSupNum_To int,
	@lPropID_To int,

	@bSkipRenditionTracking bit = 0,
	@bSkipRenditionPenalty bit = 0,
	@bSkipRendition bit = 0
as

set nocount on

	if ( @bSkipRendition = 0 )
	begin
		insert dbo.rendition with(rowlock) (
			prop_id,
			prop_val_yr,
			rendition_id,
			sup_num,
			rend_yr,
			rend_dt,
			tot_rend_amt,
			rend_verify_dt,
			rend_comment,
			rend_purge_dt,
			rend_submitted_by,
			rend_notarized,
			rend_active
		)
		select
			@lPropID_To,
			@lYear_To,
			rendition_id,
			@lSupNum_To,
			rend_yr,
			rend_dt,
			tot_rend_amt,
			rend_verify_dt,
			rend_comment,
			rend_purge_dt,
			rend_submitted_by,
			rend_notarized,
			rend_active
		from dbo.rendition as r with(nolock)
		where
			r.prop_val_yr = @lYear_From and
			r.sup_num = @lSupNum_From and
			r.prop_id = @lPropID_From
	end

	if (
		@bSkipRenditionTracking = 0 and
		not exists (
			select pprt.prop_val_yr
			from dbo.pp_rendition_tracking as pprt with(nolock)
			where
				pprt.prop_val_yr = @lYear_To and
				pprt.prop_id = @lPropID_To and
				pprt.sup_num = @lSupNum_To
		)
	)
	begin
		insert dbo.pp_rendition_tracking with(rowlock) (
			prop_id,
			prop_val_yr,
			extension1,
			extension1_processed_dt,
			extension1_printed_dt,
			extension1_comment,
			extension2,
			extension2_processed_dt,
			extension2_printed_dt,
			extension2_comment,
			imposition_letter_dt,
			imposition_letter_receieved_dt,
			request_support_doc_comment,
			request_support_doc_dt,
			print_request_support_doc_dt,
			request_support_doc_rec_dt,
			penalty_waiver_status,
			penalty_waiver_status_dt,
			penalty_waiver_request_dt,
			penalty_waiver_print_dt,
			waiver_request_mandatory_dt,
			penalty_comment,
			penalty_amount,
			penalty_amount_override,
			penalty_amount_dt,
			penalty_paid_dt,
			fraud_penalty_dt,
			fraud_penalty_amount,
			fraud_penalty_paid_dt,
			fraud_comment,
			fraud_penalty_flag,
			sup_num,
			do_not_print_until,
			do_not_print_until_year,
			do_not_print_ever
		)
		select
			@lPropID_To,
			@lYear_To,
			'NR',
			NULL,
			NULL,
			'',
			'NR',
			NULL,
			NULL,
			'',
			NULL,
			NULL,
			'',
			NULL,
			NULL,
			NULL,
			'NR',
			NULL,
			NULL,
			NULL,
			NULL,
			'',
			0,
			0,
			NULL,
			NULL,
			NULL,
			0,
			NULL,
			'',
			0,
			@lSupNum_To,
			case when pprt.do_not_print_until = 1 and pprt.do_not_print_until_year < @lYear_To then 1 else 0 end,
			case when pprt.do_not_print_until = 1 and pprt.do_not_print_until_year < @lYear_To then pprt.do_not_print_until_year else NULL end,
			pprt.do_not_print_ever
		from dbo.pp_rendition_tracking as pprt with(nolock)
		where
			pprt.prop_val_yr = @lYear_From and
			pprt.prop_id = @lPropID_From and
			pprt.sup_num = @lSupNum_From
	end


	-- pp_rendition_prop_penalty & pp_rendition_prop_penalty_distribution
	-- only required if copying to same prop & year but different supp
	if (
		@bSkipRenditionPenalty = 1 or
		@lYear_From <> @lYear_To or
		@lPropID_From <> @lPropID_To or
		@lSupNum_From = @lSupNum_To
	)
	begin
		return(0)
	end


	insert dbo.pp_rendition_prop_penalty with(rowlock) (
		prop_id,
		owner_id,
		sup_num,
		rendition_year,
		owner_name,
		legal_desc,
		situs_address,
		market_value,
		rendition_dt,
		rendition_penalty,
		rendition_fraud_penalty,
		geo_id,
		ref_id1,
		ref_id2,
		late_rendition_penalty_flag,
		fraud_penalty_flag
	)
	select
		@lPropID_To,
		owner_id,
		@lSupNum_To,
		@lYear_To,
		owner_name,
		legal_desc,
		situs_address,
		market_value,
		rendition_dt,
		rendition_penalty,
		rendition_fraud_penalty,
		geo_id,
		ref_id1,
		ref_id2,
		late_rendition_penalty_flag,
		fraud_penalty_flag
	from dbo.pp_rendition_prop_penalty as pprpp with(nolock)
	where
		pprpp.rendition_year = @lYear_From and
		pprpp.sup_num = @lSupNum_From and
		pprpp.prop_id = @lPropID_From


	insert dbo.pp_rendition_prop_penalty_distribution with(rowlock) (
		prop_id,
		owner_id,
		sup_num,
		rendition_year,
		entity_cd,
		penalty_distribution_amt,
		fraud_penalty_distribution_amt
	)
	select
		@lPropID_To,
		owner_id,
		@lSupNum_To,
		@lYear_To,
		entity_cd,
		penalty_distribution_amt,
		fraud_penalty_distribution_amt
	from dbo.pp_rendition_prop_penalty_distribution as pprppd with(nolock)
	where
		pprppd.rendition_year = @lYear_From and
		pprppd.sup_num = @lSupNum_From and
		pprppd.prop_id = @lPropID_From


	return(0)

GO

