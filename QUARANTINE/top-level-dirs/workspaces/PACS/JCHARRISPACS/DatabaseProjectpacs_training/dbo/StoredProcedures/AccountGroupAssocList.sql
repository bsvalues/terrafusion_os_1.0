


CREATE PROCEDURE AccountGroupAssocList

	@acct_id int

AS

	SELECT account_group_assoc.group_cd,
			account_group_code.group_desc
	FROM account_group_assoc
	INNER JOIN account_group_code
	ON account_group_assoc.group_cd = account_group_code.group_cd
	
	WHERE account_group_assoc.acct_id = @acct_id

	ORDER BY account_group_assoc.group_cd

GO

