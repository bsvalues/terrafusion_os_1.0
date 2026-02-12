#COPYRIGHT 2024 ESRI
#
#TRADE SECRETS: ESRI PROPRIETARY AND CONFIDENTIAL
#Unpublished material - all rights reserved under the
#Copyright Laws of the United States.
#
#For additional information, contact:
#Environmental Systems Research Institute, Inc.
#Attn: Contracts Dept
#380 New York Street
#Redlands, California, USA 92373
#
#email: contracts@esri.com

from arcgisscripting import un as cun

__all__ = ['UtilityNetwork']

class UtilityNetwork():
    """Provides access to the Utility Network class and all its public methods"""
    def __init__(self, utilityNetworkPath):
        self._utilityNetwork = cun.UtilityNetwork(utilityNetworkPath)

    def HasValidNetworkTopology(self) -> bool:
        """HasValidNetworkTopology()
           Checks to see whether the network topology is enabled for the utility network.

        OUTPUTS:
         is_topology_valid (Bool):
             Whether the topology for the utility network is currently enabled."""
        return self._utilityNetwork.HasValidNetworkTopology()

    def AddConnectivityAssociation(self,
            association_type: int,
            from_table: str,
            from_global_id: str,
            from_terminal_name: str,
            to_table: str,
            to_global_id: str,
            to_terminal_name: str,
            percent_along: float) -> int:
        """AddConnectivityAssociation(association_type, from_table, from_global_id, from_terminal_name, to_table, to_global_id, to_terminal_name, percent_along)
           Add a connectivity association to the utility network.

        INPUTS:
         association_type (Integer):
             The type of connectivity association to create.
         from_table (String):
             Table of the from object.
         from_global_id (String):
             Global ID of the from object.
         from_terminal_name (String):
             Terminal Name of the from object.
         to_table (String):
             Table of the to object.
         to_global_id (String):
             Global ID of the to object.
         to_terminal_name (String):
             Terminal Name of the to object.
         percent_along (Float):
             Percent along the edge where the connection occurs. Only used for midspan connectivity.
        OUTPUTS:
         connectivity_object_id (Integer):
             Object ID of the newly created connectivity association."""
        return self._utilityNetwork.AddConnectivityAssociation(association_type, from_table, from_global_id, from_terminal_name, to_table, to_global_id, to_terminal_name, percent_along)

    def AddContainmentAssociation(self,
           container_table: str, 
           container_global_id: str,
           content_table: str, 
           content_global_id: str, 
           is_content_visible: bool) -> int:
        """AddContainmentAssociation(container_table, container_global_id, content_table, content_global_id, is_content_visible)
           Add a containment association to the utility network.

        INPUTS:
         container_table (String):
             Table of the container object.
         container_global_id (String):
             Global ID of the container object.
         content_table (String):
             Table of the content object.
         content_global_id (String):
             Global ID of the content object.
         is_content_visible (Boolean):
             Whether the content is visible.
        OUTPUTS:
         containment_object_id (Integer):
             Object ID of the newly created containment association."""
        return self._utilityNetwork.AddContainmentAssociation(container_table, container_global_id, content_table, content_global_id, is_content_visible)

    def AddStructuralAttachmentAssociation(self, 
            structure_table: str,
            structure_global_id: str,
            attachment_table: str,
            attachment_global_id: str) -> int:
        """AddStructuralAttachmentAssociation(structure_table, structure_global_id, attachment_table, attachment_global_id)
           Add a structural attachment association to the utility network.

        INPUTS:
         structure_table (String):
             Table of the structure object.
         structure_global_id (String):
             Global ID of the structure object.
         attachment_table (String):
             Table of the attachment object.
         attachment_global_id (String):
             Global ID of the attachment object.
        OUTPUTS:
         attachment_object_id (Integer):
             Object ID of the newly created attachment association."""
        return self._utilityNetwork.AddStructuralAttachmentAssociation(structure_table, structure_global_id, attachment_table, attachment_global_id)

    def DeleteConnectivityAssociation(self,
            association_type: int,
            association_global_id: str):
        """DeleteConnectivityAssociation(association_type, association_global_id)
           Deletes the specified connectivity association from the utility network.

        INPUTS:
         association_type (Integer):
             Type of the connectivity association to delete.
         association_global_id (String):
             Global ID of the association to delete.
        """
        return self._utilityNetwork.DeleteConnectivityAssociation(association_type, association_global_id)

    def DeleteContainmentAssociation(self, association_global_id: str):
        """DeleteContainmentAssociation(association_global_id)
           Deletes the specified containment association from the utility network.

        INPUTS:
         association_global_id (String):
             Global ID of the association to delete.
        """
        return self._utilityNetwork.DeleteContainmentAssociation(association_global_id)

    def DeleteStructuralAttachmentAssociation(self, association_global_id: str):
        """DeleteStructuralAttachmentAssociation(association_global_id)
           Deletes the specified structural attachment association from the utility network.

        INPUTS:
         association_global_id (String):
             Global ID of the association to delete.
        """
        return self._utilityNetwork.DeleteStructuralAttachmentAssociation(association_global_id)

    def DisableSubnetworkController(self,
            table: str,
            global_id: str,
            terminal_name: str):
        """DisableSubnetworkController(table, global_id, terminal_name)
           Disables the subnetwork controller.

        INPUTS:
         table (String):
             Table of the subnetwork controller.
         global_id (String):
             Global ID of the subnetwork controller.
         terminal_name (String):
             Terminal Name of the subnetwork controller."""
        return self._utilityNetwork.DisableSubnetworkController(table, global_id, terminal_name)

    def EnableSubnetworkController(self,
            table: str,
            global_id: str,
            terminal_name: str,
            subnetwork_controller_name: str,
            subnetwork_name: str,
            tier_name: str,
            description: str,
            notes: str) -> int:
        """EnableSubnetworkController(table, global_id, terminal_name, subnetwork_controller_name, subnetwork_name, tier_name, description, notes)
           Enables the feature as a subnetwork controller.

        INPUTS:
         table (String):
             Table of the new subnetwork controller.
         global_id (String):
             Global ID of the new subnetwork controller.
         terminal_name (String):
             Terminal Name of the new subnetwork controller.
         subnetwork_controller_name (String):
             Name of the subnetwork controller.
         subnetwork_name (String):
             Name of the subnetwork the subnetwork controller controls.
         tier_name (String):
             Tier Name of the new subnetwork controller.
         description (String):
             Description of the new subnetwork controller.
         notes (String):
             Notes for the new subnetwork controller.
        OUTPUTS:
         object_id (Integer):
             Object ID of the new row in the subnetworks table"""
        return self._utilityNetwork.EnableSubnetworkController(table, global_id, terminal_name, subnetwork_controller_name, subnetwork_name, tier_name, description, notes)


