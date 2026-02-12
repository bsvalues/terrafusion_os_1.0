
CREATE VIEW mr_wa_tax_statement_vw
AS
		select wts.*
		from wa_tax_statement wts with (nolock)
		join (	select max(run_id) maxRunID, year, group_id, owner_id
				from wa_tax_statement_owner with (nolock)
				group by year, group_id, owner_id ) t
		on t.year = wts.year
		and t.group_id = wts.group_id
		and t.maxRunID = wts.run_id
		and t.owner_id = wts.owner_id 
		join wa_tax_statement_group wtsg with (nolock)
		on wtsg.year = wts.year
		and wtsg.group_id = wts.group_id

GO

