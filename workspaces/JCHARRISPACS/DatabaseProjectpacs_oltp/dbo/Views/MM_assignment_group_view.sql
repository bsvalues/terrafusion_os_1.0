
CREATE VIEW [dbo].[MM_assignment_group_view] AS select mg.mobile_assignment_group_id, mg.mobile_assignment_group_description,isnull(count(mag.prop_id),0) as count
from mobile_assignment_group mg 
left join ccproperty mag on
ltrim(rtrim(mg.mobile_assignment_group_id))=ltrim(rtrim(mag.mobile_assignment_group_id))
group by mg.mobile_assignment_group_id, mg.mobile_assignment_group_description

GO

