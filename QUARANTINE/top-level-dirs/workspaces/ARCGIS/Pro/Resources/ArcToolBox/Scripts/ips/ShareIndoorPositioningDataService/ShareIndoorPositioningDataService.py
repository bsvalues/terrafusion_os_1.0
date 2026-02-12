import arcpy
import ips.GenerateIndoorPositioningDataset.validation as gipd_v
import ips.ShareIndoorPositioningDataService.utils as sipds_u
import ips.ShareIndoorPositioningDataService.validation as sipds_v


class ShareIndoorPositioningDataService(object):
    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Share Indoor Positioning Data Service"
        self.description = ""
        self.canRunInBackground = False
        self.helpContext = 78000009

    def execute(self):
        """ main function to share an indoor positioning dataset as a data service

        input params:
            - in_ips_datasets: the location of indoor positioning datasets
            - ips_dataset_name: dataset name
            - title: title for the data service
            - summary: summary for the data service
            - tags: tags for the data service
            - folder: folder contains the data service
            - sharing_level: share as "owner", "organization" or "everyone"
            - group_sharing: share with groups

        """
        params = arcpy.GetParameterInfo()
        in_ips_datasets = params[0]
        ips_dataset_name = params[1].valueAsText
        title = params[2].valueAsText
        summary = params[3].valueAsText
        tags = params[4].valueAsText
        folder = params[5].valueAsText
        sharing_level = params[6].valueAsText
        group_sharing = params[7]
        update_existing = params[10].value

        if group_sharing.valueAsText:
            # transform ; separated values to a list of strings
            # also replace any ' that are placed in case of an empty character in group name
            group_sharing = group_sharing.valueAsText.split(";")
        else:
            group_sharing = None

        try:
            positioning_item_id, positioning_item_url = sipds_u.share_ips_dataservice(
                in_ips_datasets=in_ips_datasets,
                ips_dataset_name=ips_dataset_name,
                title=title,
                summary=summary,
                tags=tags,
                folder=folder,
                sharing_level=sharing_level,
                group_sharing=group_sharing,
                update_existing=update_existing
            )
            arcpy.SetParameter(index=8, value=positioning_item_id)
            arcpy.SetParameter(index=9, value=positioning_item_url)

        except sipds_v.DuplicateTitleError as e:
            arcpy.AddIDMessage('ERROR', 250098, e.title)
        except gipd_v.EmptyPositioningDataset as e:
            arcpy.AddIDMessage("ERROR", 250102, e.param_name)
        except sipds_v.DuplicateIPDSDatasetError as e:
            arcpy.AddIDMessage('ERROR', 250099, e.param_name)
        except Exception as any_error:
            arcpy.AddIDMessage("ERROR", 999998)
            arcpy.AddError(any_error)

        return


if __name__ == "__main__":
    ShareIndoorPositioningDataService().execute()
