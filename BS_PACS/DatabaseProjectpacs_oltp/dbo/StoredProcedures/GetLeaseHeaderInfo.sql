



CREATE PROCEDURE GetLeaseHeaderInfo

	@input_lease_id varchar(20),
	@input_lease_yr int,
	@input_rev_num int

AS

declare @entities varchar(255)
declare @entity_cd varchar(20)
declare @entity_pct numeric(13,10)
declare @num_properties int
declare @total_wi_interest numeric(14,8)
declare @total_or_interest numeric(14,8)
declare @total_rior_interest numeric(14,8)
declare @total_interest numeric(14,8)
declare @total_assessed numeric(14,0)
declare @rev_num int

IF @input_rev_num = -1
BEGIN
	SELECT @rev_num = MAX(rev_num)
	FROM lease
	WHERE lease_id = @input_lease_id
	AND lease_yr = @input_lease_yr
END
ELSE
BEGIN
	SET @rev_num = @input_rev_num
END


DECLARE leaseEntities CURSOR FAST_FORWARD
FOR	SELECT RTRIM(entity_cd) as entity_cd,
			entity_pct
	FROM lease_entity_assoc AS lea
	WITH (NOLOCK)

	INNER JOIN entity
	WITH (NOLOCK)
	ON lea.entity_id = entity.entity_id

	WHERE lease_id = @input_lease_id
	AND lease_yr = @input_lease_yr
	AND rev_num = @rev_num

	ORDER BY entity_cd

OPEN leaseEntities

SET @entities = ''

FETCH NEXT FROM leaseEntities INTO @entity_cd, @entity_pct

WHILE @@FETCH_STATUS = 0
BEGIN
	IF @entities <> ''
	BEGIN
		SET @entities = @entities + ', '
	END

	SET @entities = @entities + @entity_cd

	IF @entity_pct <> 100
	BEGIN
		SET @entities = @entities + '(' + CONVERT(varchar(20), @entity_pct) + ')'
	END

	FETCH NEXT FROM leaseEntities INTO @entity_cd, @entity_pct
END

CLOSE leaseEntities
DEALLOCATE leaseEntities


SELECT @num_properties = COUNT(lpa.prop_id),
		@total_wi_interest = SUM(CASE WHEN interest_type_cd = 'WI' THEN ISNULL(interest_pct, 0) ELSE 0 END),
		@total_or_interest = SUM(CASE WHEN interest_type_cd = 'OR' THEN ISNULL(interest_pct, 0) ELSE 0 END),
		@total_rior_interest = SUM(CASE WHEN interest_type_cd = 'RI' OR interest_type_cd = 'OR' THEN ISNULL(interest_pct, 0) ELSE 0 END),
		@total_interest = SUM(ISNULL(interest_pct,0)),
		@total_assessed = SUM(ISNULL(assessed_val, 0))

FROM lease_prop_assoc as lpa
WITH (NOLOCK)

INNER JOIN property_val as pv
ON lpa.prop_id = pv.prop_id
AND lpa.lease_yr = pv.prop_val_yr
AND lpa.sup_num = pv.sup_num
AND pv.prop_inactive_dt IS NULL

INNER JOIN prop_supp_assoc as psa
ON lpa.prop_id = psa.prop_id
AND lpa.lease_yr = psa.owner_tax_yr
AND lpa.sup_num = psa.sup_num

WHERE lease_id = @input_lease_id
AND lease_yr = @input_lease_yr
AND rev_num = @rev_num

	SELECT lease_id,
			lease_yr,
			rev_num,
			lease_name,
			operator,
			rrc_number,
			field_id,
			abstract,
			geo_info,
			well_type,
			state_cd,
			gatherer_cd,
			appraiser_id,
			ISNULL(prior_yr_ri,0) as prior_yr_ri,
			ISNULL(prior_yr_wi,0) as prior_yr_wi,
			ISNULL(curr_yr_ri,0) as curr_yr_ri,
			ISNULL(curr_yr_wi,0) as curr_yr_wi,
			lease_dt,
			ISNULL(participation_pct,0) as participation_pct,
			ISNULL(zero_value,0) as zero_value,
			comment,
			last_change_dt,
			value_distrib_dt,
			legal_rebuild_dt,
			lease_inactive_dt,
			@entities as entities,
			rev_comment,
			create_dt,
			sup_cd,
			sup_desc,
			lease.sup_group_id,
			sup_num,
			RTRIM(sup_group.status_cd) as status_cd,
			ISNULL(@num_properties, 0) as num_properties,
			ISNULL(@total_wi_interest, 0) as total_wi_interest,
			ISNULL(@total_or_interest, 0) as total_or_interest,
			ISNULL(@total_rior_interest, 0) as total_rior_interest,
			ISNULL(@total_interest, 0) as total_interest,
			ISNULL(@total_assessed, 0) as total_assessed

	FROM lease
	WITH (NOLOCK)

	LEFT OUTER JOIN sup_group
	ON lease.sup_group_id = sup_group.sup_group_id

	WHERE lease_id = @input_lease_id
	AND lease_yr = @input_lease_yr
	AND rev_num = @rev_num

GO

