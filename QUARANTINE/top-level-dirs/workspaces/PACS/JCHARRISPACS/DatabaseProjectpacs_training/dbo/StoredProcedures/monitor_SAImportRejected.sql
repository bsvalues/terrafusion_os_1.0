CREATE PROCEDURE monitor_SAImportRejected



/***************

This monitor was created for Benton to provide them a list of the properties rejected during a Special Assessment Import.

The results include the bill amount plus split information if it exists.

***************/



@import_id		int



as







select import_id, p.prop_id, iad.bill_amount, iad.error, sa.before_legal_acres as deleted_acres, si.child_id as new_prop_id, si.legal_acres new_acres

from import_assessment_data iad with(nolock)

join property p with(nolock)

	on p.prop_id = iad.prop_id 

	or p.geo_id = iad.geo_id

left join split_assoc sa with(nolock)

	on sa.prop_id = p.prop_id

left join split_into si with(nolock)

	on si.split_id = sa.split_id

	and si.parent_id = p.prop_id

where iad.import_id = @import_id

and iad.match <> 'M'

order by prop_id, new_prop_id

GO

