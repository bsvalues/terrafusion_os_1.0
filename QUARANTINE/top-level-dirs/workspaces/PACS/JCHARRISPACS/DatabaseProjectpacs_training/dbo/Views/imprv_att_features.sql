create view imprv_att_features as 
SELECT prop_id,

case	WHEN	i_attr_val_id	=	'6'		then	i_attr_val_cd			end		as 	RoofCovering,
case	WHEN	i_attr_val_id	=	'9'		then	i_attr_val_cd			end		as 	HVAC	,
case	WHEN	i_attr_val_id	=	'2'		then	i_attr_val_cd			end		as 	Foundation	,
case	WHEN	i_attr_val_id	=	'10'	then	i_attr_val_cd			end		as 	Fireplace	,
case	WHEN	i_attr_val_id	=	'15'	then	i_attr_val_cd			end		as 	Bedrooms	,
case	WHEN	i_attr_val_id	=	'67'	then	i_attr_val_cd			end		as 	SolarPanels	,
case	WHEN	i_attr_val_id	=	'3'		then	i_attr_val_cd			end		as 	ExteriorWall
  FROM [pacs_oltp].[dbo].[imprv_attr]

  group by prop_id,i_attr_val_id,i_attr_val_cd,i_attr_unit

GO

