"""Core logic to check if the user has enough credits for the desired task."""
import json
import os
import sys
import arcpy  # pylint: disable=E0401
from CreditEstimation import _CostReporterFactory


class CreditsChecker:
    """Class module to check user's credits for a desired task."""

    def __init__(self, task_name, task_parameters=None):
        """Initialize the parameters.

        Args:
            task_name: a string of the task_name.
            task_parameters: a dictionary keyed by the parameter name and valued by the parameter value.
        Returns:
            No returns.
        Raises:
            No exceptions.

        """
        self.task_name = task_name
        self.task_parameters = task_parameters

    def get_cost(self):
        """Get cost based on the task parameters."""
        if not self.task_parameters:
            return 0

        reporter = _CostReporterFactory(self.task_name, self.task_parameters).create()
        report_result = reporter.report()
        arcpy.AddMessage("Reported cost: {}".format(report_result))
        cost = json.loads(report_result)
        return cost.get("cost", cost.get("maximumCost", 0))

    def check(self):
        """checks whether credits available."""
        self_profile = arcpy.GetPortalDescription()
        subscription_info = self_profile.get("subscriptionInfo", None)
        if subscription_info:
            org_state = subscription_info.get('state')
            # Credit checks failed if account status is suspended
            if org_state.lower() == 'suspended':
                return False

        credit_assignment = self_profile.get("creditAssignments", "disabled")
        arcpy.AddMessage("credit_assignment: {}".format(credit_assignment))
        # If credit assignment not enabled, don't check anything
        if credit_assignment.lower() == "disabled":
            return True

        # Check if the user has enough credits if credit assignment enabled
        user = self_profile.get("user", None)
        if not user:
            return False
        else:
            assigned_credits = user.get("assignedCredits", 0)
            available_credits = user.get("availableCredits", 0)
            arcpy.AddMessage("User's assigned credits: {}, and available credits: {}".format(assigned_credits,
                                                                                             available_credits))
            # if assignedCredits is -1, it means that the user has no limitation on credits usage.
            if assigned_credits == -1:
                return True
            elif available_credits < 0:
                return False
            else:
                try:
                    cost = float(self.get_cost())
                    arcpy.AddMessage("cost for the task is: {}".format(cost))
                except:
                    arcpy.AddMessage("Failed to get cost of the desired task.")
                    # If it is actually some parameter setting issue, it will fail afterwards.
                    return True
                # Check if the assigned credits is larger than the cost.
                return available_credits >= cost
#endregion

#region credit report implementation (turned off temporarily to keep using SOE to log)


class CreditsLogger:
    def __init__(self, task_name, task_parameters):
        """Assign properties of reporter."""
        self.task_name = task_name
        self.task_parameters = task_parameters

    def report(self):
        """Get the cost."""
        reporter = _CostReporterFactory(self.task_name, self.task_parameters).create()
        reporter.log()

#endregion
