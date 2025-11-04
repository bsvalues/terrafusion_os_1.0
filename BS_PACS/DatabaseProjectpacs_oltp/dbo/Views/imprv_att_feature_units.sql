create view imprv_att_feature_units as 
SELECT prop_id,
sum	(	case	WHEN	i_attr_val_id	=	'45'	then	i_attr_unit	else	0	end	)	as 	Bathrooms,
sum	(	case	WHEN	i_attr_val_id	=	'47'	then	i_attr_unit	else	0	end	)	as 	FixtureCount,
sum	(	case	WHEN	i_attr_val_id	=	'46'	then	i_attr_unit	else	0	end	)	as 	HalfBathrooms,
sum	(	case	WHEN	i_attr_val_id	=	'10'	then	i_attr_unit	else	0	end	)	as 	Fireplace	

	

  FROM [pacs_oltp].[dbo].[imprv_attr]

  group by prop_id

GO

