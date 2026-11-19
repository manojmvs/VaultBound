/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-e82df9a2'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "pwa-icon-v2-maskable-512.png",
    "revision": "68a384644164214f1e779ffb709a15e2"
  }, {
    "url": "pwa-icon-v2-512.png",
    "revision": "20915cae1e46e9d974d94dc572c6bc1d"
  }, {
    "url": "pwa-icon-v2-192.png",
    "revision": "5551db668a67523e3718ada59474a990"
  }, {
    "url": "index.html",
    "revision": "2d7958327629d29c3aa4ab5f00afa7fc"
  }, {
    "url": "icon-v2.svg",
    "revision": "1350c3ec0dccc1f0e3fb9bd232525fd1"
  }, {
    "url": "apple-touch-icon-v2.png",
    "revision": "bfc9f12265c1ff3a1242135666bc40d4"
  }, {
    "url": "assets/workbox-window.prod.es5-Bd17z0YL.js",
    "revision": null
  }, {
    "url": "assets/intro_human_vs_robot_1794665477652-DmLaxGvt.jpg",
    "revision": null
  }, {
    "url": "assets/index-DyMCvPWD.js",
    "revision": null
  }, {
    "url": "assets/index-B5pUUsWK.css",
    "revision": null
  }, {
    "url": "apple-touch-icon-v2.png",
    "revision": "bfc9f12265c1ff3a1242135666bc40d4"
  }, {
    "url": "icon-v2.svg",
    "revision": "1350c3ec0dccc1f0e3fb9bd232525fd1"
  }, {
    "url": "pwa-icon-v2-192.png",
    "revision": "5551db668a67523e3718ada59474a990"
  }, {
    "url": "pwa-icon-v2-512.png",
    "revision": "20915cae1e46e9d974d94dc572c6bc1d"
  }, {
    "url": "pwa-icon-v2-maskable-512.png",
    "revision": "68a384644164214f1e779ffb709a15e2"
  }, {
    "url": "manifest.webmanifest",
    "revision": "d9135c8d9f1a64cc2fd62c94617657c4"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(({
    request
  }) => request.mode === "navigate", new workbox.NetworkFirst({
    "cacheName": "pages-cache",
    "networkTimeoutSeconds": 4,
    plugins: [new workbox.CacheableResponsePlugin({
      statuses: [200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
