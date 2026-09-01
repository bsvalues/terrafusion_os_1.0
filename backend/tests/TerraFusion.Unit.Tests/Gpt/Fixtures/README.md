# GPT exact runtime fixtures

These files are immutable CI inputs for executing the exact protected TerraGPT artifact when the
sovereign repository workflow has no cross-repository credential. They are not a runtime source,
fallback implementation, or ownership claim.

The module and schema Git blobs exactly equal protected `terrafusion-gpt@550b50f27af6f0911f16c973cbb6fc57a20eb15a`.
The base64 file decodes to the exact 1,685-byte published manifest produced by the governed OS
stager. The workflow refuses any length or SHA-256 mismatch before the process host is tested.
Development runtime publication continues to use `Stage-GptGroundedContextModule.ps1` against the
protected suite repository.
