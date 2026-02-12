"""Performs vrp analysis."""  # File name is based on the tool name. pylint:disable=invalid-name

import logging
import SolveVehicleRoutingProblem

# Adding the below unused imports to enable packaging of these modules when creating SD
import nat
import nast
import svrp


LOG_LEVEL = logging.INFO  # log level for the tool.

if __name__ == "__main__":
    SolveVehicleRoutingProblem.GPToolDialog(LOG_LEVEL, "EditVehicleRoutingProblem")
