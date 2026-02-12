

create procedure LayerCopyTablePPReview
	@lYear_From numeric(4,0),
	@lSupNum_From int,
	@lPropID_From int,
	@lYear_To numeric(4,0),
	@lSupNum_To int,
	@lPropID_To int
as

	insert pp_review with(rowlock)
	(
		prop_id, 
		[year],
		sup_num,
		type_code,
		status_code,
		[value],
		review_dt,
		review_scheduled_dt,
		letter_mailed_dt,
		comment
	)
	select
		@lPropID_To,
		@lYear_To,
		@lSupNum_To,
		type_code,
		status_code,
		[value],
		review_dt,
		review_scheduled_dt,
		letter_mailed_dt,
		comment
	from pp_review (nolock)
	where 
		[year] = @lYear_From and
		sup_num = @lSupNum_From and
		prop_id = @lPropID_From

	return(0)

GO

