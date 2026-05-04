---
layout: null
title: Markdown image test
---

# Markdown image test

This page verifies that `![alt](url)` in `.md` files is processed by Astro's image pipeline and routed through the `@imagekit/astro` image service.

<div class="container">

## ImageKit URL (primary endpoint host)

![Imagekit URL](https://ik.imagekit.io/demo/default-image.jpg)

## Custom IK domain (additionalEndpoints host)

![Another custom IK URL](https://ik.imgkit.net/demo/default-image.jpg)

## Local imported asset (delegated to sharp)

![Local hero asset](../assets/hero.jpg)

## Allow-listed external URL (delegated to sharp)

![Allowed external URL](https://placehold.co/600x400)

## Non-allow-listed external URL (rendered as-is by Astro)

![Not allowed external URL](https://not-allowed-external-as-is.com/creatives/4a3a37e5-f135-4fdd-877f-488570c9d4bb/default.jpg?tr=cm-pad_resize,w-900)

</div>
