

CREATE PROCEDURE ValidateAgentProperty

	@input_prop_geo_id	varchar(50),
	@pid_flag		bit /* 1 = prop_id 0 = geoID */


AS

declare @prop_id int
declare @appr_yr int
declare @prop_inactive_dt datetime
declare @strError varchar(100)
declare @owner_count int
declare @owner varchar(70)
declare @agent_count int
declare @agent varchar(70)
declare @geo_id varchar(50)
declare @udi_parent char(1)

SET @strError = ''
SET @owner = ''
SET @agent = ''


SET NOCOUNT ON

	SELECT @appr_yr = appr_yr
	FROM pacs_system
	WHERE system_type IN ('A','B')

	/*
	 * This procedure needs to check the following:
	 *
	 * 1. if the prop_id/geo_id is valid
	 * 2. if the property already has an active agent on it
	 * 3. if the property has multiple owners
	 * 4. if the property is deleted.
	 * 5.  If the deleted property is actually a UDI parent
	 */

--	IF CHARINDEX('-', @input_prop_geo_id, 1) > 0
	IF @pid_flag = 0
	BEGIN
		SELECT @prop_id = prop_id
		FROM property as p
		WITH (NOLOCK)
		WHERE geo_id = @input_prop_geo_id

		IF @@ROWCOUNT > 1
		BEGIN
			SET @strError = 'More than one property with Geo ID:  '
			SET @strError = @strError + @input_prop_geo_id
		END

		IF @prop_id IS NULL
		BEGIN
			SET @strError = 'No properties found with Geo ID:  '
			SET @strError = @strError + @input_prop_geo_id
		END
	END
	ELSE
	BEGIN
		SET @prop_id = CONVERT(int, @input_prop_geo_id)
	END

	/*
	 * Now that the prop_id has been determined, check if
	 * the prop_id is valid.
	 */

	IF @strError = ''
	BEGIN
		SELECT @prop_inactive_dt = pv.prop_inactive_dt,
				@geo_id = p.geo_id,
			@udi_parent = pv.udi_parent
		FROM property_val as pv
		WITH (NOLOCK)
		INNER JOIN property as p
		WITH (NOLOCK)
		ON pv.prop_id = p.prop_id
		WHERE pv.prop_id = @prop_id
		AND pv.prop_val_yr = @appr_yr
		AND pv.sup_num = 0
	
		/*
		 * It's possible that the property doesn't exist for the
		 * current appraisal year.  So just checking for NULL on
		 * the inactive date will not be enough.
		 */
	
		IF @@ROWCOUNT > 0
		BEGIN
			IF @prop_inactive_dt IS NOT NULL
			BEGIN

				IF @udi_parent <> 'T'
				BEGIN
					SET @strError = 'Property:  '
					SET @strError = @strError + @input_prop_geo_id
					SET @strError = @strError + ' is deleted.'
				END
				ELSE
				BEGIN
					SET @strError = 'Property:  '
					SET @strError = @strError + @input_prop_geo_id
					SET @strError = @strError + ' is a Parent property. Assign Agents to the Child Properties.'
				END
			END
		END
		ELSE
		BEGIN
			SET @strError = 'Property:  '
			SET @strError = @strError + @input_prop_geo_id
			SET @strError = @strError + ' does not exist for the current appraisal year.'
		END
	END

	IF @strError = ''
	BEGIN
		SELECT @owner_count = COUNT(owner_id)
		FROM owner as o
		WITH (NOLOCK)
		WHERE o.prop_id = @prop_id
		AND o.owner_tax_yr = @appr_yr
		AND o.sup_num = 0

		IF @owner_count = 0
		BEGIN
			SET @strError = 'No owner for Property:  '
			SET @strError = @strError + @input_prop_geo_id
		END
		ELSE IF @owner_count > 1
		BEGIN
			SET @strError = 'Multiple owners for Property:  '
			SET @strError = @strError + @input_prop_geo_id
		END
	END

	IF @strError = ''
	BEGIN
		SELECT TOP 1 @owner = ISNULL(account.file_as_name, '')
		FROM owner WITH (NOLOCK)
		INNER JOIN account WITH (NOLOCK)
		ON owner.owner_id = account.acct_id
		WHERE owner.prop_id  = @prop_id
		AND owner.owner_tax_yr = @appr_yr
		AND owner.sup_num  = 0
	END	
/*
	IF @strError = ''
	BEGIN
		SELECT @agent_count = COUNT(agent_id)
		FROM agent_assoc as aa
		WITH (NOLOCK)
		WHERE aa.owner_tax_yr = @appr_yr
		AND aa.prop_id = @prop_id

		IF @agent_count > 0
		BEGIN
			SET @strError = 'Active agent already on property.'
		END
	END
*/
	IF @strError = ''
	BEGIN
		SELECT @agent_count = COUNT(agent_id)
		FROM agent_assoc WITH (NOLOCK)
		WHERE agent_assoc.owner_tax_yr = @appr_yr
		AND agent_assoc.prop_id = @prop_id

		IF @agent_count = 1
		BEGIN
			SELECT TOP 1 @agent = ISNULL(account.file_as_name, '')
			FROM agent WITH (NOLOCK)
			INNER JOIN agent_assoc
			ON agent.agent_id = agent_assoc.agent_id
			INNER JOIN account
			ON agent.agent_id = account.acct_id
			WHERE agent_assoc.prop_id = @prop_id
			AND agent_assoc.owner_tax_yr = @appr_yr
		END
		ELSE IF @agent_count > 1
		BEGIN
			SET @agent = 'MULTIPLE AGENTS'
		END

	END
SET NOCOUNT OFF

	SELECT @prop_id as prop_id, @geo_id as geo_id, @owner as owner, @agent as agent, @strError as error_desc

GO

