


create view top_50_taxpayers
as
SELECT top 50 
    CURR_PROP_INFO_VW."assessed_val", CURR_PROP_INFO_VW."prop_id", CURR_PROP_INFO_VW."owner_id", CURR_PROP_INFO_VW."file_as_name"
FROM
    "CERTIFIED_PROP_INFO_VW" CURR_PROP_INFO_VW
ORDER BY
    CURR_PROP_INFO_VW."assessed_val" desc,
    CURR_PROP_INFO_VW."file_as_name" ASC

GO

