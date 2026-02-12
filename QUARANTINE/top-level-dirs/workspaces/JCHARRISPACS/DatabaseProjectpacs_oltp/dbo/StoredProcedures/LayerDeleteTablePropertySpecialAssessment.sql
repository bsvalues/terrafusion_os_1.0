
create procedure LayerDeleteTablePropertySpecialAssessment
 @lYear numeric(4,0),  
 @lSupNum int,  
 @lPropID int  
as
set nocount on  

if not exists(
 select 1 from assessment_bill ab with(nolock)
 join bill b with(nolock) on b.bill_id = ab.bill_id  and b.year = ab.year
 join property_special_assessment psa with(nolock) on ab.agency_id = psa.agency_id and psa.year = ab.year and psa.prop_id = b.prop_id and psa.sup_num = b.sup_num
 where b.prop_id = @lPropID and b.year = @lYear and b.sup_num = @lYear
)
begin
 delete from dbo.property_special_assessment with(rowlock)  
 where  
  year = @lYear and  
  sup_num = @lSupNum and  
  prop_id = @lPropID  
end  

delete dbo.property_assessment_attribute_val with(rowlock)
where
	prop_val_yr = @lYear and
	sup_num = @lSupNum and
	prop_id = @lPropID

delete from dbo.user_property_special_assessment 
where
	[year] = @lYear and
	sup_num = @lSupNum and
	prop_id = @lPropID

return(0)

GO

