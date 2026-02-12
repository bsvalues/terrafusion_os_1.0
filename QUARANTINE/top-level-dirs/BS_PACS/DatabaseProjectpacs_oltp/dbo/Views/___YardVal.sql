create view ___YardVal as
SELECT [prop_id],
		CAST(SUM(CovBalc) 	AS INT) 	as CovBalc, 
		CAST(SUM(CovDeck) 	AS INT)		as CovDeck,
		CAST(SUM(CovPatio) 	AS INT) 	as CovPatio, 
		CAST(SUM(Deck) 		AS INT) 	as deck,
		CAST(SUM(EncPorch) 	AS INT) 	as EncPorch,
		CAST(SUM(hobby_barn)AS INT) 	as hobby_barn,
		CAST(SUM(GAZEBO) 	AS INT) 	as GAZEBO
  FROM [pacs_oltp].[dbo].[__Yard_Imprv_val]
  --where prop_id=285459

  group by [prop_id],[CovBalc]
      ,[CovDeck]
      ,[CovPatio]
      ,[deck]
      ,[EncPorch]
      ,[hobby_barn]
      ,[GAZEBO]

GO

