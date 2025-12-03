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
define(['./workbox-df7646a5'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();

  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "ui-fix.css",
    "revision": "dc9513acf6ab30605f1fe480e41da548"
  }, {
    "url": "service-worker.js",
    "revision": "474b91e47aa8eef01dbac54928637b73"
  }, {
    "url": "registerSW.js",
    "revision": "1872c500de691dce40960bb85481de07"
  }, {
    "url": "module-map.html",
    "revision": "6341d8c6d097a9861dfd6bf748d4d811"
  }, {
    "url": "mockServiceWorker.js",
    "revision": "950685fe6476cf5463ff17a5108b8c79"
  }, {
    "url": "index.html",
    "revision": "d2014ab678d2f80885b8ab6b5a2891bc"
  }, {
    "url": "fix-chrome-errors.js",
    "revision": "8683a5dedd4ba11ff751b1e7886cedbf"
  }, {
    "url": "chrome-extension-shield.js",
    "revision": "df2604d07c2a422fd80a5f1f41b2f6fa"
  }, {
    "url": "benton-county-ready.html",
    "revision": "e727c25e45044c9d753b097ed8e9891c"
  }, {
    "url": "modules/marketplace/index.html",
    "revision": "d97b60009c6958241fabdab6a3f797c6"
  }, {
    "url": "modules/counties-hub/index.html",
    "revision": "a59878741e53a03b2d2a0a484f9ac10f"
  }, {
    "url": "modules/costforge/index.html",
    "revision": "76ecded99ab79794f4fe0a3ecc0467c8"
  }, {
    "url": "brand/tokens-yakima.css",
    "revision": "2283aeb6b7a234d730b2b359bc893d80"
  }, {
    "url": "brand/tokens-benton.css",
    "revision": "ffa7a499cd34286dd7ea426293913a16"
  }, {
    "url": "brand/tokens-base.css",
    "revision": "f03c8de2c9c0b5172f15ac0860f29e04"
  }, {
    "url": "assets/vendor-CQJcVwtU.js",
    "revision": null
  }, {
    "url": "assets/ui-CaNJ-T69.js",
    "revision": null
  }, {
    "url": "assets/platform-design-system-l0sNRNKZ.js",
    "revision": null
  }, {
    "url": "assets/index-DzVN25xI.js",
    "revision": null
  }, {
    "url": "assets/index-DrGrWq43.css",
    "revision": null
  }, {
    "url": "assets/charts-Zt_oMwNx.js",
    "revision": null
  }, {
    "url": "assets/3d-l0sNRNKZ.js",
    "revision": null
  }, {
    "url": "manifest.webmanifest",
    "revision": "b0ac54c92909b22e538888d74eecff03"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
//# sourceMappingURL=sw.js.map
