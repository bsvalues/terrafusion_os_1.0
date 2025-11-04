
CREATE FUNCTION dbo.fn_GetExistingMetaComponentLevelEntries
(
	@parent_level int
   ,@component_type int
)
RETURNS @Table Table (component_level_id int,
                      display_order int,
                      display_text varchar(50))
-- This function will return entries of the same 
-- parent_level and component_type for a given parent_level and type
Begin

  INSERT INTO @Table
   SELECT mcl1.component_level_id,
          mcl1.display_order,
          mcl1.display_text
     FROM meta_component_level mcl1 join
          (
              SELECT mcl.component_level_id,mcl.display_order
                    ,ISNULL(mcl.parent_level,-1) as parent_level
                    ,component_type =(SELECT component_type 
                                        FROM meta_component mc 
                                       WHERE mc.component_id = mcl.component_id)
               FROM dbo.meta_component_level mcl 
        ) as mcl2
      on mcl1.component_level_id  = mcl2.component_level_id
    where ISNULL(mcl2.parent_level,-1) = ISNULL(@parent_level,-1)
      and  ISNULL(mcl2.component_type,-1) = ISNULL(@component_type,-1)

	Return
End

GO

