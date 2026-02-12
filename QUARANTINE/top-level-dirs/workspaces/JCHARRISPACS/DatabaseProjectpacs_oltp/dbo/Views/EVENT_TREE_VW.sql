


CREATE VIEW dbo.EVENT_TREE_VW
AS
SELECT     dbo.prop_event_assoc.prop_id, DATEPART([year], dbo.event.event_date) AS event_year, dbo.event.event_date, dbo.event.event_id, 
                      dbo.event.event_type, dbo.event.event_desc, dbo.event.system_type, ISNULL(dbo.event_type.event_user_right, 'F') AS event_user_right
FROM         dbo.event INNER JOIN
                      dbo.prop_event_assoc ON dbo.event.event_id = dbo.prop_event_assoc.event_id LEFT OUTER JOIN
                      dbo.event_type ON dbo.event.event_type = dbo.event_type.event_type_cd

GO

