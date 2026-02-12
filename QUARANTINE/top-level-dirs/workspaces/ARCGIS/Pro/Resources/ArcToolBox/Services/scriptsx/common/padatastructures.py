"""Module to provide special data structures."""
from itertools import repeat


__all__ = ["ImmutableDict"]


ITERITEMS = lambda d, *args, **kwargs: iter(d.items(*args, **kwargs))


def is_immutable(self):
    """Raise a not immutable TypeError"""
    raise TypeError("%r objects are immutable" % self.__class__.__name__)


class ImmutableDictMixin(object):
    """Class module to make dict object immutable."""

    _hash_cache = None

    @classmethod
    def fromkeys(cls, keys, value=None):
        instance = super(cls, cls).__new__(cls)  # type: ignore
        instance.__init__(zip(keys, repeat(value)))
        return instance

    def __reduce_ex__(self, protocol):
        """meta-method used for pickling purpose."""
        return type(self), (dict(self),)  # type: ignore

    def _iter_hashitems(self):
        return ITERITEMS(self)

    def __hash__(self):
        if self._hash_cache is not None:
            return self._hash_cache
        rv = self._hash_cache = hash(frozenset(self._iter_hashitems()))
        return rv

    def setdefault(self, key, default=None):
        is_immutable(self)

    def update(self, *args, **kwargs):
        is_immutable(self)

    def pop(self, key, default=None):
        is_immutable(self)

    def popitem(self):
        is_immutable(self)

    def __setitem__(self, key, value):
        is_immutable(self)

    def __delitem__(self, key):
        is_immutable(self)

    def clear(self):
        is_immutable(self)


class ImmutableDict(ImmutableDictMixin, dict):
    """A special type of dict that is not mutable."""

    def __repr__(self):
        return "%s(%s)" % (self.__class__.__name__, dict.__repr__(self))

    def copy(self):
        """Return a shallow mutable copy of this object.  Keep in mind that
        the standard library's :func:`copy` function is a no-op for this class
        like for any other python immutable type (eg: :class:`tuple`).
        """
        return dict(self)

    def __copy__(self):
        return self
