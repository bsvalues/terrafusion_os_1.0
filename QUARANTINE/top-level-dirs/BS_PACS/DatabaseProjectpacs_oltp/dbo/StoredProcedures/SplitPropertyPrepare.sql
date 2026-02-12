
create procedure [dbo].[SplitPropertyPrepare]
	@lYear numeric(4,0),
	@lSupNum int,
	@lPropID int

as

set nocount on

	exec dbo.LayerDeleteExemption @lYear, @lSupNum, @lPropID
	exec dbo.LayerDeleteTablePropertyDestroyed @lYear, @lSupNum, @lPropID
	exec dbo.LayerDeleteLand @lYear, @lSupNum, 0, @lPropID
	exec dbo.LayerDeleteImprovement @lYear, @lSupNum, 0, @lPropID		
	exec dbo.LayerDeleteTableAgentAssoc @lYear, @lPropID	

 delete from dbo.property_special_assessment with(rowlock)  
 where  
  year = @lYear and  
  sup_num = @lSupNum and  
  prop_id = @lPropID

 delete from dbo.user_property_special_assessment 
 where
	year = @lYear and
	sup_num = @lSupNum and
	prop_id = @lPropID

GO

