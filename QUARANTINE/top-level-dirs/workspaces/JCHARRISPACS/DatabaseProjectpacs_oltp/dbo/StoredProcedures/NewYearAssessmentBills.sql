    
    
CREATE procedure [dbo].[NewYearAssessmentBills]    

/*   

{Call NewYearAssessmentBills(2013)}

*/
    
@tax_year  int    
    
    
    
    
as    
    
    
    
set nocount on    
    

select saa.assessment_cd, saa.assessment_description, sum(b.initial_amount_due) original_bill_due,
	sum(isnull(f.initial_amount_due, 0)) original_fee_due,
	sum(b.initial_amount_due + isnull(f.initial_amount_due, 0)) original_total_due
from bill b with(nolock)
join assessment_bill ab with(nolock)
	on ab.bill_id = b.bill_id
join special_assessment_agency saa with(nolock)
	on saa.agency_id = ab.agency_id
left join bill_fee_assoc bfa with(nolock)
	on bfa.bill_id = b.bill_id
left join fee f with(nolock)
	on f.fee_id = bfa.fee_id
where b.display_year = @tax_year
group by saa.assessment_cd, saa.assessment_description
order by saa.assessment_cd

set nocount off

GO

