<?xml version="1.0" encoding="ISO-8859-1"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:esri_wms="http://www.esri.com/wms" xmlns="http://www.esri.com/wms">
	<!--
		<%@page contentType="text/html" pageEncoding="ISO-8859-1"%>
		<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
	-->	
	<xsl:output 
		method="html" 
		indent="yes" 
		encoding="UTF-8" 
		version="4.01" 
		doctype-public="-//W3C//DTD HTML 4.01 Transitional//EN" 
		doctype-system="http://www.w3.org/TR/html4/loose.dtd"/> 		
	<xsl:template match="/">
		<html>
			<head>
				<!-- enforce the client to display result html as UTF-8 encoding -->	
			    <meta http-equiv="content-type" content="text/html; charset=UTF-8">					
			    </meta>
				<style type="text/css">
					table, th, td {
						border:1px solid #e5e5e5;
						border-collapse:collapse;
						font-family: arial;					
						font-size: 80%;						
						color: #333333
					}   					
					th, td {
						valign: top;
						text-align: center;
					}					
					th {
						background-color: #aed7ff
					}
				</style>
			</head>
			<body>	
				<xsl:for-each select="esri_wms:FeatureInfoResponse/esri_wms:FeatureInfoCollection">										
					<h5>FeatureInfoCollection - layer name: '<xsl:value-of select="@layername"/>'</h5>	
					<table width="100%" cellpadding="0" cellspacing="0" border="1">
						<tbody>													
							<tr>									
								<xsl:for-each select="esri_wms:FeatureInfo[1]/esri_wms:Field">
									<th>	
										<xsl:value-of select="esri_wms:FieldName"/>
									</th>
								</xsl:for-each>								
							</tr>							
							<xsl:for-each select="esri_wms:FeatureInfo">	
								<tr>
									<xsl:if test="(position() +1) mod 2">
										<xsl:attribute name="bgcolor">#eeeeee</xsl:attribute>
									</xsl:if>
									<xsl:for-each select="esri_wms:Field">
										<td>
											<xsl:value-of select="esri_wms:FieldValue"/>
										</td>
									</xsl:for-each>
								</tr>
							</xsl:for-each>
						</tbody>
					</table>					
				</xsl:for-each>
			</body>
		</html>
	</xsl:template>
</xsl:stylesheet>
