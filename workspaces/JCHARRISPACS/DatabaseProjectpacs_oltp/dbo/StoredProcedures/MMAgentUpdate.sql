

CREATE PROCEDURE MMAgentUpdate

	@input_agent_id int,
	@input_prop_id int,
	@input_year int,
	@input_auth_to_protest varchar(1),
	@input_auth_confidential varchar(1),
	@input_auth_to_resolve varchar(1),
	@input_auth_other varchar(1),
	@input_arb_mailing varchar(1),
	@input_ca_mailing varchar(1),
	@input_ent_mailing varchar(1),
	@input_application_date datetime,
	@input_effective_date datetime,
	@input_expiration_date datetime,
	@input_comment varchar(255),
	@input_pacs_user_id int

AS


declare @owner_id int
declare @agent_id int
declare @strInfo varchar(100)

SET @strInfo = ''

SET NOCOUNT ON

	SELECT @owner_id = owner_id
	FROM owner as o WITH (NOLOCK)
	WHERE prop_id = @input_prop_id
	AND owner_tax_yr = @input_year
	AND sup_num = 0

	IF EXISTS	(
			SELECT *
			FROM agent_assoc WITH (NOLOCK)
			WHERE prop_id = @input_prop_id
			AND owner_tax_yr = @input_year
			AND owner_id = @owner_id
			AND eff_dt >= @input_effective_date
			)
	BEGIN
		SET @strInfo = 'Property has an Agent with a greater or equal effective date.'
	END
	ELSE
	BEGIN

		/*
		 * check for an already active agent with an effective date less than
		 * the one entered by the user.  If one is found, inactivate the agent
		 * just like the user hit the Inactivate button on PropertyOwnerPg.cpp
		 */

		SELECT @agent_id = agent_id
		FROM agent_assoc WITH (NOLOCK)
		WHERE prop_id = @input_prop_id
		AND owner_tax_yr = @input_year
		AND owner_id = @owner_id
		AND eff_dt < @input_effective_date

		IF @agent_id IS NOT NULL
		BEGIN
			exec AgentInactivate @input_prop_id, @owner_id, @agent_id, @input_year, @input_pacs_user_id

			DELETE FROM agent_assoc
			WHERE prop_id = @input_prop_id
			AND owner_tax_yr = @input_year
			AND owner_id = @owner_id
			AND agent_id = @agent_id

			SET @strInfo = 'Previous Agent was inactivated for Property.'
		END

		INSERT INTO agent_assoc
		(owner_tax_yr, agent_id, arb_mailings, prop_id, ca_mailings, owner_id,
		ent_mailings, appl_dt, eff_dt, exp_dt, agent_cmnt, auth_to_protest,
		auth_to_resolve, auth_confidential, auth_other)
		VALUES
		(@input_year, @input_agent_id, @input_arb_mailing, @input_prop_id,
		@input_ca_mailing, @owner_id, @input_ent_mailing,
		@input_application_date, @input_effective_date, @input_expiration_date,
		@input_comment, @input_auth_to_protest, @input_auth_to_resolve,
		@input_auth_confidential, @input_auth_other)
	END

SET NOCOUNT OFF

	SELECT @strInfo as info

GO

