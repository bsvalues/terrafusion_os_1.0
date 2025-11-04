#COPYRIGHT 2018 ESRI
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

"""
Contains the implementation of the ComplexArgument class.
"""


class _ComplexArgument:
    """
    Base class for specialized complex argument classes.

    A complex argument is a tool argument which encapsulates multiple values.
    When a tool is called these values are formatted into a single string.

    Most of these arguments start with a keyword.

    A requirement of complex argument specialisations is that they have
    implemented __str__().
    """

    @classmethod
    def _toString(cls, values):
        """Return a list of values converted to a string.

        values -- Sequence of values.

        If a value is equal to None, than a pound sign is inserted.
        """
        result = []

        # Use "#" if value is not provided.
        # We need to discern between user provided #'s and #'s inserted by us.
        # Traling #'s can be removed, unless provided by the user. Some tools
        # treat a not provided argument value different from a default argument
        # value (#). See Kriging.

        # Create a list with True for every user-provided #.
        userProvidedPounds = [value == "#" for value in values]

        # Create a list with all values converted to a string. Insert #'s when
        # the user did not provide a value.
        for value in values:
            if value != None:
                result.append(str(value))
            else:
                result.append("#")

        # Remove trailing "#"'s.
        for i in range(len(result) - 1, -1, -1):
            if result[i] == "#" and not userProvidedPounds[i]:
                del result[i]
            else:
                break

        return " ".join(result)

    @classmethod
    def _toRepresentation(cls, values):
        result = []
        userProvidedPounds = [value == "#" for value in values]

        for value in values:
            if value != None:
                result.append(repr(value))
            else:
                result.append("'#'")

        for i in range(len(result) - 1, -1, -1):
            if result[i] == "'#'" and not userProvidedPounds[i]:
                del result[i]
            else:
                break

        return ", ".join(result)

    @classmethod
    def _addProperty(cls, name):
        """Add a property to the class.

        name -- Name of the property.
        """
        # Add a hidden member variable for the value to the instance.
        # assert not hasattr(self, "__%s" % (name))
        # setattr(self, "__%s" % (name), initialValue)
        # assert hasattr(self, "__%s" % (name))

        # print cls
        # print cls.__subclasses__()
        # print dir(cls)

        # Add a property attribute to the class.
        if not hasattr(cls, name):
            setattr(
                cls,
                name,
                property(
                    fget=lambda instance: cls.__propertyGetter(instance, name),
                    fset=lambda instance, value: cls.__propertySetter(
                        instance, value, name
                    ),
                ),
            )

        # assert hasattr(self, "__properties")
        # assert hasattr(cls, "properties")
        # self.properties.append(getattr(cls, name))

    def __init__(self, keyword=None):
        """Create a ComplexArgument.

        keyword -- Argument keyword.
        """
        self._keyword = keyword

    def __str__(self):
        """Return a string representation of the argument.

        Each specialisation should have implemented its own version. This
        version should not be called. It will fail.
        """
        assert False, "Illegal call of abstract base class member"

    def __eq__(self, rhs):
        return self.__class__ == rhs.__class__ and self.__dict__ == rhs.__dict__

    def __ne__(self, rhs):
        return not self == rhs

    # def __lt__(self,
    #        rhs):
    #   return NotImplemented

    # def __le__(self,
    #        rhs):
    #   return NotImplemented

    # def __gt__(self,
    #        rhs):
    #   return NotImplemented

    # def __ge__(self,
    #        rhs):
    #   return NotImplemented

    def __propertyGetter(self, name):
        assert hasattr(self, "__%s" % (name)), str(type(self))
        return getattr(self, "__%s" % (name))

    def __propertySetter(self, value, name):
        # Creates member variable whenever necessary.
        setattr(self, "__%s" % (name), value)


_ComplexArgument._addProperty("_keyword")
