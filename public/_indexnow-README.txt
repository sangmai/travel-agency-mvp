This directory contains an IndexNow key file: a 32-character hex name whose
contents are that same string.

It exists so Bing, Yandex and other IndexNow participants can verify that
whoever submits URLs for this host actually controls the host. Deleting it
silently breaks submission — the API answers 403 and no URL is queued.

The key is not a secret. It proves control of the domain, nothing more.
Rotating it means publishing a new file and submitting with the new key.
