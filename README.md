Download Progress
=================

Show progress of file downloads in the browser

TODO
----

* Currently notifies all connected sockets. Restrict to the one downloading.

```bash
# Linux
fallocate -l 200m demo/public/200mb.dat

# Mac
dd if=/dev/zero of=demo/public/200mb.dat bs=1024 count=204800
```
