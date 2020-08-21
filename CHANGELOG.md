# 3.0.0-rc.8 (2020-08-21)


### Bug Fixes

* $emit should check for raw parent data for listeners ([172b7f5](https://github.com/kangjiancheng/vue-next/commit/172b7f5cf780cdfd135ee3a78965e92894bc5120))
* activateComponent should insert vnode now ([d9e3ad7](https://github.com/kangjiancheng/vue-next/commit/d9e3ad72c0e996ce6977f77753ac862130df52e3))
* add missing compiler to the full build on Windows ([#333](https://github.com/kangjiancheng/vue-next/issues/333)) ([58fcd15](https://github.com/kangjiancheng/vue-next/commit/58fcd15000ba0961059e41ae9700f3b03391baab))
* add warnings ([#82](https://github.com/kangjiancheng/vue-next/issues/82)) ([0177355](https://github.com/kangjiancheng/vue-next/commit/0177355242ae598d345f8f659847aa70f8343034))
* always treat spellcheck and draggable as attributes ([4492b88](https://github.com/kangjiancheng/vue-next/commit/4492b88938922a7f1bcc36a608375ad99f16b22e)), closes [#1350](https://github.com/kangjiancheng/vue-next/issues/1350)
* **runtime-core:** fix globalProperties in check on instance render proxy ([c28a919](https://github.com/kangjiancheng/vue-next/commit/c28a9196b2165e8ce274b2708d6d772024c2933a))
* avoid double inserting root component ([a8522cf](https://github.com/kangjiancheng/vue-next/commit/a8522cf48c09efbb2063f129cf1bea0dae09f10a))
* **apiInject:** fix stringifying of symbol injection key ([#383](https://github.com/kangjiancheng/vue-next/issues/383)) ([7394f7e](https://github.com/kangjiancheng/vue-next/commit/7394f7ec42d2eb93c6dbbe8c9a10ed736e0eae0b))
* **BaseTransition:** collect correct children with slot passthrough in `Transition` ([#1456](https://github.com/kangjiancheng/vue-next/issues/1456)) ([d4cd128](https://github.com/kangjiancheng/vue-next/commit/d4cd12887eba18c4aff02b85834679bfe679f878)), closes [#1455](https://github.com/kangjiancheng/vue-next/issues/1455)
* **BaseTransition:** fix `BaseTransition` delayed leave with mode `in-out` ([#1404](https://github.com/kangjiancheng/vue-next/issues/1404)) ([2ff8dca](https://github.com/kangjiancheng/vue-next/commit/2ff8dcab0a51cc3634a0a739641fb4cfe459b731)), closes [#1400](https://github.com/kangjiancheng/vue-next/issues/1400)
* **build:** fix component resolution when disabling options API ([a75b8a2](https://github.com/kangjiancheng/vue-next/commit/a75b8a268fca800a49c7d772b4a290b4435e85b9)), closes [#1688](https://github.com/kangjiancheng/vue-next/issues/1688)
* **build:** make transition tree-shakeable again ([ad199e1](https://github.com/kangjiancheng/vue-next/commit/ad199e1a252f80c85a8e40a4b4539ad27c39505c))
* **build:** remove __RUNTIME_COMPILE__ flag ([206640a](https://github.com/kangjiancheng/vue-next/commit/206640a2d859a9ce9c19f22e201692f15a8d1da3)), closes [#817](https://github.com/kangjiancheng/vue-next/issues/817)
* **build:** retain main vue package side effect for compiler registration ([dc986ad](https://github.com/kangjiancheng/vue-next/commit/dc986addd9f6c57a4d3d13b0f97132064a8d76a4)), closes [#1263](https://github.com/kangjiancheng/vue-next/issues/1263)
* **codeframe:** Added Math.max to prevent RangeError ([#1807](https://github.com/kangjiancheng/vue-next/issues/1807)) ([b14f4a5](https://github.com/kangjiancheng/vue-next/commit/b14f4a505b343b12be846f2455d461027a51641c)), closes [#1806](https://github.com/kangjiancheng/vue-next/issues/1806)
* **compiler:** avoid hoisting components and directive calls ([277651c](https://github.com/kangjiancheng/vue-next/commit/277651ce89e6719b178a31bebe8f56bd61a6d084))
* **compiler:** bail strigification on runtime constant expressions ([f9a3766](https://github.com/kangjiancheng/vue-next/commit/f9a3766fd68dc6996cdbda6475287c4005f55243))
* **compiler:** cache handlers should be per-instance, fix hoist w/ cached handlers ([869ae19](https://github.com/kangjiancheng/vue-next/commit/869ae19c4194bf74e486157c74ee623bc684af24))
* **compiler:** do not hoist element with dynamic key ([#187](https://github.com/kangjiancheng/vue-next/issues/187)) ([80f5cb2](https://github.com/kangjiancheng/vue-next/commit/80f5cb2700f976a19e82b3815b1f2c8f468e0518))
* **compiler:** exclude BAIL flag in annotations ([4dea23f](https://github.com/kangjiancheng/vue-next/commit/4dea23f79ee7f0858bfad43062ac11d5954dabd7))
* **compiler:** export COMMENT instead EMPTY runtime helper ([9ad7ae4](https://github.com/kangjiancheng/vue-next/commit/9ad7ae479e5b65e475a2b26d0f66cc7d2e8218a3))
* **compiler:** fix pre tag whitespace handling ([7f30cb5](https://github.com/kangjiancheng/vue-next/commit/7f30cb577257ad5765261bbffa3cae862259fcab)), closes [#908](https://github.com/kangjiancheng/vue-next/issues/908)
* **compiler:** fix v-for fragment openBlock argument ([12fcf9a](https://github.com/kangjiancheng/vue-next/commit/12fcf9ab953acdbb8706b549c7e63f69482a495a))
* **compiler:** generate correct fragment children when it contains single text node or slot outlet ([3a95a2f](https://github.com/kangjiancheng/vue-next/commit/3a95a2f1482a94479466423d4c36a745d2edf03e))
* **compiler:** generate correct mappings for v-for and object properties ([#69](https://github.com/kangjiancheng/vue-next/issues/69)) ([a407b16](https://github.com/kangjiancheng/vue-next/commit/a407b16b2b19276f6a5e8a722a109d9fa4d36677))
* **compiler:** handle block nodes with custom directives + improve ast types ([16da9ae](https://github.com/kangjiancheng/vue-next/commit/16da9ae89f714cffdc459c0dd883caf27dc04b54))
* **compiler:** improve auto prefixing cases ([6377af4](https://github.com/kangjiancheng/vue-next/commit/6377af483b881b71a3fcf5fcf409613deb6072cf))
* **compiler:** include createTextVNode helper for hoisted static content (fix [#465](https://github.com/kangjiancheng/vue-next/issues/465)) ([e89d009](https://github.com/kangjiancheng/vue-next/commit/e89d0099379ba49697ae4b6853ab749046733475))
* **compiler:** patchFlag analysis should factor in props returned by directive transforms ([6059fe6](https://github.com/kangjiancheng/vue-next/commit/6059fe69e866fd96e5e1bce2d1a1882fdd7604b8))
* **compiler:** props hoist should also work on elements w/ TEXT flag ([2166624](https://github.com/kangjiancheng/vue-next/commit/21666243e959f58f07c0ab288f0e966f8f6389b4))
* **compiler:** should not condense &nbsp; ([8c17535](https://github.com/kangjiancheng/vue-next/commit/8c17535a470501f7f4ec3747cd3de25d9169c505)), closes [#945](https://github.com/kangjiancheng/vue-next/issues/945)
* **compiler:** should not prefix reserved literals (close [#142](https://github.com/kangjiancheng/vue-next/issues/142)) ([b4d375b](https://github.com/kangjiancheng/vue-next/commit/b4d375b0b87076c18d27bcddbde643c9bbf4ac4a))
* **compiler:** should only strip leading newline directly in pre tag ([be666eb](https://github.com/kangjiancheng/vue-next/commit/be666ebd59027eb2fc96595c1a6054ecf62832e8))
* **compiler:** support full range of entity decoding in browser builds ([1f6e72b](https://github.com/kangjiancheng/vue-next/commit/1f6e72b11051561abe270fa233cf52d5aba01d6b))
* **compiler:** update v-if directive to use Comment instead of Empty ([#208](https://github.com/kangjiancheng/vue-next/issues/208)) ([584ac88](https://github.com/kangjiancheng/vue-next/commit/584ac88b54b8053cf2c9adc13e4b1a5cadb36302))
* **compiler:** v-for fragments should be blocks ([bec01c9](https://github.com/kangjiancheng/vue-next/commit/bec01c93bdb7c5a427b88cd58df2deb09eae5f72))
* **compiler:** warn against v-bind with empty attribute value ([675330b](https://github.com/kangjiancheng/vue-next/commit/675330ba542022935ebbb2d31af3ba643c37a5eb)), closes [/github.com/vuejs/vue-next/issues/1128#issuecomment-624647434](https://github.com//github.com/vuejs/vue-next/issues/1128/issues/issuecomment-624647434)
* **compiler-core:** add `\r` to accepted chars after end tag name ([#1515](https://github.com/kangjiancheng/vue-next/issues/1515)) ([64e2f46](https://github.com/kangjiancheng/vue-next/commit/64e2f4643602c5980361e66674141e61ba60ef70)), closes [#1476](https://github.com/kangjiancheng/vue-next/issues/1476)
* **compiler-core:** allow multiline expression on v-model and v-on ([#1234](https://github.com/kangjiancheng/vue-next/issues/1234)) ([958b6c8](https://github.com/kangjiancheng/vue-next/commit/958b6c80cf2e07ef6e829b5b5d698fd61c25b91f))
* **compiler-core:** always compile Teleport and Suspense as blocks ([fbf865d](https://github.com/kangjiancheng/vue-next/commit/fbf865d9d4744a0233db1ed6e5543b8f3ef51e8d))
* **compiler-core:** assest id ([#190](https://github.com/kangjiancheng/vue-next/issues/190)) ([f71d252](https://github.com/kangjiancheng/vue-next/commit/f71d252ffe37bf719b931b955d33a5ba57fae7e0))
* **compiler-core:** assign patchFlag for template v-if fragment ([a1da9c2](https://github.com/kangjiancheng/vue-next/commit/a1da9c28a0a7030124b1deb9369685760c67be47)), closes [#850](https://github.com/kangjiancheng/vue-next/issues/850)
* **compiler-core:** avoid override user keys when injecting branch key ([#630](https://github.com/kangjiancheng/vue-next/issues/630)) ([aca2c2a](https://github.com/kangjiancheng/vue-next/commit/aca2c2a81e2793befce516378a02afd1e4da3d3d))
* **compiler-core:** avoid prefixing empty interpolations ([#290](https://github.com/kangjiancheng/vue-next/issues/290)) ([3385480](https://github.com/kangjiancheng/vue-next/commit/3385480ba7a0c1afd12c285b75d6ccc086412dcd))
* **compiler-core:** bail static stringfication even threshold is met ([#1298](https://github.com/kangjiancheng/vue-next/issues/1298)) ([64ec8bf](https://github.com/kangjiancheng/vue-next/commit/64ec8bfb54b97036d9cde765d923443ec8bc02b9)), closes [#1128](https://github.com/kangjiancheng/vue-next/issues/1128)
* **compiler-core:** dynamic component should always be made blocks ([7d0ab33](https://github.com/kangjiancheng/vue-next/commit/7d0ab3392af5285147db111759fe380688ca17ea)), closes [#1018](https://github.com/kangjiancheng/vue-next/issues/1018)
* **compiler-core:** elements with dynamic keys should be forced into blocks ([d531686](https://github.com/kangjiancheng/vue-next/commit/d531686f9154c2ef7f1d877c275df62a8d8da2a5)), closes [#916](https://github.com/kangjiancheng/vue-next/issues/916)
* **compiler-core:** fix directive args with empty holes ([acf406b](https://github.com/kangjiancheng/vue-next/commit/acf406b7798e73c5a324c01bf0e121f0addd2eab))
* **compiler-core:** fix keep-alive when used in templates ([ade07c6](https://github.com/kangjiancheng/vue-next/commit/ade07c64a1f98c0958e80db0458c699c21998f64)), closes [#715](https://github.com/kangjiancheng/vue-next/issues/715)
* **compiler-core:** fix parsing for directive with dynamic argument containing dots ([0d26413](https://github.com/kangjiancheng/vue-next/commit/0d26413433d41389f5525a0ef2c2dd7cfbb454d4))
* **compiler-core:** fix prod whitespace/comment removal ([f3623e4](https://github.com/kangjiancheng/vue-next/commit/f3623e4d1ea83d552b5ab29955dead6c36a87723)), closes [#1256](https://github.com/kangjiancheng/vue-next/issues/1256)
* **compiler-core:** fix property shorthand detection ([586e5bb](https://github.com/kangjiancheng/vue-next/commit/586e5bb8003916ba6be9b3394087df80328657f4)), closes [#845](https://github.com/kangjiancheng/vue-next/issues/845)
* **compiler-core:** fix v-if + v-for on `<template>` ([af7e100](https://github.com/kangjiancheng/vue-next/commit/af7e100ef229e1088abfd270a71c5a7da44e760e)), closes [#1637](https://github.com/kangjiancheng/vue-next/issues/1637)
* **compiler-core:** force <svg> into blocks for correct runtime isSVG ([f2ac28b](https://github.com/kangjiancheng/vue-next/commit/f2ac28b31e9f1e8ebcd68ca9a1e8ea29653b0916))
* **compiler-core:** generate incremental keys for v-if/else-if/else chains ([#1589](https://github.com/kangjiancheng/vue-next/issues/1589)) ([64c7b2f](https://github.com/kangjiancheng/vue-next/commit/64c7b2f9cedae676ec26a7a8da4c109bc88b48f1)), closes [#1587](https://github.com/kangjiancheng/vue-next/issues/1587)
* **compiler-core:** generate NEED_PATCH flag for element with vnode hooks ([24041b7](https://github.com/kangjiancheng/vue-next/commit/24041b7ac1a22ca6c10bf2af81c9250af26bda34))
* **compiler-core:** handle base-transition ([52134a8](https://github.com/kangjiancheng/vue-next/commit/52134a88d0e374f7471fe43a8a77fa5aa261f381))
* **compiler-core:** handle template root and template v-if as stable fragments ([8ffd79c](https://github.com/kangjiancheng/vue-next/commit/8ffd79c75402d73280dc3bc948599a8d7416676e))
* **compiler-core:** hoist pure annotations should apply to all nested calls ([c5e7d8b](https://github.com/kangjiancheng/vue-next/commit/c5e7d8b532685e1e33e1cfb316f75c1b61109ee7))
* **compiler-core:** hoisted vnode calls and scoped id calls should be marked pure ([cad25d9](https://github.com/kangjiancheng/vue-next/commit/cad25d95a3171628b0c95e89fb8e52eb5f41bbc5))
* **compiler-core:** ignore comment nodes in transition children ([e52b7cd](https://github.com/kangjiancheng/vue-next/commit/e52b7cd7e7c10d8dbad92000ab3d5f2e02533e39)), closes [#1352](https://github.com/kangjiancheng/vue-next/issues/1352)
* **compiler-core:** only check is prop on `<component>` ([78c4f32](https://github.com/kangjiancheng/vue-next/commit/78c4f321cd0902a117c599ac705dda294fa198ed))
* **compiler-core:** prevent generating invalid code for v-bind with empty expression ([#1720](https://github.com/kangjiancheng/vue-next/issues/1720)) ([d452723](https://github.com/kangjiancheng/vue-next/commit/d4527230e40c4728e5becdd35c3e039f0992ae4c))
* **compiler-core:** relax error on unknown entities ([730d329](https://github.com/kangjiancheng/vue-next/commit/730d329f794caf1ea2cc47628f8d74ef2d07f96e)), closes [#663](https://github.com/kangjiancheng/vue-next/issues/663)
* **compiler-core:** should alias name in helperString ([#743](https://github.com/kangjiancheng/vue-next/issues/743)) ([7b987d9](https://github.com/kangjiancheng/vue-next/commit/7b987d9450fc7befcd0946a0d53991d27ed299ec)), closes [#740](https://github.com/kangjiancheng/vue-next/issues/740)
* **compiler-core:** should apply text transform to <template v-for> children ([c36941c](https://github.com/kangjiancheng/vue-next/commit/c36941c4987c38c5a92a1ae0d554dbf746177e71))
* **compiler-core:** should apply text transform to if branches ([e0f3c6b](https://github.com/kangjiancheng/vue-next/commit/e0f3c6b352ab35adcad779ef0ac9670acf3d7b37)), closes [#725](https://github.com/kangjiancheng/vue-next/issues/725)
* **compiler-core:** should attach key to single element child of `<template v-for>` ([#1910](https://github.com/kangjiancheng/vue-next/issues/1910)) ([69cfed6](https://github.com/kangjiancheng/vue-next/commit/69cfed6b313821d1ae7ecb02b63b0aaccb5599c6))
* **compiler-core:** should not condense whitespace in RAWTEXT mode ([4b739e3](https://github.com/kangjiancheng/vue-next/commit/4b739e3bc09e4693a5c356ee432520a1c507731e))
* **compiler-core:** should not generate CLASS/STYLE patch flags on components ([a6e2b10](https://github.com/kangjiancheng/vue-next/commit/a6e2b1052a4d461767147a6c13854fcb4f9509d2)), closes [#677](https://github.com/kangjiancheng/vue-next/issues/677)
* **compiler-core:** should not hoist element with cached + merged event handlers ([5455e8e](https://github.com/kangjiancheng/vue-next/commit/5455e8e69a59cd1ff72330b1aed9c8e6aedc4b36))
* **compiler-core:** should not prefix object method ([#1375](https://github.com/kangjiancheng/vue-next/issues/1375)) ([35dbef2](https://github.com/kangjiancheng/vue-next/commit/35dbef268ca43234aa8544a62dfa4240dcc2974e))
* **compiler-core:** should only parse interpolations in DATA text mode ([95b2cb6](https://github.com/kangjiancheng/vue-next/commit/95b2cb6fd26790f3f371c8475e9fdc4b3f2ee02d))
* **compiler-core:** should pre-convert text nodes in all non-element cases ([42f3f9e](https://github.com/kangjiancheng/vue-next/commit/42f3f9e832022156537e7ce9ae1eb6d057baaec8))
* **compiler-core:** skip empty expressions when validating expressions in browser mode ([afb231e](https://github.com/kangjiancheng/vue-next/commit/afb231ec5ce5ac77ff6260bea4d866ec2d5bbd85))
* **compiler-core:** support interpolation in RCDATA mode (e.g. textarea) ([0831b98](https://github.com/kangjiancheng/vue-next/commit/0831b98eac344d9bdfd6f6e922902adb91ea180a))
* **compiler-core:** support static slot names containing dots for 2.x compat ([825ec15](https://github.com/kangjiancheng/vue-next/commit/825ec1500feda8b0c43245e7e92074af7f9dcca2)), closes [#1241](https://github.com/kangjiancheng/vue-next/issues/1241)
* **compiler-core:** v-if key error should only be checking same key on different branches ([de0c8a7](https://github.com/kangjiancheng/vue-next/commit/de0c8a7e3e8d2adfae4c4ef992cd5ac6262ca534))
* **compiler-core/slots:** should support on-component named slots ([a022b63](https://github.com/kangjiancheng/vue-next/commit/a022b63605820c97923413ee457ba1fb69a5221e))
* **compiler-core/v-on:** bail caching for member expression handlers on components ([87c2a1e](https://github.com/kangjiancheng/vue-next/commit/87c2a1e50f5317a0c47051b06f419e60e5644a1a)), closes [#1541](https://github.com/kangjiancheng/vue-next/issues/1541)
* **compiler-core/v-on:** fix codegen for event handler with newlines ([#1640](https://github.com/kangjiancheng/vue-next/issues/1640)) ([f9826fa](https://github.com/kangjiancheng/vue-next/commit/f9826fa963e67c495b8c44efb22b09b87df381de))
* **compiler-core/v-on:** only cache empty handler when the option is used ([5fbd1f4](https://github.com/kangjiancheng/vue-next/commit/5fbd1f4ccb22bf62bdf749460f8c6dadee3b6b89)), closes [#1716](https://github.com/kangjiancheng/vue-next/issues/1716)
* **compiler-core/v-on:** pass noninitial arguments in cached event handlers ([#1265](https://github.com/kangjiancheng/vue-next/issues/1265)) ([7e28173](https://github.com/kangjiancheng/vue-next/commit/7e281733120fe003552b915f97713a3d26f4dc8a))
* **compiler-dom:** add tfoot,caption,col element on bail stringification ([#1333](https://github.com/kangjiancheng/vue-next/issues/1333)) ([fbaf52a](https://github.com/kangjiancheng/vue-next/commit/fbaf52ae9fdd412e517e7edf44544db5d759dd2c))
* **compiler-dom:** bail static stringfication on non-attr bindings ([304ab8c](https://github.com/kangjiancheng/vue-next/commit/304ab8c99b954de4aa9ab6a5387116228345f544)), closes [#1128](https://github.com/kangjiancheng/vue-next/issues/1128)
* **compiler-dom:** bail stringification on table elements ([a938b61](https://github.com/kangjiancheng/vue-next/commit/a938b61edca63c1f03f99b85de3f2a3a519268e6)), closes [#1230](https://github.com/kangjiancheng/vue-next/issues/1230) [#1268](https://github.com/kangjiancheng/vue-next/issues/1268)
* **compiler-dom:** fix duplicated transforms ([9e51297](https://github.com/kangjiancheng/vue-next/commit/9e51297702f975ced1cfebad9a46afc46f0593bb))
* **compiler-dom:** fix v-on .left .right modifier handling ([6b63ba2](https://github.com/kangjiancheng/vue-next/commit/6b63ba2f453b3f9bbf9e9e2167030de42f76b5ac))
* **compiler-dom:** properly stringify class/style bindings when hoisting static strings ([1b9b235](https://github.com/kangjiancheng/vue-next/commit/1b9b235663b75db040172d2ffbee1dd40b4db032))
* **compiler-dom:** should bail stringification on runtime constant regardless of position ([dd2bfb5](https://github.com/kangjiancheng/vue-next/commit/dd2bfb5a8f5b897a621b3ebb89a9fb1b8e4c63cd)), closes [vuejs/vite#157](https://github.com/vuejs/vite/issues/157)
* **compiler-dom:** should ignore and warn side effect tags like script and style ([5e52f4e](https://github.com/kangjiancheng/vue-next/commit/5e52f4e4d7c92ee8ec9c0d644735e23342965096))
* **compiler-dom:** style transform of static styles should not add STYLE patchFlag ([113339c](https://github.com/kangjiancheng/vue-next/commit/113339c7b600a62cfcc703c6b1f6af646653b05b))
* **compiler-sfc:** `<script setup>` warning ([9146cc4](https://github.com/kangjiancheng/vue-next/commit/9146cc485e317ff29192796f9366471144ed3ad2))
* **compiler-sfc:** `<style vars scoped>` prefixing should only apply to pre-transform source ([4951d43](https://github.com/kangjiancheng/vue-next/commit/4951d4352605eb9f4bcbea40ecc68fc6cbc3dce2)), closes [#1623](https://github.com/kangjiancheng/vue-next/issues/1623)
* **compiler-sfc:** `less` and `stylus` output deps path is absolute p… ([#1685](https://github.com/kangjiancheng/vue-next/issues/1685)) ([578f25c](https://github.com/kangjiancheng/vue-next/commit/578f25c34efab0a71a7afd8bff278bd147a16a64))
* **compiler-sfc:** always use offset for template block sourcemaps ([#911](https://github.com/kangjiancheng/vue-next/issues/911)) ([db50009](https://github.com/kangjiancheng/vue-next/commit/db5000935306214b31e33865cd57935e80e27d41))
* **compiler-sfc:** asset url transform should ignore direct hash urls ([5ddd9d2](https://github.com/kangjiancheng/vue-next/commit/5ddd9d241747ef785de848d19246ef518abd8b8f))
* **compiler-sfc:** custom blocks sourcemap ([#1812](https://github.com/kangjiancheng/vue-next/issues/1812)) ([619efd9](https://github.com/kangjiancheng/vue-next/commit/619efd9ac5a0d38651b7282722e7b347a013411a))
* **compiler-sfc:** fix preprocessor filename access ([9cb29ee](https://github.com/kangjiancheng/vue-next/commit/9cb29eea3a61f7f4a6730fed56f2e3e9a13dbcc9))
* **compiler-sfc:** fix rewrite named export default ([#1675](https://github.com/kangjiancheng/vue-next/issues/1675)) ([452edb7](https://github.com/kangjiancheng/vue-next/commit/452edb73cb02c4aecb518a45df9b01aaa1516b19))
* **compiler-sfc:** fix useCssVars codegen ([9b5ff2b](https://github.com/kangjiancheng/vue-next/commit/9b5ff2b567f5e29cc59e23e106f2278c3feaad21))
* **compiler-sfc:** handle empty nodes with src attribute ([#695](https://github.com/kangjiancheng/vue-next/issues/695)) ([2d56dfd](https://github.com/kangjiancheng/vue-next/commit/2d56dfdc4fcf824bba4c0166ca5471258c4f883b))
* **compiler-sfc:** only transform relative asset URLs ([#628](https://github.com/kangjiancheng/vue-next/issues/628)) ([c71ca35](https://github.com/kangjiancheng/vue-next/commit/c71ca354b9368135b55676c5817cebffaf3fd9c5))
* **compiler-sfc:** prohibit src usage for `<script setup>` + do not ([af4b0c2](https://github.com/kangjiancheng/vue-next/commit/af4b0c2cf18b63990bc266eb0871a50ba2004fc0))
* **compiler-sfc:** should ignore nodes with no children ([#464](https://github.com/kangjiancheng/vue-next/issues/464)) ([1efb35e](https://github.com/kangjiancheng/vue-next/commit/1efb35e3240fce10be79f34f9f119e0ea4f18a08))
* **compiler-sfc:** should not transform external asset url with ([d662118](https://github.com/kangjiancheng/vue-next/commit/d66211849ca174c4458b59d3df5569730ee224f6))
* **compiler-sfc:** template with alt lang should be parsed as raw text ([d10835a](https://github.com/kangjiancheng/vue-next/commit/d10835aee73e3be579c728df634fbaa8fe3a0e0f)), closes [#1120](https://github.com/kangjiancheng/vue-next/issues/1120)
* **compiler-sfc:** transformAssetUrl should ignore inline data url ([#1431](https://github.com/kangjiancheng/vue-next/issues/1431)) ([90c285c](https://github.com/kangjiancheng/vue-next/commit/90c285c5c8ac13afb4932974c1f9aede15e81337))
* **compiler-sfc:** use `filename` from options when compile styl preprocessor ([#1635](https://github.com/kangjiancheng/vue-next/issues/1635)) ([0526e5d](https://github.com/kangjiancheng/vue-next/commit/0526e5d7faa9ba69f76e7ff71fe96d93a4e99684))
* **compiler-sfc:** use correct importer with `useCssVars` ([#1658](https://github.com/kangjiancheng/vue-next/issues/1658)) ([6f148d0](https://github.com/kangjiancheng/vue-next/commit/6f148d0b9a0630dc87c741ed951c82b639e776b2))
* **compiler-ssr:** avoid unnecessary withCtx import ([08b4e88](https://github.com/kangjiancheng/vue-next/commit/08b4e8815da4e8911058ccbab986bea6365c3352))
* **compiler-ssr:** fix input w/ v-bind="obj" codegen ([3b40fc5](https://github.com/kangjiancheng/vue-next/commit/3b40fc56dba56a5c1085582d11f3287e9317a151))
* **compiler-ssr:** handle comments codegen + refactor ssr codegen transform ([6c60ce1](https://github.com/kangjiancheng/vue-next/commit/6c60ce13e061b43d314dde022d3f43ece7f03c30))
* **compiler-ssr:** import helpers from correct packages ([8f6b669](https://github.com/kangjiancheng/vue-next/commit/8f6b6690a2011846446804267ec49073996c3800))
* **compiler-ssr:** should escape template string interpolation chars in generated code ([5f15d9a](https://github.com/kangjiancheng/vue-next/commit/5f15d9aa4b9024b3764b962bee042d72f94dee91))
* **compiler-ssr:** should pass necessary tag names for dynamic v-bind ([a46f3b3](https://github.com/kangjiancheng/vue-next/commit/a46f3b354d451a857df750a318bd0536338008cd))
* **compiler/codegen:** add simple expression node opening bracket for ConditionalExpression ([#110](https://github.com/kangjiancheng/vue-next/issues/110)) ([de9507b](https://github.com/kangjiancheng/vue-next/commit/de9507b6ffe92aa3f1dc3d5efa41ac1dbaf22c37))
* **compiler/v-if:** avoid incorrect transform application on v-else/else-if branch children ([3146e6b](https://github.com/kangjiancheng/vue-next/commit/3146e6b942aa7b024184dfc466b4d85200c5bc32))
* **compiler/v-on:** handle multiple statements in v-on handler (close [#572](https://github.com/kangjiancheng/vue-next/issues/572)) ([137893a](https://github.com/kangjiancheng/vue-next/commit/137893a4fdd3d2b901adca31e30d916df925b108))
* **compiler/v-slot:** handle implicit default slot mixed with named slots ([2ac4b72](https://github.com/kangjiancheng/vue-next/commit/2ac4b723e010082488b5be64af73e41c9677a28d))
* **computed:** support arrow function usage for computed option ([2fb7a63](https://github.com/kangjiancheng/vue-next/commit/2fb7a63943d9d995248cb6d2d4fb5f22ff2ac000)), closes [#733](https://github.com/kangjiancheng/vue-next/issues/733)
* **core:** clone mounted hoisted vnodes on patch ([47a6a84](https://github.com/kangjiancheng/vue-next/commit/47a6a846311203fa59584486265f5da387afa51d))
* **core:** generate fragment root with patchFlag + optimize fragment w/ patchFlag ([ef50c33](https://github.com/kangjiancheng/vue-next/commit/ef50c333ce0d6b48dfc9e1f1219f26d6f2406e76))
* **core:** propsProxy should not convert non-reactive nested values ([57bbbb2](https://github.com/kangjiancheng/vue-next/commit/57bbbb227c37127dbe6dbe7f0686cb81c0a5083c))
* **core:** should not warn extraneous props when root is toggled ([a58da63](https://github.com/kangjiancheng/vue-next/commit/a58da63f162da95cb50935adefeb1a12a95876c1))
* **core:** use correct parent for v-if toggle ([24f6d63](https://github.com/kangjiancheng/vue-next/commit/24f6d63c6af16bc3a6e09452a3c4b9eb8264ad0c))
* **core:** use String to convert primitive types ([#518](https://github.com/kangjiancheng/vue-next/issues/518)) ([f3007a6](https://github.com/kangjiancheng/vue-next/commit/f3007a6b4f57559cf51acfe71bdacdabc9055be8))
* **deps:** move @babel/types back to dependencies ([11c2ad4](https://github.com/kangjiancheng/vue-next/commit/11c2ad4a04c000ea828a0f5017e41fc7e0816868))
* **devtools:** unmountApp not behind compile flag ([6eb7fd8](https://github.com/kangjiancheng/vue-next/commit/6eb7fd83333d97186d570029e4fdca060fdb328d))
* **directives:** ignore invalid directive hooks ([7971b04](https://github.com/kangjiancheng/vue-next/commit/7971b0468c81483dd7026204518f7c03187d13c4)), closes [#795](https://github.com/kangjiancheng/vue-next/issues/795)
* **dom:** fix <svg> and <foreignObject> mount and updates ([4f06eeb](https://github.com/kangjiancheng/vue-next/commit/4f06eebc1c2a29d0e4165c6e87f849732ec2cd0f))
* **fragment:** perform direct remove when removing fragments ([2fdb499](https://github.com/kangjiancheng/vue-next/commit/2fdb499bd96b4d1a8a7a1964d59e8dc5dacd9d22))
* **fragment:** properly remove compiler generated fragments ([fa5390f](https://github.com/kangjiancheng/vue-next/commit/fa5390fb6fae4a4f7f6ffa2c0823fd3c48099d41))
* **hmr:** always force full child component props update in HMR mode ([1b946c8](https://github.com/kangjiancheng/vue-next/commit/1b946c85df3d213900faccfa0723d736fa0927a3))
* **hmr:** ensure static nodes inherit DOM element in hmr mode ([66c5a55](https://github.com/kangjiancheng/vue-next/commit/66c5a556dc5b27e9a72fa7176fbb45d8c4c515b7)), closes [#1156](https://github.com/kangjiancheng/vue-next/issues/1156)
* **hmr:** fix hmr updates for reused hoisted trees ([5f61aa0](https://github.com/kangjiancheng/vue-next/commit/5f61aa0f719cbd90182af1e27fad37b91c2c351e))
* **hmr:** force full diff on HMR ([d6acb9c](https://github.com/kangjiancheng/vue-next/commit/d6acb9c0733750222fac7bcd23e5de32484488f0))
* **hmr:** force full update in child component on slot update ([2408a65](https://github.com/kangjiancheng/vue-next/commit/2408a656627358b21aa49209e64d14a1aeec7825))
* **hmr:** force full update on nested child components ([#1312](https://github.com/kangjiancheng/vue-next/issues/1312)) ([8f2a748](https://github.com/kangjiancheng/vue-next/commit/8f2a7489b7c74f5cfc1844697c60287c37fc0eb8))
* **hmr:** handle cases where instances with same id having different definitions ([01b7e90](https://github.com/kangjiancheng/vue-next/commit/01b7e90eac88c79ed38a396f824f71c6653736c8))
* **hmr:** should update el for `HYDRATE_EVENTS` patchFlags node ([#1707](https://github.com/kangjiancheng/vue-next/issues/1707)) ([de62cc0](https://github.com/kangjiancheng/vue-next/commit/de62cc040c22e3bd93222a9cc84b6564a4b08b51))
* **hmr:** static child traversal should only affect elements ([2bc6a8c](https://github.com/kangjiancheng/vue-next/commit/2bc6a8c1cf4f409eea0cefa8b8a7619aae1f3569))
* **hmr:** support hmr for static nodes ([386b093](https://github.com/kangjiancheng/vue-next/commit/386b093554c8665fa6a9313b61c0a9359c4ec819))
* **hooks:** fix effect update & cleanup ([98e7994](https://github.com/kangjiancheng/vue-next/commit/98e79943d2e3043f9880e59218189b8a25d94ccf))
* **hydration:** fix text mismatch warning ([e087b4e](https://github.com/kangjiancheng/vue-next/commit/e087b4e02467db18766b7acc2218b3d38d60ce8b))
* **inject:** allow default value to be `undefined` ([#894](https://github.com/kangjiancheng/vue-next/issues/894)) ([94562da](https://github.com/kangjiancheng/vue-next/commit/94562daea70fde33a340bb7b57746523c3660a8e)), closes [#892](https://github.com/kangjiancheng/vue-next/issues/892)
* **keep-alive:**  handle "0" as cache key ([#1622](https://github.com/kangjiancheng/vue-next/issues/1622)) ([2deb0c7](https://github.com/kangjiancheng/vue-next/commit/2deb0c7a74d20e334bb1458bc2f28d65aeea704b)), closes [#1621](https://github.com/kangjiancheng/vue-next/issues/1621)
* **keep-alive:** do not invoke onVnodeBeforeUnmount if is KeepAlive component ([#1079](https://github.com/kangjiancheng/vue-next/issues/1079)) ([239270c](https://github.com/kangjiancheng/vue-next/commit/239270c38a56782bd7f29802cb583b0a8a5a4df4))
* **keep-alive:** fix activated hook invocation on nested components ([#1743](https://github.com/kangjiancheng/vue-next/issues/1743)) ([233d191](https://github.com/kangjiancheng/vue-next/commit/233d191d0d33802cdf7e2996569372a6442e236a)), closes [#1742](https://github.com/kangjiancheng/vue-next/issues/1742)
* **keep-alive:** fix keep-alive with scopeId/fallthrough attrs ([d86b01b](https://github.com/kangjiancheng/vue-next/commit/d86b01ba3a29e2e04c13597a1b9123ca35beaf57)), closes [#1511](https://github.com/kangjiancheng/vue-next/issues/1511)
* **keep-alive:** should update re-activated component with latest props ([1237387](https://github.com/kangjiancheng/vue-next/commit/123738727a0af54fd632bf838dc3aa024722ee41))
* **options:** data options should preserve original object if possible ([d87255c](https://github.com/kangjiancheng/vue-next/commit/d87255ce46373cc12fa4ed175b6787007b6470a0))
* **options:** fix renderTriggered option translation ([5ab1d75](https://github.com/kangjiancheng/vue-next/commit/5ab1d75c3957d70f223209f7b9be928fb20821b3))
* **portal:** fix portal placeholder text ([4397528](https://github.com/kangjiancheng/vue-next/commit/439752822c175c737e58896e0f365f2b02bab577))
* **portal:** portal should always remove its children when unmounted ([16cd8ee](https://github.com/kangjiancheng/vue-next/commit/16cd8eee7839cc4613f17642bf37b39f7bdf1fce))
* **Portal:** add ability to use element as target ([#380](https://github.com/kangjiancheng/vue-next/issues/380)) ([49914ef](https://github.com/kangjiancheng/vue-next/commit/49914efc9e8f4ae40fcefc821c766a7b776c7748))
* **reactivity:** accept subtypes of collections ([#1864](https://github.com/kangjiancheng/vue-next/issues/1864)) ([d005b57](https://github.com/kangjiancheng/vue-next/commit/d005b578b183f165929e1f921584ce599178cad6))
* **reactivity:** account for NaN in value change checks ([#361](https://github.com/kangjiancheng/vue-next/issues/361)) ([18a349c](https://github.com/kangjiancheng/vue-next/commit/18a349ce8c26d04ccd980938d87964ab2c5771e3))
* **reactivity:** allow effect trigger inside no-track execution contexts ([274f81c](https://github.com/kangjiancheng/vue-next/commit/274f81c5db83f0f77e1aba3240b2134a2474a72f)), closes [#804](https://github.com/kangjiancheng/vue-next/issues/804)
* **reactivity:** Array methods relying on identity should work with raw values ([aefb7d2](https://github.com/kangjiancheng/vue-next/commit/aefb7d282ed716923ca1a288a63a83a94af87ebc))
* **reactivity:** avoid cross-component dependency leaks in setup() ([d9d63f2](https://github.com/kangjiancheng/vue-next/commit/d9d63f21b1e6f99f2fb63d736501095b131e5ad9))
* **reactivity:** avoid polluting Object prototype ([f40f3a0](https://github.com/kangjiancheng/vue-next/commit/f40f3a0e9589bfa096d365f735c9bb54b9853fd3))
* **reactivity:** avoid tracking internal symbols in has trap ([7edfdf7](https://github.com/kangjiancheng/vue-next/commit/7edfdf7e239ef8f58a343f9802d675d84ed51d64)), closes [#1683](https://github.com/kangjiancheng/vue-next/issues/1683)
* **reactivity:** avoid triggering effect when deleting property returns false ([#168](https://github.com/kangjiancheng/vue-next/issues/168)) ([ff68db4](https://github.com/kangjiancheng/vue-next/commit/ff68db46ea6f6e693600bf24b22d9504fb82de03))
* **reactivity:** check own property for existing proxy of target ([6be2b73](https://github.com/kangjiancheng/vue-next/commit/6be2b73f8aeb26be72eab22259c8a513b59b910f)), closes [#1107](https://github.com/kangjiancheng/vue-next/issues/1107)
* **reactivity:** effect should handle self dependency mutations ([e8e6772](https://github.com/kangjiancheng/vue-next/commit/e8e67729cb7649d736be233b2a5e00768dd6f4ba))
* **reactivity:** effect should still check sync self-trigger ([ac81dcf](https://github.com/kangjiancheng/vue-next/commit/ac81dcf0cc7f5fc722a0c14d1cc92ece5cc0db07))
* **reactivity:** explicitly do type conversions in warning strings ([#129](https://github.com/kangjiancheng/vue-next/issues/129)) ([5eacfaf](https://github.com/kangjiancheng/vue-next/commit/5eacfaf210b4c18c546ec225a92683be5cecb64e))
* **reactivity:** fix __proto__ access on proxy objects ([#1133](https://github.com/kangjiancheng/vue-next/issues/1133)) ([037fa07](https://github.com/kangjiancheng/vue-next/commit/037fa07113eff6792cda58f91169d26cf6033aea))
* **reactivity:** fix ref mutation debugger event values ([b7ef38b](https://github.com/kangjiancheng/vue-next/commit/b7ef38b7731a16b6fa4391978132ee379a1bbdc2))
* **reactivity:** fix toRaw for objects prototype inherting reactive ([10bb34b](https://github.com/kangjiancheng/vue-next/commit/10bb34bb869a47c37d945f8c80abf723fac9fc1a)), closes [#1246](https://github.com/kangjiancheng/vue-next/issues/1246)
* **reactivity:** Map.set should trigger when adding new entry with undefined value ([#364](https://github.com/kangjiancheng/vue-next/issues/364)) ([246cad7](https://github.com/kangjiancheng/vue-next/commit/246cad74598f12f9466e9222730636bb41382ed6))
* **reactivity:** Map/Set identity methods should work even if raw value contains reactive entries ([cc69fd7](https://github.com/kangjiancheng/vue-next/commit/cc69fd72e3f9ef3572d2be40af71d22232e1b9af)), closes [#799](https://github.com/kangjiancheng/vue-next/issues/799)
* **reactivity:** readonly+reactive collection should also expose readonly+reactive values ([ed43810](https://github.com/kangjiancheng/vue-next/commit/ed4381020fcea0494f19f11bebabd9108f2dafd7)), closes [#1772](https://github.com/kangjiancheng/vue-next/issues/1772)
* **reactivity:** remove Symbol.observable ([#968](https://github.com/kangjiancheng/vue-next/issues/968)) ([4d014dc](https://github.com/kangjiancheng/vue-next/commit/4d014dc3d361c52ac6192c063100ad8655a6e397))
* **reactivity:** replaced ref in reactive object should be tracked ([#1058](https://github.com/kangjiancheng/vue-next/issues/1058)) ([80e1693](https://github.com/kangjiancheng/vue-next/commit/80e1693e1f525a6c5811689fbeaccdccae1e2c23))
* **reactivity:** revert to Reflect.get and add test cases ([d69d3bf](https://github.com/kangjiancheng/vue-next/commit/d69d3bf76540c83cf3a1d39ecf45efc3f82510a8))
* **reactivity:** scheduled effect should not execute if stopped ([0764c33](https://github.com/kangjiancheng/vue-next/commit/0764c33d3da8c06d472893a4e451e33394726a42)), closes [#910](https://github.com/kangjiancheng/vue-next/issues/910)
* **reactivity:** shallowReactive collection to not-readonly ([#1212](https://github.com/kangjiancheng/vue-next/issues/1212)) ([c97d1ba](https://github.com/kangjiancheng/vue-next/commit/c97d1bae56c3643304165d0e5b7924e5a0aad2df))
* **reactivity:** shallowReactive for collections ([#1204](https://github.com/kangjiancheng/vue-next/issues/1204)) ([488e2bc](https://github.com/kangjiancheng/vue-next/commit/488e2bcfef8dd69d15c224d94a433680db140ef9)), closes [#1202](https://github.com/kangjiancheng/vue-next/issues/1202)
* **reactivity:** should delete observe value ([#598](https://github.com/kangjiancheng/vue-next/issues/598)) ([63a6563](https://github.com/kangjiancheng/vue-next/commit/63a656310676e3927b2e57d813fd6300c0a42590)), closes [#597](https://github.com/kangjiancheng/vue-next/issues/597)
* **reactivity:** should not observe frozen objects ([1b2149d](https://github.com/kangjiancheng/vue-next/commit/1b2149dbb2dd224d01e90c1a9332bfe67aa465ce)), closes [#867](https://github.com/kangjiancheng/vue-next/issues/867)
* **reactivity:** should not trigger length dependency on Array delete ([a306658](https://github.com/kangjiancheng/vue-next/commit/a3066581f3014aae31f2d96b96428100f1674166)), closes [#774](https://github.com/kangjiancheng/vue-next/issues/774)
* **reactivity:** should not trigger map keys iteration when keys did not change ([45ba06a](https://github.com/kangjiancheng/vue-next/commit/45ba06ac5f49876b4f05e5996f595b2c4a761f47)), closes [#877](https://github.com/kangjiancheng/vue-next/issues/877)
* **reactivity:** should trigger all effects when array length is mutated ([#754](https://github.com/kangjiancheng/vue-next/issues/754)) ([5fac655](https://github.com/kangjiancheng/vue-next/commit/5fac65589b4455b98fd4e2f9eb3754f0acde97bb))
* **reactivity:** track reactive keys in raw collection types ([5dcc645](https://github.com/kangjiancheng/vue-next/commit/5dcc645fc068f9a467fa31ba2d3c2a59e68a9fd7)), closes [#919](https://github.com/kangjiancheng/vue-next/issues/919)
* **reactivity:** trigger iteration effect on Map.set ([e1c9153](https://github.com/kangjiancheng/vue-next/commit/e1c9153b9ed71f9b2e1ad4f9018c51d239e7dcd0)), closes [#709](https://github.com/kangjiancheng/vue-next/issues/709)
* **reactivity:** unwrap non-index accessed refs on reactive arrays ([#1859](https://github.com/kangjiancheng/vue-next/issues/1859)) ([3c05f8b](https://github.com/kangjiancheng/vue-next/commit/3c05f8bbd6cd0e01bbc5830730852f9a93d8de8a)), closes [#1846](https://github.com/kangjiancheng/vue-next/issues/1846)
* **reactivity:** use correct thisArg for collection method callbacks ([#1132](https://github.com/kangjiancheng/vue-next/issues/1132)) ([e08f6f0](https://github.com/kangjiancheng/vue-next/commit/e08f6f0ede03d09e71e44de5e524abd9789971d8))
* **reactivity:** use isExtensible instead of isFrozen ([#1753](https://github.com/kangjiancheng/vue-next/issues/1753)) ([2787c34](https://github.com/kangjiancheng/vue-next/commit/2787c34cd436e3ec4656b6986d9d14d57911a7b5)), closes [#1784](https://github.com/kangjiancheng/vue-next/issues/1784)
* **renderer:** should also use latest parent node when patching block child components ([9f52dce](https://github.com/kangjiancheng/vue-next/commit/9f52dce0d58f5bc09dded9291eadbb6b1af2dcbe))
* **renderSlot:** set slot render as a STABLE_FRAGMENT ([#776](https://github.com/kangjiancheng/vue-next/issues/776)) ([8cb0b83](https://github.com/kangjiancheng/vue-next/commit/8cb0b8308801159177ec16ab5a3e23672c4c1d00)), closes [#766](https://github.com/kangjiancheng/vue-next/issues/766)
* **runtime-core:** allow classes to be passed as plugins ([#588](https://github.com/kangjiancheng/vue-next/issues/588)) ([8f616a8](https://github.com/kangjiancheng/vue-next/commit/8f616a89c580bc211540d5e4d60488ff24d024cc))
* **runtime-core:** always check props presence in public instance proxy ([e0d19a6](https://github.com/kangjiancheng/vue-next/commit/e0d19a695316a8a459274874d304872fea384851)), closes [#1236](https://github.com/kangjiancheng/vue-next/issues/1236)
* **runtime-core:** always set invalid vnode type ([#820](https://github.com/kangjiancheng/vue-next/issues/820)) ([28a9bee](https://github.com/kangjiancheng/vue-next/commit/28a9beed1624de9812e0f4ce9b63f7f3ed2c6db8))
* **runtime-core:** avoid accidental access of Object.prototype properties ([f3e9c1b](https://github.com/kangjiancheng/vue-next/commit/f3e9c1b59d5d3999ac6180ed75c84d88b29c41e6))
* **runtime-core:** avoid infinite warning loop for isRef check on component public proxy ([6233608](https://github.com/kangjiancheng/vue-next/commit/62336085f497d42f0007bf9ad33f078d273605a6)), closes [#1091](https://github.com/kangjiancheng/vue-next/issues/1091)
* **runtime-core:** avoid manual slot invocation in template expressions interfering with block tracking ([791eff3](https://github.com/kangjiancheng/vue-next/commit/791eff3dfbd6be9ba8d597ecf8d943cd197f9807)), closes [#1745](https://github.com/kangjiancheng/vue-next/issues/1745)
* **runtime-core:** avoid scopeId as attr for slot nodes with same scopeId ([#1561](https://github.com/kangjiancheng/vue-next/issues/1561)) ([583a1c7](https://github.com/kangjiancheng/vue-next/commit/583a1c7b45e67e9cd57e411853c20509248def89)), closes [vitejs/vite#536](https://github.com/vitejs/vite/issues/536)
* **runtime-core:** check if the key is string on undefined property warning ([#1731](https://github.com/kangjiancheng/vue-next/issues/1731)) ([ce78eac](https://github.com/kangjiancheng/vue-next/commit/ce78eac8e9cfa75a1409ce09ce9f02d4899188d3))
* **runtime-core:** cloned vnodes with extra props should de-opt ([08bf7e3](https://github.com/kangjiancheng/vue-next/commit/08bf7e360783d520bae3fbe37143c52d360bd52d))
* **runtime-core:** cloneVNode should preserve correct ctx instance when normalizing ref ([be69bee](https://github.com/kangjiancheng/vue-next/commit/be69beed5ed05067006c297589598b33e7108b1b)), closes [#1311](https://github.com/kangjiancheng/vue-next/issues/1311)
* **runtime-core:** component root should inherit scopeId from vnode ([f3f94e4](https://github.com/kangjiancheng/vue-next/commit/f3f94e4deb40d3a0d83804454874833b194f83da)), closes [#1399](https://github.com/kangjiancheng/vue-next/issues/1399)
* **runtime-core:** condition for parent node check should be any different nodes ([c35fea3](https://github.com/kangjiancheng/vue-next/commit/c35fea3d608acbb571ace6693284061e1cadf7ba)), closes [#622](https://github.com/kangjiancheng/vue-next/issues/622)
* **runtime-core:** correctly track dynamic nodes in renderSlot ([#1911](https://github.com/kangjiancheng/vue-next/issues/1911)) ([7ffb79c](https://github.com/kangjiancheng/vue-next/commit/7ffb79c56318861075a47bd2357e34cde8a6dad9))
* **runtime-core:** default value for function type prop ([#1349](https://github.com/kangjiancheng/vue-next/issues/1349)) ([d437a01](https://github.com/kangjiancheng/vue-next/commit/d437a0145df5b63a959da873041816af68b440db)), closes [#1348](https://github.com/kangjiancheng/vue-next/issues/1348)
* **runtime-core:** dev root resolution should differentiate user comments vs v-if comments ([355c052](https://github.com/kangjiancheng/vue-next/commit/355c05262252b247ec29ed4c4fd6ab69143dd6b7)), closes [#1704](https://github.com/kangjiancheng/vue-next/issues/1704)
* **runtime-core:** disable block tracking when calling compiled slot function in tempalte expressions ([f02e2f9](https://github.com/kangjiancheng/vue-next/commit/f02e2f99d9c2ca95f4fd984d7bd62178eceaa214)), closes [#1745](https://github.com/kangjiancheng/vue-next/issues/1745) [#1918](https://github.com/kangjiancheng/vue-next/issues/1918)
* **runtime-core:** do not call transition enter hooks when mounting in suspense ([#1588](https://github.com/kangjiancheng/vue-next/issues/1588)) ([246ec5c](https://github.com/kangjiancheng/vue-next/commit/246ec5c594650f3fcccd0de94aa3f97b4d705e42)), closes [#1583](https://github.com/kangjiancheng/vue-next/issues/1583)
* **runtime-core:** do not use bail patchFlag on cloned vnodes ([6390ddf](https://github.com/kangjiancheng/vue-next/commit/6390ddfb7d0ed83ac4bae15d0497cba4de3e1972)), closes [#1665](https://github.com/kangjiancheng/vue-next/issues/1665)
* **runtime-core:** dynamic component should support falsy values without warning ([ded92f9](https://github.com/kangjiancheng/vue-next/commit/ded92f93b423cda28a40746c1f5fa9bcba56e80d))
* **runtime-core:** empty boolean props ([#844](https://github.com/kangjiancheng/vue-next/issues/844)) ([c7ae269](https://github.com/kangjiancheng/vue-next/commit/c7ae2699724bd5206ce7d2db73b86c1ef5947641)), closes [#843](https://github.com/kangjiancheng/vue-next/issues/843)
* **runtime-core:** ensure $forceUpdate behavior consistency with 2.x ([7431c2e](https://github.com/kangjiancheng/vue-next/commit/7431c2e46e4d5c94632a34a6ff44ef0dd4f4ef8b))
* **runtime-core:** ensure inhertied attrs update on optimized child root ([6810d14](https://github.com/kangjiancheng/vue-next/commit/6810d1402e214a12fa274ff5fb7475bad002d1b1)), closes [#677](https://github.com/kangjiancheng/vue-next/issues/677) [#784](https://github.com/kangjiancheng/vue-next/issues/784)
* **runtime-core:** ensure renderCache always exists ([8383e54](https://github.com/kangjiancheng/vue-next/commit/8383e5450e4f9679ac8a284f1c3960e3ee5b5211))
* **runtime-core:** fix attr fallthrough on compiled framgent w/ single static element + comments ([1af3531](https://github.com/kangjiancheng/vue-next/commit/1af35317195772ea8f2728abc8f5ac159a5b7b75))
* **runtime-core:** fix beforeUpdate call timing to allow state mutation ([1eb6067](https://github.com/kangjiancheng/vue-next/commit/1eb6067a8598730c67b3b3a4ac459d2723aa858c)), closes [#1899](https://github.com/kangjiancheng/vue-next/issues/1899)
* **runtime-core:** fix boolean props validation ([3b282e7](https://github.com/kangjiancheng/vue-next/commit/3b282e7e3c96786af0a5ff61822882d1ed3f4db3))
* **runtime-core:** fix component name inference in warnings ([e765d81](https://github.com/kangjiancheng/vue-next/commit/e765d814048c2cdc3cc32bdffb73c6e59b0d747d)), closes [#1418](https://github.com/kangjiancheng/vue-next/issues/1418)
* **runtime-core:** fix component proxy props presence check ([b3890a9](https://github.com/kangjiancheng/vue-next/commit/b3890a93e39342fd16e5fd72c59f361fc211309c)), closes [#864](https://github.com/kangjiancheng/vue-next/issues/864)
* **runtime-core:** fix dynamic node tracking in dynamic component that resolves to plain elements ([dcf2458](https://github.com/kangjiancheng/vue-next/commit/dcf2458fa84d7573273b0306aaabcf28ee859622)), closes [#1039](https://github.com/kangjiancheng/vue-next/issues/1039)
* **runtime-core:** fix error when passed plugin is undefined ([#502](https://github.com/kangjiancheng/vue-next/issues/502)) ([fbcc478](https://github.com/kangjiancheng/vue-next/commit/fbcc47841b6eafaa63bf9b5055c3a04ecb20bbf9))
* **runtime-core:** fix kebab-case props update ([7cbf684](https://github.com/kangjiancheng/vue-next/commit/7cbf68461118ced0c7c6eb79a395ae2b148e3737)), closes [#955](https://github.com/kangjiancheng/vue-next/issues/955)
* **runtime-core:** fix keep-alive tree-shaking ([5b43764](https://github.com/kangjiancheng/vue-next/commit/5b43764eacb59ff6ebba3195a55af4ac0cf253bb))
* **runtime-core:** fix key/ref resolution for cloneVNode ([d7379c7](https://github.com/kangjiancheng/vue-next/commit/d7379c7647e3222eddd18d7dad8d2520f59deb8a)), closes [#1041](https://github.com/kangjiancheng/vue-next/issues/1041)
* **runtime-core:** fix Object props validation for objects with custom toStringTag ([6ccd9ac](https://github.com/kangjiancheng/vue-next/commit/6ccd9ac2bc8ea09978fbb99c272bff6614387e90)), closes [#1872](https://github.com/kangjiancheng/vue-next/issues/1872)
* **runtime-core:** fix parent el update on nested HOC self-update ([#1360](https://github.com/kangjiancheng/vue-next/issues/1360)) ([6c8bfa1](https://github.com/kangjiancheng/vue-next/commit/6c8bfa10189d1a5a6837d2e25a9451889a0e19d6)), closes [#1357](https://github.com/kangjiancheng/vue-next/issues/1357)
* **runtime-core:** fix scheduler dedupe when not flushing ([4ef5c8d](https://github.com/kangjiancheng/vue-next/commit/4ef5c8d42408fd444114604292106c0027600fa4))
* **runtime-core:** fix scopeId inheritance for component inside slots ([978d952](https://github.com/kangjiancheng/vue-next/commit/978d9522e80cb19257ee2f4c8ba5da6f8aa6b3d2))
* **runtime-core:** fix ShapeFlags tree shaking ([0f67aa7](https://github.com/kangjiancheng/vue-next/commit/0f67aa7da50d6ffc543754a42f1e677af11f9173))
* **runtime-core:** fix slot fallback + slots typing ([4a5b91b](https://github.com/kangjiancheng/vue-next/commit/4a5b91bd1faec76bbaa0522b095f4a07ca88a9e5)), closes [#773](https://github.com/kangjiancheng/vue-next/issues/773)
* **runtime-core:** fix slot fragment bail check ([ac6a6f1](https://github.com/kangjiancheng/vue-next/commit/ac6a6f11ac3931c723c9aca8a351768ea2cacf38))
* **runtime-core:** fix user attched public instance properties that start with "$" ([d7ca1c5](https://github.com/kangjiancheng/vue-next/commit/d7ca1c5c6e75648793d670299c9059b6db9b1715))
* **runtime-core:** handle component updates with only class/style bindings ([35d91f4](https://github.com/kangjiancheng/vue-next/commit/35d91f4e18ccb72cbf39a86fe8f39060f0bf075e))
* **runtime-core:** handle dynamicChildren when portal is used as a block ([1722dc0](https://github.com/kangjiancheng/vue-next/commit/1722dc05c5840c3ac3cbc7e7c49612a0102dc4d0))
* **runtime-core:** handle patch flag de-op from cloned vnode ([0dd5cde](https://github.com/kangjiancheng/vue-next/commit/0dd5cde861735e80cfe21537380e52789cc865f8)), closes [#1426](https://github.com/kangjiancheng/vue-next/issues/1426)
* **runtime-core:** initialize renderCache if not present ([3116b5d](https://github.com/kangjiancheng/vue-next/commit/3116b5d6c3628c88a290c487bc0a21c63689c606))
* **runtime-core:** instance should not expose non-declared props ([2884831](https://github.com/kangjiancheng/vue-next/commit/2884831065e16ccf5bd3ae1ee95116803ee3b18c))
* **runtime-core:** isSVG check should also apply for patch branch ([035b656](https://github.com/kangjiancheng/vue-next/commit/035b6560f7eb64ce940ed0d06e19086ad9a3890f)), closes [#639](https://github.com/kangjiancheng/vue-next/issues/639)
* **runtime-core:** make watchEffect ignore deep option ([#765](https://github.com/kangjiancheng/vue-next/issues/765)) ([19a799c](https://github.com/kangjiancheng/vue-next/commit/19a799c28b149b14e85d9e2081fa65ed58d108ba))
* **runtime-core:** mixin options that rely on this context should be deferred ([ff4d1fc](https://github.com/kangjiancheng/vue-next/commit/ff4d1fcd81d96f3ddb0e34f04e70e3539dc7a96f)), closes [#1016](https://github.com/kangjiancheng/vue-next/issues/1016) [#1029](https://github.com/kangjiancheng/vue-next/issues/1029)
* **runtime-core:** mount children before setting element props ([8084156](https://github.com/kangjiancheng/vue-next/commit/8084156f4d0b572716a685a561d5087cddceab2c)), closes [#1318](https://github.com/kangjiancheng/vue-next/issues/1318) [#1320](https://github.com/kangjiancheng/vue-next/issues/1320)
* **runtime-core:** only infer component name for object components ([e422b8b](https://github.com/kangjiancheng/vue-next/commit/e422b8b082f1765f596c3ae0ff5b2e65d756405a)), closes [#1023](https://github.com/kangjiancheng/vue-next/issues/1023)
* **runtime-core:** pass instance proxy as data() argument ([#828](https://github.com/kangjiancheng/vue-next/issues/828)) ([d9dd1d8](https://github.com/kangjiancheng/vue-next/commit/d9dd1d8a0ac81d7d463e0788bb2e75b2d4866db6))
* **runtime-core:** pass options to plugins ([#561](https://github.com/kangjiancheng/vue-next/issues/561)) ([4d20981](https://github.com/kangjiancheng/vue-next/commit/4d20981eb069b20e1627916b977aedb2d68eca86))
* **runtime-core:** pass prev value to hostPatchProp ([#809](https://github.com/kangjiancheng/vue-next/issues/809)) ([cd34603](https://github.com/kangjiancheng/vue-next/commit/cd34603864142d5468486ec3f379679b22014a1b)), closes [#808](https://github.com/kangjiancheng/vue-next/issues/808)
* **runtime-core:** pass unmount into inital mount patch prop ([2bdb5c1](https://github.com/kangjiancheng/vue-next/commit/2bdb5c146449092623f06e20fb71ebaca7e5588f))
* **runtime-core:** properly capitalize v-on object keys ([#1358](https://github.com/kangjiancheng/vue-next/issues/1358)) ([250eb4a](https://github.com/kangjiancheng/vue-next/commit/250eb4a5bc121d303aa109c20251c95616049f05))
* **runtime-core:** render context set should not unwrap reactive values ([27fbfbd](https://github.com/kangjiancheng/vue-next/commit/27fbfbdb8beffc96134c931425f33178c23a72db))
* **runtime-core:** renderList with default value when source is undefined ([#498](https://github.com/kangjiancheng/vue-next/issues/498)) ([d4f4c7c](https://github.com/kangjiancheng/vue-next/commit/d4f4c7c4d48f64f093a0204e83097eaf01936d25))
* **runtime-core:** respect props from mixins and extends ([2417a0c](https://github.com/kangjiancheng/vue-next/commit/2417a0cb302ed72e145986f85422470713edf2d8)), closes [#1236](https://github.com/kangjiancheng/vue-next/issues/1236) [#1250](https://github.com/kangjiancheng/vue-next/issues/1250)
* **runtime-core:** respect render function from mixins ([354d79c](https://github.com/kangjiancheng/vue-next/commit/354d79c42bf152643b77d83520757818d913de4f)), closes [#1630](https://github.com/kangjiancheng/vue-next/issues/1630)
* **runtime-core:** rework vnode hooks handling ([cfadb98](https://github.com/kangjiancheng/vue-next/commit/cfadb98011e188114bb822ee6f678cd09ddac7e3)), closes [#684](https://github.com/kangjiancheng/vue-next/issues/684)
* **runtime-core:** scheduler should allow intentional self triggering effects ([c27dfe1](https://github.com/kangjiancheng/vue-next/commit/c27dfe1d0994c65de601760d082cf4668dc3fad0)), closes [#1727](https://github.com/kangjiancheng/vue-next/issues/1727)
* **runtime-core:** separate null vs. non-null ref value updates ([#1835](https://github.com/kangjiancheng/vue-next/issues/1835)) ([3991ff0](https://github.com/kangjiancheng/vue-next/commit/3991ff03ceea89bbc149e864f754196d20c81f90)), closes [#1789](https://github.com/kangjiancheng/vue-next/issues/1789) [#1834](https://github.com/kangjiancheng/vue-next/issues/1834)
* **runtime-core:** set appContext.provides to Object.create(null) ([#781](https://github.com/kangjiancheng/vue-next/issues/781)) ([04f83fa](https://github.com/kangjiancheng/vue-next/commit/04f83fa6810e07915e98b94c954ff0c1859aaa49))
* **runtime-core:** set fragment root children should also update dynamicChildren ([#944](https://github.com/kangjiancheng/vue-next/issues/944)) ([a27e9ee](https://github.com/kangjiancheng/vue-next/commit/a27e9ee9aea3487ef3ef0c8a5df53227fc172886)), closes [#943](https://github.com/kangjiancheng/vue-next/issues/943)
* **runtime-core:** should allow empty string and 0 as valid vnode key ([#807](https://github.com/kangjiancheng/vue-next/issues/807)) ([54a0e93](https://github.com/kangjiancheng/vue-next/commit/54a0e93c276f95a35b3bd6510a7f52d967fd3b7f))
* **runtime-core:** should allow v-model listeners to fallthrough, but ignore for warning ([903e8f6](https://github.com/kangjiancheng/vue-next/commit/903e8f697e4377e0ae92e1a6b58777438fba3610)), closes [#1543](https://github.com/kangjiancheng/vue-next/issues/1543)
* **runtime-core:** should call Suspense fallback unmount hook ([#1061](https://github.com/kangjiancheng/vue-next/issues/1061)) ([8b85aae](https://github.com/kangjiancheng/vue-next/commit/8b85aaeea9b2ed343e2ae19958abbd9e5d223a77)), closes [#1059](https://github.com/kangjiancheng/vue-next/issues/1059)
* **runtime-core:** should catch dom prop set TypeErrors ([98bee59](https://github.com/kangjiancheng/vue-next/commit/98bee596bddc8131cccfde4a11fa2e5cd9bf39e4)), closes [#1051](https://github.com/kangjiancheng/vue-next/issues/1051)
* **runtime-core:** should correctly call `beforeEnter` inside `Suspense` ([#1805](https://github.com/kangjiancheng/vue-next/issues/1805)) ([bc6f252](https://github.com/kangjiancheng/vue-next/commit/bc6f252c4abc72bee29aa4766fc6c5ed0a81d7cd)), closes [#1795](https://github.com/kangjiancheng/vue-next/issues/1795)
* **runtime-core:** should not cast prop value if prop did not change ([171cfa4](https://github.com/kangjiancheng/vue-next/commit/171cfa404f33a451376dcb84d66ddae012c343ec)), closes [#999](https://github.com/kangjiancheng/vue-next/issues/999)
* **runtime-core:** should not return early on text patchFlag ([778f3a5](https://github.com/kangjiancheng/vue-next/commit/778f3a5e886a1a1136bc8b00b849370d7c4041be))
* **runtime-core:** should not take unmount children fast path for v-for fragments ([5b8883a](https://github.com/kangjiancheng/vue-next/commit/5b8883a84689dd04dbbcd677bf177ffeda43489d)), closes [#1153](https://github.com/kangjiancheng/vue-next/issues/1153)
* **runtime-core:** should not warn unused attrs when accessed via setup context ([751d838](https://github.com/kangjiancheng/vue-next/commit/751d838fb963e580a40df2d84840ba2198480185)), closes [#625](https://github.com/kangjiancheng/vue-next/issues/625)
* **runtime-core:** should pass instance to patchProp on mount for event error handling ([#1337](https://github.com/kangjiancheng/vue-next/issues/1337)) ([aac9b03](https://github.com/kangjiancheng/vue-next/commit/aac9b03c11c9be0c67b924004364a42d04d78195)), closes [#1336](https://github.com/kangjiancheng/vue-next/issues/1336)
* **runtime-core:** should preserve props casing when component has no declared props ([bb6a346](https://github.com/kangjiancheng/vue-next/commit/bb6a346996ce0bf05596c605ba5ddbe0743ef84b)), closes [#583](https://github.com/kangjiancheng/vue-next/issues/583)
* **runtime-core:** should remove no longer present camelCase props ([#1413](https://github.com/kangjiancheng/vue-next/issues/1413)) ([1c4e1b6](https://github.com/kangjiancheng/vue-next/commit/1c4e1b679261ad151c4ed04b11279a3768a1c9e2)), closes [#1412](https://github.com/kangjiancheng/vue-next/issues/1412)
* **runtime-core:** should resolve value instead of delete for dynamic props with options ([c80b857](https://github.com/kangjiancheng/vue-next/commit/c80b857eb5b19f48f498147479a779af9953be32))
* **runtime-core:** support attr merging on child with root level comments ([e42cb54](https://github.com/kangjiancheng/vue-next/commit/e42cb543947d4286115b6adae6e8a5741d909f14)), closes [#904](https://github.com/kangjiancheng/vue-next/issues/904)
* **runtime-core:** support object syntax for class ([#215](https://github.com/kangjiancheng/vue-next/issues/215)) ([e32da91](https://github.com/kangjiancheng/vue-next/commit/e32da9169bcad1b811d27695e368a8d996d9cf4a))
* **runtime-core:** track access to $attrs ([6abac87](https://github.com/kangjiancheng/vue-next/commit/6abac87b3d1b7a22df80b7a70a10101a7f3d3732)), closes [#1346](https://github.com/kangjiancheng/vue-next/issues/1346)
* **runtime-core:** use array destructuring instead of object for edge compat ([#1302](https://github.com/kangjiancheng/vue-next/issues/1302)) ([4a5021e](https://github.com/kangjiancheng/vue-next/commit/4a5021e763b7f49069e1f3d488bdddf910f09f3f)), closes [#1294](https://github.com/kangjiancheng/vue-next/issues/1294)
* **runtime-core:** use correct container for moving `Teleport` content ([#1703](https://github.com/kangjiancheng/vue-next/issues/1703)) ([04a4eba](https://github.com/kangjiancheng/vue-next/commit/04a4ebaaeb4418d211293fc7b92c19c42a425cbd))
* **runtime-core:** use correct parentNode when patching dynamicChildren (close [#98](https://github.com/kangjiancheng/vue-next/issues/98)) ([46d875f](https://github.com/kangjiancheng/vue-next/commit/46d875f4e8dfe8766d540272584ade23e6f1a273))
* **runtime-core/emits:** merge emits options from mixins/extends ([ba3b3cd](https://github.com/kangjiancheng/vue-next/commit/ba3b3cdda98f6efb5d4c4fafc579b8f568a19bde)), closes [#1562](https://github.com/kangjiancheng/vue-next/issues/1562)
* **runtime-core/hmr:** only use cloneNode mount optimization in prod ([4655d69](https://github.com/kangjiancheng/vue-next/commit/4655d699831b3356bb8be5b41c45da830dac9eb2)), closes [#1626](https://github.com/kangjiancheng/vue-next/issues/1626)
* **runtime-core/renderer:** fix v-if toggle inside blocks ([2e9726e](https://github.com/kangjiancheng/vue-next/commit/2e9726e6a219d546cd28e4ed42be64719708f047)), closes [#604](https://github.com/kangjiancheng/vue-next/issues/604) [#607](https://github.com/kangjiancheng/vue-next/issues/607)
* **runtime-core/scheduler:** allow component render functions to trigger itself ([611437a](https://github.com/kangjiancheng/vue-next/commit/611437a3fe5e50a5a6f79e2f8a0ed59e74539626)), closes [#1801](https://github.com/kangjiancheng/vue-next/issues/1801)
* **runtime-core/scheduler:** avoid duplicate updates of child component ([8a87074](https://github.com/kangjiancheng/vue-next/commit/8a87074df013fdbb0e88f34074c2605e4af2937c))
* **runtime-core/scheduler:** invalidate job ([#717](https://github.com/kangjiancheng/vue-next/issues/717)) ([fe9da2d](https://github.com/kangjiancheng/vue-next/commit/fe9da2d0e4f9b338252b1b62941ee9ead71f0346))
* **runtime-core/scheduler:** only allow watch callbacks to be self-triggering ([09702e9](https://github.com/kangjiancheng/vue-next/commit/09702e95b9a3f68fc1952ef74555dffa92d50032)), closes [#1740](https://github.com/kangjiancheng/vue-next/issues/1740) [#1727](https://github.com/kangjiancheng/vue-next/issues/1727)
* **runtime-core/scheduler:** prevent duplicate queue ([#1767](https://github.com/kangjiancheng/vue-next/issues/1767)) ([b2a9142](https://github.com/kangjiancheng/vue-next/commit/b2a91429ede9ea49e4808de2748da19deeb7f335))
* **runtime-core/scheduler:** sort postFlushCbs to ensure refs are set before lifecycle hooks ([#1854](https://github.com/kangjiancheng/vue-next/issues/1854)) ([caccec3](https://github.com/kangjiancheng/vue-next/commit/caccec3f78414ae294f1a813ffd16791d56da3a6)), closes [#1852](https://github.com/kangjiancheng/vue-next/issues/1852)
* **runtime-core/template-ref:** template ref used in the same template should trigger update ([36b6b4f](https://github.com/kangjiancheng/vue-next/commit/36b6b4f0228c4adf679c232bf4d1e8cff7fb6474)), closes [#1505](https://github.com/kangjiancheng/vue-next/issues/1505)
* **runtime-core/vnode:** should not render boolean values in vnode children (close [#574](https://github.com/kangjiancheng/vue-next/issues/574)) ([84dc5a6](https://github.com/kangjiancheng/vue-next/commit/84dc5a686275528733977ea1570e0a892ba3e177))
* **runtime-core/watch:** trigger watcher with undefined as initial value ([#687](https://github.com/kangjiancheng/vue-next/issues/687)) ([5742a0b](https://github.com/kangjiancheng/vue-next/commit/5742a0b826fe77d2310acb530667adb758822f66)), closes [#683](https://github.com/kangjiancheng/vue-next/issues/683)
* **runtime-dom:** allow force updating value bindings for controlled inputs ([b3536d8](https://github.com/kangjiancheng/vue-next/commit/b3536d87a587dc1e78c8712cb29ca61ca0931ac9)), closes [#1471](https://github.com/kangjiancheng/vue-next/issues/1471)
* **runtime-dom:** cast  to true for boolean props ([59e18e5](https://github.com/kangjiancheng/vue-next/commit/59e18e54781564417e22a97d2eab5520e5661a5c))
* **runtime-dom:** compatibility for cases where event.timeStamp is 0 ([#1328](https://github.com/kangjiancheng/vue-next/issues/1328)) ([90c3532](https://github.com/kangjiancheng/vue-next/commit/90c35329468e1fbb5cd2c1df2e4efd5b12b4fd41)), closes [#1325](https://github.com/kangjiancheng/vue-next/issues/1325)
* **runtime-dom:** event handlers with modifiers should get all event arguments ([#1193](https://github.com/kangjiancheng/vue-next/issues/1193)) ([ab86b19](https://github.com/kangjiancheng/vue-next/commit/ab86b190ce540336a01f936baa836f1aefd90e85))
* **runtime-dom:** fix getModelAssigner order in vModelCheckbox ([#926](https://github.com/kangjiancheng/vue-next/issues/926)) ([da1fb7a](https://github.com/kangjiancheng/vue-next/commit/da1fb7afef75470826501fe6e9d81e5af296fea7))
* **runtime-dom:** fix patching for attributes starting with `on` ([6eb3399](https://github.com/kangjiancheng/vue-next/commit/6eb339931185a57cc36ddb6e12314a5283948169)), closes [#949](https://github.com/kangjiancheng/vue-next/issues/949)
* **runtime-dom:** fix v-on same computed handler on multiple elements ([1c967fc](https://github.com/kangjiancheng/vue-next/commit/1c967fc44b971686d5a0e2811deb2362ec84979f)), closes [#1747](https://github.com/kangjiancheng/vue-next/issues/1747)
* **runtime-dom:** invalid lineGradient svg tag ([#863](https://github.com/kangjiancheng/vue-next/issues/863)) ([d425818](https://github.com/kangjiancheng/vue-next/commit/d425818901428ff919a0179fc910410cbcfa119b)), closes [#862](https://github.com/kangjiancheng/vue-next/issues/862)
* **runtime-dom:** patch `form` as an attribute ([#1788](https://github.com/kangjiancheng/vue-next/issues/1788)) ([00683fc](https://github.com/kangjiancheng/vue-next/commit/00683fce9a1c6856be23b35ff0226d8ac5c96791)), closes [#1787](https://github.com/kangjiancheng/vue-next/issues/1787)
* **runtime-dom:** patch xlink attribute ([#842](https://github.com/kangjiancheng/vue-next/issues/842)) ([d318576](https://github.com/kangjiancheng/vue-next/commit/d318576d74f8756e471942ff44d2af2a4661d775))
* **runtime-dom:** remove attrs with nullish values ([cb6a091](https://github.com/kangjiancheng/vue-next/commit/cb6a0915c540af94f5d79c311022b99bc17f2965)), closes [#1576](https://github.com/kangjiancheng/vue-next/issues/1576)
* **runtime-dom:** should not access document in non-browser env ([48152bc](https://github.com/kangjiancheng/vue-next/commit/48152bc88ea817ae23e2987dce99d64b426366c1)), closes [#657](https://github.com/kangjiancheng/vue-next/issues/657)
* **runtime-dom:** should not coerce nullish values to empty strings for non-string dom props ([20bc7ba](https://github.com/kangjiancheng/vue-next/commit/20bc7ba1c55b43143a4cef98cadaad8d693f9275)), closes [#1049](https://github.com/kangjiancheng/vue-next/issues/1049) [#1092](https://github.com/kangjiancheng/vue-next/issues/1092) [#1093](https://github.com/kangjiancheng/vue-next/issues/1093) [#1094](https://github.com/kangjiancheng/vue-next/issues/1094)
* **runtime-dom:** should patch svg innerHtml ([#956](https://github.com/kangjiancheng/vue-next/issues/956)) ([27b5c71](https://github.com/kangjiancheng/vue-next/commit/27b5c71944637bc04d715382851cc63ca7efc47a))
* **runtime-dom:** should set `<input list="...">` as attribute ([441c236](https://github.com/kangjiancheng/vue-next/commit/441c23602f57d00b00fa3a590b30487003efe210)), closes [#1526](https://github.com/kangjiancheng/vue-next/issues/1526)
* **runtime-dom:** style binding multi value support ([0cd98c3](https://github.com/kangjiancheng/vue-next/commit/0cd98c3040a64df4577d188b9f2221224549a132)), closes [#1759](https://github.com/kangjiancheng/vue-next/issues/1759)
* **runtime-dom:** support native onxxx handlers ([2302dea](https://github.com/kangjiancheng/vue-next/commit/2302dea1624d4b964fed71e30089426212091c11)), closes [#927](https://github.com/kangjiancheng/vue-next/issues/927)
* **runtime-dom:** unref when setting useCssVars ([44e6da1](https://github.com/kangjiancheng/vue-next/commit/44e6da1402fa2b6f5a0a0c692cd693a8ff1a40a3))
* **runtime-dom:** v-cloak should be removed after compile on the root element ([#893](https://github.com/kangjiancheng/vue-next/issues/893)) ([0ed147d](https://github.com/kangjiancheng/vue-next/commit/0ed147d33610b86af72cbadcc4b32e6069bcaf08)), closes [#890](https://github.com/kangjiancheng/vue-next/issues/890)
* **runtime-dom/events:** fix wrong scope for event value ([#117](https://github.com/kangjiancheng/vue-next/issues/117)) ([6d5c12b](https://github.com/kangjiancheng/vue-next/commit/6d5c12b63a2e920fae0f49ba2f056ac1c157087e))
* **runtime-dom/ssr:** properly handle xlink and boolean attributes ([e6e2c58](https://github.com/kangjiancheng/vue-next/commit/e6e2c58234cab46fa530c383c0f7ae1cb3494da3))
* **runtime-dom/style:** fix patchStyle on falsy next value ([#1504](https://github.com/kangjiancheng/vue-next/issues/1504)) ([77538ec](https://github.com/kangjiancheng/vue-next/commit/77538ec6d90fee66d229d6d3a4f977c6b548a9bd)), closes [#1506](https://github.com/kangjiancheng/vue-next/issues/1506)
* **runtime-dom/style:** normalize string when merging styles ([#1127](https://github.com/kangjiancheng/vue-next/issues/1127)) ([2d9f136](https://github.com/kangjiancheng/vue-next/commit/2d9f1360778154a232473fcf93f6164a6bd80ca5))
* **runtime-dom/v-on:** only block event handlers based on attach timestamp ([8b320cc](https://github.com/kangjiancheng/vue-next/commit/8b320cc12f74aafea9ec69f7ce70231d4f0d08fd)), closes [#1565](https://github.com/kangjiancheng/vue-next/issues/1565)
* **runtime-dom/v-on:** support event.stopImmediatePropagation on multiple listeners ([d45e475](https://github.com/kangjiancheng/vue-next/commit/d45e47569d366b932c0e3461afc6478b45a4602d)), closes [#916](https://github.com/kangjiancheng/vue-next/issues/916)
* **runtime-test:** output empty attrs without value in seralized output ([3d16c0e](https://github.com/kangjiancheng/vue-next/commit/3d16c0ea5af6f08e3e3913d6d35fba6dbd84de1d))
* **runtome-core:** do not cache property access in beforeCreate hook ([f6afe70](https://github.com/kangjiancheng/vue-next/commit/f6afe7000efb964355c439b7963087ab8e42d6b1)), closes [#1756](https://github.com/kangjiancheng/vue-next/issues/1756)
* **runtome-dom:** properly support creating customized built-in element ([b1d0b04](https://github.com/kangjiancheng/vue-next/commit/b1d0b046afb1e8f4640d8d80b6eeaf9f89e892f7))
* **scheduler:** handle queueJob inside postFlushCbs ([ebf67ad](https://github.com/kangjiancheng/vue-next/commit/ebf67ad2087c3efbfeb64fba62350aad6c96189d))
* **scheduler:** sort jobs before flushing ([78977c3](https://github.com/kangjiancheng/vue-next/commit/78977c399734da7c4f8d58f2ccd650533e89249f)), closes [#910](https://github.com/kangjiancheng/vue-next/issues/910) [/github.com/vuejs/vue-next/issues/910#issuecomment-613097539](https://github.com//github.com/vuejs/vue-next/issues/910/issues/issuecomment-613097539)
* **scheduler:** warn recursive updates in postFlushCbs as well ([#456](https://github.com/kangjiancheng/vue-next/issues/456)) ([aa6c67e](https://github.com/kangjiancheng/vue-next/commit/aa6c67ee2e053503c36c0ed80b794dd5e5e00e95))
* **sfc:** fix v-slotted attribute injection ([362831d](https://github.com/kangjiancheng/vue-next/commit/362831d8abfda56107c31d0236b7cbd264ff7526))
* **sfc:** inherit parent scopeId on child rooot ([#756](https://github.com/kangjiancheng/vue-next/issues/756)) ([9547c2b](https://github.com/kangjiancheng/vue-next/commit/9547c2b93d6d8f469314cfe055960746a3e3acbe))
* **sfc:** treat custom block content as raw text ([d6275a3](https://github.com/kangjiancheng/vue-next/commit/d6275a3c310e6e9426f897afe35ff6cdb125c023))
* **slots:** compiled slot fallback should be functions ([#1030](https://github.com/kangjiancheng/vue-next/issues/1030)) ([2b19965](https://github.com/kangjiancheng/vue-next/commit/2b19965bcf75d981400ed58a0348bcfc13f17e33)), closes [#1021](https://github.com/kangjiancheng/vue-next/issues/1021)
* **slots:** differentiate dynamic/static compiled slots ([65beba9](https://github.com/kangjiancheng/vue-next/commit/65beba98fe5793133d3218945218b9e3f8d136eb)), closes [#1557](https://github.com/kangjiancheng/vue-next/issues/1557)
* **slots:** filter out compiler marker from resolved slots ([70ea76a](https://github.com/kangjiancheng/vue-next/commit/70ea76ae0c16a55154e785f8ca42ed13e0d15170)), closes [#1451](https://github.com/kangjiancheng/vue-next/issues/1451)
* **slots:** fix conditional slot ([3357ff4](https://github.com/kangjiancheng/vue-next/commit/3357ff438c6ff0d4fea67923724dd3cb99ff2756)), closes [#787](https://github.com/kangjiancheng/vue-next/issues/787)
* **slots:** make compiled slot marker non-enumerable ([062835d](https://github.com/kangjiancheng/vue-next/commit/062835d45aaf4168ddf2e39a5c7e162b3a18ccae)), closes [#1470](https://github.com/kangjiancheng/vue-next/issues/1470)
* **slots:** properly force update on forwarded slots ([aab99ab](https://github.com/kangjiancheng/vue-next/commit/aab99abd28a5d17f2d1966678b0d334975d21877)), closes [#1594](https://github.com/kangjiancheng/vue-next/issues/1594)
* **slots:** should update compiled dynamic slots ([8444078](https://github.com/kangjiancheng/vue-next/commit/84440780f9e45aa5b060180078b769f27757c7bd))
* **ssr:** avoid hard-coded ssr checks in cjs builds ([bc07e95](https://github.com/kangjiancheng/vue-next/commit/bc07e95ca84686bfa43798a444a3220581b183d8))
* **ssr:** fix class/style rendering + ssrRenderComponent export name ([688ad92](https://github.com/kangjiancheng/vue-next/commit/688ad9239105625f7b63ac43181dfb2e9d1d4720))
* **ssr:** fix escape and handling for raw Text, Comment and Static vnodes ([5b09e74](https://github.com/kangjiancheng/vue-next/commit/5b09e743a01a4dbc73b98ecf130a3a5f95ce41fe))
* **ssr:** fix ssr on-the-fly compilation + slot fallback branch helper injection ([3be3785](https://github.com/kangjiancheng/vue-next/commit/3be3785f945253918469da456a14a2d9381bcbd0))
* **ssr:** fix ssr scopeId on component root ([afe13e0](https://github.com/kangjiancheng/vue-next/commit/afe13e0584afb70a2682763dda148c35f9a97f95))
* **ssr:** fix unintended error on `Teleport` hydration mismatch ([#1271](https://github.com/kangjiancheng/vue-next/issues/1271)) ([c463a71](https://github.com/kangjiancheng/vue-next/commit/c463a71bb31f01da55927424533e2ece3a3c4efe)), closes [#1235](https://github.com/kangjiancheng/vue-next/issues/1235)
* **ssr:** handle fallthrough attrs in ssr compile output ([d5dbd27](https://github.com/kangjiancheng/vue-next/commit/d5dbd27193eee5fe401d3b85b6c5ddef5cd42b9d))
* **ssr:** render components returning render function from setup ([#720](https://github.com/kangjiancheng/vue-next/issues/720)) ([4669215](https://github.com/kangjiancheng/vue-next/commit/4669215ca2f82d90a1bd730613259f3167e199cd))
* **ssr:** should set ref on hydration ([0a7932c](https://github.com/kangjiancheng/vue-next/commit/0a7932c6b3e6b6fdda27fa7161726a615a598355))
* **ssr:** support dynamic components that resolve to element or vnode ([41db49d](https://github.com/kangjiancheng/vue-next/commit/41db49dfb7c520c4f743e522a03f06b33259a2eb)), closes [#1508](https://github.com/kangjiancheng/vue-next/issues/1508)
* **style-vars:** fix css vars on component with suspense as root ([#1718](https://github.com/kangjiancheng/vue-next/issues/1718)) ([07ece2e](https://github.com/kangjiancheng/vue-next/commit/07ece2e9260fe30a50e7cf317d2ff69f113ecad1))
* **suspense:** clear effects on suspense resolve ([ebc1ca8](https://github.com/kangjiancheng/vue-next/commit/ebc1ca8eff82789987c09a9f6a934898b00153ff))
* **teleport:** always inherit root DOM nodes on patch ([#1836](https://github.com/kangjiancheng/vue-next/issues/1836)) ([517c2b8](https://github.com/kangjiancheng/vue-next/commit/517c2b8bdb9ffa53717c10d604ff6db84d50d4f2)), closes [#1813](https://github.com/kangjiancheng/vue-next/issues/1813)
* **teleport:** only inherit el for non-patched nodes ([d4cc7b2](https://github.com/kangjiancheng/vue-next/commit/d4cc7b2496f9ed21ef6cac426697eac058da76bb)), closes [#1903](https://github.com/kangjiancheng/vue-next/issues/1903)
* **teleport:** teleport should always be tracked as dynamic child for unmount ([7f23555](https://github.com/kangjiancheng/vue-next/commit/7f2355535613f1f5f5902cc7ca235fca8ee5493c)), closes [#1088](https://github.com/kangjiancheng/vue-next/issues/1088)
* **template-explorer:** rename watch -> watchEffect ([#780](https://github.com/kangjiancheng/vue-next/issues/780)) ([59393dd](https://github.com/kangjiancheng/vue-next/commit/59393dd75766720330cb69e22086c97a392dbbe4))
* **template-ref:** fix string template refs inside slots ([3eab143](https://github.com/kangjiancheng/vue-next/commit/3eab1438432a3bab15ccf2f6092fc3e4355f3cdd))
* **test-renderer:** indent on multiple children ([3fe047b](https://github.com/kangjiancheng/vue-next/commit/3fe047b4accfcd013d4954484be61a94918e9456))
* **transform:** transform should still apply even when node is removed ([9c01e0b](https://github.com/kangjiancheng/vue-next/commit/9c01e0bf0d2aa5b06685ae1c40d393a680f6c8f3))
* **transition:** enter/leave hook timing consistency with v2 ([bf84ac8](https://github.com/kangjiancheng/vue-next/commit/bf84ac8396666194cd386b8a66040b19131983e0)), closes [#1145](https://github.com/kangjiancheng/vue-next/issues/1145)
* **transition:** fix appear hooks handling ([7ae70ea](https://github.com/kangjiancheng/vue-next/commit/7ae70ea44cf66be134c6ec3b060d9872fa0774e0))
* **transition:** fix css:false with hooks with no explicit done callback ([9edbc27](https://github.com/kangjiancheng/vue-next/commit/9edbc27f45aafaa6bc27ab244dc77d4d86d09fc4)), closes [#1149](https://github.com/kangjiancheng/vue-next/issues/1149)
* **transition:** fix dom transition cancel hooks not being called ([acd3156](https://github.com/kangjiancheng/vue-next/commit/acd3156d2c45609ab04cb54734258fe340c4ca02))
* **transition:** fix duration prop validation ([0dc2478](https://github.com/kangjiancheng/vue-next/commit/0dc24785699101fa24d2a68786feaaac8a887520)), closes [#868](https://github.com/kangjiancheng/vue-next/issues/868)
* **transition:** fix dynamic transition update on nested HOCs ([b8da8b2](https://github.com/kangjiancheng/vue-next/commit/b8da8b2dfac96558df1d038aac3bbe63bd42a8ce))
* **transition:** handle errors in CSSTransition onEnter & onLeave ([55b7bf9](https://github.com/kangjiancheng/vue-next/commit/55b7bf991d5315187769a7a34e2866a7585fedbd))
* **transition:** handle multiple transition classes ([#638](https://github.com/kangjiancheng/vue-next/issues/638)) ([#645](https://github.com/kangjiancheng/vue-next/issues/645)) ([98d50d8](https://github.com/kangjiancheng/vue-next/commit/98d50d874dcb32a246216b936e442e5b95ab4825))
* **transition:** should call transition hooks inside already resolved suspense ([#1698](https://github.com/kangjiancheng/vue-next/issues/1698)) ([2a633c8](https://github.com/kangjiancheng/vue-next/commit/2a633c84ff0e522a7562d3194a8f4e4012eb8281)), closes [#1689](https://github.com/kangjiancheng/vue-next/issues/1689)
* **transition:** should reset enter class after appear ([#1152](https://github.com/kangjiancheng/vue-next/issues/1152)) ([697de07](https://github.com/kangjiancheng/vue-next/commit/697de07e630c502db42e93e64ba556cc4599cbe4))
* **transition:** should ship props declarations in production ([4227831](https://github.com/kangjiancheng/vue-next/commit/42278317e15a202e4e1c8f7084eafa7bb13f1ade))
* **transition:** transition should accept multiple handlers on same event ([48576e5](https://github.com/kangjiancheng/vue-next/commit/48576e582c4177572c2fd1764fbca53a6a30abe2)), closes [#1746](https://github.com/kangjiancheng/vue-next/issues/1746)
* **transition:** warn only when there is more than one rendered child ([#903](https://github.com/kangjiancheng/vue-next/issues/903)) ([37b1dc8](https://github.com/kangjiancheng/vue-next/commit/37b1dc8242608b072d14fd2a5e52f5d40829ea52))
* **Transition:** fix validate duration ([#1188](https://github.com/kangjiancheng/vue-next/issues/1188)) ([d73a508](https://github.com/kangjiancheng/vue-next/commit/d73a508a73c03d64cea0c376e25f4f0272728a18))
* **transition-group:** handle multiple move-classes ([#679](https://github.com/kangjiancheng/vue-next/issues/679)) ([5495c70](https://github.com/kangjiancheng/vue-next/commit/5495c70c4a3f740ef4ac575ffee5466ca747cca1)), closes [#678](https://github.com/kangjiancheng/vue-next/issues/678)
* **transition-group:** should collect raw children with Fragment ([#1046](https://github.com/kangjiancheng/vue-next/issues/1046)) ([8ed3455](https://github.com/kangjiancheng/vue-next/commit/8ed3455251d721e62fd7f6f75a7ef04bc411c152)), closes [#1045](https://github.com/kangjiancheng/vue-next/issues/1045)
* **transition-group:** vue 2 compatible handling of transition-group w/ multiple v-for children ([86d3972](https://github.com/kangjiancheng/vue-next/commit/86d3972855990c23f583a4b11b3c86fe04f1ab90)), closes [#1126](https://github.com/kangjiancheng/vue-next/issues/1126)
* **transitionGroup:** fix transition children resolving condition ([f05aeea](https://github.com/kangjiancheng/vue-next/commit/f05aeea7aec2e6cd859f40edc6236afd0ce2ea7d))
* **transitionGroup:** inner children should skip comment node ([#1105](https://github.com/kangjiancheng/vue-next/issues/1105)) ([26a50ce](https://github.com/kangjiancheng/vue-next/commit/26a50ce67f64439cfc242fba59b1e7129e59ba40))
* **TransitionGroup:** ignore comment node when warn (fix[#869](https://github.com/kangjiancheng/vue-next/issues/869)) ([#875](https://github.com/kangjiancheng/vue-next/issues/875)) ([0dba5d4](https://github.com/kangjiancheng/vue-next/commit/0dba5d44e60d33b909f4e4d05663c7ddf746a1f2))
* **types:** accept generic Component type in h() ([c1d5928](https://github.com/kangjiancheng/vue-next/commit/c1d5928f3b240a4a69bcd8d88494e4fe8d2e625b)), closes [#922](https://github.com/kangjiancheng/vue-next/issues/922)
* **types:** add RawSlots in h signature ([#1293](https://github.com/kangjiancheng/vue-next/issues/1293)) ([cab769f](https://github.com/kangjiancheng/vue-next/commit/cab769f174f4c0bcad59454e4a77039830e796f8))
* **types:** allow use PropType with Function ([#915](https://github.com/kangjiancheng/vue-next/issues/915)) ([026eb72](https://github.com/kangjiancheng/vue-next/commit/026eb729f3d1566e95f2f4253d76c20e86d1ec9b)), closes [#748](https://github.com/kangjiancheng/vue-next/issues/748)
* **types:** app.component should accept defineComponent return type ([57ee5df](https://github.com/kangjiancheng/vue-next/commit/57ee5df364f03816e548f4f3bf05edc7a089c362)), closes [#730](https://github.com/kangjiancheng/vue-next/issues/730)
* **types:** app.component should accept defineComponent return type ([#822](https://github.com/kangjiancheng/vue-next/issues/822)) ([1e9d131](https://github.com/kangjiancheng/vue-next/commit/1e9d1319c3f66a0a7430a4f6ac7b508486894b6b)), closes [#730](https://github.com/kangjiancheng/vue-next/issues/730)
* **types:** augment ref unwrap bail types in appropriate packages ([b40fcbc](https://github.com/kangjiancheng/vue-next/commit/b40fcbc4c66125bf6b390e208b61635a9e2c003f))
* **types:** components options should accept components defined with defineComponent ([#602](https://github.com/kangjiancheng/vue-next/issues/602)) ([74baea1](https://github.com/kangjiancheng/vue-next/commit/74baea108aa93377c4959f9a6b8bc8f9548700ba))
* **types:** ensure correct oldValue typing based on lazy option ([c6a9787](https://github.com/kangjiancheng/vue-next/commit/c6a9787941ca99877d268182a5bb57fcf8b80b75)), closes [#719](https://github.com/kangjiancheng/vue-next/issues/719)
* **types:** ensure correct public props interface for defineComponent instance type ([2961e14](https://github.com/kangjiancheng/vue-next/commit/2961e149c9825d56680e982acd056d9f337afc5e)), closes [#1385](https://github.com/kangjiancheng/vue-next/issues/1385)
* **types:** export ComponentOptionsMixin ([#1361](https://github.com/kangjiancheng/vue-next/issues/1361)) ([68e2d6c](https://github.com/kangjiancheng/vue-next/commit/68e2d6c68a4e8a95d112597b82d40efb8571d9c0))
* **types:** export missing types from runtime-core ([#889](https://github.com/kangjiancheng/vue-next/issues/889)) ([412ec86](https://github.com/kangjiancheng/vue-next/commit/412ec86128fa33fa41ce435c493fd8275a785fea))
* **types:** fix ref(false) type to Ref<boolean> ([#1028](https://github.com/kangjiancheng/vue-next/issues/1028)) ([0bdd889](https://github.com/kangjiancheng/vue-next/commit/0bdd8891569eb15e492007b3eb0f45d598e85b3f))
* **types:** fix VNodeTypes unique symbols ([#387](https://github.com/kangjiancheng/vue-next/issues/387)) ([134e932](https://github.com/kangjiancheng/vue-next/commit/134e932322be48ab4be9f42435a326305120f14d))
* **types:** handling PropType<Function> with default value ([#1896](https://github.com/kangjiancheng/vue-next/issues/1896)) ([c2913d5](https://github.com/kangjiancheng/vue-next/commit/c2913d57d14449775faf1f2e5647e6d1f3d3f920)), closes [#1891](https://github.com/kangjiancheng/vue-next/issues/1891)
* **types:** improve ref typing, close [#759](https://github.com/kangjiancheng/vue-next/issues/759) ([627b9df](https://github.com/kangjiancheng/vue-next/commit/627b9df4a293ae18071009d9cac7a5e995d40716))
* **types:** make return type of `defineComponent` assignable to `Component` type ([#1032](https://github.com/kangjiancheng/vue-next/issues/1032)) ([f3a9b51](https://github.com/kangjiancheng/vue-next/commit/f3a9b516bd6feb42d1ea611faf6550f709fd3173)), closes [#993](https://github.com/kangjiancheng/vue-next/issues/993)
* **types:** ref value type unwrapping should happen at creation time ([d4c6957](https://github.com/kangjiancheng/vue-next/commit/d4c6957e2d8ac7920a649f3a3576689cd5e1099f))
* **types:** shallowRef should not unwrap value type ([3206e5d](https://github.com/kangjiancheng/vue-next/commit/3206e5dfe58fd0e93644d13929558d71c5171888))
* **types:** should unwrap array -> object -> ref ([82b28a5](https://github.com/kangjiancheng/vue-next/commit/82b28a5ecb95be1565e50427bfd5eefe4b2d408c))
* **types:** UnwrapRef should bail on DOM element types ([#952](https://github.com/kangjiancheng/vue-next/issues/952)) ([33ccfc0](https://github.com/kangjiancheng/vue-next/commit/33ccfc0a8b69de13065c4b995f88722dd72a1ae9)), closes [#951](https://github.com/kangjiancheng/vue-next/issues/951)
* **types:** update setup binding unwrap types for 6b10f0c ([a840e7d](https://github.com/kangjiancheng/vue-next/commit/a840e7ddf0b470b5da27b7b2b8b5fcf39a7197a2)), closes [#738](https://github.com/kangjiancheng/vue-next/issues/738)
* **types/jsx:** update innerHTML property in jsx typing ([#1814](https://github.com/kangjiancheng/vue-next/issues/1814)) ([b984d47](https://github.com/kangjiancheng/vue-next/commit/b984d47ac43a0aae2db5556a138a256fb5533ced))
* **types/reactivity:** add generics constraint for markNonReactive ([f3b6559](https://github.com/kangjiancheng/vue-next/commit/f3b6559408fb42ff6dc0c67001c9c67093f2b059)), closes [#917](https://github.com/kangjiancheng/vue-next/issues/917)
* **types/reactivity:** fix ref type inference on nested reactive properties with .value ([bc1f097](https://github.com/kangjiancheng/vue-next/commit/bc1f097e29c5c823737503532baa23c11d4824f8)), closes [#1111](https://github.com/kangjiancheng/vue-next/issues/1111)
* **types/tsx:** add JSX.IntrinsicAttributes definition ([#1517](https://github.com/kangjiancheng/vue-next/issues/1517)) ([a5b4332](https://github.com/kangjiancheng/vue-next/commit/a5b4332c69146de569ad328cac9224c3cded15c9)), closes [#1516](https://github.com/kangjiancheng/vue-next/issues/1516)
* **typo:** transformSlotOutlet name correction ([#83](https://github.com/kangjiancheng/vue-next/issues/83)) ([ea4a352](https://github.com/kangjiancheng/vue-next/commit/ea4a352ee6dea4aadd23c13c9889fec52aa7df0b))
* **v-model:** allow v-model usage on declared custom elements ([71c3c6e](https://github.com/kangjiancheng/vue-next/commit/71c3c6e2a03095ddd4c2a1e15957afd3ec8d4120)), closes [#1699](https://github.com/kangjiancheng/vue-next/issues/1699)
* **v-model:** consistent nullish value handling with 2.x ([#1530](https://github.com/kangjiancheng/vue-next/issues/1530)) ([425335c](https://github.com/kangjiancheng/vue-next/commit/425335c28bdb48f2f48f97021fc0a77eaa89ec34)), closes [#1528](https://github.com/kangjiancheng/vue-next/issues/1528)
* **v-model:** enable v-model type detection on custom elements ([0b3b1cf](https://github.com/kangjiancheng/vue-next/commit/0b3b1cfa487a359c8762794cfd74726d55b9ef8f))
* **v-model:** generate separate modifiers for v-model with args ([f178874](https://github.com/kangjiancheng/vue-next/commit/f178874ace60d241db38a0f2813bb97815e2a2a3))
* **v-model:** handle dynamic assigners and array assigners ([f42d11e](https://github.com/kangjiancheng/vue-next/commit/f42d11e8e19f7356f4e1629cd07c774c9af39288)), closes [#923](https://github.com/kangjiancheng/vue-next/issues/923)
* **v-model:** handle more edge cases in `looseEqual()` ([#379](https://github.com/kangjiancheng/vue-next/issues/379)) ([fe1b27b](https://github.com/kangjiancheng/vue-next/commit/fe1b27b7f875e1c8aece12b04531e7fa3184be27))
* **v-model:** should ignore compiled v-model listeners in attr fallthrough ([6dd59ee](https://github.com/kangjiancheng/vue-next/commit/6dd59ee301d8d93e7ca14447243d07a653e69159)), closes [#1510](https://github.com/kangjiancheng/vue-next/issues/1510)
* **v-model:** should not trigger updates during input composition ([#1183](https://github.com/kangjiancheng/vue-next/issues/1183)) ([83b7158](https://github.com/kangjiancheng/vue-next/commit/83b7158017325db03e5c677b5f1c6adfe41d1ca4))
* **v-model:** should use dynamic directive on input with dynamic v-bind ([1f2de9e](https://github.com/kangjiancheng/vue-next/commit/1f2de9e232409b09c97b67d0824d1450beed6eb1))
* **v-model:** v-model listeners should not fallthrough to plain element root ([c852bf1](https://github.com/kangjiancheng/vue-next/commit/c852bf18d7a51be0c3255357f0c30f39ae9bb540)), closes [#1643](https://github.com/kangjiancheng/vue-next/issues/1643)
* **v-model/emit:** update:camelCase events should trigger kebab case equivalent ([2837ce8](https://github.com/kangjiancheng/vue-next/commit/2837ce842856d51dfbb55e3fa4a36a352446fb54)), closes [#656](https://github.com/kangjiancheng/vue-next/issues/656)
* **v-on:** capitalize dynamic event names ([9152a89](https://github.com/kangjiancheng/vue-next/commit/9152a8901653d7cef864a52a3c618afcc70d827d))
* **v-on:** refactor DOM event options modifer handling ([380c679](https://github.com/kangjiancheng/vue-next/commit/380c6792d8899f1a43a9e6400c5df483c63290b6)), closes [#1567](https://github.com/kangjiancheng/vue-next/issues/1567)
* **v-on:** transform click.right and click.middle modifiers ([028f748](https://github.com/kangjiancheng/vue-next/commit/028f748c32f80842be39897fdacc37f6700f00a7)), closes [#735](https://github.com/kangjiancheng/vue-next/issues/735)
* **v-show:** fix v-show unmount with falsy value ([#1403](https://github.com/kangjiancheng/vue-next/issues/1403)) ([d7beea0](https://github.com/kangjiancheng/vue-next/commit/d7beea015bdb208d89a2352a5d43cc1913f87337)), closes [#1401](https://github.com/kangjiancheng/vue-next/issues/1401)
* **vue:** properly cache runtime compilation ([d3d4fe8](https://github.com/kangjiancheng/vue-next/commit/d3d4fe84cdc3f93838acb5d657d60672182a2f18))
* **warn:** cast symbols to strings ([#1103](https://github.com/kangjiancheng/vue-next/issues/1103)) ([71a942b](https://github.com/kangjiancheng/vue-next/commit/71a942b25a2cad61c3d670075523c31d296c7089))
* **warn:** fix component name inference in warning trace ([0278992](https://github.com/kangjiancheng/vue-next/commit/0278992f78834bc8df677c4e8ec891bb79510edb))
* **warning:** always check for component instance presence when formatting traces ([a0e2c12](https://github.com/kangjiancheng/vue-next/commit/a0e2c1287466567d945e87496ce2f922f3dc6d8c))
* **warning:** handle errors in warn handler ([#396](https://github.com/kangjiancheng/vue-next/issues/396)) ([db7666d](https://github.com/kangjiancheng/vue-next/commit/db7666d0f35c4417fb357162b7cdad89f86d9bee))
* **watch:** allow handler to be a string ([#1775](https://github.com/kangjiancheng/vue-next/issues/1775)) ([b5f91ff](https://github.com/kangjiancheng/vue-next/commit/b5f91ff570244436aa8f579ec3a6fec781d198a7)), closes [#1774](https://github.com/kangjiancheng/vue-next/issues/1774)
* **watch:** callback not called when using `flush:sync` ([#1633](https://github.com/kangjiancheng/vue-next/issues/1633)) ([8facaef](https://github.com/kangjiancheng/vue-next/commit/8facaefcc3eff1ca1fa19832172495e4272979e5))
* **watch:** exhaust pre-flush watchers + avoid duplicate render by pre-flush watchers ([a0e34ce](https://github.com/kangjiancheng/vue-next/commit/a0e34cee4a09a14548bf1e78f4a82702e9d40717)), closes [#1777](https://github.com/kangjiancheng/vue-next/issues/1777)
* **watch:** fix deep watchers on refs containing primitives ([#984](https://github.com/kangjiancheng/vue-next/issues/984)) ([99fd158](https://github.com/kangjiancheng/vue-next/commit/99fd158d090594a433b57d9ff9420f3aed48ad2d))
* **watch:** fix watching reactive array ([#1656](https://github.com/kangjiancheng/vue-next/issues/1656)) ([288b4ea](https://github.com/kangjiancheng/vue-next/commit/288b4eab9e10187eb14d4d6d54dc9f077343a2a5)), closes [#1655](https://github.com/kangjiancheng/vue-next/issues/1655)
* **watch:** ignore lazy option in simple watch ([#546](https://github.com/kangjiancheng/vue-next/issues/546)) ([c2c9c2b](https://github.com/kangjiancheng/vue-next/commit/c2c9c2b57e5d2e87da99bedb06b9e2d3e48b492e))
* **watch:** post flush watchers should not fire when component is unmounted ([341b30c](https://github.com/kangjiancheng/vue-next/commit/341b30c961aa065fc59f0c2b592a11229cb6bd14)), closes [#1603](https://github.com/kangjiancheng/vue-next/issues/1603)
* **watch:** pre-flush watcher watching props should trigger before component update ([d4c17fb](https://github.com/kangjiancheng/vue-next/commit/d4c17fb48b7880a4e3db6d48f8ab76540a3f59a2)), closes [#1763](https://github.com/kangjiancheng/vue-next/issues/1763)
* **watch:** remove recorded effect on manual stop ([#590](https://github.com/kangjiancheng/vue-next/issues/590)) ([453e688](https://github.com/kangjiancheng/vue-next/commit/453e6889da22e7224b638261a32438bdf5c62e41))
* **watch:** should trigger watcher callback on triggerRef when watching ref source ([fce2689](https://github.com/kangjiancheng/vue-next/commit/fce2689ff1af0b632a2034403a6dfbcbff91aa60)), closes [#1736](https://github.com/kangjiancheng/vue-next/issues/1736)
* **watch:** stop instance-bound watchers in post render queue ([58b0706](https://github.com/kangjiancheng/vue-next/commit/58b07069ad33c8a8e44cb47b81084a452dda2846)), closes [#1525](https://github.com/kangjiancheng/vue-next/issues/1525)
* patching a component with pending async setup should update its props and slots ([dff4e7c](https://github.com/kangjiancheng/vue-next/commit/dff4e7cd447dcb2168c14bbed62d3ba1966596c8))
* **watch:** traverse refs in deep watch ([#1939](https://github.com/kangjiancheng/vue-next/issues/1939)) ([10293c7](https://github.com/kangjiancheng/vue-next/commit/10293c7a188021db9bb4386e12c490f1daf28126)), closes [#1900](https://github.com/kangjiancheng/vue-next/issues/1900)
* bail stringification for slots ([9b5d13e](https://github.com/kangjiancheng/vue-next/commit/9b5d13e598686b0a73bc8f4a0f5581f066c3e923)), closes [#1281](https://github.com/kangjiancheng/vue-next/issues/1281) [#1286](https://github.com/kangjiancheng/vue-next/issues/1286)
* beforeUpdate should not be called via onTrigger ([fc1d6e5](https://github.com/kangjiancheng/vue-next/commit/fc1d6e52f37b222666da49531c89672525f2bd6f))
* clone vnode before mutating flags ([01a0fcb](https://github.com/kangjiancheng/vue-next/commit/01a0fcb876c247235610ce549313cd829ee9e65b))
* codeframe marker should have min width of 1 ([02c6d5c](https://github.com/kangjiancheng/vue-next/commit/02c6d5c4e3c3d521bf76f3ce717124a9325a4d20))
* Collection iterations should yield observable values ([9fcd30b](https://github.com/kangjiancheng/vue-next/commit/9fcd30b483047c789233db8d8558e028bc16f252))
* do not drop SFC runtime behavior code in global builds ([4c1a193](https://github.com/kangjiancheng/vue-next/commit/4c1a193617bee8ace6fad289b78e9d2557cb081e)), closes [#873](https://github.com/kangjiancheng/vue-next/issues/873)
* do not use lookbehind regex yet ([2e3a1ff](https://github.com/kangjiancheng/vue-next/commit/2e3a1ff3c3d46341e02e87865225a018bfefab85))
* domProps handling ([157971b](https://github.com/kangjiancheng/vue-next/commit/157971b3cbb1fe81e60d7e4ea4719bf287927f23))
* dynamic component fallback to native element ([f529dbd](https://github.com/kangjiancheng/vue-next/commit/f529dbde236e9eaedbded78e926951a189234f9c)), closes [#870](https://github.com/kangjiancheng/vue-next/issues/870)
* ensure consistent behavior in dev/prod ([5e5dd7b](https://github.com/kangjiancheng/vue-next/commit/5e5dd7b44cf6892d0f513e10585ab54930ec3412))
* ensure makeMap calls are tree-shakable ([7de3aee](https://github.com/kangjiancheng/vue-next/commit/7de3aee31798e3f2c008d4f3f4f9f25b54142eb7))
* ensure vnode hooks are called consistently regardless of keep-alive ([4e8e689](https://github.com/kangjiancheng/vue-next/commit/4e8e689572dcae0cb468989c5e0c531a837a900b))
* export missing createCommentVNode fn ([7b63731](https://github.com/kangjiancheng/vue-next/commit/7b637319a8ac8d57b625615bdf59cd05141e629a))
* expose Vue to compiled template ([#120](https://github.com/kangjiancheng/vue-next/issues/120)) ([b7a9c25](https://github.com/kangjiancheng/vue-next/commit/b7a9c25f145a1db63e1dfd1902750c04488f27da))
* fix functional updates ([ca91797](https://github.com/kangjiancheng/vue-next/commit/ca91797c7fa93df58a8e2b582ef954f5203061db))
* fix h signature for suspense ([083296e](https://github.com/kangjiancheng/vue-next/commit/083296ead6d0ebdf75d12fd2ac2064e6bb732dd8))
* fix internal components render signature ([8024f05](https://github.com/kangjiancheng/vue-next/commit/8024f058ccf13dd8b56f3cded50109fb58efc10c))
* fix not saving cached computed options ([871947c](https://github.com/kangjiancheng/vue-next/commit/871947c25f83c999d0cd64f2e81939a5c2ae72af))
* fix option merge global mixins presence check ([10ad965](https://github.com/kangjiancheng/vue-next/commit/10ad965100a88e28cb528690f2e09070fefc8872))
* fix props option merging ([456ee13](https://github.com/kangjiancheng/vue-next/commit/456ee13ec9b3a03b8fc7a62e7091deba2448f0bc))
* fix reactivity cjs entry ([a83ee65](https://github.com/kangjiancheng/vue-next/commit/a83ee65e30e5896763b13068db9b6204248a0fa3))
* fix scheduler dupe invokes ([75bfa80](https://github.com/kangjiancheng/vue-next/commit/75bfa809972a50cbe64beea70c5ba045874bd2c1))
* fix shapeflags export ([b5c501c](https://github.com/kangjiancheng/vue-next/commit/b5c501c0b43a523a0c8e68f892dd5a25595deab5))
* fix source map by fixing advancePositionWithMutation ([6c8f226](https://github.com/kangjiancheng/vue-next/commit/6c8f226a7979faa2ebfa8cbaf8da84bdc53deef4))
* fragment replaceVNode ([e8dd725](https://github.com/kangjiancheng/vue-next/commit/e8dd725e41e636f60426d072557034bbad2a6d84))
* generate v-if fallback comment as block ([ed29af7](https://github.com/kangjiancheng/vue-next/commit/ed29af7bea4f4f78f50992213b56e41bb5bc9052))
* h.* shorthands should expect correct args type ([aafecb3](https://github.com/kangjiancheng/vue-next/commit/aafecb319d258662cb692e8461ae6d97778e8e90))
* handle empty lines in codeframe ([4b2610c](https://github.com/kangjiancheng/vue-next/commit/4b2610c46820007f26b7bbce962180483bd6444e))
* handle nested scope identifiers ([e09e887](https://github.com/kangjiancheng/vue-next/commit/e09e887219e104c9e466d2c84ba5e5a578b3ded3))
* handle prev children is null in patch element ([7950980](https://github.com/kangjiancheng/vue-next/commit/7950980dc332260dff4a85f0c2d5448fa261cf06))
* import patchFlags from @vue/shared in compiler instead ([9c9ef60](https://github.com/kangjiancheng/vue-next/commit/9c9ef609d82ef8c2c0c80050c71ccad11aea72cd))
* KeepAlive state should be non-reactive ([a428218](https://github.com/kangjiancheng/vue-next/commit/a428218c6440e12e37af14054d0c8027c7987cd8))
* make sure v-if and v-for work together ([0af0feb](https://github.com/kangjiancheng/vue-next/commit/0af0febfc20f1320038df7b034ca6465228a678d))
* mounting new children ([7d436ab](https://github.com/kangjiancheng/vue-next/commit/7d436ab59a30562a049e199ae579df7ac8066829))
* nativeOn should be able to be passed down multiple times ([03390f8](https://github.com/kangjiancheng/vue-next/commit/03390f80a782841131f31ed3872c92fc8ed4af19))
* nativeOn test case + test nested components ([05b70f7](https://github.com/kangjiancheng/vue-next/commit/05b70f790ccbd3bd630839a4254d299a1e87d76c))
* parent chain error when root is functional ([01bb8d1](https://github.com/kangjiancheng/vue-next/commit/01bb8d189482084291248a8deba3c94f6a684c2c))
* provide/inject should be resolved in parent tree ([d4cd3fb](https://github.com/kangjiancheng/vue-next/commit/d4cd3fb3524959269fd47f4abe62cf73913a6aab))
* reactive and immutable should warn for undefined ([e53874f](https://github.com/kangjiancheng/vue-next/commit/e53874f7e72a50fa41e050198521b3a964b83659))
* remove effect from public API ([4bc4cb9](https://github.com/kangjiancheng/vue-next/commit/4bc4cb970f7a65177948c5d817bb43ecb0324636)), closes [#712](https://github.com/kangjiancheng/vue-next/issues/712)
* resolveDynamicComponent should use context instance ([08a3d95](https://github.com/kangjiancheng/vue-next/commit/08a3d95e5213c717dde43a9b58d18dc37e6872d9))
* run ci ([6b889e7](https://github.com/kangjiancheng/vue-next/commit/6b889e7c8a599c829f9a240fdcdce3299fbd0e6d))
* runtime compilation marker should be applied in exposed compile function ([b3b65b4](https://github.com/kangjiancheng/vue-next/commit/b3b65b40582d7fbdc776bfe8a1542b80aebe0aac))
* shallowReadonly should keep reactive properties reactive ([0a4f306](https://github.com/kangjiancheng/vue-next/commit/0a4f306492705b21340b60602bd84a614a7b445a)), closes [#552](https://github.com/kangjiancheng/vue-next/issues/552)
* should always generate slot for non-null children ([7c38960](https://github.com/kangjiancheng/vue-next/commit/7c389606a482b0932f5073f0e6e9f84b9f2216c0))
* simplify and use correct ctx in withCtx ([4dc8ffc](https://github.com/kangjiancheng/vue-next/commit/4dc8ffc3788c38aff3e4c0f271d0ca111f723140))
* Suspense should include into dynamic children ([#653](https://github.com/kangjiancheng/vue-next/issues/653)) ([ec63623](https://github.com/kangjiancheng/vue-next/commit/ec63623fe8d395e1cd759f27b90b1ccc1b616931)), closes [#649](https://github.com/kangjiancheng/vue-next/issues/649)
* vnode key ref should default to null ([693938d](https://github.com/kangjiancheng/vue-next/commit/693938d956572e4651eaa27f476f94fc890a2b00))
* watcher oldValue ([023f4ef](https://github.com/kangjiancheng/vue-next/commit/023f4ef7f41a8e52fa59c813f1a47582aa8aba84))
* **watch:** type inference for computed refs ([6b3ad95](https://github.com/kangjiancheng/vue-next/commit/6b3ad95fa4bdbea99f2f96404cc0b35f4a691595))


### Code Refactoring

* **runtime-core:** rename `createAsyncComponent` to `defineAsyncComponent` ([#888](https://github.com/kangjiancheng/vue-next/issues/888)) ([ebc5873](https://github.com/kangjiancheng/vue-next/commit/ebc587376ca1fb4bb8a20d4137332740605753c8))
* adjust `createApp` related API signatures ([c07751f](https://github.com/kangjiancheng/vue-next/commit/c07751fd3605f301dc0f02fd2a48acc7ba7a0397))
* **compiler/types:** convert compiler options documentation to jsdoc ([e58beec](https://github.com/kangjiancheng/vue-next/commit/e58beecc97635ea61e39b84ea406fcc42166095b))
* **reactivity:** adjust APIs ([09b4202](https://github.com/kangjiancheng/vue-next/commit/09b4202a22ae03072a8a8405511e37f65b626568))
* **reactivity:** remove stale API `markReadonly` ([e8a866e](https://github.com/kangjiancheng/vue-next/commit/e8a866ec9945ec0464035be4c4c58d6212080a50))
* **runtime-core:** adjust attr fallthrough behavior ([e1660f4](https://github.com/kangjiancheng/vue-next/commit/e1660f4338fbf4d2a434e13193a58e00f844379b)), closes [#749](https://github.com/kangjiancheng/vue-next/issues/749)
* **runtime-core:** adjust attr fallthrough behavior ([21bcdec](https://github.com/kangjiancheng/vue-next/commit/21bcdec9435700cac98868a36716b49a7766c48d))
* **runtime-core:** adjust patchProp value arguments order ([ca5f39e](https://github.com/kangjiancheng/vue-next/commit/ca5f39ee3501a1d9cacdb74108318c15ee7c0abb))
* **runtime-core:** remove emit return value ([55566e8](https://github.com/kangjiancheng/vue-next/commit/55566e8f520eee8a07b85221174989c47c443c35))
* preserve refs in reactive arrays ([775a7c2](https://github.com/kangjiancheng/vue-next/commit/775a7c2b414ca44d4684badb29e8e80ff6b5d3dd)), closes [#737](https://github.com/kangjiancheng/vue-next/issues/737)
* remove implicit reactive() call on renderContext ([6b10f0c](https://github.com/kangjiancheng/vue-next/commit/6b10f0cd1da942c1d96746672b5f595df7d125b5))
* **runtime-core:** revert setup() result reactive conversion ([e67f655](https://github.com/kangjiancheng/vue-next/commit/e67f655b2687042fcc74dc0993581405abed56de))
* rename `<portal>` to `<teleport>` ([eee5095](https://github.com/kangjiancheng/vue-next/commit/eee50956924d7d2c916cdb8b99043da616e53af5))
* **types:** mark internal API exports and exclude from d.ts ([c9bf7de](https://github.com/kangjiancheng/vue-next/commit/c9bf7ded2e74790c902384e13c1d444c7136c1f9))
* **watch:** adjsut watch API behavior ([9571ede](https://github.com/kangjiancheng/vue-next/commit/9571ede84bb6949e13c25807cc8f016ace29dc8a))


### Features

* (wip) setup compiler-sfc ([7031e6a](https://github.com/kangjiancheng/vue-next/commit/7031e6a07a4d87bbeccea06e40de011a9fa623ed))
* [@prop](https://github.com/prop) decorator ([cbf95c6](https://github.com/kangjiancheng/vue-next/commit/cbf95c642ef4df34f300be2acb98c119d476f3df))
* $nextTick, $forceUpdate, $watch ([b4c909c](https://github.com/kangjiancheng/vue-next/commit/b4c909c260f8028acad97f4bbd207ef02e9cfc03))
* **v-on:** adjust key modifier behavior to match 2.x ([7fa676e](https://github.com/kangjiancheng/vue-next/commit/7fa676e55f97fb8926c63e32bdf30cd75be455db))
* $refs ([ccd83e2](https://github.com/kangjiancheng/vue-next/commit/ccd83e2fb021dbf2b6721e888fbcfd146c23863c))
* **apiApp:** add more warnings ([#394](https://github.com/kangjiancheng/vue-next/issues/394)) ([5cce23f](https://github.com/kangjiancheng/vue-next/commit/5cce23f4c6c6427589803ca083883760a49e47d0))
* **apiApp:** return app from provide method for chaining ([#393](https://github.com/kangjiancheng/vue-next/issues/393)) ([e581b14](https://github.com/kangjiancheng/vue-next/commit/e581b14dff828f4fe6a465c53362982319f8db26))
* **apiOptions:** add warning for duplicated properties declared by options ([#329](https://github.com/kangjiancheng/vue-next/issues/329)) ([a23e03f](https://github.com/kangjiancheng/vue-next/commit/a23e03f01ee5877b8d6a94c03b6fe6f750296cc5))
* **apiOptions:** warn invalid computed options ([#225](https://github.com/kangjiancheng/vue-next/issues/225)) ([d2bcedb](https://github.com/kangjiancheng/vue-next/commit/d2bcedb213876b3f8ec030c4c826c70cb344b936))
* **asyncComponent:** add `onError` option for defineAsyncComponent ([e804463](https://github.com/kangjiancheng/vue-next/commit/e80446349215159c002223a41baeb5a8bc0f444c))
* **asyncComponent:** retry support ([c01930e](https://github.com/kangjiancheng/vue-next/commit/c01930e60b4abf481900cdfcc2ba422890c41656))
* **asyncComponent:** SSR/hydration support for async component ([cba2f1a](https://github.com/kangjiancheng/vue-next/commit/cba2f1aadbd0d4ae246040ecd5a91d8dd4e8fd1a))
* **build:** provide more specific warnings for runtime compilation ([e954ba2](https://github.com/kangjiancheng/vue-next/commit/e954ba21f04f0ef848c687233fcb849d75e4153f)), closes [#1004](https://github.com/kangjiancheng/vue-next/issues/1004)
* **compiler:** accept line offset in codeframe ([49a50d3](https://github.com/kangjiancheng/vue-next/commit/49a50d3c9cf96e4628d82e726134b81b4112cd82))
* **compiler:** add isNativeTag option for determining element type ([#139](https://github.com/kangjiancheng/vue-next/issues/139)) ([78f6034](https://github.com/kangjiancheng/vue-next/commit/78f60347dc9ff2387727e0073d94665189c05544))
* **compiler:** annotate patchFlags in generated code ([4fc963b](https://github.com/kangjiancheng/vue-next/commit/4fc963bc5a46464f97e3bcd39d58e4a6d7e4360c))
* **compiler:** basic codegen with source map support ([9b1a548](https://github.com/kangjiancheng/vue-next/commit/9b1a548c6b40492824f8786cb966a28a704a0187))
* **compiler:** basic transform implementation ([bbb57c2](https://github.com/kangjiancheng/vue-next/commit/bbb57c26a258d3778ae6c04fe93f4ef098f2af66))
* **compiler:** basic v-bind & v-on transforms ([914087e](https://github.com/kangjiancheng/vue-next/commit/914087edeaab5501bd14d62b899dcdf5f81dd49f))
* **compiler:** better warning for invalid expressions in function/browser mode ([e29f0b3](https://github.com/kangjiancheng/vue-next/commit/e29f0b3fc2b10c76264cdd8e49c2ab4260286fd6)), closes [#1266](https://github.com/kangjiancheng/vue-next/issues/1266)
* **compiler:** block optimization codegen for RootNode ([24bd6c2](https://github.com/kangjiancheng/vue-next/commit/24bd6c27e08296f170ed96db982bfb20ab51ac4f))
* **compiler:** compile suspense children as slots ([#419](https://github.com/kangjiancheng/vue-next/issues/419)) ([4b9483f](https://github.com/kangjiancheng/vue-next/commit/4b9483fd5ec70dae07a20563168c3d1d4e95bfe5))
* **compiler:** convert text mixed with elements into createVNode calls ([052febc](https://github.com/kangjiancheng/vue-next/commit/052febc12799044a002fcf2ef648376b195f845b))
* **compiler:** correct source map generation ([63b6902](https://github.com/kangjiancheng/vue-next/commit/63b6902bdb161c3d3b7e3bb2510b66a93f7d342f))
* **compiler:** element codegen ([3a177a1](https://github.com/kangjiancheng/vue-next/commit/3a177a18d24d1aecfb38c0d12aa951c0c1a85273))
* **compiler:** element transform ([baa8954](https://github.com/kangjiancheng/vue-next/commit/baa8954884d6f61b2f4b874032ef9203718df360))
* **compiler:** ensure interpolation expressions are wrapped with toString() ([b3b67b8](https://github.com/kangjiancheng/vue-next/commit/b3b67b8c7d2d32c66c89158ff177f75baf950a2d))
* **compiler:** expose generateCodeFrame ([5658f8b](https://github.com/kangjiancheng/vue-next/commit/5658f8b6789e7d68c81bed9c31d5aea4957743a6))
* **compiler:** expression prefixing + v-for scope analysis ([e57cb51](https://github.com/kangjiancheng/vue-next/commit/e57cb5106624f4738e042a32bf23d3389ee9ed29))
* **compiler:** force dynamicSlots flag when inside v-for or v-slot ([c2fc7e3](https://github.com/kangjiancheng/vue-next/commit/c2fc7e334711de5a2cdf71aaaacd131f5af2e5d1))
* **compiler:** generate patchFlags for runtime ([d674180](https://github.com/kangjiancheng/vue-next/commit/d67418002fbbff358e8761b07607f71e5df06c24))
* **compiler:** generate TEXT patchFlag ([fe36555](https://github.com/kangjiancheng/vue-next/commit/fe36555d9e843d1b71be796e77e735edf0face0f))
* **compiler:** handle complex destructure expressions in v-for ([389a078](https://github.com/kangjiancheng/vue-next/commit/389a07835c716f1009d44b347e3519dd1f0a9f2f))
* **compiler:** handle conditional v-slot ([3d14265](https://github.com/kangjiancheng/vue-next/commit/3d142651028baf85b00a998dfc896a6144ed5be2))
* **compiler:** handle runtime helper injection ([8076ce1](https://github.com/kangjiancheng/vue-next/commit/8076ce1f282498c8f9df6947f5a0908c99965333))
* **compiler:** hoist static trees ([095f5ed](https://github.com/kangjiancheng/vue-next/commit/095f5edf8dad8a44adaba6d1d1556168e8eec108))
* **compiler:** implement support for v-pre ([5dfb271](https://github.com/kangjiancheng/vue-next/commit/5dfb271551912b5080a49b719805cb3706b8a3ed))
* **compiler:** include ast in compile result ([f79433c](https://github.com/kangjiancheng/vue-next/commit/f79433cbb365804f74ae05f6e9b429706d2f73cf))
* **compiler:** include names in source map ([3bba461](https://github.com/kangjiancheng/vue-next/commit/3bba46112824e6ad2d5ce2e0325e77df5a63dcf2))
* **compiler:** mark compiler-generated slots for runtime ([306c22e](https://github.com/kangjiancheng/vue-next/commit/306c22efe1dbc3e98a8fe31277bc5025715b37e1))
* **compiler:** mark hoisted trees with patchFlag ([175f8aa](https://github.com/kangjiancheng/vue-next/commit/175f8aae8d009e044e3674f7647bf1397f3a794a))
* **compiler:** optimize text by merging adjacent nodes ([e5e40e1](https://github.com/kangjiancheng/vue-next/commit/e5e40e1e38109a017efed2e308e986193a12daca))
* **compiler:** port parser implementation based on work by [@znck](https://github.com/znck) and [@mysticatea](https://github.com/mysticatea) ([86ae923](https://github.com/kangjiancheng/vue-next/commit/86ae92303d9c7e2dc37d295fda1d3b4f62214dd0))
* **compiler:** preserve whitespace in pre tag, add tests ([eb20730](https://github.com/kangjiancheng/vue-next/commit/eb20730a67ce5f0012d05b5ed8aafcc58b7b2c0d))
* **compiler:** render <slot/> as block fragments ([aa9245d](https://github.com/kangjiancheng/vue-next/commit/aa9245d55c6c766f5f9da68c217b92d68d8fd4b4))
* **compiler:** scaffold compiler-dom ([1c8f5b6](https://github.com/kangjiancheng/vue-next/commit/1c8f5b612ae6efb49733829f855eec2c6a2dd69b))
* **compiler:** set sourcesContent for source map ([c78d47b](https://github.com/kangjiancheng/vue-next/commit/c78d47b78851b7bc8a0261f5b8a79c88bf22273e))
* **compiler:** support keep-alive in templates ([98e9b76](https://github.com/kangjiancheng/vue-next/commit/98e9b769e6528a303b06f7e52a9544b3d057f0a6))
* **compiler:** support v-for on named slots ([fc47029](https://github.com/kangjiancheng/vue-next/commit/fc47029ed3849833a773a9f0d816228f8366a9bb))
* **compiler:** transform component slots ([32666c7](https://github.com/kangjiancheng/vue-next/commit/32666c77086d4eee29c436d456e2ec6d925efe72))
* **compiler:** transform slot outlets ([ee66ce7](https://github.com/kangjiancheng/vue-next/commit/ee66ce78b7f29e901ca7d25f0bd0ef889ef7b070))
* **compiler:** transformStyle + context.hoist ([b43f3b6](https://github.com/kangjiancheng/vue-next/commit/b43f3b61b7e7d367af9823545befb2a75a0e856a))
* **compiler:** v-for codegen w/ correct blocks optimization + key flags ([a477594](https://github.com/kangjiancheng/vue-next/commit/a477594d656b895af5018d686b7601cdeca0f552))
* **compiler:** v-on inline statement handling ([2e2b692](https://github.com/kangjiancheng/vue-next/commit/2e2b6924dacb240609c0c5527e9cc5e1138d9205))
* **compiler:** v-text transform + move dom-specific errros codes to compiler-dom ([f91d335](https://github.com/kangjiancheng/vue-next/commit/f91d335e6595029b713b55cb0cea77e7085c382d))
* **compiler:** warn invalid children for transition and keep-alive ([4cc39e1](https://github.com/kangjiancheng/vue-next/commit/4cc39e14a297f42230f5aac5ec08e3c98902b98d))
* **compiler-core:** add `comments` parser option ([#1858](https://github.com/kangjiancheng/vue-next/issues/1858)) ([62b9d02](https://github.com/kangjiancheng/vue-next/commit/62b9d02f6fbb08d51bed73f33435c1ed83d5b2ea))
* **compiler-core:** add parser transform for v-for directive ([#65](https://github.com/kangjiancheng/vue-next/issues/65)) ([10c1a2b](https://github.com/kangjiancheng/vue-next/commit/10c1a2b33278364c1d53011989d6a6d16a498c5e))
* **compiler-core:** create transform for v-model ([#146](https://github.com/kangjiancheng/vue-next/issues/146)) ([87c3d2e](https://github.com/kangjiancheng/vue-next/commit/87c3d2edae8d0549eb66e23657cdfbe92a0aba1b))
* **compiler-core:** do not generate TEXT flag if child is constant ([6a75c34](https://github.com/kangjiancheng/vue-next/commit/6a75c3463b7f7ef669b070051ab231f6abb5bd6f))
* **compiler-core:** export `transformElement` from compiler-core ([#907](https://github.com/kangjiancheng/vue-next/issues/907)) ([20f4965](https://github.com/kangjiancheng/vue-next/commit/20f4965b45d410a2fe95310ecf7293b2b7f46f36))
* **compiler-core:** hoist element with static ref ([#344](https://github.com/kangjiancheng/vue-next/issues/344)) ([920773f](https://github.com/kangjiancheng/vue-next/commit/920773fc6b082269e5c54a9c44609e6fd7dba5f3))
* **compiler-core:** more hoisting optimizations ([#276](https://github.com/kangjiancheng/vue-next/issues/276)) ([68a3879](https://github.com/kangjiancheng/vue-next/commit/68a3879b8851bc34344e6466c0eb97319684a398))
* **compiler-core:** options.isBuiltInComponent ([4e8d57b](https://github.com/kangjiancheng/vue-next/commit/4e8d57bdfb270341c23fcb9f6bc9043509649b32))
* **compiler-core:** re-implement v-once to use cache mechanism ([af5a8e1](https://github.com/kangjiancheng/vue-next/commit/af5a8e11544ce836d1aa07457a51b59a29101ac4))
* **compiler-core:** support <portal> in template ([#203](https://github.com/kangjiancheng/vue-next/issues/203)) ([4547d85](https://github.com/kangjiancheng/vue-next/commit/4547d85a388ebb0f982a8bc48c66c83aca3cae24))
* **compiler-core:** support mode: cjs in codegen ([04da2a8](https://github.com/kangjiancheng/vue-next/commit/04da2a82e8fbde2b60b2392bc4bdcc5e61113202))
* **compiler-core:** support Suspense in templates ([4b2b29e](https://github.com/kangjiancheng/vue-next/commit/4b2b29efa1d531af6c2a59e73eb0cda3b078aad6))
* **compiler-core:** support v-is ([b8ffbff](https://github.com/kangjiancheng/vue-next/commit/b8ffbffaf771c259848743cf4eb1a5ea31795aaa))
* **compiler-core:** switch to @babel/parser for expression parsing ([8449a97](https://github.com/kangjiancheng/vue-next/commit/8449a9727c942b6049c9e577c7c15b43fdca2867))
* **compiler-core:** whitespace handling ([9298f46](https://github.com/kangjiancheng/vue-next/commit/9298f46f929fff18cf5e2d93b523fd27782225ba))
* **compiler-core:** wrap slot functions with render context ([ecd7ce6](https://github.com/kangjiancheng/vue-next/commit/ecd7ce60d5234a7a0dbc11add6a690c3f9ff0617))
* **compiler-core/internal:** add `onContextCreated` option to `generate` ([#1672](https://github.com/kangjiancheng/vue-next/issues/1672)) ([615dccd](https://github.com/kangjiancheng/vue-next/commit/615dccd00e7d85a3f4b82e62d6cb6c41f167d8c6))
* **compiler-core/runtime-core:** show codeframe in runtime compile errors ([#220](https://github.com/kangjiancheng/vue-next/issues/220)) ([46e64b2](https://github.com/kangjiancheng/vue-next/commit/46e64b257cbb81aa302d0d9a4c6434d21216ed2d))
* **compiler-core/v-model:** avoid patching v-model handler when possible ([5481f76](https://github.com/kangjiancheng/vue-next/commit/5481f76ce835f29c29d4a5a083e5d8ec1e25b9e7))
* **compiler-core/v-model:** error when v-model is used on scope variable ([25dd507](https://github.com/kangjiancheng/vue-next/commit/25dd507f71b1df065a81e0cb8623674ae672fa71))
* **compiler-core/v-model:** generate modelModifiers for component v-model ([5e97643](https://github.com/kangjiancheng/vue-next/commit/5e97643c85a67b82c7b61c386e351e5db7dc6729))
* **compiler-core/v-on:** support [@vnode-xxx](https://github.com/vnode-xxx) usage for vnode hooks ([571ed42](https://github.com/kangjiancheng/vue-next/commit/571ed4226be618dcc9f95e4c2da8d82d7d2f7750))
* **compiler-core/v-slot:** only force dynamic slots when referencing scope vars ([d69db0b](https://github.com/kangjiancheng/vue-next/commit/d69db0b2fd8388cceb87b207292e28753395d323))
* **compiler-dom:** handle constant expressions when stringifying static content ([8b7c162](https://github.com/kangjiancheng/vue-next/commit/8b7c162125cb72068727a76ede8afa2896251db0))
* **compiler-dom:** transform for v-html ([eadcaea](https://github.com/kangjiancheng/vue-next/commit/eadcaead37116a9506302f9a55917c32552eded9))
* **compiler-dom:** v-cloak transform ([#141](https://github.com/kangjiancheng/vue-next/issues/141)) ([2144183](https://github.com/kangjiancheng/vue-next/commit/21441830dd8c6d9870350dbf9d265afc0b62c021))
* **compiler-dom/runtime-dom:** stringify eligible static trees ([27913e6](https://github.com/kangjiancheng/vue-next/commit/27913e661ac551f580bd5fd42b49fe55cbe8dbb8))
* **compiler-sfc:** `<script setup>` support (experimental) ([4c43d4e](https://github.com/kangjiancheng/vue-next/commit/4c43d4e5b9df8732b601a269bf4030f9721d466f))
* **compiler-sfc:** `<style vars>` CSS variable injection ([bd5c3b9](https://github.com/kangjiancheng/vue-next/commit/bd5c3b96be2c6c4a0b84b096c3baa3c30feb95d6))
* **compiler-sfc:** add cache for parsing sfc ([#453](https://github.com/kangjiancheng/vue-next/issues/453)) ([4e538ac](https://github.com/kangjiancheng/vue-next/commit/4e538ac46562826c0bb2cd7ebf1668d7dd57cfe6))
* **compiler-sfc:** add preprocessCustomRequire option ([20d425f](https://github.com/kangjiancheng/vue-next/commit/20d425fb19e04cd5b66f76b0f52ca221c92eb74c))
* **compiler-sfc:** add ssr option ([3b2d236](https://github.com/kangjiancheng/vue-next/commit/3b2d23671409f8ac358252311bf5212882fa985a))
* **compiler-sfc:** add transformAssetUrlsBase option ([36972c2](https://github.com/kangjiancheng/vue-next/commit/36972c20b5c2451c8345361f9c015655afbfdd87))
* **compiler-sfc:** allow using :deep, :global & :slotted for short in `<style scoped>` ([f3cc41f](https://github.com/kangjiancheng/vue-next/commit/f3cc41f0c8713475f2aa592bae3d82ffbc6b1300))
* **compiler-sfc:** built-in support for css modules ([fa216a0](https://github.com/kangjiancheng/vue-next/commit/fa216a0c3adc70ff74deca872e295a154fa147c8))
* **compiler-sfc:** compile template WIP ([#534](https://github.com/kangjiancheng/vue-next/issues/534)) ([0a14c04](https://github.com/kangjiancheng/vue-next/commit/0a14c04c81edd0706f5030a1f4cb9db6095a56ef))
* **compiler-sfc:** export dependencies for css and css preprocessors ([#1278](https://github.com/kangjiancheng/vue-next/issues/1278)) ([e41d831](https://github.com/kangjiancheng/vue-next/commit/e41d8310de0d9299fce2bccd57af4e30b74e3795))
* **compiler-sfc:** gen source map for style and script block ([#497](https://github.com/kangjiancheng/vue-next/issues/497)) ([6511832](https://github.com/kangjiancheng/vue-next/commit/65118327ff9f506d241959d96e1e57871a6427d7))
* **compiler-sfc:** generate source map for template block ([865c1ce](https://github.com/kangjiancheng/vue-next/commit/865c1ce9ee9f884242f35e9f6591b510ac0063a7))
* **compiler-sfc:** handle pad option ([#509](https://github.com/kangjiancheng/vue-next/issues/509)) ([ef27861](https://github.com/kangjiancheng/vue-next/commit/ef2786151e38532536269eea947ae15e7714ed51))
* **compiler-sfc:** improve sfc source map generation ([698c8d3](https://github.com/kangjiancheng/vue-next/commit/698c8d35d55ae6a157d7aad5ffb1f3a27e0b3970))
* **compiler-sfc:** properly pass on options ([c8c5b16](https://github.com/kangjiancheng/vue-next/commit/c8c5b16ef7f977cf4038e3390a0b2652b6e03d99))
* **compiler-sfc:** support transforming absolute asset urls ([6a0be88](https://github.com/kangjiancheng/vue-next/commit/6a0be882d4ce95eb8d8093f273ea0e868acfcd24))
* **compiler-sfc:** transform asset url ([#500](https://github.com/kangjiancheng/vue-next/issues/500)) ([810b3a3](https://github.com/kangjiancheng/vue-next/commit/810b3a3e2a1e426187a4dac7c7aec1500cf3a241))
* **compiler-sfc:** transform srcset ([#501](https://github.com/kangjiancheng/vue-next/issues/501)) ([cf2a0b2](https://github.com/kangjiancheng/vue-next/commit/cf2a0b281f869aeee64667c0fe914c3a5736ca72))
* **compiler-sfc:** use @vue/compiler-dom by default ([818bf17](https://github.com/kangjiancheng/vue-next/commit/818bf17cb710f5a881bc34378e02333c3232482d))
* **compiler-sfc:** warn duplicate block ([#451](https://github.com/kangjiancheng/vue-next/issues/451)) ([7f6abda](https://github.com/kangjiancheng/vue-next/commit/7f6abda6ddb9629695f48a2d68206194324b91e7))
* **compiler-ssr:** compile portal ([#775](https://github.com/kangjiancheng/vue-next/issues/775)) ([d8ed0e7](https://github.com/kangjiancheng/vue-next/commit/d8ed0e7fbf9bbe734667eb94e809235e79e431eb))
* **compiler/slot:** bail out of optimization mode for non-compiled slots ([227ad03](https://github.com/kangjiancheng/vue-next/commit/227ad034f057ee4a355e941536121e4d780ac761))
* **computed:** add readonly flag if no setter is provided ([#1654](https://github.com/kangjiancheng/vue-next/issues/1654)) ([dabdc5e](https://github.com/kangjiancheng/vue-next/commit/dabdc5e115514f98b5f8559a3819e96416939f43))
* **computed:** warn if trying to set a readonly computed ([#161](https://github.com/kangjiancheng/vue-next/issues/161)) ([530be30](https://github.com/kangjiancheng/vue-next/commit/530be302fc8ea4fc7246246096077660fb3ee6a3))
* **core:** adjust attrs fallthrough behavior ([8edfbf9](https://github.com/kangjiancheng/vue-next/commit/8edfbf9df901b703ed91500c0a840e74a0f4177f))
* **core:** allow passing explicit refs via props ([d9c6ff3](https://github.com/kangjiancheng/vue-next/commit/d9c6ff372c10dde8b496ee32f2b9a246edf66a35))
* **core:** export version ([#254](https://github.com/kangjiancheng/vue-next/issues/254)) ([fd209f5](https://github.com/kangjiancheng/vue-next/commit/fd209f5a668ddf4b74cabab60d35c2d6b3d29fea))
* **core:** keep-alive ([c6cbca2](https://github.com/kangjiancheng/vue-next/commit/c6cbca25fe6f1718495764747aa6f999e09b55e9))
* **core:** respect $stable slots flag per RFC ([4309798](https://github.com/kangjiancheng/vue-next/commit/43097987cf73d9c098a6d8c62db05503e8ac52d7))
* **core:** support dynamic component via <component :is> ([#320](https://github.com/kangjiancheng/vue-next/issues/320)) ([7f23eaf](https://github.com/kangjiancheng/vue-next/commit/7f23eaf661555df64464a0f41fc1d77b3d1addde))
* **core:** support recursively resolving self component by name ([f5f2dca](https://github.com/kangjiancheng/vue-next/commit/f5f2dca13244dcfa1c802e3efcbc6f76d6f70095))
* **core:** support v-show directive ([#310](https://github.com/kangjiancheng/vue-next/issues/310)) ([00857ac](https://github.com/kangjiancheng/vue-next/commit/00857ac8166426106bdee96072fa2b79d957dece))
* **core:** validate directives names ([#326](https://github.com/kangjiancheng/vue-next/issues/326)) ([2238925](https://github.com/kangjiancheng/vue-next/commit/2238925fbea7a57d5a0e69e39ff00afdfce267db))
* **createRenderer:** handle errors in function refs ([#403](https://github.com/kangjiancheng/vue-next/issues/403)) ([325e15e](https://github.com/kangjiancheng/vue-next/commit/325e15ef41367aa5d382ad53740643a92041b9db))
* **devtools:** catch events ([23233dc](https://github.com/kangjiancheng/vue-next/commit/23233dc8b850bf9c6bf24c11d4586865884ddb5f))
* **devtools:** expose setupState target object ([31b99a9](https://github.com/kangjiancheng/vue-next/commit/31b99a9139a32590187a2e4a50ad0654de0034a9))
* **directives:** add support for function directives ([#252](https://github.com/kangjiancheng/vue-next/issues/252)) ([0bac763](https://github.com/kangjiancheng/vue-next/commit/0bac763f5a4906a030258dd3a71a912c0a0b1201))
* **dom:** transform + runtime for v-on ([#213](https://github.com/kangjiancheng/vue-next/issues/213)) ([57a94b5](https://github.com/kangjiancheng/vue-next/commit/57a94b530d40904fafdc9783c3e957c64c9db465))
* **hmr:** reload and force slot update on re-render ([f77ae13](https://github.com/kangjiancheng/vue-next/commit/f77ae132e5a94a279b1cccb87061603fda42e2aa))
* **hmr:** root instance reload ([eda495e](https://github.com/kangjiancheng/vue-next/commit/eda495efd824f17095728a4d2a6db85ca874e5ca))
* **imart:** add .idea to .gitignore ([a57d730](https://github.com/kangjiancheng/vue-next/commit/a57d730299f6caf07a786ba79cf55e4e15d9acfd))
* **imart:** add demo test ([c65eaab](https://github.com/kangjiancheng/vue-next/commit/c65eaab2260602a1d928ac1c378e9c7dd15e2490))
* **imart:** analyze the compile status ([2927490](https://github.com/kangjiancheng/vue-next/commit/2927490234bf18b24b30dc231be3241945da38c4))
* **imart:** demo README.md ([a2376e3](https://github.com/kangjiancheng/vue-next/commit/a2376e32b3ecefb367cd5c2d7c951cd46cafdc89))
* **imart:** init demo  源码分析 ([31d326b](https://github.com/kangjiancheng/vue-next/commit/31d326b47ba9b6d678751d2cc35db8c0490e385d))
* **imart:** optimize ([2e1bbdc](https://github.com/kangjiancheng/vue-next/commit/2e1bbdcbdfa5a530f69ce3aea4d86972e35c28df))
* **imart:** start debug ([f03bce2](https://github.com/kangjiancheng/vue-next/commit/f03bce2b3fad40a27cfd98cdb12f766cd8438708))
* **imart:** 分析 xxx.prod.js 版本创建 ([888c083](https://github.com/kangjiancheng/vue-next/commit/888c083db9084c48ae83fed34ce4951a2becb4fa))
* **inject:** allow usage in functional components ([e79c918](https://github.com/kangjiancheng/vue-next/commit/e79c918676a0703be868efce0115bc1037e84f40))
* **portal:** hydration support for portal disabled mode ([b74bab2](https://github.com/kangjiancheng/vue-next/commit/b74bab216c3be68ab046451cf5e5b5bec5f19483))
* **portal:** SSR support for multi portal shared target ([e866434](https://github.com/kangjiancheng/vue-next/commit/e866434f0c54498dd0fc47d48287a1d0ada36388))
* **portal:** SSR support for portal disabled prop ([9ed9bf3](https://github.com/kangjiancheng/vue-next/commit/9ed9bf3687a770aebc265839065832761e6bafa1))
* **portal:** support disabled prop ([8ce3da0](https://github.com/kangjiancheng/vue-next/commit/8ce3da0104db9bdd89929724c6d841ac3dfb7336))
* **portal:** support multiple portal appending to same target ([aafb880](https://github.com/kangjiancheng/vue-next/commit/aafb880a0a9e023b62cf8fb3ae269b31f22ac84e))
* **props:** enable case conversion in all builds, preserve casing for attrs ([42bf9ca](https://github.com/kangjiancheng/vue-next/commit/42bf9ca3e5babe6e9bc4967ed2904e7e56023c5b))
* **props:** kebab -> camel prop case support in full build ([e2917fe](https://github.com/kangjiancheng/vue-next/commit/e2917fef96554f99a751feb972c4b2793cc734a1))
* **reactivity:** `proxyRefs` method and `ShallowUnwrapRefs` type ([#1682](https://github.com/kangjiancheng/vue-next/issues/1682)) ([aa06b10](https://github.com/kangjiancheng/vue-next/commit/aa06b1034d8268fa15cb6b4b6916440701238b2d))
* **reactivity:** add effect to public api ([#909](https://github.com/kangjiancheng/vue-next/issues/909)) ([6fba241](https://github.com/kangjiancheng/vue-next/commit/6fba2418507d9c65891e8d14bd63736adb377556))
* **reactivity:** add shallowReactive function ([#689](https://github.com/kangjiancheng/vue-next/issues/689)) ([7f38c1e](https://github.com/kangjiancheng/vue-next/commit/7f38c1e0ff5a7591f67ed21aa3a2944db2e72a27))
* **reactivity:** add support for `customRef` API ([b83c580](https://github.com/kangjiancheng/vue-next/commit/b83c5801315e5e28ac51ecff743206e665f4d868))
* **reactivity:** add support for `toRef` API ([486dc18](https://github.com/kangjiancheng/vue-next/commit/486dc188fe1593448d2bfb0c3c4c3c02b2d78ea4))
* **reactivity:** add triggerRef API ([2acf3e8](https://github.com/kangjiancheng/vue-next/commit/2acf3e84b95d7f18925b4d7ada92f1992f5b7ee3))
* **reactivity:** expose unref and shallowRef ([e9024bf](https://github.com/kangjiancheng/vue-next/commit/e9024bf1b7456b9cf9b913c239502593364bc773))
* **reactivity:** provide correct tracking info for refs ([f3c1fa7](https://github.com/kangjiancheng/vue-next/commit/f3c1fa75f6e90269fb2e86e150e4f5e4d71b4901))
* **reactivity:** ref(Ref) should return Ref ([#180](https://github.com/kangjiancheng/vue-next/issues/180)) ([cbb4b19](https://github.com/kangjiancheng/vue-next/commit/cbb4b19cfbef2fac9c2c41e412245e69a433885a))
* **reactivity:** return array when calling `toRefs` on array ([#1768](https://github.com/kangjiancheng/vue-next/issues/1768)) ([4172fdb](https://github.com/kangjiancheng/vue-next/commit/4172fdb90cd75d5741f843a227cfe9b5f5b22b35)), closes [#1764](https://github.com/kangjiancheng/vue-next/issues/1764)
* **reactivity:** use Symbol for Ref._isRef ([#114](https://github.com/kangjiancheng/vue-next/issues/114)) ([0bdee72](https://github.com/kangjiancheng/vue-next/commit/0bdee72e17f920354c4e72a921b944e22bf30ad9))
* **renderer-test:** allow specifying indent for serialization ([4f6531a](https://github.com/kangjiancheng/vue-next/commit/4f6531aa3c41193f190c5e35d404bdeca5b1d1e9))
* **runtime:** support rendering comment nodes ([76a1196](https://github.com/kangjiancheng/vue-next/commit/76a119693501525ff2e59e669daaab839c3e7b01))
* **runtime-core:** add inheritRef option + make <transition> & <keep-alive> inherit refs ([38f2d23](https://github.com/kangjiancheng/vue-next/commit/38f2d23a607cd7077da189ac274a3a0ad542cc1f))
* **runtime-core:** add special property to get class component options ([#821](https://github.com/kangjiancheng/vue-next/issues/821)) ([dd17fa1](https://github.com/kangjiancheng/vue-next/commit/dd17fa1c9071b9685c379e1b12102214b757cf35))
* **runtime-core:** add watchEffect API ([99a2e18](https://github.com/kangjiancheng/vue-next/commit/99a2e18c9711d3d1f79f8c9c59212880efd058b9))
* **runtime-core:** async component support ([c3bb316](https://github.com/kangjiancheng/vue-next/commit/c3bb3169f497fc834654d8ae700f18b1a6613127))
* **runtime-core:** config.performance tracing support ([e93e426](https://github.com/kangjiancheng/vue-next/commit/e93e426bfad13f40c8f1d80b8f45ac5d0926c2fc))
* **runtime-core:** detect and warn against components made reactive ([2e06f5b](https://github.com/kangjiancheng/vue-next/commit/2e06f5bbe84155588dea82d90822a41dc93d0688)), closes [#962](https://github.com/kangjiancheng/vue-next/issues/962)
* **runtime-core:** emit now returns array of return values from all triggered handlers ([e81c8a3](https://github.com/kangjiancheng/vue-next/commit/e81c8a32c7b66211cbaecffa93efd4629ec45ad9)), closes [#635](https://github.com/kangjiancheng/vue-next/issues/635)
* **runtime-core:** emits validation and warnings ([c7c3a6a](https://github.com/kangjiancheng/vue-next/commit/c7c3a6a3bef6275be8f9f8873358421017bb5386))
* **runtime-core:** export queuePostFlushCb ([#1078](https://github.com/kangjiancheng/vue-next/issues/1078)) ([ba240eb](https://github.com/kangjiancheng/vue-next/commit/ba240eb497de75acd5f31ff6b3803da0560027d8))
* **runtime-core:** expose isVNode ([a165d82](https://github.com/kangjiancheng/vue-next/commit/a165d8293dbd092828b14530577d45e2af40deda))
* **runtime-core:** expose version on app instance ([056cac9](https://github.com/kangjiancheng/vue-next/commit/056cac91855e644e94cd704ff5462c4e1acba66b)), closes [#1449](https://github.com/kangjiancheng/vue-next/issues/1449)
* **runtime-core:** failed component resolution should fallback to native element ([cb31eb4](https://github.com/kangjiancheng/vue-next/commit/cb31eb4d0a0afdd2abf9e3897d9aac447dd0264b))
* **runtime-core:** hot module replacement ([efe39db](https://github.com/kangjiancheng/vue-next/commit/efe39db023dcd4bad5692031d2be0d0e6a0c1853))
* **runtime-core:** implement RFC-0020 ([bb7fa3d](https://github.com/kangjiancheng/vue-next/commit/bb7fa3dabce73de63d016c75f1477e7d8bed8858))
* **runtime-core:** improve component public instance proxy inspection ([899287a](https://github.com/kangjiancheng/vue-next/commit/899287ad35d8b74e76a71f39772a92f261dfa4f8))
* **runtime-core:** improve warning for extraneous event listeners ([#1005](https://github.com/kangjiancheng/vue-next/issues/1005)) ([cebad64](https://github.com/kangjiancheng/vue-next/commit/cebad64d224ff9a2b7976643c85d55d8ec53ee54)), closes [#1001](https://github.com/kangjiancheng/vue-next/issues/1001)
* **runtime-core:** more specific warning for failed v-on fallthrough ([ab844fd](https://github.com/kangjiancheng/vue-next/commit/ab844fd1692007cf2be4d01a9062caa36fa1d280)), closes [#1001](https://github.com/kangjiancheng/vue-next/issues/1001)
* **runtime-core:** pass current props to prop default value functions ([0d508e9](https://github.com/kangjiancheng/vue-next/commit/0d508e9f51734409ac1aa57ba0ea98808be0a3a3)), closes [#1886](https://github.com/kangjiancheng/vue-next/issues/1886)
* **runtime-core:** respect function name when using `defineComponent` function shorthand ([#1661](https://github.com/kangjiancheng/vue-next/issues/1661)) ([304830a](https://github.com/kangjiancheng/vue-next/commit/304830a764cd9f28098cfb0ac0e520e1bb2f57c7))
* **runtime-core:** set context for manual slot functions as well ([8a58dce](https://github.com/kangjiancheng/vue-next/commit/8a58dce6034944b18c2e507b5d9ab8177f60e269))
* **runtime-core:** skip emit warn if has equivalent onXXX prop ([0709380](https://github.com/kangjiancheng/vue-next/commit/0709380c5faf0a86c25a0564781fdb2650c9c353))
* **runtime-core:** support `config.optionMergeStrategies` ([528621b](https://github.com/kangjiancheng/vue-next/commit/528621ba41b1d7113940077574217d01d182b35f))
* **runtime-core:** support app.config.globalProperties ([27873db](https://github.com/kangjiancheng/vue-next/commit/27873dbe1c09ac6a058d815949a4e13831513fd0))
* **runtime-core:** support app.unmount(container) ([#601](https://github.com/kangjiancheng/vue-next/issues/601)) ([04ac6c4](https://github.com/kangjiancheng/vue-next/commit/04ac6c467a4122877c204d7494c86f89498d2dc6)), closes [#593](https://github.com/kangjiancheng/vue-next/issues/593)
* **runtime-core:** support array in watch option ([#376](https://github.com/kangjiancheng/vue-next/issues/376)) ([532b5ee](https://github.com/kangjiancheng/vue-next/commit/532b5eebd7b30d628972a89f16287ca25b9bf7e5))
* **runtime-core:** support creating vnode from existing vnode ([c9629f2](https://github.com/kangjiancheng/vue-next/commit/c9629f26924fcb3c51994549a3013ccc05c1030a))
* **runtime-core:** support variadic children in `h` for simple JSX compat ([54d06ec](https://github.com/kangjiancheng/vue-next/commit/54d06ec495a1743415de9426962024ffb764e4fe)), closes [#1917](https://github.com/kangjiancheng/vue-next/issues/1917)
* **runtime-core:** type and attr fallthrough support for emits option ([bf473a6](https://github.com/kangjiancheng/vue-next/commit/bf473a64eacab21d734d556c66cc190aa4ff902d))
* **runtime-core:** warn access of undefined property during render ([8c1638d](https://github.com/kangjiancheng/vue-next/commit/8c1638da33036fc2b2b5fa363fd89e54ce471670))
* **runtime-core:** warn against user properties with reserved prefixes ([1bddeea](https://github.com/kangjiancheng/vue-next/commit/1bddeea24797fe5c66e469bb6bc526c17bfb7fde))
* **runtime-core:** warn async data() ([3e7bb7d](https://github.com/kangjiancheng/vue-next/commit/3e7bb7d110818d7b90ca4acc47afc30508f465b7))
* **runtime-core:** warn incorrect root props value (close [#375](https://github.com/kangjiancheng/vue-next/issues/375)) ([c53fae9](https://github.com/kangjiancheng/vue-next/commit/c53fae987d5b7980b7df48305e36f2c0ddf6c8a8))
* **runtime-core/reactivity:** expose shallowReactive ([#711](https://github.com/kangjiancheng/vue-next/issues/711)) ([21944c4](https://github.com/kangjiancheng/vue-next/commit/21944c4a42a65f20245794fa5f07add579b7121f))
* **runtime-dom:** support !important for patchStyle. ([#422](https://github.com/kangjiancheng/vue-next/issues/422)) ([34e2725](https://github.com/kangjiancheng/vue-next/commit/34e2725e9b8252f711d2475e7390f4137cee14ab))
* **runtime-dom:** support event options ([#149](https://github.com/kangjiancheng/vue-next/issues/149)) ([08df965](https://github.com/kangjiancheng/vue-next/commit/08df965e3c4fde06d8028369a606cdff35eb87d3))
* **runtime-dom:** support using mount target innerHTML as template ([6a92bbd](https://github.com/kangjiancheng/vue-next/commit/6a92bbd9c0e6ccc8bbea4119930292df64f09f3e))
* **runtime-dom:** useCssVars ([9f706a9](https://github.com/kangjiancheng/vue-next/commit/9f706a9f5ee52c8256c52111da4271bf43b811ab))
* **runtime-dom:** v-model directive runtime ([a42ad6c](https://github.com/kangjiancheng/vue-next/commit/a42ad6cc9d420decccd98df5115a80e721fca862))
* **runtime-dom/style:** support CSS variables and auto prefixing ([2b2727e](https://github.com/kangjiancheng/vue-next/commit/2b2727e62cf791d301dc254628d965a69bf3398a))
* **server-renderer:** render suspense in vnode mode ([#727](https://github.com/kangjiancheng/vue-next/issues/727)) ([589aeb4](https://github.com/kangjiancheng/vue-next/commit/589aeb402c58f463cc32d5e7728b56614bc9bf33))
* **server-renderer:** support on-the-fly template compilation ([#707](https://github.com/kangjiancheng/vue-next/issues/707)) ([6d10a6c](https://github.com/kangjiancheng/vue-next/commit/6d10a6c77242aec98103f15d6cb672ba63c18abf))
* **sfc:** ::slotted selector support ([f194aa0](https://github.com/kangjiancheng/vue-next/commit/f194aa0eea56caaeed3cf5624beebf3984599763))
* **sfc:** ::v-global() pseudo selector support ([31ca785](https://github.com/kangjiancheng/vue-next/commit/31ca7858bb9d9d9cb0e149182cf62ad03acb1104))
* **sfc:** accept inMap in compileTemplate() ([3a3a24d](https://github.com/kangjiancheng/vue-next/commit/3a3a24d621465e4b444e23585e0422fd877f2f2f))
* **sfc:** css modules support ([d84cf3a](https://github.com/kangjiancheng/vue-next/commit/d84cf3a538621c0ee636e650e9749bd1958efd59))
* **sfc:** scopeId runtime support ([69c9dbc](https://github.com/kangjiancheng/vue-next/commit/69c9dbc825163ab572a2e3c49837fbda20e15434))
* **sfc:** support resolving template components from `<script setup>` exports ([6f5d840](https://github.com/kangjiancheng/vue-next/commit/6f5d840612dbced2dbb4584c979a8f0cfc1f72f0))
* **sfc:** wip scopeId compiler support ([51980af](https://github.com/kangjiancheng/vue-next/commit/51980afca2e90784c51d13729cf5e18995bde43e))
* **shared:** support Map and Set in toDisplayString ([3c60d40](https://github.com/kangjiancheng/vue-next/commit/3c60d40827f65cbff024cfda4bb981a742bb83a7)), closes [#1067](https://github.com/kangjiancheng/vue-next/issues/1067) [#1100](https://github.com/kangjiancheng/vue-next/issues/1100)
* **ssr:** compiler-ssr support for Suspense ([80c625d](https://github.com/kangjiancheng/vue-next/commit/80c625dce33610e53c953e9fb8fde26e3e10e358))
* **ssr:** hide comment anchors during hydration in dev mode ([cad5bcc](https://github.com/kangjiancheng/vue-next/commit/cad5bcce40b9f2aaa520ccbd377cd5419650e55f))
* **ssr:** hydration mismatch handling ([91269da](https://github.com/kangjiancheng/vue-next/commit/91269da52c30abf6c50312555b715f5360224bb0))
* **ssr:** improve fragment mismatch handling ([60ed4e7](https://github.com/kangjiancheng/vue-next/commit/60ed4e7e0821a2932660b87fbf8d5ca953e0e073))
* **ssr:** render portals ([#714](https://github.com/kangjiancheng/vue-next/issues/714)) ([e495fa4](https://github.com/kangjiancheng/vue-next/commit/e495fa4a1872d03ed59252e7ed5dd2b708adb7ae))
* **ssr:** renderToStream ([#1197](https://github.com/kangjiancheng/vue-next/issues/1197)) ([6bc0e0a](https://github.com/kangjiancheng/vue-next/commit/6bc0e0a31a173cfd4cef82230862f269e4d94c94))
* **ssr:** support getSSRProps for vnode directives ([c450ede](https://github.com/kangjiancheng/vue-next/commit/c450ede12d1a93a70271a2fe7fcb6f8efcf1cd4c))
* **ssr:** support portal hydration ([70dc3e3](https://github.com/kangjiancheng/vue-next/commit/70dc3e3ae74f08d53243e6f078794c16f359e272))
* **ssr:** useSSRContext ([fd03149](https://github.com/kangjiancheng/vue-next/commit/fd031490fb89b7c0d1d478b586151a24324101a3))
* **ssr/suspense:** suspense hydration ([a3cc970](https://github.com/kangjiancheng/vue-next/commit/a3cc970030579f2c55d893d6e83bbc05324adad4))
* **suspense:** replace errors with warnings ([#412](https://github.com/kangjiancheng/vue-next/issues/412)) ([d3d2353](https://github.com/kangjiancheng/vue-next/commit/d3d2353eacdde6fa190eb6706bd104a64230dde3))
* **templateRef:** should work with direct reactive property ([449ab03](https://github.com/kangjiancheng/vue-next/commit/449ab039feb10df7179898b13ecc45028a043002)), closes [#901](https://github.com/kangjiancheng/vue-next/issues/901)
* **templateRef:** support template ref for all vnode types ([55b364d](https://github.com/kangjiancheng/vue-next/commit/55b364decc903a6c7fccd1cdcdcfc79948c848a2))
* mixins/extends/assets options ([02de984](https://github.com/kangjiancheng/vue-next/commit/02de984f1faec2504e6decb9c58c335fc5dbf9be))
* **transition:** add runtime props validation for TransitionGroup ([6d254da](https://github.com/kangjiancheng/vue-next/commit/6d254da532651b62e82e5a89ca0a3e75967e96ff))
* 2.x options support ([a6616e4](https://github.com/kangjiancheng/vue-next/commit/a6616e4210d900d46c0f80c3320e5f00da5f766a))
* activated/deactivated hooks ([ee50fb9](https://github.com/kangjiancheng/vue-next/commit/ee50fb9723375a344e0219583d2b5af0a4669edd))
* add hook for transforming h's arguments ([#851](https://github.com/kangjiancheng/vue-next/issues/851)) ([b7d1e0f](https://github.com/kangjiancheng/vue-next/commit/b7d1e0fa2ffe4561a589580eca6e92171c311347))
* add isCustomElement option ([#299](https://github.com/kangjiancheng/vue-next/issues/299)) ([f71bf2f](https://github.com/kangjiancheng/vue-next/commit/f71bf2f1d39bcf6f6d84467f02b20762245319fb))
* added transformVText to directiveTransform ([#182](https://github.com/kangjiancheng/vue-next/issues/182)) ([8cb56dd](https://github.com/kangjiancheng/vue-next/commit/8cb56ddb81c7a0c5a44ec14a7182eb3ebee85ec4))
* alias $attrs to $props when component has no declared props ([3a7bbec](https://github.com/kangjiancheng/vue-next/commit/3a7bbecb22d6240b93ba110633966a9a7ea48b8d))
* allow mixins to accept generics ([62214fa](https://github.com/kangjiancheng/vue-next/commit/62214fa42e09a9175c45b46a2485d42278f4e05e))
* applyDirective ([1e447d0](https://github.com/kangjiancheng/vue-next/commit/1e447d021bc09aacde3eb0928d5721f83e1f03c6))
* applyDirectives ([4974a47](https://github.com/kangjiancheng/vue-next/commit/4974a4711100fc5e9b2b4f58a79dd2ff1247d51d))
* applyDirectives ([a3b0f2b](https://github.com/kangjiancheng/vue-next/commit/a3b0f2bd1cdf4f23ab16b85c362d9ad62b717f07))
* asset resolution ([015d5dd](https://github.com/kangjiancheng/vue-next/commit/015d5dd0f101092a4f92cc01600f551659b236af))
* async component ([2c75338](https://github.com/kangjiancheng/vue-next/commit/2c753388c3aaa27f18ee9b924a53d69f4a84794e))
* attribute fallthrough ([cb01733](https://github.com/kangjiancheng/vue-next/commit/cb0173384276ae256237a801ae83d4f994793745))
* basic error handling ([6ce39b4](https://github.com/kangjiancheng/vue-next/commit/6ce39b4d2069a74e00175aba3670f71b9be13cc7))
* boolean casting ([e93e85b](https://github.com/kangjiancheng/vue-next/commit/e93e85bb2976c84aab59d34e4f94f6df775b66b6))
* clone observable data instead of warning ([3c49b30](https://github.com/kangjiancheng/vue-next/commit/3c49b30e1764053f4e7f880f00b5cff14265b833))
* createApp / appContext ([32713f8](https://github.com/kangjiancheng/vue-next/commit/32713f8fceb226a81d9669da090c54b2051ab876))
* created/beforeCreate ([81a31f7](https://github.com/kangjiancheng/vue-next/commit/81a31f79dc69dae1eac1b958af3f3a18bd1f67ac))
* delegate pointer events ([c9b33a9](https://github.com/kangjiancheng/vue-next/commit/c9b33a9e69b032febc6254c4e5560f4d65b0afb2))
* detailed info in renderTriggered + hint for skipping slot updates ([64029b4](https://github.com/kangjiancheng/vue-next/commit/64029b4a5451a504f71940e376919e39ed295e84))
* directives ([9b428c6](https://github.com/kangjiancheng/vue-next/commit/9b428c6d83d55aa26d292e4a7bca611e53cee7a9))
* dot-delimited path for watch ([296164c](https://github.com/kangjiancheng/vue-next/commit/296164c2076f7dab0b04c0c834d921fb8c2a2e82))
* emit compiler error for invalid JavaScript expressions ([e97951d](https://github.com/kangjiancheng/vue-next/commit/e97951dd2e9c3d6894d34eb5a2b4f8f0e46f4db4))
* enable returning observable state from hooks() ([a17c377](https://github.com/kangjiancheng/vue-next/commit/a17c377be0288670636b699eac509224218411e4))
* error handling for lifecycle hooks ([3d681f8](https://github.com/kangjiancheng/vue-next/commit/3d681f8bcd7bfdfde49aaa77e726808f6d20a78c))
* error handling for setup / render / watch / event handlers ([966d7b5](https://github.com/kangjiancheng/vue-next/commit/966d7b5487e320e955d858fba76e89fb42e9d6eb))
* error handling in scheduler ([09593c9](https://github.com/kangjiancheng/vue-next/commit/09593c94c3f9c96a07cac21582942595f58a073e))
* experimental time-slicing ([6ba0282](https://github.com/kangjiancheng/vue-next/commit/6ba02827b155aa7ea73a552d34241b13082d5efa))
* export all option types ([50d4241](https://github.com/kangjiancheng/vue-next/commit/50d424188cbdb90e9217c71270bbed18c7cd90fc))
* expose __vue__ in dev mode ([65033ce](https://github.com/kangjiancheng/vue-next/commit/65033cec9db46573b804c4372ad2be29c5d338ce))
* expose compiler APIs ([d7aab85](https://github.com/kangjiancheng/vue-next/commit/d7aab859a35dc6daa4eb531452ec59722c52b060))
* fix all cases for h and options type inference ([94a0556](https://github.com/kangjiancheng/vue-next/commit/94a05561f8253840b00a31f4be5d2d8455836a93))
* full watch api ([ddd55fa](https://github.com/kangjiancheng/vue-next/commit/ddd55fae54e16de6d8dab3dcec7c80bb2a0cca47))
* hooks that match current API ([6767bf8](https://github.com/kangjiancheng/vue-next/commit/6767bf83c46edf582aa4d80fabbd48f9604db81b))
* implement basic hooks ([832d715](https://github.com/kangjiancheng/vue-next/commit/832d715afe104669524f4d62bfcc1cb88ca04262))
* implement basic test renderer ([da20a06](https://github.com/kangjiancheng/vue-next/commit/da20a06a78c9166d89f6410d7fd96e5c637286ca))
* improve static content stringiciation ([d965bb6](https://github.com/kangjiancheng/vue-next/commit/d965bb6227d53b715cfb797114b9452a6db841ec))
* improve warning component trace ([2507ad2](https://github.com/kangjiancheng/vue-next/commit/2507ad2b44bbce0d02bc0354f5aff3c7949c6793))
* inheritAttrs ([b5db956](https://github.com/kangjiancheng/vue-next/commit/b5db956f9a4c8a38d20bf6bc23b34309313d6d9c))
* Initial devtools support ([#1125](https://github.com/kangjiancheng/vue-next/issues/1125)) ([568b6db](https://github.com/kangjiancheng/vue-next/commit/568b6db12b9fa167569809dc0da7e0e3c026f204))
* interop with object syntax in all builds ([848b920](https://github.com/kangjiancheng/vue-next/commit/848b92070ba3488af9c0a96b9f983b81e97c45c0))
* keep-alive ([7c2ec8a](https://github.com/kangjiancheng/vue-next/commit/7c2ec8ace05b173b00631be43f8dc65f6d9540fd))
* log on the fly template compilation error ([95d7e1f](https://github.com/kangjiancheng/vue-next/commit/95d7e1f471ed098f1f3bb3fa9cb4bd27bc2e76c8))
* make functional components time-slicable ([d5862d8](https://github.com/kangjiancheng/vue-next/commit/d5862d8c51065babd031edaf173a92c552ce0b4c))
* make hooks usable inside classes ([894bead](https://github.com/kangjiancheng/vue-next/commit/894bead9141af17b8368d04aded010d8f6ec382b))
* oldValue for directives ([1def00e](https://github.com/kangjiancheng/vue-next/commit/1def00e96e399d49e282cee0fa6291404d90f456))
* on-the-fly template compilation ([3ddd121](https://github.com/kangjiancheng/vue-next/commit/3ddd121b197d8c640262d594089d4abe7367fb14))
* process certain attrs as properties ([93d7243](https://github.com/kangjiancheng/vue-next/commit/93d724382ee59a9f2bae259fc17bbde9bc460ef0))
* production tip ([c833db9](https://github.com/kangjiancheng/vue-next/commit/c833db9c9728382aed747313e2718622b2305b42))
* proper static tree skip ([fc5aa6d](https://github.com/kangjiancheng/vue-next/commit/fc5aa6d0be9886e7bdda013469fba219da1080c9))
* provide ability to overwrite feature flags in esm-bundler builds ([54727f9](https://github.com/kangjiancheng/vue-next/commit/54727f9874abe8d0c99ee153d252269ae519b45d))
* provide/inject ([7484b4d](https://github.com/kangjiancheng/vue-next/commit/7484b4d2e6e64732f53c71ac2ad18c681b0aeb2a))
* re-suspense when encountering new async deps in resolved state ([1c628d0](https://github.com/kangjiancheng/vue-next/commit/1c628d0b79ec31c8f44fec074a2728cf8b1e0bdc))
* renderError ([44d1a8e](https://github.com/kangjiancheng/vue-next/commit/44d1a8efcbf7513a0043bb4521487f633f248016))
* renderList helper for v-for ([6ad8461](https://github.com/kangjiancheng/vue-next/commit/6ad84614f7384947663852c2c437d9ebcefa7472))
* renderTracked & renderTriggered ([ef1d621](https://github.com/kangjiancheng/vue-next/commit/ef1d62116292bdbf04a0f59abaea6edd7c414f17))
* renderTriggered for forced updates ([6027d48](https://github.com/kangjiancheng/vue-next/commit/6027d480f3bcf1a3acc43793b74958de66081e7a))
* runtime component name validation ([#217](https://github.com/kangjiancheng/vue-next/issues/217)) ([66023a8](https://github.com/kangjiancheng/vue-next/commit/66023a888633b00ef328d7a7154cf8a9cda527ec))
* runtime prop validation ([2241ad7](https://github.com/kangjiancheng/vue-next/commit/2241ad776545cfc83abd52df85cb46941a466694))
* serialize for test renderer ([21e8798](https://github.com/kangjiancheng/vue-next/commit/21e8798a2126700b14a3c7024417626d7b4ad9c3))
* show fragment ids in dev ([e1d25e3](https://github.com/kangjiancheng/vue-next/commit/e1d25e35379fa935035888faceced5a850061daf))
* simplify prop/attr checking ([35effde](https://github.com/kangjiancheng/vue-next/commit/35effdee5aca20eaa7c2be7d97fe59e82bd6a3f0))
* skip constant trees and memoize fn ([131936f](https://github.com/kangjiancheng/vue-next/commit/131936f1441d1000d1f28d0f749e78a2406a8943))
* ssr support for `<style vars>` ([b9595e6](https://github.com/kangjiancheng/vue-next/commit/b9595e64cfdfc2607d3d3e6232b4a7ea199dd553))
* support defining data in constructor/initialzers ([60e803c](https://github.com/kangjiancheng/vue-next/commit/60e803ce629858ff03cf630aef4861d9adf831f4))
* support delimiters option for runtime compilation ([ba17c87](https://github.com/kangjiancheng/vue-next/commit/ba17c871d80f833e064a51900d07efa358eafb89)), closes [#1679](https://github.com/kangjiancheng/vue-next/issues/1679)
* support initializers in mixins ([7ce16ea](https://github.com/kangjiancheng/vue-next/commit/7ce16ea8d66e4ce6c05deb5052f0066c446b9eae))
* template ref handling + ref unmount ([8f9afdf](https://github.com/kangjiancheng/vue-next/commit/8f9afdff643af6ba0df5df88cd57732c0b484775))
* toRefs ([b218678](https://github.com/kangjiancheng/vue-next/commit/b218678c66dc99ffe0d62e4a9b44834a73213abe))
* update svg tag list ([5023dff](https://github.com/kangjiancheng/vue-next/commit/5023dff60cab98b4f8208c94ce18ae1fc85b2e73))
* use internal warning ([7e6fdb8](https://github.com/kangjiancheng/vue-next/commit/7e6fdb8cc46a1578c440654de82cfea354f6f4c0))
* v-on with no argument ([9b06e04](https://github.com/kangjiancheng/vue-next/commit/9b06e04e0f2970747ca2d0e7491cf15737cc8a94))
* v-once ([93c6aa4](https://github.com/kangjiancheng/vue-next/commit/93c6aa4c9080136c8b2df09adcc64795664aedc1))
* vnode hooks ([1106e22](https://github.com/kangjiancheng/vue-next/commit/1106e2208dfab9c1e33be216b058ee7743be21d7))
* warn duplicate plugin installations ([c61e546](https://github.com/kangjiancheng/vue-next/commit/c61e5463fa77a56c4271db958e4a8e48bb2ae233))
* **transition:** base transition component ([93561b0](https://github.com/kangjiancheng/vue-next/commit/93561b080eea3acb028739e1354b9004c5feaf0d))
* **transition:** compat with keep-alive ([c6fb506](https://github.com/kangjiancheng/vue-next/commit/c6fb506fc0a5d60d92f9fb4ce3f35d6cdee2ebd8))
* **transition:** CSS transition for runtime-dom ([7859e4b](https://github.com/kangjiancheng/vue-next/commit/7859e4bce337919711107a2eebcf4740e9d29f85))
* **transition:** handle cancel hooks ([5c691ae](https://github.com/kangjiancheng/vue-next/commit/5c691aebfd65311e38134e539057cd1dd8051445))
* **transition:** handle persisted mode ([1b82366](https://github.com/kangjiancheng/vue-next/commit/1b8236615e68d9e6e4811a08e4f5c99da6ea175e))
* **transition:** handle transition classes when patching classes ([be9b4b2](https://github.com/kangjiancheng/vue-next/commit/be9b4b252723bac5582630b72188eb00d97606cc))
* **transition:** properly handle transition & transition-group in compiler ([0e3e070](https://github.com/kangjiancheng/vue-next/commit/0e3e07079a7e537f51fe45626f1b7e053f4f3a60))
* **transition:** support component child ([79f23a2](https://github.com/kangjiancheng/vue-next/commit/79f23a2f7758912714492c8240d81df4e244c3cf))
* **transition:** support in templates ([1765985](https://github.com/kangjiancheng/vue-next/commit/1765985ec2c36ebc716f020d03013c75ed7b51ca))
* **transition:** TransitionGroup ([800b0f0](https://github.com/kangjiancheng/vue-next/commit/800b0f0e7a1176f630efed877251205968c6f934))
* **transition:** warn non-animatable component root node ([01eb3c1](https://github.com/kangjiancheng/vue-next/commit/01eb3c12e9711bd1efb5f1e8ee48a34dd315b380))
* **types:** adjust type exports for manual render function and tooling usage ([e4dc03a](https://github.com/kangjiancheng/vue-next/commit/e4dc03a8b17d5e9f167de6a62a645878ac7ef3e2)), closes [#1329](https://github.com/kangjiancheng/vue-next/issues/1329)
* **types:** deny unknown attributes on component by default ([#1614](https://github.com/kangjiancheng/vue-next/issues/1614)) ([5d8a64d](https://github.com/kangjiancheng/vue-next/commit/5d8a64d53a27ad57fe9940dd0d4d745dfbaf3c9e)), closes [#1519](https://github.com/kangjiancheng/vue-next/issues/1519)
* **types:** export `ErrorTypes` ([#840](https://github.com/kangjiancheng/vue-next/issues/840)) ([760c3e0](https://github.com/kangjiancheng/vue-next/commit/760c3e0fd67f6360995cdbb125f9eae4e024f3af))
* **types:** expose `ToRefs` type ([#1037](https://github.com/kangjiancheng/vue-next/issues/1037)) ([28b4c31](https://github.com/kangjiancheng/vue-next/commit/28b4c317b412e0c08bb791d647d4234078c41542))
* **types:** expose ComponentCustomOptions for declaring custom options ([c0adb67](https://github.com/kangjiancheng/vue-next/commit/c0adb67c2e10d07af74304accbc1c79d19f6c196))
* **types:** expose DeepReadonly type ([#1606](https://github.com/kangjiancheng/vue-next/issues/1606)) ([527c2c8](https://github.com/kangjiancheng/vue-next/commit/527c2c8bbb5c8fcfdf827dd985a09d7e7388cdad))
* **types:** expose ExtractPropTypes ([#983](https://github.com/kangjiancheng/vue-next/issues/983)) ([4cf5e07](https://github.com/kangjiancheng/vue-next/commit/4cf5e07608a85f1526b89e90ee3710d40cb5a964))
* **types:** expose WritableComputedRef ([#1500](https://github.com/kangjiancheng/vue-next/issues/1500)) ([220db9b](https://github.com/kangjiancheng/vue-next/commit/220db9bcda17a56bb4e5222d2634800672513983))
* **types:** mixins/extends support in TypeScript ([#626](https://github.com/kangjiancheng/vue-next/issues/626)) ([d3c436a](https://github.com/kangjiancheng/vue-next/commit/d3c436ae2e66b75b7f2ed574dadda3f0e1fdce73))
* **types:** re-expose `withDirectives` as public type ([583ba0c](https://github.com/kangjiancheng/vue-next/commit/583ba0c172de7a2fd0d2dc93ad7e4f40c53ba7ac))
* **types:** re-expose resolve asset utitlies and registerRuntimeCompiler in type definitions ([64ef7c7](https://github.com/kangjiancheng/vue-next/commit/64ef7c76bf0dfa4897d930e9d369a026d1ecbaf6)), closes [#1109](https://github.com/kangjiancheng/vue-next/issues/1109)
* **types:** re-expose trasnformVNodeArgs ([40166a8](https://github.com/kangjiancheng/vue-next/commit/40166a8637a0f0272eb80777650398ccc067af88))
* **types:** support typing directive value via generic argument ([#1007](https://github.com/kangjiancheng/vue-next/issues/1007)) ([419b86d](https://github.com/kangjiancheng/vue-next/commit/419b86d1908f2a0521e6a7eafcbee764e9ee59a0)), closes [#998](https://github.com/kangjiancheng/vue-next/issues/998)
* **types:** update to Typescript 3.9 ([#1106](https://github.com/kangjiancheng/vue-next/issues/1106)) ([97dedeb](https://github.com/kangjiancheng/vue-next/commit/97dedebd8097116a16209664a1ca38392b964da3))
* warn when toRefs() receives non-reactive object ([#430](https://github.com/kangjiancheng/vue-next/issues/430)) ([a02820d](https://github.com/kangjiancheng/vue-next/commit/a02820d7e046d32f635f04104472fc9f823e9d49))
* **types): feat(types:** add `ComponentCustomProperties` interface ([#982](https://github.com/kangjiancheng/vue-next/issues/982)) ([be21cfb](https://github.com/kangjiancheng/vue-next/commit/be21cfb1db1a60fb0f2dda57d7f62d1c126a064b))
* **types/reactivity:** use `DeepReadonly` type for `readonly` return type ([#1462](https://github.com/kangjiancheng/vue-next/issues/1462)) ([b772bba](https://github.com/kangjiancheng/vue-next/commit/b772bba5587726e78b20ccb9b61374120bd4b0ae)), closes [#1452](https://github.com/kangjiancheng/vue-next/issues/1452)
* **v-model:** number/trim modifier + array checkbox support ([14aabf0](https://github.com/kangjiancheng/vue-next/commit/14aabf0f98d4bc6084266e763b40b14e5d02c5b0))
* **v-on:** cache handlers ([58593c4](https://github.com/kangjiancheng/vue-next/commit/58593c47144d8022ef46814bce04687d2585a9d3))
* **vModel:** handle true-value and false-value for checkbox ([#449](https://github.com/kangjiancheng/vue-next/issues/449)) ([fe66194](https://github.com/kangjiancheng/vue-next/commit/fe66194a77f68c610ad4d6c6eb143441f3ab0ac5))
* **vModel:** warn if v-model is used on file input ([#295](https://github.com/kangjiancheng/vue-next/issues/295)) ([8eba1ab](https://github.com/kangjiancheng/vue-next/commit/8eba1aba087dccf85c10f29bdf7e78b015012a8b))
* **vue:** handle template querySelector ([c8895e7](https://github.com/kangjiancheng/vue-next/commit/c8895e7cb966dee7f549f825d63d0af8fda28041))
* **warn:** infer anonymous component named based on resolve name ([dece610](https://github.com/kangjiancheng/vue-next/commit/dece6102aa84c115a3d6481c6e0f27e5b4be3ef1))
* **watch:** support directly watching reactive object in multiple sources with deep default ([#1201](https://github.com/kangjiancheng/vue-next/issues/1201)) ([ba62ccd](https://github.com/kangjiancheng/vue-next/commit/ba62ccd55d659a874ece4b26454ae31c6de72f59))
* **watch:** support directly watching reactive object with deep default ([6b33cc4](https://github.com/kangjiancheng/vue-next/commit/6b33cc422933a004fb116fc5182b3fa3a32567ff)), closes [#1110](https://github.com/kangjiancheng/vue-next/issues/1110)
* **watch:** warn when using lazy with simple callback ([3deb20d](https://github.com/kangjiancheng/vue-next/commit/3deb20df637079010ff1c8a154924bf0bc268f57))
* warn missing render() function ([2f936a0](https://github.com/kangjiancheng/vue-next/commit/2f936a0dfe165a1f9e96b1ebabab2491e300c5ef))
* warn ref usage on functional components ([7f05478](https://github.com/kangjiancheng/vue-next/commit/7f054782ad0dde832e22e5cc1fb1186c1340d020))
* warning context ([fd018b8](https://github.com/kangjiancheng/vue-next/commit/fd018b83b5d28449a6b5340be2bdf66bb1c82c72))
* warning traces & error handling for functional render ([5327abb](https://github.com/kangjiancheng/vue-next/commit/5327abb249692b210b114330bd2ac3115de5084b))


### Performance Improvements

* avoid cloning in parser advanceBy ([81fd694](https://github.com/kangjiancheng/vue-next/commit/81fd694dd7b4d8e264661fe7957f8b5ab6892658))
* avoid parentNode call when dynamic child is not a Fragment ([1b06b3c](https://github.com/kangjiancheng/vue-next/commit/1b06b3c424a7d754aa3a118da4e391f239d5a377))
* avoid using WeakSet for isRef check ([46bd9db](https://github.com/kangjiancheng/vue-next/commit/46bd9dbab06feeeadb7ae32a080b4fc32fc4511f))
* cache string helpers ([04e1118](https://github.com/kangjiancheng/vue-next/commit/04e11187b9e9eaddd6199413f7c99d3558df5620))
* further tweak accessCache ([d179918](https://github.com/kangjiancheng/vue-next/commit/d179918001e7bf88b0701ab73f982ca1e7626781))
* improve directive runtime performance ([07ce2c5](https://github.com/kangjiancheng/vue-next/commit/07ce2c5fa7b389bc3fdfee4d3e28a1817b2bd422))
* improve inject performance ([117630f](https://github.com/kangjiancheng/vue-next/commit/117630fb926e6cbd5a5efad7c377397fee532597))
* instance public proxy should never be observed ([11f38d8](https://github.com/kangjiancheng/vue-next/commit/11f38d8a853b2d8043212c17612b63df92322de4))
* micro optimizations for vnode creation ([8be578b](https://github.com/kangjiancheng/vue-next/commit/8be578b6b6886bd0f13bf197fa9778b6cc7dad1e))
* minor tweaks ([e3b6897](https://github.com/kangjiancheng/vue-next/commit/e3b68972d8eacfd89158dff9e496ec90f62da602))
* only patch string style when value has changed ([#1310](https://github.com/kangjiancheng/vue-next/issues/1310)) ([d4e9b19](https://github.com/kangjiancheng/vue-next/commit/d4e9b19932dac686f57091e66f21a80d4c5db881)), closes [#1309](https://github.com/kangjiancheng/vue-next/issues/1309)
* optimize LRU access in keep-alive ([#1316](https://github.com/kangjiancheng/vue-next/issues/1316)) ([1f2926a](https://github.com/kangjiancheng/vue-next/commit/1f2926a33c78b6a6f4752a01b88f7cad809ed302))
* optimize props resolution ([2c3c657](https://github.com/kangjiancheng/vue-next/commit/2c3c65772b628fc4013b5d777be41b0fe1d515ce))
* optimize public properties access on componentProxy ([d6da48a](https://github.com/kangjiancheng/vue-next/commit/d6da48a33f4e44f110d26928158125427f72abfc))
* prevent renderer hot functions being inlined by minifiers ([629ee75](https://github.com/kangjiancheng/vue-next/commit/629ee75588fc2ca4ab2b3786046f788d3547b6bc))
* revert to _isRef for perf ([cdee65a](https://github.com/kangjiancheng/vue-next/commit/cdee65aa1b3f0187949a0c186ee6ee78bf0df5c3))
* **compiler:** should only perform assertions during tests ([353b06d](https://github.com/kangjiancheng/vue-next/commit/353b06df7756c2364b7473d0bb4e2c4c3547445e))
* skip hasScopeRef check if there are no scope vars ([b980ddb](https://github.com/kangjiancheng/vue-next/commit/b980ddb607f12e82b86cffbc96051c8b41f0da8b))
* skip initializer extraction for options objects ([f142c32](https://github.com/kangjiancheng/vue-next/commit/f142c322e0a18f7f9337212d4cf94c01f2ba701d))
* **compiler:** further improve advanceBy perf ([98571ab](https://github.com/kangjiancheng/vue-next/commit/98571ab496cbf4d8a5e0df091d19d3206b9ed1eb))
* **compiler:** improve perf of parseTextData ([4fef8f3](https://github.com/kangjiancheng/vue-next/commit/4fef8f342a7c90a1d1994b943edf361175b7e6b4))
* **compiler:** minor perf tweaks ([51d57b4](https://github.com/kangjiancheng/vue-next/commit/51d57b456636e246524aa064a7788dcc7658588d))
* **compiler:** pre-compute maxCRNameLength for perf ([1de0725](https://github.com/kangjiancheng/vue-next/commit/1de072567d072bb61c5aed5df1e717fa92e1ce0d))
* **compiler-core:** add perf optimization to parseText ([#458](https://github.com/kangjiancheng/vue-next/issues/458)) ([2780e0d](https://github.com/kangjiancheng/vue-next/commit/2780e0df4cc0e8ab53b586e1cf63527eacc69a84))
* **compiler-core:** set simple expression outside map ([#485](https://github.com/kangjiancheng/vue-next/issues/485)) ([009dc80](https://github.com/kangjiancheng/vue-next/commit/009dc806740f4011cdaf026fc1970b85341bb23c))
* **compiler-core:** simplify `advancePositionWithMutation` ([#564](https://github.com/kangjiancheng/vue-next/issues/564)) ([ad2a0bd](https://github.com/kangjiancheng/vue-next/commit/ad2a0bde988de743d4abc62b681b6a4888545a51))
* **compiler-core:** treat v-for with constant exp as a stable fragment ([#1394](https://github.com/kangjiancheng/vue-next/issues/1394)) ([8a2cf21](https://github.com/kangjiancheng/vue-next/commit/8a2cf21b717411e4e66f9223e9f6d1c5c817c6ac))
* **compiler-dom:** generate modifiers in a function ([#459](https://github.com/kangjiancheng/vue-next/issues/459)) ([96623d0](https://github.com/kangjiancheng/vue-next/commit/96623d0d52d1f7e9430dde9d86583728a4f7e626))
* **compiler-dom:** use makeMap instead of RegEx ([#354](https://github.com/kangjiancheng/vue-next/issues/354)) ([a489f98](https://github.com/kangjiancheng/vue-next/commit/a489f98a6625fbd61067e2d4721c1204bd22ea45))
* **compiler-sfc:** improve asset url trasnform efficiency ([c5dcfe1](https://github.com/kangjiancheng/vue-next/commit/c5dcfe16f6cd3503ce1d5349cfacbe099a7e19be))
* **compiler-sfc:** only add character mapping if not whitespace ([2f69167](https://github.com/kangjiancheng/vue-next/commit/2f69167e889f2817138629a04c01c6baf565d485))
* **core:** cache property access types on renderProxy ([4771319](https://github.com/kangjiancheng/vue-next/commit/4771319a1544afa46920c30e33c02d4fe5fd9561))
* **core:** use `startsWith` instead of `indexOf` ([#989](https://github.com/kangjiancheng/vue-next/issues/989)) ([054ccec](https://github.com/kangjiancheng/vue-next/commit/054ccecd58c36b909661598f43a4056ed07e59c2))
* **effect:** optimize effect trigger for array length mutation ([#761](https://github.com/kangjiancheng/vue-next/issues/761)) ([76c7f54](https://github.com/kangjiancheng/vue-next/commit/76c7f5426919f9d29a303263bc54a1e42a66e94b))
* **reactivity:** better computed tracking ([#710](https://github.com/kangjiancheng/vue-next/issues/710)) ([8874b21](https://github.com/kangjiancheng/vue-next/commit/8874b21a7e2383a8bb6c15a7095c1853aa5ae705))
* **reactivity:** improve ref performance by using class-based implementation ([#1900](https://github.com/kangjiancheng/vue-next/issues/1900)) ([07919e0](https://github.com/kangjiancheng/vue-next/commit/07919e00658592ebdb42f0c6f004f631c4bf4d34))
* **reactivity:** only trigger all effects on Array length mutation if new length is shorter than old length ([33622d6](https://github.com/kangjiancheng/vue-next/commit/33622d63600ba0f18ba4dae97bda882c918b5f7d))
* **reactivity:** optimize effect stack ([46c5393](https://github.com/kangjiancheng/vue-next/commit/46c53932242b6393cf76c6dba3f42aa1d8692eab))
* **reactivity:** optimize the performance of the `canObserve` ([#330](https://github.com/kangjiancheng/vue-next/issues/330)) ([60961ef](https://github.com/kangjiancheng/vue-next/commit/60961ef5b6bd180fc7483571cfaa9c887d168734))
* **reactivity:** ref should not trigger if value did not change ([b0d4df9](https://github.com/kangjiancheng/vue-next/commit/b0d4df974339a570fd30263797cf948619e1f57b)), closes [#1012](https://github.com/kangjiancheng/vue-next/issues/1012)
* **reactivity:** should not track `__v_isRef` ([#1392](https://github.com/kangjiancheng/vue-next/issues/1392)) ([c43a6e6](https://github.com/kangjiancheng/vue-next/commit/c43a6e61a0952c629cfb062f67e8eb27a0f6f227))
* **runtime-core:** avoid duplicate postFlushCb invocation ([165068d](https://github.com/kangjiancheng/vue-next/commit/165068dbc295bb70fdec9ae56dfcaac17d2f977c)), closes [#1595](https://github.com/kangjiancheng/vue-next/issues/1595)
* **runtime-core:** use `makeMap` instead of `RE` ([#350](https://github.com/kangjiancheng/vue-next/issues/350)) ([9dcbf17](https://github.com/kangjiancheng/vue-next/commit/9dcbf17f3af18d8e10e01a71003c6de8d87b812c))
* **runtime-core:** use faster diff map population ([#319](https://github.com/kangjiancheng/vue-next/issues/319)) ([48b79d0](https://github.com/kangjiancheng/vue-next/commit/48b79d02e8a7c077eeae40bd94e3383067e54030))
* **runtime-core:** use raw context on component options init ([bfd6744](https://github.com/kangjiancheng/vue-next/commit/bfd6744fb1db36a02914ef48da7116636343f313))
* **ssr:** avoid unnecessary async overhead ([297282a](https://github.com/kangjiancheng/vue-next/commit/297282a81259289bfed207d0c9393337aea70117))
* **ssr:** avoid unnecessary await ticks when unrolling sync buffers ([30584bc](https://github.com/kangjiancheng/vue-next/commit/30584bcc61515eb9200071b8a4780e05c2ab786e))
* **transform-vif:** don't need to createBlock for a component ([#853](https://github.com/kangjiancheng/vue-next/issues/853)) ([a3601e9](https://github.com/kangjiancheng/vue-next/commit/a3601e9fa73d10f524ed3bdf3ae44df8847c1230))
* **v-for:** use faster array population in renderList ([b20b922](https://github.com/kangjiancheng/vue-next/commit/b20b922d9943397bcd9ac33d7bde88caa84e986e))
* skip normalizeVNode in optimized mode ([520af97](https://github.com/kangjiancheng/vue-next/commit/520af9787b54955e2ae883679d241f2013271df8))
* skip props update if data object is the same ([d8cda23](https://github.com/kangjiancheng/vue-next/commit/d8cda2387f716fb7eb90dd50b65e6acac11484ff))
* use makeMap for reserved prop check ([6c7787d](https://github.com/kangjiancheng/vue-next/commit/6c7787db7b451c0c18ff9a77321a0c49e1bdeddd))
* using a _isVNode field is faster than a weakset ([7f06981](https://github.com/kangjiancheng/vue-next/commit/7f06981f7c060235a33698cb00f1ecab6a6210bc))
* v-for fragments do not need to track dynamicChildren ([1b9bd69](https://github.com/kangjiancheng/vue-next/commit/1b9bd6912e6acd683b4c34856faf21c2eea71cc4))


### Reverts

* "wip: handle value -> value assignment in reactive object" ([2fc0d59](https://github.com/kangjiancheng/vue-next/commit/2fc0d599db55b7890c6ca0a974559e65c5535fb4))
* Revert "feat(reactivity): add effect to public api (#909)" (#961) ([9e9d264](https://github.com/kangjiancheng/vue-next/commit/9e9d2644127a17f770f325d1f1c88b12a34c8789)), closes [#909](https://github.com/kangjiancheng/vue-next/issues/909) [#961](https://github.com/kangjiancheng/vue-next/issues/961)
* Revert "feat(compiler-core): hoist element with static ref (#344)" ([a0d570b](https://github.com/kangjiancheng/vue-next/commit/a0d570b16d49a304e550ce3105cd02bfc0b05ea4)), closes [#344](https://github.com/kangjiancheng/vue-next/issues/344)
* Revert "chore: remove useless else (#245)" (#257) ([8e5ea98](https://github.com/kangjiancheng/vue-next/commit/8e5ea98ccda7784edc4feee9a20ca2f32de405f0)), closes [#245](https://github.com/kangjiancheng/vue-next/issues/245) [#257](https://github.com/kangjiancheng/vue-next/issues/257)


### types

* use more consistent naming for apiWatch type exports ([892fb6d](https://github.com/kangjiancheng/vue-next/commit/892fb6d2290516df44241992b62d65f1376f611a))


### BREAKING CHANGES

* **reactivity:** template auto ref unwrapping are now applied shallowly,
i.e. only at the root level. See https://github.com/vuejs/vue-next/pull/1682 for
more details.
* `createApp` API has been adjusted.

  - `createApp()` now accepts the root component, and optionally a props
  object to pass to the root component.
  - `app.mount()` now accepts a single argument (the root container)
  - `app.unmount()` no longer requires arguments.

  New behavior looks like the following:

  ``` js
  const app = createApp(RootComponent)
  app.mount('#app')
  app.unmount()
  ```
* **compiler-sfc:** `@vue/compiler-sfc`'s `transformAssetUrlsBase` option
has been removed. It is merged into `trasnformAssetUrls` which now also
accepts the format of

  ```ts
  {
    base?: string
    includeAbsolute?: string
    tags?: { [name: string]: string[] }
  }
  ```
* **types:** Internal APIs are now excluded from type decalrations.
* Some watch API types are renamed.

    - `BaseWatchOptions` -> `WatchOptionsBase`
    - `StopHandle` -> `WatchStopHandle`
* **reactivity:** Reactivity APIs adjustments:

- `readonly` is now non-tracking if called on plain objects.
  `lock` and `unlock` have been removed. A `readonly` proxy can no
  longer be directly mutated. However, it can still wrap an already
  reactive object and track changes to the source reactive object.

- `isReactive` now only returns true for proxies created by `reactive`,
   or a `readonly` proxy that wraps a `reactive` proxy.

- A new utility `isProxy` is introduced, which returns true for both
  reactive or readonly proxies.

- `markNonReactive` has been renamed to `markRaw`.
* **reactivity:** `markReadonly` has been removed.
* **runtime-dom:** Only props starting with `on` followed by an uppercase
letter or a non-letter character are considered event listeners.
* **runtime-core:** this.$emit() and setupContext.emit() no longer
return values. For logic that relies on return value of listeners,
the listener should be declared as an `onXXX` prop and be called
directly. This still allows the parent component to pass in
a handler using `v-on`, since `v-on:foo` internally compiles
to `onFoo`.

    ref: https://github.com/vuejs/rfcs/pull/16
* **compiler:** compiler options have been adjusted.
    - new option `decodeEntities` is added.
    - `namedCharacterReferences` option has been removed.
    - `maxCRNameLength` option has been rmeoved.
* **asyncComponent:** `retryWhen` and `maxRetries` options for
`defineAsyncComponent` has been replaced by the more flexible `onError`
option, per https://github.com/vuejs/rfcs/pull/148
* **runtime-core:** attribute fallthrough behavior has been adjusted
according to https://github.com/vuejs/rfcs/pull/154
* **compiler/types:** `getTextMode` compiler option signature has changed from

  ```ts
  (tag: string, ns: string, parent: ElementNode | undefined) => TextModes
  ```

  to

  ```ts
  (node: ElementNode, parent: ElementNode | undefined) => TextModes
  ```
* **asyncComponent:** async component `error` and `loading` options have been
renamed to `errorComponent` and `loadingComponent` respectively.
* **runtime-core:** `createAsyncComponent` has been renamed to `defineAsyncComponent` for consistency with `defineComponent`.
* **runtime-core:** data no longer supports object format (per RFC-0020)
* **runtime-core:** `RendererOptions.patchProp` arguments order has changed

  The `prevValue` and `nextValue` position has been swapped to keep it
  consistent with other functions in the renderer implementation. This
  only affects custom renderers using the `createRenderer` API.
* **runtime-core:** adjust attr fallthrough behavior

    Updated per pending RFC https://github.com/vuejs/rfcs/pull/137

    - Implicit fallthrough now by default only applies for a whitelist
      of attributes (class, style, event listeners, a11y attributes, and
      data attributes).

    - Fallthrough is now applied regardless of whether the component has
* **runtime-core:** revert setup() result reactive conversion

    Revert 6b10f0c & a840e7d. The motivation of the original change was
    avoiding unnecessary deep conversions, but that can be achieved by
    explicitly marking values non-reactive via `markNonReactive`.

    Removing the reactive conversion behavior leads to an usability
    issue in that plain objects containing refs (which is what most
    composition functions will return), when exposed as a nested
    property from `setup()`, will not unwrap the refs in templates. This
    goes against the "no .value in template" intuition and the only
    workaround requires users to manually wrap it again with `reactive()`.

    So in this commit we are reverting to the previous behavior where
    objects returned from `setup()` are implicitly wrapped with
    `reactive()` for deep ref unwrapping.
* **runtime-core:** replae `watch(fn, options?)` with `watchEffect`

    The `watch(fn, options?)` signature has been replaced by the new
    `watchEffect` API, which has the same usage and behavior. `watch`
    now only supports the `watch(source, cb, options?)` signautre.
* reactive arrays no longer unwraps contained refs

    When reactive arrays contain refs, especially a mix of refs and
    plain values, Array prototype methods will fail to function
    properly - e.g. sort() or reverse() will overwrite the ref's value
* **watch:** `watch` behavior has been adjusted.

    - When using the `watch(source, callback, options?)` signature, the
      callback now fires lazily by default (consistent with 2.x
      behavior).

      Note that the `watch(effect, options?)` signature is still eager,
      since it must invoke the `effect` immediately to collect
      dependencies.

    - The `lazy` option has been replaced by the opposite `immediate`
      option, which defaults to `false`. (It's ignored when using the
      effect signature)

    - Due to the above changes, the `watch` option in Options API now
      behaves exactly the same as 2.x.

    - When using the effect signature or `{ immediate: true }`, the
      intital execution is now performed synchronously instead of
      deferred until the component is mounted. This is necessary for
      certain use cases to work properly with `async setup()` and
      Suspense.

      The side effect of this is the immediate watcher invocation will
      no longer have access to the mounted DOM. However, the watcher can
      be initiated inside `onMounted` to retain previous behavior.
* object returned from `setup()` are no longer implicitly
passed to `reactive()`.

  The renderContext is the object returned by `setup()` (or a new object
  if no setup() is present). Before this change, it was implicitly passed
  to `reactive()` for ref unwrapping. But this has the side effect of
  unnecessary deep reactive conversion on properties that should not be
  made reactive (e.g. computed return values and injected non-reactive
  objects), and can lead to performance issues.

  This change removes the `reactive()` call and instead performs a
  shallow ref unwrapping at the render proxy level. The breaking part is
  when the user returns an object with a plain property from `setup()`,
  e.g. `return { count: 0 }`, this property will no longer trigger
  updates when mutated by a in-template event handler. Instead, explicit
  refs are required.

  This also means that any objects not explicitly made reactive in
  `setup()` will remain non-reactive. This can be desirable when
  exposing heavy external stateful objects on `this`.
* `<portal>` has been renamed to `<teleport>`.

    `target` prop is also renmaed to `to`, so the new usage will be:

    ```html
    <Teleport to="#modal-layer" :disabled="isMobile">
      <div class="modal">
        hello
      </div>
    </Teleport>
    ```

    The primary reason for the renaming is to avoid potential naming
    conflict with [native portals](https://wicg.github.io/portals/).



# [3.0.0-rc.7](https://github.com/vuejs/vue-next/compare/v3.0.0-rc.6...v3.0.0-rc.7) (2020-08-21)


### Bug Fixes

* **compiler-core:** should attach key to single element child of `<template v-for>` ([#1910](https://github.com/vuejs/vue-next/issues/1910)) ([69cfed6](https://github.com/vuejs/vue-next/commit/69cfed6b313821d1ae7ecb02b63b0aaccb5599c6))
* **reactivity:** unwrap non-index accessed refs on reactive arrays ([#1859](https://github.com/vuejs/vue-next/issues/1859)) ([3c05f8b](https://github.com/vuejs/vue-next/commit/3c05f8bbd6cd0e01bbc5830730852f9a93d8de8a)), closes [#1846](https://github.com/vuejs/vue-next/issues/1846)
* **runtime-core:** correctly track dynamic nodes in renderSlot ([#1911](https://github.com/vuejs/vue-next/issues/1911)) ([7ffb79c](https://github.com/vuejs/vue-next/commit/7ffb79c56318861075a47bd2357e34cde8a6dad9))
* **runtime-core:** disable block tracking when calling compiled slot function in tempalte expressions ([f02e2f9](https://github.com/vuejs/vue-next/commit/f02e2f99d9c2ca95f4fd984d7bd62178eceaa214)), closes [#1745](https://github.com/vuejs/vue-next/issues/1745) [#1918](https://github.com/vuejs/vue-next/issues/1918)
* **teleport:** only inherit el for non-patched nodes ([d4cc7b2](https://github.com/vuejs/vue-next/commit/d4cc7b2496f9ed21ef6cac426697eac058da76bb)), closes [#1903](https://github.com/vuejs/vue-next/issues/1903)


### Performance Improvements

* **reactivity:** improve ref performance by using class-based implementation ([#1900](https://github.com/vuejs/vue-next/issues/1900)) ([07919e0](https://github.com/vuejs/vue-next/commit/07919e00658592ebdb42f0c6f004f631c4bf4d34))



# [3.0.0-rc.6](https://github.com/vuejs/vue-next/compare/v3.0.0-rc.5...v3.0.0-rc.6) (2020-08-19)


### Bug Fixes

* **codeframe:** Added Math.max to prevent RangeError ([#1807](https://github.com/vuejs/vue-next/issues/1807)) ([b14f4a5](https://github.com/vuejs/vue-next/commit/b14f4a505b343b12be846f2455d461027a51641c)), closes [#1806](https://github.com/vuejs/vue-next/issues/1806)
* **compiler-core:** generate NEED_PATCH flag for element with vnode hooks ([24041b7](https://github.com/vuejs/vue-next/commit/24041b7ac1a22ca6c10bf2af81c9250af26bda34))
* **compiler-core:** v-if key error should only be checking same key on different branches ([de0c8a7](https://github.com/vuejs/vue-next/commit/de0c8a7e3e8d2adfae4c4ef992cd5ac6262ca534))
* **compiler-sfc:** custom blocks sourcemap ([#1812](https://github.com/vuejs/vue-next/issues/1812)) ([619efd9](https://github.com/vuejs/vue-next/commit/619efd9ac5a0d38651b7282722e7b347a013411a))
* **keep-alive:** fix activated hook invocation on nested components ([#1743](https://github.com/vuejs/vue-next/issues/1743)) ([233d191](https://github.com/vuejs/vue-next/commit/233d191d0d33802cdf7e2996569372a6442e236a)), closes [#1742](https://github.com/vuejs/vue-next/issues/1742)
* **reactivity:** accept subtypes of collections ([#1864](https://github.com/vuejs/vue-next/issues/1864)) ([d005b57](https://github.com/vuejs/vue-next/commit/d005b578b183f165929e1f921584ce599178cad6))
* **reactivity:** effect should still check sync self-trigger ([ac81dcf](https://github.com/vuejs/vue-next/commit/ac81dcf0cc7f5fc722a0c14d1cc92ece5cc0db07))
* **reactivity:** readonly+reactive collection should also expose readonly+reactive values ([ed43810](https://github.com/vuejs/vue-next/commit/ed4381020fcea0494f19f11bebabd9108f2dafd7)), closes [#1772](https://github.com/vuejs/vue-next/issues/1772)
* **reactivity:** use isExtensible instead of isFrozen ([#1753](https://github.com/vuejs/vue-next/issues/1753)) ([2787c34](https://github.com/vuejs/vue-next/commit/2787c34cd436e3ec4656b6986d9d14d57911a7b5)), closes [#1784](https://github.com/vuejs/vue-next/issues/1784)
* **runtime-core:** avoid manual slot invocation in template expressions interfering with block tracking ([791eff3](https://github.com/vuejs/vue-next/commit/791eff3dfbd6be9ba8d597ecf8d943cd197f9807)), closes [#1745](https://github.com/vuejs/vue-next/issues/1745)
* **runtime-core:** check if the key is string on undefined property warning ([#1731](https://github.com/vuejs/vue-next/issues/1731)) ([ce78eac](https://github.com/vuejs/vue-next/commit/ce78eac8e9cfa75a1409ce09ce9f02d4899188d3))
* **runtime-core:** fix beforeUpdate call timing to allow state mutation ([1eb6067](https://github.com/vuejs/vue-next/commit/1eb6067a8598730c67b3b3a4ac459d2723aa858c)), closes [#1899](https://github.com/vuejs/vue-next/issues/1899)
* **runtime-core:** fix Object props validation for objects with custom toStringTag ([6ccd9ac](https://github.com/vuejs/vue-next/commit/6ccd9ac2bc8ea09978fbb99c272bff6614387e90)), closes [#1872](https://github.com/vuejs/vue-next/issues/1872)
* **runtime-core:** separate null vs. non-null ref value updates ([#1835](https://github.com/vuejs/vue-next/issues/1835)) ([3991ff0](https://github.com/vuejs/vue-next/commit/3991ff03ceea89bbc149e864f754196d20c81f90)), closes [#1789](https://github.com/vuejs/vue-next/issues/1789) [#1834](https://github.com/vuejs/vue-next/issues/1834)
* **runtime-core:** should correctly call `beforeEnter` inside `Suspense` ([#1805](https://github.com/vuejs/vue-next/issues/1805)) ([bc6f252](https://github.com/vuejs/vue-next/commit/bc6f252c4abc72bee29aa4766fc6c5ed0a81d7cd)), closes [#1795](https://github.com/vuejs/vue-next/issues/1795)
* **runtime-core/scheduler:** allow component render functions to trigger itself ([611437a](https://github.com/vuejs/vue-next/commit/611437a3fe5e50a5a6f79e2f8a0ed59e74539626)), closes [#1801](https://github.com/vuejs/vue-next/issues/1801)
* **runtime-core/scheduler:** only allow watch callbacks to be self-triggering ([09702e9](https://github.com/vuejs/vue-next/commit/09702e95b9a3f68fc1952ef74555dffa92d50032)), closes [#1740](https://github.com/vuejs/vue-next/issues/1740) [#1727](https://github.com/vuejs/vue-next/issues/1727)
* **runtime-core/scheduler:** prevent duplicate queue ([#1767](https://github.com/vuejs/vue-next/issues/1767)) ([b2a9142](https://github.com/vuejs/vue-next/commit/b2a91429ede9ea49e4808de2748da19deeb7f335))
* **runtime-core/scheduler:** sort postFlushCbs to ensure refs are set before lifecycle hooks ([#1854](https://github.com/vuejs/vue-next/issues/1854)) ([caccec3](https://github.com/vuejs/vue-next/commit/caccec3f78414ae294f1a813ffd16791d56da3a6)), closes [#1852](https://github.com/vuejs/vue-next/issues/1852)
* **runtime-dom:** fix v-on same computed handler on multiple elements ([1c967fc](https://github.com/vuejs/vue-next/commit/1c967fc44b971686d5a0e2811deb2362ec84979f)), closes [#1747](https://github.com/vuejs/vue-next/issues/1747)
* **runtime-dom:** patch `form` as an attribute ([#1788](https://github.com/vuejs/vue-next/issues/1788)) ([00683fc](https://github.com/vuejs/vue-next/commit/00683fce9a1c6856be23b35ff0226d8ac5c96791)), closes [#1787](https://github.com/vuejs/vue-next/issues/1787)
* **runtime-dom:** style binding multi value support ([0cd98c3](https://github.com/vuejs/vue-next/commit/0cd98c3040a64df4577d188b9f2221224549a132)), closes [#1759](https://github.com/vuejs/vue-next/issues/1759)
* **runtome-core:** do not cache property access in beforeCreate hook ([f6afe70](https://github.com/vuejs/vue-next/commit/f6afe7000efb964355c439b7963087ab8e42d6b1)), closes [#1756](https://github.com/vuejs/vue-next/issues/1756)
* **teleport:** always inherit root DOM nodes on patch ([#1836](https://github.com/vuejs/vue-next/issues/1836)) ([517c2b8](https://github.com/vuejs/vue-next/commit/517c2b8bdb9ffa53717c10d604ff6db84d50d4f2)), closes [#1813](https://github.com/vuejs/vue-next/issues/1813)
* **transition:** transition should accept multiple handlers on same event ([48576e5](https://github.com/vuejs/vue-next/commit/48576e582c4177572c2fd1764fbca53a6a30abe2)), closes [#1746](https://github.com/vuejs/vue-next/issues/1746)
* **types:** handling PropType<Function> with default value ([#1896](https://github.com/vuejs/vue-next/issues/1896)) ([c2913d5](https://github.com/vuejs/vue-next/commit/c2913d57d14449775faf1f2e5647e6d1f3d3f920)), closes [#1891](https://github.com/vuejs/vue-next/issues/1891)
* **types/jsx:** update innerHTML property in jsx typing ([#1814](https://github.com/vuejs/vue-next/issues/1814)) ([b984d47](https://github.com/vuejs/vue-next/commit/b984d47ac43a0aae2db5556a138a256fb5533ced))
* **watch:** allow handler to be a string ([#1775](https://github.com/vuejs/vue-next/issues/1775)) ([b5f91ff](https://github.com/vuejs/vue-next/commit/b5f91ff570244436aa8f579ec3a6fec781d198a7)), closes [#1774](https://github.com/vuejs/vue-next/issues/1774)
* **watch:** exhaust pre-flush watchers + avoid duplicate render by pre-flush watchers ([a0e34ce](https://github.com/vuejs/vue-next/commit/a0e34cee4a09a14548bf1e78f4a82702e9d40717)), closes [#1777](https://github.com/vuejs/vue-next/issues/1777)
* **watch:** pre-flush watcher watching props should trigger before component update ([d4c17fb](https://github.com/vuejs/vue-next/commit/d4c17fb48b7880a4e3db6d48f8ab76540a3f59a2)), closes [#1763](https://github.com/vuejs/vue-next/issues/1763)
* **watch:** should trigger watcher callback on triggerRef when watching ref source ([fce2689](https://github.com/vuejs/vue-next/commit/fce2689ff1af0b632a2034403a6dfbcbff91aa60)), closes [#1736](https://github.com/vuejs/vue-next/issues/1736)


### Features

* **compiler-core:** add `comments` parser option ([#1858](https://github.com/vuejs/vue-next/issues/1858)) ([62b9d02](https://github.com/vuejs/vue-next/commit/62b9d02f6fbb08d51bed73f33435c1ed83d5b2ea))
* **reactivity:** return array when calling `toRefs` on array ([#1768](https://github.com/vuejs/vue-next/issues/1768)) ([4172fdb](https://github.com/vuejs/vue-next/commit/4172fdb90cd75d5741f843a227cfe9b5f5b22b35)), closes [#1764](https://github.com/vuejs/vue-next/issues/1764)
* **runtime-core:** pass current props to prop default value functions ([0d508e9](https://github.com/vuejs/vue-next/commit/0d508e9f51734409ac1aa57ba0ea98808be0a3a3)), closes [#1886](https://github.com/vuejs/vue-next/issues/1886)



# [3.0.0-rc.5](https://github.com/vuejs/vue-next/compare/v3.0.0-rc.4...v3.0.0-rc.5) (2020-07-28)


### Bug Fixes

* **build:** fix component resolution when disabling options API ([a75b8a2](https://github.com/vuejs/vue-next/commit/a75b8a268fca800a49c7d772b4a290b4435e85b9)), closes [#1688](https://github.com/vuejs/vue-next/issues/1688)
* **compiler-core:** always compile Teleport and Suspense as blocks ([fbf865d](https://github.com/vuejs/vue-next/commit/fbf865d9d4744a0233db1ed6e5543b8f3ef51e8d))
* **compiler-core:** prevent generating invalid code for v-bind with empty expression ([#1720](https://github.com/vuejs/vue-next/issues/1720)) ([d452723](https://github.com/vuejs/vue-next/commit/d4527230e40c4728e5becdd35c3e039f0992ae4c))
* **compiler-core/v-on:** only cache empty handler when the option is used ([5fbd1f4](https://github.com/vuejs/vue-next/commit/5fbd1f4ccb22bf62bdf749460f8c6dadee3b6b89)), closes [#1716](https://github.com/vuejs/vue-next/issues/1716)
* **compiler-sfc:** `less` and `stylus` output deps path is absolute p… ([#1685](https://github.com/vuejs/vue-next/issues/1685)) ([578f25c](https://github.com/vuejs/vue-next/commit/578f25c34efab0a71a7afd8bff278bd147a16a64))
* **compiler-sfc:** fix rewrite named export default ([#1675](https://github.com/vuejs/vue-next/issues/1675)) ([452edb7](https://github.com/vuejs/vue-next/commit/452edb73cb02c4aecb518a45df9b01aaa1516b19))
* **hmr:** should update el for `HYDRATE_EVENTS` patchFlags node ([#1707](https://github.com/vuejs/vue-next/issues/1707)) ([de62cc0](https://github.com/vuejs/vue-next/commit/de62cc040c22e3bd93222a9cc84b6564a4b08b51))
* **reactivity:** avoid tracking internal symbols in has trap ([7edfdf7](https://github.com/vuejs/vue-next/commit/7edfdf7e239ef8f58a343f9802d675d84ed51d64)), closes [#1683](https://github.com/vuejs/vue-next/issues/1683)
* **reactivity:** fix ref mutation debugger event values ([b7ef38b](https://github.com/vuejs/vue-next/commit/b7ef38b7731a16b6fa4391978132ee379a1bbdc2))
* **runtime-core:** dev root resolution should differentiate user comments vs v-if comments ([355c052](https://github.com/vuejs/vue-next/commit/355c05262252b247ec29ed4c4fd6ab69143dd6b7)), closes [#1704](https://github.com/vuejs/vue-next/issues/1704)
* **runtime-core:** fix scheduler dedupe when not flushing ([4ef5c8d](https://github.com/vuejs/vue-next/commit/4ef5c8d42408fd444114604292106c0027600fa4))
* **runtime-core:** respect render function from mixins ([354d79c](https://github.com/vuejs/vue-next/commit/354d79c42bf152643b77d83520757818d913de4f)), closes [#1630](https://github.com/vuejs/vue-next/issues/1630)
* **runtime-core:** scheduler should allow intentional self triggering effects ([c27dfe1](https://github.com/vuejs/vue-next/commit/c27dfe1d0994c65de601760d082cf4668dc3fad0)), closes [#1727](https://github.com/vuejs/vue-next/issues/1727)
* **runtime-core:** use correct container for moving `Teleport` content ([#1703](https://github.com/vuejs/vue-next/issues/1703)) ([04a4eba](https://github.com/vuejs/vue-next/commit/04a4ebaaeb4418d211293fc7b92c19c42a425cbd))
* **style-vars:** fix css vars on component with suspense as root ([#1718](https://github.com/vuejs/vue-next/issues/1718)) ([07ece2e](https://github.com/vuejs/vue-next/commit/07ece2e9260fe30a50e7cf317d2ff69f113ecad1))
* **v-model:** enable v-model type detection on custom elements ([0b3b1cf](https://github.com/vuejs/vue-next/commit/0b3b1cfa487a359c8762794cfd74726d55b9ef8f))
* runtime compilation marker should be applied in exposed compile function ([b3b65b4](https://github.com/vuejs/vue-next/commit/b3b65b40582d7fbdc776bfe8a1542b80aebe0aac))
* **transition:** should call transition hooks inside already resolved suspense ([#1698](https://github.com/vuejs/vue-next/issues/1698)) ([2a633c8](https://github.com/vuejs/vue-next/commit/2a633c84ff0e522a7562d3194a8f4e4012eb8281)), closes [#1689](https://github.com/vuejs/vue-next/issues/1689)
* **v-model:** allow v-model usage on declared custom elements ([71c3c6e](https://github.com/vuejs/vue-next/commit/71c3c6e2a03095ddd4c2a1e15957afd3ec8d4120)), closes [#1699](https://github.com/vuejs/vue-next/issues/1699)


### Features

* **reactivity:** `proxyRefs` method and `ShallowUnwrapRefs` type ([#1682](https://github.com/vuejs/vue-next/issues/1682)) ([aa06b10](https://github.com/vuejs/vue-next/commit/aa06b1034d8268fa15cb6b4b6916440701238b2d))
* **sfc:** support resolving template components from `<script setup>` exports ([6f5d840](https://github.com/vuejs/vue-next/commit/6f5d840612dbced2dbb4584c979a8f0cfc1f72f0))
* support delimiters option for runtime compilation ([ba17c87](https://github.com/vuejs/vue-next/commit/ba17c871d80f833e064a51900d07efa358eafb89)), closes [#1679](https://github.com/vuejs/vue-next/issues/1679)


### BREAKING CHANGES

* **reactivity:** template auto ref unwrapping are now applied shallowly,
i.e. only at the root level. See https://github.com/vuejs/vue-next/pull/1682 for
more details.



# [3.0.0-rc.4](https://github.com/vuejs/vue-next/compare/v3.0.0-rc.3...v3.0.0-rc.4) (2020-07-21)


### Bug Fixes

* **deps:** move @babel/types back to dependencies ([11c2ad4](https://github.com/vuejs/vue-next/commit/11c2ad4a04c000ea828a0f5017e41fc7e0816868))



# [3.0.0-rc.3](https://github.com/vuejs/vue-next/compare/v3.0.0-rc.2...v3.0.0-rc.3) (2020-07-21)


### Bug Fixes

* **build:** make transition tree-shakeable again ([ad199e1](https://github.com/vuejs/vue-next/commit/ad199e1a252f80c85a8e40a4b4539ad27c39505c))
* **compiler-sfc:** `<style vars scoped>` prefixing should only apply to pre-transform source ([4951d43](https://github.com/vuejs/vue-next/commit/4951d4352605eb9f4bcbea40ecc68fc6cbc3dce2)), closes [#1623](https://github.com/vuejs/vue-next/issues/1623)
* **compiler-sfc:** use correct importer with `useCssVars` ([#1658](https://github.com/vuejs/vue-next/issues/1658)) ([6f148d0](https://github.com/vuejs/vue-next/commit/6f148d0b9a0630dc87c741ed951c82b639e776b2))
* **runtime-core:** do not use bail patchFlag on cloned vnodes ([6390ddf](https://github.com/vuejs/vue-next/commit/6390ddfb7d0ed83ac4bae15d0497cba4de3e1972)), closes [#1665](https://github.com/vuejs/vue-next/issues/1665)
* **runtime-core:** fix attr fallthrough on compiled framgent w/ single static element + comments ([1af3531](https://github.com/vuejs/vue-next/commit/1af35317195772ea8f2728abc8f5ac159a5b7b75))
* **v-model:** v-model listeners should not fallthrough to plain element root ([c852bf1](https://github.com/vuejs/vue-next/commit/c852bf18d7a51be0c3255357f0c30f39ae9bb540)), closes [#1643](https://github.com/vuejs/vue-next/issues/1643)
* **watch:** fix watching reactive array ([#1656](https://github.com/vuejs/vue-next/issues/1656)) ([288b4ea](https://github.com/vuejs/vue-next/commit/288b4eab9e10187eb14d4d6d54dc9f077343a2a5)), closes [#1655](https://github.com/vuejs/vue-next/issues/1655)


### Features

* **compiler-core/internal:** add `onContextCreated` option to `generate` ([#1672](https://github.com/vuejs/vue-next/issues/1672)) ([615dccd](https://github.com/vuejs/vue-next/commit/615dccd00e7d85a3f4b82e62d6cb6c41f167d8c6))
* **runtime-core:** respect function name when using `defineComponent` function shorthand ([#1661](https://github.com/vuejs/vue-next/issues/1661)) ([304830a](https://github.com/vuejs/vue-next/commit/304830a764cd9f28098cfb0ac0e520e1bb2f57c7))
* provide ability to overwrite feature flags in esm-bundler builds ([54727f9](https://github.com/vuejs/vue-next/commit/54727f9874abe8d0c99ee153d252269ae519b45d))
* **computed:** add readonly flag if no setter is provided ([#1654](https://github.com/vuejs/vue-next/issues/1654)) ([dabdc5e](https://github.com/vuejs/vue-next/commit/dabdc5e115514f98b5f8559a3819e96416939f43))



# [3.0.0-rc.2](https://github.com/vuejs/vue-next/compare/v3.0.0-rc.1...v3.0.0-rc.2) (2020-07-19)


### Bug Fixes

* **compiler-core:** fix v-if + v-for on `<template>` ([af7e100](https://github.com/vuejs/vue-next/commit/af7e100ef229e1088abfd270a71c5a7da44e760e)), closes [#1637](https://github.com/vuejs/vue-next/issues/1637)
* **compiler-core/v-on:** fix codegen for event handler with newlines ([#1640](https://github.com/vuejs/vue-next/issues/1640)) ([f9826fa](https://github.com/vuejs/vue-next/commit/f9826fa963e67c495b8c44efb22b09b87df381de))
* **compiler-sfc:** use `filename` from options when compile styl preprocessor ([#1635](https://github.com/vuejs/vue-next/issues/1635)) ([0526e5d](https://github.com/vuejs/vue-next/commit/0526e5d7faa9ba69f76e7ff71fe96d93a4e99684))
* **keep-alive:**  handle "0" as cache key ([#1622](https://github.com/vuejs/vue-next/issues/1622)) ([2deb0c7](https://github.com/vuejs/vue-next/commit/2deb0c7a74d20e334bb1458bc2f28d65aeea704b)), closes [#1621](https://github.com/vuejs/vue-next/issues/1621)
* **runtime-core/hmr:** only use cloneNode mount optimization in prod ([4655d69](https://github.com/vuejs/vue-next/commit/4655d699831b3356bb8be5b41c45da830dac9eb2)), closes [#1626](https://github.com/vuejs/vue-next/issues/1626)
* **watch:** callback not called when using `flush:sync` ([#1633](https://github.com/vuejs/vue-next/issues/1633)) ([8facaef](https://github.com/vuejs/vue-next/commit/8facaefcc3eff1ca1fa19832172495e4272979e5))



# [3.0.0-rc.1](https://github.com/vuejs/vue-next/compare/v3.0.0-beta.24...v3.0.0-rc.1) (2020-07-17)


### Bug Fixes

* **watch:** post flush watchers should not fire when component is unmounted ([341b30c](https://github.com/vuejs/vue-next/commit/341b30c961aa065fc59f0c2b592a11229cb6bd14)), closes [#1603](https://github.com/vuejs/vue-next/issues/1603)


### Features

* **types:** deny unknown attributes on component by default ([#1614](https://github.com/vuejs/vue-next/issues/1614)) ([5d8a64d](https://github.com/vuejs/vue-next/commit/5d8a64d53a27ad57fe9940dd0d4d745dfbaf3c9e)), closes [#1519](https://github.com/vuejs/vue-next/issues/1519)
* **types:** expose `DeepReadonly` type ([#1606](https://github.com/vuejs/vue-next/issues/1606)) ([527c2c8](https://github.com/vuejs/vue-next/commit/527c2c8bbb5c8fcfdf827dd985a09d7e7388cdad))
* Initial devtools support ([#1125](https://github.com/vuejs/vue-next/issues/1125)) ([568b6db](https://github.com/vuejs/vue-next/commit/568b6db12b9fa167569809dc0da7e0e3c026f204))



# [3.0.0-beta.24](https://github.com/vuejs/vue-next/compare/v3.0.0-beta.23...v3.0.0-beta.24) (2020-07-16)


### Bug Fixes

* **compiler-sfc:** fix preprocessor filename access ([9cb29ee](https://github.com/vuejs/vue-next/commit/9cb29eea3a61f7f4a6730fed56f2e3e9a13dbcc9))



# [3.0.0-beta.23](https://github.com/vuejs/vue-next/compare/v3.0.0-beta.22...v3.0.0-beta.23) (2020-07-16)


### Bug Fixes

* **compiler-sfc:** fix `useCssVars` codegen ([9b5ff2b](https://github.com/vuejs/vue-next/commit/9b5ff2b567f5e29cc59e23e106f2278c3feaad21))
* **compiler-sfc:** prohibit src usage for `<script setup>` + do not ([af4b0c2](https://github.com/vuejs/vue-next/commit/af4b0c2cf18b63990bc266eb0871a50ba2004fc0))
* **runtime-dom:** unref when setting `useCssVars` ([44e6da1](https://github.com/vuejs/vue-next/commit/44e6da1402fa2b6f5a0a0c692cd693a8ff1a40a3))
* **slots:** properly force update on forwarded slots ([aab99ab](https://github.com/vuejs/vue-next/commit/aab99abd28a5d17f2d1966678b0d334975d21877)), closes [#1594](https://github.com/vuejs/vue-next/issues/1594)


### Features

* **compiler-sfc:** export dependencies for css and css preprocessors ([#1278](https://github.com/vuejs/vue-next/issues/1278)) ([e41d831](https://github.com/vuejs/vue-next/commit/e41d8310de0d9299fce2bccd57af4e30b74e3795))


### Performance Improvements

* **runtime-core:** avoid duplicate `postFlushCb` invocation ([165068d](https://github.com/vuejs/vue-next/commit/165068dbc295bb70fdec9ae56dfcaac17d2f977c)), closes [#1595](https://github.com/vuejs/vue-next/issues/1595)



# [3.0.0-beta.22](https://github.com/vuejs/vue-next/compare/v3.0.0-beta.21...v3.0.0-beta.22) (2020-07-15)


### Bug Fixes

* **compiler-core:** generate incremental keys for `v-if/else-if/else` chains ([#1589](https://github.com/vuejs/vue-next/issues/1589)) ([64c7b2f](https://github.com/vuejs/vue-next/commit/64c7b2f9cedae676ec26a7a8da4c109bc88b48f1)), closes [#1587](https://github.com/vuejs/vue-next/issues/1587)
* **compiler-sfc:** `<script setup>` warning ([9146cc4](https://github.com/vuejs/vue-next/commit/9146cc485e317ff29192796f9366471144ed3ad2))
* **hmr:** fix hmr updates for reused hoisted trees ([5f61aa0](https://github.com/vuejs/vue-next/commit/5f61aa0f719cbd90182af1e27fad37b91c2c351e))
* **runtime-core:** do not call transition enter hooks when mounting in suspense ([#1588](https://github.com/vuejs/vue-next/issues/1588)) ([246ec5c](https://github.com/vuejs/vue-next/commit/246ec5c594650f3fcccd0de94aa3f97b4d705e42)), closes [#1583](https://github.com/vuejs/vue-next/issues/1583)
* **v-model:** handle more edge cases in `looseEqual()` ([#379](https://github.com/vuejs/vue-next/issues/379)) ([fe1b27b](https://github.com/vuejs/vue-next/commit/fe1b27b7f875e1c8aece12b04531e7fa3184be27))


### Features

* **types/reactivity:** use `DeepReadonly` type for `readonly` return type ([#1462](https://github.com/vuejs/vue-next/issues/1462)) ([b772bba](https://github.com/vuejs/vue-next/commit/b772bba5587726e78b20ccb9b61374120bd4b0ae)), closes [#1452](https://github.com/vuejs/vue-next/issues/1452)



# [3.0.0-beta.21](https://github.com/vuejs/vue-next/compare/v3.0.0-beta.20...v3.0.0-beta.21) (2020-07-14)


### Bug Fixes

* **compiler-dom:** fix v-on `.left` `.right` modifier handling ([6b63ba2](https://github.com/vuejs/vue-next/commit/6b63ba2f453b3f9bbf9e9e2167030de42f76b5ac))
* **runtime-core:** avoid `scopeId` as attr for slot nodes with same `scopeId` ([#1561](https://github.com/vuejs/vue-next/issues/1561)) ([583a1c7](https://github.com/vuejs/vue-next/commit/583a1c7b45e67e9cd57e411853c20509248def89)), closes [vitejs/vite#536](https://github.com/vitejs/vite/issues/536)
* **runtime-core/emits:** merge emits options from mixins/extends ([ba3b3cd](https://github.com/vuejs/vue-next/commit/ba3b3cdda98f6efb5d4c4fafc579b8f568a19bde)), closes [#1562](https://github.com/vuejs/vue-next/issues/1562)
* **runtime-dom:** remove attrs with nullish values ([cb6a091](https://github.com/vuejs/vue-next/commit/cb6a0915c540af94f5d79c311022b99bc17f2965)), closes [#1576](https://github.com/vuejs/vue-next/issues/1576)
* **runtime-dom/v-on:** only block event handlers based on attach timestamp ([8b320cc](https://github.com/vuejs/vue-next/commit/8b320cc12f74aafea9ec69f7ce70231d4f0d08fd)), closes [#1565](https://github.com/vuejs/vue-next/issues/1565)
* **slots:** differentiate dynamic/static compiled slots ([65beba9](https://github.com/vuejs/vue-next/commit/65beba98fe5793133d3218945218b9e3f8d136eb)), closes [#1557](https://github.com/vuejs/vue-next/issues/1557)
* **v-on:** capitalize dynamic event names ([9152a89](https://github.com/vuejs/vue-next/commit/9152a8901653d7cef864a52a3c618afcc70d827d))
* **v-on:** refactor DOM event options modifer handling ([380c679](https://github.com/vuejs/vue-next/commit/380c6792d8899f1a43a9e6400c5df483c63290b6)), closes [#1567](https://github.com/vuejs/vue-next/issues/1567)


### Features

* ssr support for `<style vars>` ([b9595e6](https://github.com/vuejs/vue-next/commit/b9595e64cfdfc2607d3d3e6232b4a7ea199dd553))
* **compiler-sfc:** `<script setup>` support (experimental) ([4c43d4e](https://github.com/vuejs/vue-next/commit/4c43d4e5b9df8732b601a269bf4030f9721d466f))
* **compiler-sfc:** `<style vars>` CSS variable injection ([bd5c3b9](https://github.com/vuejs/vue-next/commit/bd5c3b96be2c6c4a0b84b096c3baa3c30feb95d6))
* **compiler-sfc:** allow using :deep, :global & :slotted for short in `<style scoped>` ([f3cc41f](https://github.com/vuejs/vue-next/commit/f3cc41f0c8713475f2aa592bae3d82ffbc6b1300))
* **runtime-dom:** useCssVars ([9f706a9](https://github.com/vuejs/vue-next/commit/9f706a9f5ee52c8256c52111da4271bf43b811ab))



# [3.0.0-beta.20](https://github.com/vuejs/vue-next/compare/v3.0.0-beta.19...v3.0.0-beta.20) (2020-07-08)


### Bug Fixes

* **compiler-core/v-on:** bail caching for member expression handlers on components ([87c2a1e](https://github.com/vuejs/vue-next/commit/87c2a1e50f5317a0c47051b06f419e60e5644a1a)), closes [#1541](https://github.com/vuejs/vue-next/issues/1541)
* **compiler-dom:** should ignore and warn side effect tags like script and style ([5e52f4e](https://github.com/vuejs/vue-next/commit/5e52f4e4d7c92ee8ec9c0d644735e23342965096))
* **runtime-core:** should allow v-model listeners to fallthrough, but ignore for warning ([903e8f6](https://github.com/vuejs/vue-next/commit/903e8f697e4377e0ae92e1a6b58777438fba3610)), closes [#1543](https://github.com/vuejs/vue-next/issues/1543)


### Features

* **types:** expose `WritableComputedRef` ([#1500](https://github.com/vuejs/vue-next/issues/1500)) ([220db9b](https://github.com/vuejs/vue-next/commit/220db9bcda17a56bb4e5222d2634800672513983))



# [3.0.0-beta.19](https://github.com/vuejs/vue-next/compare/v3.0.0-beta.18...v3.0.0-beta.19) (2020-07-07)


### Bug Fixes

* **compiler-core:** add `\r` to accepted chars after end tag name ([#1515](https://github.com/vuejs/vue-next/issues/1515)) ([64e2f46](https://github.com/vuejs/vue-next/commit/64e2f4643602c5980361e66674141e61ba60ef70)), closes [#1476](https://github.com/vuejs/vue-next/issues/1476)
* **keep-alive:** fix keep-alive with scopeId/fallthrough attrs ([d86b01b](https://github.com/vuejs/vue-next/commit/d86b01ba3a29e2e04c13597a1b9123ca35beaf57)), closes [#1511](https://github.com/vuejs/vue-next/issues/1511)
* **runtime-core/template-ref:** template ref used in the same template should trigger update ([36b6b4f](https://github.com/vuejs/vue-next/commit/36b6b4f0228c4adf679c232bf4d1e8cff7fb6474)), closes [#1505](https://github.com/vuejs/vue-next/issues/1505)
* **runtime-dom:** should set `<input list="...">` as attribute ([441c236](https://github.com/vuejs/vue-next/commit/441c23602f57d00b00fa3a590b30487003efe210)), closes [#1526](https://github.com/vuejs/vue-next/issues/1526)
* **runtime-dom/style:** fix `patchStyle` on falsy next value ([#1504](https://github.com/vuejs/vue-next/issues/1504)) ([77538ec](https://github.com/vuejs/vue-next/commit/77538ec6d90fee66d229d6d3a4f977c6b548a9bd)), closes [#1506](https://github.com/vuejs/vue-next/issues/1506)
* **ssr:** support dynamic components that resolve to element or vnode ([41db49d](https://github.com/vuejs/vue-next/commit/41db49dfb7c520c4f743e522a03f06b33259a2eb)), closes [#1508](https://github.com/vuejs/vue-next/issues/1508)
* **types/tsx:** add `JSX.IntrinsicAttributes` definition ([#1517](https://github.com/vuejs/vue-next/issues/1517)) ([a5b4332](https://github.com/vuejs/vue-next/commit/a5b4332c69146de569ad328cac9224c3cded15c9)), closes [#1516](https://github.com/vuejs/vue-next/issues/1516)
* **v-model:** consistent nullish value handling with 2.x ([#1530](https://github.com/vuejs/vue-next/issues/1530)) ([425335c](https://github.com/vuejs/vue-next/commit/425335c28bdb48f2f48f97021fc0a77eaa89ec34)), closes [#1528](https://github.com/vuejs/vue-next/issues/1528)
* **v-model:** should ignore compiled v-model listeners in attr fallthrough ([6dd59ee](https://github.com/vuejs/vue-next/commit/6dd59ee301d8d93e7ca14447243d07a653e69159)), closes [#1510](https://github.com/vuejs/vue-next/issues/1510)
* **watch:** stop instance-bound watchers in post render queue ([58b0706](https://github.com/vuejs/vue-next/commit/58b07069ad33c8a8e44cb47b81084a452dda2846)), closes [#1525](https://github.com/vuejs/vue-next/issues/1525)



# [3.0.0-beta.18](https://github.com/vuejs/vue-next/compare/v3.0.0-beta.16...v3.0.0-beta.18) (2020-07-02)


### Bug Fixes

* **runtime-core:** avoid accidental access of `Object.prototype` properties ([f3e9c1b](https://github.com/vuejs/vue-next/commit/f3e9c1b59d5d3999ac6180ed75c84d88b29c41e6))
* ensure vnode hooks are called consistently regardless of keep-alive ([4e8e689](https://github.com/vuejs/vue-next/commit/4e8e689572dcae0cb468989c5e0c531a837a900b))
* **runtime-core:** pass unmount into initial mount patch prop ([2bdb5c1](https://github.com/vuejs/vue-next/commit/2bdb5c146449092623f06e20fb71ebaca7e5588f))
* **runtime-dom:** allow force updating value bindings for controlled inputs ([b3536d8](https://github.com/vuejs/vue-next/commit/b3536d87a587dc1e78c8712cb29ca61ca0931ac9)), closes [#1471](https://github.com/vuejs/vue-next/issues/1471)
* **slots:** make compiled slot marker non-enumerable ([062835d](https://github.com/vuejs/vue-next/commit/062835d45aaf4168ddf2e39a5c7e162b3a18ccae)), closes [#1470](https://github.com/vuejs/vue-next/issues/1470)


### Features

* **runtime-core:** support creating vnode from existing vnode ([c9629f2](https://github.com/vuejs/vue-next/commit/c9629f26924fcb3c51994549a3013ccc05c1030a))



# [3.0.0-beta.17](https://github.com/vuejs/vue-next/compare/v3.0.0-beta.16...v3.0.0-beta.17) (2020-06-30)


### Bug Fixes

* **runtime-dom:** allow force updating value bindings for controlled inputs ([b3536d8](https://github.com/vuejs/vue-next/commit/b3536d87a587dc1e78c8712cb29ca61ca0931ac9)), closes [#1471](https://github.com/vuejs/vue-next/issues/1471)
* **slots:** make compiled slot marker non-enumerable ([062835d](https://github.com/vuejs/vue-next/commit/062835d45aaf4168ddf2e39a5c7e162b3a18ccae)), closes [#1470](https://github.com/vuejs/vue-next/issues/1470)



# [3.0.0-beta.16](https://github.com/vuejs/vue-next/compare/v3.0.0-beta.15...v3.0.0-beta.16) (2020-06-29)


### Bug Fixes

* **BaseTransition:** collect correct children with slot passthrough in `Transition` ([#1456](https://github.com/vuejs/vue-next/issues/1456)) ([d4cd128](https://github.com/vuejs/vue-next/commit/d4cd12887eba18c4aff02b85834679bfe679f878)), closes [#1455](https://github.com/vuejs/vue-next/issues/1455)
* **BaseTransition:** fix `BaseTransition` delayed leave with mode `in-out` ([#1404](https://github.com/vuejs/vue-next/issues/1404)) ([2ff8dca](https://github.com/vuejs/vue-next/commit/2ff8dcab0a51cc3634a0a739641fb4cfe459b731)), closes [#1400](https://github.com/vuejs/vue-next/issues/1400)
* **compiler-core:** ignore comment nodes in transition children ([e52b7cd](https://github.com/vuejs/vue-next/commit/e52b7cd7e7c10d8dbad92000ab3d5f2e02533e39)), closes [#1352](https://github.com/vuejs/vue-next/issues/1352)
* **compiler-core:** should not prefix object method ([#1375](https://github.com/vuejs/vue-next/issues/1375)) ([35dbef2](https://github.com/vuejs/vue-next/commit/35dbef268ca43234aa8544a62dfa4240dcc2974e))
* **compiler-core:** skip empty expressions when validating expressions in browser mode ([afb231e](https://github.com/vuejs/vue-next/commit/afb231ec5ce5ac77ff6260bea4d866ec2d5bbd85))
* **compiler-core/v-on:** pass noninitial arguments in cached event handlers ([#1265](https://github.com/vuejs/vue-next/issues/1265)) ([7e28173](https://github.com/vuejs/vue-next/commit/7e281733120fe003552b915f97713a3d26f4dc8a))
* **compiler-sfc:** `transformAssetUrl` should ignore inline data url ([#1431](https://github.com/vuejs/vue-next/issues/1431)) ([90c285c](https://github.com/vuejs/vue-next/commit/90c285c5c8ac13afb4932974c1f9aede15e81337))
* **runtime-core:** always check props presence in public instance proxy ([e0d19a6](https://github.com/vuejs/vue-next/commit/e0d19a695316a8a459274874d304872fea384851)), closes [#1236](https://github.com/vuejs/vue-next/issues/1236)
* **runtime-core:** `cloneVNode` should preserve correct ctx instance when normalizing ref ([be69bee](https://github.com/vuejs/vue-next/commit/be69beed5ed05067006c297589598b33e7108b1b)), closes [#1311](https://github.com/vuejs/vue-next/issues/1311)
* **runtime-core:** component root should inherit `scopeId` from `VNode` ([f3f94e4](https://github.com/vuejs/vue-next/commit/f3f94e4deb40d3a0d83804454874833b194f83da)), closes [#1399](https://github.com/vuejs/vue-next/issues/1399)
* **runtime-core:** fix component name inference in warnings ([e765d81](https://github.com/vuejs/vue-next/commit/e765d814048c2cdc3cc32bdffb73c6e59b0d747d)), closes [#1418](https://github.com/vuejs/vue-next/issues/1418)
* **runtime-core:** fix parent el update on nested HOC self-update ([#1360](https://github.com/vuejs/vue-next/issues/1360)) ([6c8bfa1](https://github.com/vuejs/vue-next/commit/6c8bfa10189d1a5a6837d2e25a9451889a0e19d6)), closes [#1357](https://github.com/vuejs/vue-next/issues/1357)
* **runtime-core:** fix `scopeId` inheritance for component inside slots ([978d952](https://github.com/vuejs/vue-next/commit/978d9522e80cb19257ee2f4c8ba5da6f8aa6b3d2))
* **runtime-core:** handle patch flag de-op from cloned vnode ([0dd5cde](https://github.com/vuejs/vue-next/commit/0dd5cde861735e80cfe21537380e52789cc865f8)), closes [#1426](https://github.com/vuejs/vue-next/issues/1426)
* **runtime-core:** properly capitalize v-on object keys ([#1358](https://github.com/vuejs/vue-next/issues/1358)) ([250eb4a](https://github.com/vuejs/vue-next/commit/250eb4a5bc121d303aa109c20251c95616049f05))
* **runtime-core:** should remove no longer present camelCase props ([#1413](https://github.com/vuejs/vue-next/issues/1413)) ([1c4e1b6](https://github.com/vuejs/vue-next/commit/1c4e1b679261ad151c4ed04b11279a3768a1c9e2)), closes [#1412](https://github.com/vuejs/vue-next/issues/1412)
* **slots:** filter out compiler marker from resolved slots ([70ea76a](https://github.com/vuejs/vue-next/commit/70ea76ae0c16a55154e785f8ca42ed13e0d15170)), closes [#1451](https://github.com/vuejs/vue-next/issues/1451)
* **ssr:** fix ssr scopeId on component root ([afe13e0](https://github.com/vuejs/vue-next/commit/afe13e0584afb70a2682763dda148c35f9a97f95))
* **ssr:** handle fallthrough attrs in ssr compile output ([d5dbd27](https://github.com/vuejs/vue-next/commit/d5dbd27193eee5fe401d3b85b6c5ddef5cd42b9d))
* **transition:** enter/leave hook timing consistency with v2 ([bf84ac8](https://github.com/vuejs/vue-next/commit/bf84ac8396666194cd386b8a66040b19131983e0)), closes [#1145](https://github.com/vuejs/vue-next/issues/1145)
* **transition:** fix appear hooks handling ([7ae70ea](https://github.com/vuejs/vue-next/commit/7ae70ea44cf66be134c6ec3b060d9872fa0774e0))
* **transition:** fix css:false with hooks with no explicit done callback ([9edbc27](https://github.com/vuejs/vue-next/commit/9edbc27f45aafaa6bc27ab244dc77d4d86d09fc4)), closes [#1149](https://github.com/vuejs/vue-next/issues/1149)
* **transition:** fix dom transition cancel hooks not being called ([acd3156](https://github.com/vuejs/vue-next/commit/acd3156d2c45609ab04cb54734258fe340c4ca02))
* **transition-group:** vue 2 compatible handling of transition-group w/ multiple v-for children ([86d3972](https://github.com/vuejs/vue-next/commit/86d3972855990c23f583a4b11b3c86fe04f1ab90)), closes [#1126](https://github.com/vuejs/vue-next/issues/1126)
* **types:** ensure correct public props interface for `defineComponent` instance type ([2961e14](https://github.com/vuejs/vue-next/commit/2961e149c9825d56680e982acd056d9f337afc5e)), closes [#1385](https://github.com/vuejs/vue-next/issues/1385)
* **types:** export `ComponentOptionsMixin` ([#1361](https://github.com/vuejs/vue-next/issues/1361)) ([68e2d6c](https://github.com/vuejs/vue-next/commit/68e2d6c68a4e8a95d112597b82d40efb8571d9c0))
* **types:** should unwrap array -> object -> ref ([82b28a5](https://github.com/vuejs/vue-next/commit/82b28a5ecb95be1565e50427bfd5eefe4b2d408c))
* **v-show:** fix v-show unmount with falsy value ([#1403](https://github.com/vuejs/vue-next/issues/1403)) ([d7beea0](https://github.com/vuejs/vue-next/commit/d7beea015bdb208d89a2352a5d43cc1913f87337)), closes [#1401](https://github.com/vuejs/vue-next/issues/1401)


### Features

* **runtime-core:** expose version on app instance ([056cac9](https://github.com/vuejs/vue-next/commit/056cac91855e644e94cd704ff5462c4e1acba66b)), closes [#1449](https://github.com/vuejs/vue-next/issues/1449)
* **ssr:** `renderToStream` ([#1197](https://github.com/vuejs/vue-next/issues/1197)) ([6bc0e0a](https://github.com/vuejs/vue-next/commit/6bc0e0a31a173cfd4cef82230862f269e4d94c94))


### Performance Improvements

* **compiler-core:** treat v-for with constant exp as a stable fragment ([#1394](https://github.com/vuejs/vue-next/issues/1394)) ([8a2cf21](https://github.com/vuejs/vue-next/commit/8a2cf21b717411e4e66f9223e9f6d1c5c817c6ac))
* **reactivity:** should not track `__v_isRef` ([#1392](https://github.com/vuejs/vue-next/issues/1392)) ([c43a6e6](https://github.com/vuejs/vue-next/commit/c43a6e61a0952c629cfb062f67e8eb27a0f6f227))
* **ssr:** avoid unnecessary await ticks when unrolling sync buffers ([30584bc](https://github.com/vuejs/vue-next/commit/30584bcc61515eb9200071b8a4780e05c2ab786e))



# [3.0.0-beta.15](https://github.com/vuejs/vue-next/compare/v3.0.0-beta.14...v3.0.0-beta.15) (2020-06-12)


### Bug Fixes

* **build:** retain main vue package side effect for compiler registration ([dc986ad](https://github.com/vuejs/vue-next/commit/dc986addd9f6c57a4d3d13b0f97132064a8d76a4)), closes [#1263](https://github.com/vuejs/vue-next/issues/1263)
* **compiler-core:** allow multiline expression on v-model and v-on ([#1234](https://github.com/vuejs/vue-next/issues/1234)) ([958b6c8](https://github.com/vuejs/vue-next/commit/958b6c80cf2e07ef6e829b5b5d698fd61c25b91f))
* **compiler-core:** bail static stringfication even threshold is met ([#1298](https://github.com/vuejs/vue-next/issues/1298)) ([64ec8bf](https://github.com/vuejs/vue-next/commit/64ec8bfb54b97036d9cde765d923443ec8bc02b9)), closes [#1128](https://github.com/vuejs/vue-next/issues/1128)
* **compiler-core:** fix parsing for directive with dynamic argument containing dots ([0d26413](https://github.com/vuejs/vue-next/commit/0d26413433d41389f5525a0ef2c2dd7cfbb454d4))
* **compiler-core:** support static slot names containing dots for 2.x compat ([825ec15](https://github.com/vuejs/vue-next/commit/825ec1500feda8b0c43245e7e92074af7f9dcca2)), closes [#1241](https://github.com/vuejs/vue-next/issues/1241)
* **hmr:** force full update on nested child components ([#1312](https://github.com/vuejs/vue-next/issues/1312)) ([8f2a748](https://github.com/vuejs/vue-next/commit/8f2a7489b7c74f5cfc1844697c60287c37fc0eb8))
* **reactivity:** fix toRaw for objects prototype inherting reactive ([10bb34b](https://github.com/vuejs/vue-next/commit/10bb34bb869a47c37d945f8c80abf723fac9fc1a)), closes [#1246](https://github.com/vuejs/vue-next/issues/1246)
* **runtime-core:** should pass instance to patchProp on mount for event error handling ([#1337](https://github.com/vuejs/vue-next/issues/1337)) ([aac9b03](https://github.com/vuejs/vue-next/commit/aac9b03c11c9be0c67b924004364a42d04d78195)), closes [#1336](https://github.com/vuejs/vue-next/issues/1336)
* **runtime-core:** track access to $attrs ([6abac87](https://github.com/vuejs/vue-next/commit/6abac87b3d1b7a22df80b7a70a10101a7f3d3732)), closes [#1346](https://github.com/vuejs/vue-next/issues/1346)
* always treat spellcheck and draggable as attributes ([4492b88](https://github.com/vuejs/vue-next/commit/4492b88938922a7f1bcc36a608375ad99f16b22e)), closes [#1350](https://github.com/vuejs/vue-next/issues/1350)
* **compiler-core:** fix prod whitespace/comment removal ([f3623e4](https://github.com/vuejs/vue-next/commit/f3623e4d1ea83d552b5ab29955dead6c36a87723)), closes [#1256](https://github.com/vuejs/vue-next/issues/1256)
* **compiler-dom:** add tfoot,caption,col element on bail stringification ([#1333](https://github.com/vuejs/vue-next/issues/1333)) ([fbaf52a](https://github.com/vuejs/vue-next/commit/fbaf52ae9fdd412e517e7edf44544db5d759dd2c))
* **compiler-dom:** bail stringification on table elements ([a938b61](https://github.com/vuejs/vue-next/commit/a938b61edca63c1f03f99b85de3f2a3a519268e6)), closes [#1230](https://github.com/vuejs/vue-next/issues/1230) [#1268](https://github.com/vuejs/vue-next/issues/1268)
* **compiler-sfc:** asset url transform should ignore direct hash urls ([5ddd9d2](https://github.com/vuejs/vue-next/commit/5ddd9d241747ef785de848d19246ef518abd8b8f))
* **compiler-ssr:** should escape template string interpolation chars in generated code ([5f15d9a](https://github.com/vuejs/vue-next/commit/5f15d9aa4b9024b3764b962bee042d72f94dee91))
* **hmr:** force full update in child component on slot update ([2408a65](https://github.com/vuejs/vue-next/commit/2408a656627358b21aa49209e64d14a1aeec7825))
* **reactivity:** replaced ref in reactive object should be tracked ([#1058](https://github.com/vuejs/vue-next/issues/1058)) ([80e1693](https://github.com/vuejs/vue-next/commit/80e1693e1f525a6c5811689fbeaccdccae1e2c23))
* **reactivity:** shallowReactive collection to not-readonly ([#1212](https://github.com/vuejs/vue-next/issues/1212)) ([c97d1ba](https://github.com/vuejs/vue-next/commit/c97d1bae56c3643304165d0e5b7924e5a0aad2df))
* **runtime-core:** default value for function type prop ([#1349](https://github.com/vuejs/vue-next/issues/1349)) ([d437a01](https://github.com/vuejs/vue-next/commit/d437a0145df5b63a959da873041816af68b440db)), closes [#1348](https://github.com/vuejs/vue-next/issues/1348)
* **runtime-core:** mount children before setting element props ([8084156](https://github.com/vuejs/vue-next/commit/8084156f4d0b572716a685a561d5087cddceab2c)), closes [#1318](https://github.com/vuejs/vue-next/issues/1318) [#1320](https://github.com/vuejs/vue-next/issues/1320)
* **runtime-core:** respect props from mixins and extends ([2417a0c](https://github.com/vuejs/vue-next/commit/2417a0cb302ed72e145986f85422470713edf2d8)), closes [#1236](https://github.com/vuejs/vue-next/issues/1236) [#1250](https://github.com/vuejs/vue-next/issues/1250)
* **runtime-core:** use array destructuring instead of object for edge compat ([#1302](https://github.com/vuejs/vue-next/issues/1302)) ([4a5021e](https://github.com/vuejs/vue-next/commit/4a5021e763b7f49069e1f3d488bdddf910f09f3f)), closes [#1294](https://github.com/vuejs/vue-next/issues/1294)
* **runtime-dom:** compatibility for cases where event.timeStamp is 0 ([#1328](https://github.com/vuejs/vue-next/issues/1328)) ([90c3532](https://github.com/vuejs/vue-next/commit/90c35329468e1fbb5cd2c1df2e4efd5b12b4fd41)), closes [#1325](https://github.com/vuejs/vue-next/issues/1325)
* **ssr:** fix unintended error on `Teleport` hydration mismatch ([#1271](https://github.com/vuejs/vue-next/issues/1271)) ([c463a71](https://github.com/vuejs/vue-next/commit/c463a71bb31f01da55927424533e2ece3a3c4efe)), closes [#1235](https://github.com/vuejs/vue-next/issues/1235)
* **types:** add RawSlots in h signature ([#1293](https://github.com/vuejs/vue-next/issues/1293)) ([cab769f](https://github.com/vuejs/vue-next/commit/cab769f174f4c0bcad59454e4a77039830e796f8))
* bail stringification for slots ([9b5d13e](https://github.com/vuejs/vue-next/commit/9b5d13e598686b0a73bc8f4a0f5581f066c3e923)), closes [#1281](https://github.com/vuejs/vue-next/issues/1281) [#1286](https://github.com/vuejs/vue-next/issues/1286)
* **ssr:** should set ref on hydration ([0a7932c](https://github.com/vuejs/vue-next/commit/0a7932c6b3e6b6fdda27fa7161726a615a598355))
* run ci ([6b889e7](https://github.com/vuejs/vue-next/commit/6b889e7c8a599c829f9a240fdcdce3299fbd0e6d))


### Features

* **compiler:** better warning for invalid expressions in function/browser mode ([e29f0b3](https://github.com/vuejs/vue-next/commit/e29f0b3fc2b10c76264cdd8e49c2ab4260286fd6)), closes [#1266](https://github.com/vuejs/vue-next/issues/1266)
* **runtime-core:** add inheritRef option + make `<transition>` & `<keep-alive>` inherit refs ([38f2d23](https://github.com/vuejs/vue-next/commit/38f2d23a607cd7077da189ac274a3a0ad542cc1f))
* **types:** adjust type exports for manual render function and tooling usage ([e4dc03a](https://github.com/vuejs/vue-next/commit/e4dc03a8b17d5e9f167de6a62a645878ac7ef3e2)), closes [#1329](https://github.com/vuejs/vue-next/issues/1329)
* **types:** mixins/extends support in TypeScript ([#626](https://github.com/vuejs/vue-next/issues/626)) ([d3c436a](https://github.com/vuejs/vue-next/commit/d3c436ae2e66b75b7f2ed574dadda3f0e1fdce73))
* **types:** support typing directive value via generic argument ([#1007](https://github.com/vuejs/vue-next/issues/1007)) ([419b86d](https://github.com/vuejs/vue-next/commit/419b86d1908f2a0521e6a7eafcbee764e9ee59a0)), closes [#998](https://github.com/vuejs/vue-next/issues/998)
* **types:** update to Typescript 3.9 ([#1106](https://github.com/vuejs/vue-next/issues/1106)) ([97dedeb](https://github.com/vuejs/vue-next/commit/97dedebd8097116a16209664a1ca38392b964da3))


### Performance Improvements

* only patch string style when value has changed ([#1310](https://github.com/vuejs/vue-next/issues/1310)) ([d4e9b19](https://github.com/vuejs/vue-next/commit/d4e9b19932dac686f57091e66f21a80d4c5db881)), closes [#1309](https://github.com/vuejs/vue-next/issues/1309)
* optimize LRU access in keep-alive ([#1316](https://github.com/vuejs/vue-next/issues/1316)) ([1f2926a](https://github.com/vuejs/vue-next/commit/1f2926a33c78b6a6f4752a01b88f7cad809ed302))



# [3.0.0-beta.14](https://github.com/vuejs/vue-next/compare/v3.0.0-beta.13...v3.0.0-beta.14) (2020-05-18)


### Bug Fixes

* **compiler-dom:** should bail stringification on runtime constant regardless of position ([dd2bfb5](https://github.com/vuejs/vue-next/commit/dd2bfb5a8f5b897a621b3ebb89a9fb1b8e4c63cd)), closes [vuejs/vite#157](https://github.com/vuejs/vite/issues/157)
* **reactivity:** shallowReactive for collections ([#1204](https://github.com/vuejs/vue-next/issues/1204)) ([488e2bc](https://github.com/vuejs/vue-next/commit/488e2bcfef8dd69d15c224d94a433680db140ef9)), closes [#1202](https://github.com/vuejs/vue-next/issues/1202)
* **runtime-dom:** event handlers with modifiers should get all event arguments ([#1193](https://github.com/vuejs/vue-next/issues/1193)) ([ab86b19](https://github.com/vuejs/vue-next/commit/ab86b190ce540336a01f936baa836f1aefd90e85))
* **Transition:** fix validate duration ([#1188](https://github.com/vuejs/vue-next/issues/1188)) ([d73a508](https://github.com/vuejs/vue-next/commit/d73a508a73c03d64cea0c376e25f4f0272728a18))
* **v-model:** should not trigger updates during input composition ([#1183](https://github.com/vuejs/vue-next/issues/1183)) ([83b7158](https://github.com/vuejs/vue-next/commit/83b7158017325db03e5c677b5f1c6adfe41d1ca4))


### Features

* **watch:** support directly watching reactive object in multiple sources with deep default ([#1201](https://github.com/vuejs/vue-next/issues/1201)) ([ba62ccd](https://github.com/vuejs/vue-next/commit/ba62ccd55d659a874ece4b26454ae31c6de72f59))



# [3.0.0-beta.13](https://github.com/vuejs/vue-next/compare/v3.0.0-beta.12...v3.0.0-beta.13) (2020-05-17)


### Features

* improve static content stringification ([d965bb6](https://github.com/vuejs/vue-next/commit/d965bb6227d53b715cfb797114b9452a6db841ec))



# [3.0.0-beta.12](https://github.com/vuejs/vue-next/compare/v3.0.0-beta.11...v3.0.0-beta.12) (2020-05-11)


### Bug Fixes

* **hmr:** static child traversal should only affect elements ([2bc6a8c](https://github.com/vuejs/vue-next/commit/2bc6a8c1cf4f409eea0cefa8b8a7619aae1f3569))



# [3.0.0-beta.11](https://github.com/vuejs/vue-next/compare/v3.0.0-beta.10...v3.0.0-beta.11) (2020-05-11)


### Bug Fixes

* **hmr:** always force full child component props update in HMR mode ([1b946c8](https://github.com/vuejs/vue-next/commit/1b946c85df3d213900faccfa0723d736fa0927a3))
* **hmr:** ensure static nodes inherit DOM element in hmr mode ([66c5a55](https://github.com/vuejs/vue-next/commit/66c5a556dc5b27e9a72fa7176fbb45d8c4c515b7)), closes [#1156](https://github.com/vuejs/vue-next/issues/1156)
* **runtime-core:** should not take unmount children fast path for v-for fragments ([5b8883a](https://github.com/vuejs/vue-next/commit/5b8883a84689dd04dbbcd677bf177ffeda43489d)), closes [#1153](https://github.com/vuejs/vue-next/issues/1153)
* **transition:** should reset enter class after appear ([#1152](https://github.com/vuejs/vue-next/issues/1152)) ([697de07](https://github.com/vuejs/vue-next/commit/697de07e630c502db42e93e64ba556cc4599cbe4))


### Features

* **runtime-core:** expose isVNode ([a165d82](https://github.com/vuejs/vue-next/commit/a165d8293dbd092828b14530577d45e2af40deda))



# [3.0.0-beta.10](https://github.com/vuejs/vue-next/compare/v3.0.0-beta.9...v3.0.0-beta.10) (2020-05-07)


### Bug Fixes

* **compiler:** warn against v-bind with empty attribute value ([675330b](https://github.com/vuejs/vue-next/commit/675330ba542022935ebbb2d31af3ba643c37a5eb)), closes [github.com/vuejs/vue-next/issues/1128#issuecomment-624647434](https://github.com/vuejs/vue-next/issues/1128#issuecomment-624647434)
* **compiler-dom:** bail static stringfication on non-attr bindings ([304ab8c](https://github.com/vuejs/vue-next/commit/304ab8c99b954de4aa9ab6a5387116228345f544)), closes [#1128](https://github.com/vuejs/vue-next/issues/1128)
* **compiler-sfc:** should not transform external asset url with ([d662118](https://github.com/vuejs/vue-next/commit/d66211849ca174c4458b59d3df5569730ee224f6))
* **compiler-sfc:** template with alt lang should be parsed as raw text ([d10835a](https://github.com/vuejs/vue-next/commit/d10835aee73e3be579c728df634fbaa8fe3a0e0f)), closes [#1120](https://github.com/vuejs/vue-next/issues/1120)
* **reactivity:** fix `__proto__` access on proxy objects ([#1133](https://github.com/vuejs/vue-next/issues/1133)) ([037fa07](https://github.com/vuejs/vue-next/commit/037fa07113eff6792cda58f91169d26cf6033aea))
* **reactivity:** use correct thisArg for collection method callbacks ([#1132](https://github.com/vuejs/vue-next/issues/1132)) ([e08f6f0](https://github.com/vuejs/vue-next/commit/e08f6f0ede03d09e71e44de5e524abd9789971d8))
* **runtime-dom/style:** normalize string when merging styles ([#1127](https://github.com/vuejs/vue-next/issues/1127)) ([2d9f136](https://github.com/vuejs/vue-next/commit/2d9f1360778154a232473fcf93f6164a6bd80ca5))


### Code Refactoring

* **compiler/types:** convert compiler options documentation to jsdoc ([e58beec](https://github.com/vuejs/vue-next/commit/e58beecc97635ea61e39b84ea406fcc42166095b))


### Features

* **compiler-sfc:** improve sfc source map generation ([698c8d3](https://github.com/vuejs/vue-next/commit/698c8d35d55ae6a157d7aad5ffb1f3a27e0b3970))
* **types:** re-expose trasnformVNodeArgs ([40166a8](https://github.com/vuejs/vue-next/commit/40166a8637a0f0272eb80777650398ccc067af88))


### Performance Improvements

* **compiler-sfc:** improve asset url transform efficiency ([c5dcfe1](https://github.com/vuejs/vue-next/commit/c5dcfe16f6cd3503ce1d5349cfacbe099a7e19be))
* **compiler-sfc:** only add character mapping if not whitespace ([2f69167](https://github.com/vuejs/vue-next/commit/2f69167e889f2817138629a04c01c6baf565d485))


### BREAKING CHANGES

* **compiler/types:** `getTextMode` compiler option signature has changed from

  ```ts
  (tag: string, ns: string, parent: ElementNode | undefined) => TextModes
  ```

  to

  ```ts
  (node: ElementNode, parent: ElementNode | undefined) => TextModes
  ```



# [3.0.0-beta.9](https://github.com/vuejs/vue-next/compare/v3.0.0-beta.8...v3.0.0-beta.9) (2020-05-04)


### Bug Fixes

* **compiler:** bail strigification on runtime constant expressions ([f9a3766](https://github.com/vuejs/vue-next/commit/f9a3766fd68dc6996cdbda6475287c4005f55243))
* **transitionGroup:** fix transition children resolving condition ([f05aeea](https://github.com/vuejs/vue-next/commit/f05aeea7aec2e6cd859f40edc6236afd0ce2ea7d))


### Features

* **compiler-sfc:** support transforming absolute asset urls ([6a0be88](https://github.com/vuejs/vue-next/commit/6a0be882d4ce95eb8d8093f273ea0e868acfcd24))


### BREAKING CHANGES

* **compiler-sfc:** `@vue/compiler-sfc`'s `transformAssetUrlsBase` option
has been removed. It is merged into `trasnformAssetUrls` which now also
accepts the format of

  ```ts
  {
    base?: string
    includeAbsolute?: string
    tags?: { [name: string]: string[] }
  }
  ```



# [3.0.0-beta.8](https://github.com/vuejs/vue-next/compare/v3.0.0-beta.7...v3.0.0-beta.8) (2020-05-04)


### Bug Fixes

* **hmr:** handle cases where instances with same id having different definitions ([01b7e90](https://github.com/vuejs/vue-next/commit/01b7e90eac88c79ed38a396f824f71c6653736c8))
* **reactivity:** avoid polluting Object prototype ([f40f3a0](https://github.com/vuejs/vue-next/commit/f40f3a0e9589bfa096d365f735c9bb54b9853fd3))
* **reactivity:** check own property for existing proxy of target ([6be2b73](https://github.com/vuejs/vue-next/commit/6be2b73f8aeb26be72eab22259c8a513b59b910f)), closes [#1107](https://github.com/vuejs/vue-next/issues/1107)
* **transitionGroup:** inner children should skip comment node ([#1105](https://github.com/vuejs/vue-next/issues/1105)) ([26a50ce](https://github.com/vuejs/vue-next/commit/26a50ce67f64439cfc242fba59b1e7129e59ba40))
* **types/reactivity:** fix ref type inference on nested reactive properties with .value ([bc1f097](https://github.com/vuejs/vue-next/commit/bc1f097e29c5c823737503532baa23c11d4824f8)), closes [#1111](https://github.com/vuejs/vue-next/issues/1111)


### Features

* **shared:** support Map and Set in toDisplayString ([3c60d40](https://github.com/vuejs/vue-next/commit/3c60d40827f65cbff024cfda4bb981a742bb83a7)), closes [#1067](https://github.com/vuejs/vue-next/issues/1067) [#1100](https://github.com/vuejs/vue-next/issues/1100)
* **types:** re-expose resolve asset utitlies and registerRuntimeCompiler in type definitions ([64ef7c7](https://github.com/vuejs/vue-next/commit/64ef7c76bf0dfa4897d930e9d369a026d1ecbaf6)), closes [#1109](https://github.com/vuejs/vue-next/issues/1109)
* **watch:** support directly watching reactive object with deep default ([6b33cc4](https://github.com/vuejs/vue-next/commit/6b33cc422933a004fb116fc5182b3fa3a32567ff)), closes [#1110](https://github.com/vuejs/vue-next/issues/1110)



# [3.0.0-beta.7](https://github.com/vuejs/vue-next/compare/v3.0.0-beta.6...v3.0.0-beta.7) (2020-05-02)


### Bug Fixes

* **warn:** cast symbols to strings ([#1103](https://github.com/vuejs/vue-next/issues/1103)) ([71a942b](https://github.com/vuejs/vue-next/commit/71a942b25a2cad61c3d670075523c31d296c7089))


### Features

* **compiler-sfc:** add transformAssetUrlsBase option ([36972c2](https://github.com/vuejs/vue-next/commit/36972c20b5c2451c8345361f9c015655afbfdd87))
* **types:** re-expose `withDirectives` as public type ([583ba0c](https://github.com/vuejs/vue-next/commit/583ba0c172de7a2fd0d2dc93ad7e4f40c53ba7ac))



# [3.0.0-beta.6](https://github.com/vuejs/vue-next/compare/v3.0.0-beta.5...v3.0.0-beta.6) (2020-05-01)


### Bug Fixes

* **compiler-core:** hoist pure annotations should apply to all nested calls ([c5e7d8b](https://github.com/vuejs/vue-next/commit/c5e7d8b532685e1e33e1cfb316f75c1b61109ee7))
* **compiler-core:** hoisted vnode calls and scoped id calls should be marked pure ([cad25d9](https://github.com/vuejs/vue-next/commit/cad25d95a3171628b0c95e89fb8e52eb5f41bbc5))
* **compiler-ssr:** handle comments codegen + refactor ssr codegen transform ([6c60ce1](https://github.com/vuejs/vue-next/commit/6c60ce13e061b43d314dde022d3f43ece7f03c30))
* **runtime-core:** avoid infinite warning loop for isRef check on component public proxy ([6233608](https://github.com/vuejs/vue-next/commit/62336085f497d42f0007bf9ad33f078d273605a6)), closes [#1091](https://github.com/vuejs/vue-next/issues/1091)
* **runtime-core:** cloned vnodes with extra props should de-opt ([08bf7e3](https://github.com/vuejs/vue-next/commit/08bf7e360783d520bae3fbe37143c52d360bd52d))
* **runtime-core:** fix slot fragment bail check ([ac6a6f1](https://github.com/vuejs/vue-next/commit/ac6a6f11ac3931c723c9aca8a351768ea2cacf38))
* **runtime-core:** should call Suspense fallback unmount hook ([#1061](https://github.com/vuejs/vue-next/issues/1061)) ([8b85aae](https://github.com/vuejs/vue-next/commit/8b85aaeea9b2ed343e2ae19958abbd9e5d223a77)), closes [#1059](https://github.com/vuejs/vue-next/issues/1059)
* **runtime-core:** should catch dom prop set TypeErrors ([98bee59](https://github.com/vuejs/vue-next/commit/98bee596bddc8131cccfde4a11fa2e5cd9bf39e4)), closes [#1051](https://github.com/vuejs/vue-next/issues/1051)
* **runtime-dom:** should not coerce nullish values to empty strings for non-string dom props ([20bc7ba](https://github.com/vuejs/vue-next/commit/20bc7ba1c55b43143a4cef98cadaad8d693f9275)), closes [#1049](https://github.com/vuejs/vue-next/issues/1049) [#1092](https://github.com/vuejs/vue-next/issues/1092) [#1093](https://github.com/vuejs/vue-next/issues/1093) [#1094](https://github.com/vuejs/vue-next/issues/1094)
* **ssr:** fix escape and handling for raw Text, Comment and Static vnodes ([5b09e74](https://github.com/vuejs/vue-next/commit/5b09e743a01a4dbc73b98ecf130a3a5f95ce41fe))
* **teleport:** teleport should always be tracked as dynamic child for unmount ([7f23555](https://github.com/vuejs/vue-next/commit/7f2355535613f1f5f5902cc7ca235fca8ee5493c)), closes [#1088](https://github.com/vuejs/vue-next/issues/1088)
* **types:** augment ref unwrap bail types in appropriate packages ([b40fcbc](https://github.com/vuejs/vue-next/commit/b40fcbc4c66125bf6b390e208b61635a9e2c003f))


### Code Refactoring

* **types:** mark internal API exports and exclude from d.ts ([c9bf7de](https://github.com/vuejs/vue-next/commit/c9bf7ded2e74790c902384e13c1d444c7136c1f9))


### Features

* **runtime-core:** warn against user properties with reserved prefixes ([1bddeea](https://github.com/vuejs/vue-next/commit/1bddeea24797fe5c66e469bb6bc526c17bfb7fde))


### Performance Improvements

* instance public proxy should never be observed ([11f38d8](https://github.com/vuejs/vue-next/commit/11f38d8a853b2d8043212c17612b63df92322de4))


### BREAKING CHANGES

* **types:** Internal APIs are now excluded from type declarations.



# [3.0.0-beta.5](https://github.com/vuejs/vue-next/compare/v3.0.0-beta.4...v3.0.0-beta.5) (2020-04-30)


### Bug Fixes

* **compiler-ssr:** avoid unnecessary withCtx import ([08b4e88](https://github.com/vuejs/vue-next/commit/08b4e8815da4e8911058ccbab986bea6365c3352))
* **hmr:** support hmr for static nodes ([386b093](https://github.com/vuejs/vue-next/commit/386b093554c8665fa6a9313b61c0a9359c4ec819))
* **hydration:** fix text mismatch warning ([e087b4e](https://github.com/vuejs/vue-next/commit/e087b4e02467db18766b7acc2218b3d38d60ce8b))
* **keep-alive:** do not invoke onVnodeBeforeUnmount if is KeepAlive component ([#1079](https://github.com/vuejs/vue-next/issues/1079)) ([239270c](https://github.com/vuejs/vue-next/commit/239270c38a56782bd7f29802cb583b0a8a5a4df4))
* **transition-group:** should collect raw children with Fragment ([#1046](https://github.com/vuejs/vue-next/issues/1046)) ([8ed3455](https://github.com/vuejs/vue-next/commit/8ed3455251d721e62fd7f6f75a7ef04bc411c152)), closes [#1045](https://github.com/vuejs/vue-next/issues/1045)
* **warning:** always check for component instance presence when formatting traces ([a0e2c12](https://github.com/vuejs/vue-next/commit/a0e2c1287466567d945e87496ce2f922f3dc6d8c))


### Features

* **runtime-core:** export queuePostFlushCb ([#1078](https://github.com/vuejs/vue-next/issues/1078)) ([ba240eb](https://github.com/vuejs/vue-next/commit/ba240eb497de75acd5f31ff6b3803da0560027d8))


### types

* use more consistent naming for apiWatch type exports ([892fb6d](https://github.com/vuejs/vue-next/commit/892fb6d2290516df44241992b62d65f1376f611a))


### BREAKING CHANGES

* Some watch API types are renamed.

    - `BaseWatchOptions` -> `WatchOptionsBase`
    - `StopHandle` -> `WatchStopHandle`



# [3.0.0-beta.4](https://github.com/vuejs/vue-next/compare/v3.0.0-beta.3...v3.0.0-beta.4) (2020-04-24)


### Bug Fixes

* **compiler-core:** dynamic component should always be made blocks ([7d0ab33](https://github.com/vuejs/vue-next/commit/7d0ab3392af5285147db111759fe380688ca17ea)), closes [#1018](https://github.com/vuejs/vue-next/issues/1018)
* **runtime-core:** dynamic component should support falsy values without warning ([ded92f9](https://github.com/vuejs/vue-next/commit/ded92f93b423cda28a40746c1f5fa9bcba56e80d))
* **runtime-core:** fix dynamic node tracking in dynamic component that resolves to plain elements ([dcf2458](https://github.com/vuejs/vue-next/commit/dcf2458fa84d7573273b0306aaabcf28ee859622)), closes [#1039](https://github.com/vuejs/vue-next/issues/1039)
* **runtime-core:** fix key/ref resolution for cloneVNode ([d7379c7](https://github.com/vuejs/vue-next/commit/d7379c7647e3222eddd18d7dad8d2520f59deb8a)), closes [#1041](https://github.com/vuejs/vue-next/issues/1041)
* **runtime-core:** mixin options that rely on this context should be deferred ([ff4d1fc](https://github.com/vuejs/vue-next/commit/ff4d1fcd81d96f3ddb0e34f04e70e3539dc7a96f)), closes [#1016](https://github.com/vuejs/vue-next/issues/1016) [#1029](https://github.com/vuejs/vue-next/issues/1029)
* **runtime-core:** only infer component name for object components ([e422b8b](https://github.com/vuejs/vue-next/commit/e422b8b082f1765f596c3ae0ff5b2e65d756405a)), closes [#1023](https://github.com/vuejs/vue-next/issues/1023)
* **slots:** compiled slot fallback should be functions ([#1030](https://github.com/vuejs/vue-next/issues/1030)) ([2b19965](https://github.com/vuejs/vue-next/commit/2b19965bcf75d981400ed58a0348bcfc13f17e33)), closes [#1021](https://github.com/vuejs/vue-next/issues/1021)
* **types:** fix ref(false) type to Ref<boolean> ([#1028](https://github.com/vuejs/vue-next/issues/1028)) ([0bdd889](https://github.com/vuejs/vue-next/commit/0bdd8891569eb15e492007b3eb0f45d598e85b3f))
* **types:** make return type of `defineComponent` assignable to `Component` type ([#1032](https://github.com/vuejs/vue-next/issues/1032)) ([f3a9b51](https://github.com/vuejs/vue-next/commit/f3a9b516bd6feb42d1ea611faf6550f709fd3173)), closes [#993](https://github.com/vuejs/vue-next/issues/993)


### Features

* **compiler-sfc:** add preprocessCustomRequire option ([20d425f](https://github.com/vuejs/vue-next/commit/20d425fb19e04cd5b66f76b0f52ca221c92eb74c))
* **compiler-sfc:** built-in support for css modules ([fa216a0](https://github.com/vuejs/vue-next/commit/fa216a0c3adc70ff74deca872e295a154fa147c8))
* **reactivity:** add triggerRef API ([2acf3e8](https://github.com/vuejs/vue-next/commit/2acf3e84b95d7f18925b4d7ada92f1992f5b7ee3))
* **types:** expose `ToRefs` type ([#1037](https://github.com/vuejs/vue-next/issues/1037)) ([28b4c31](https://github.com/vuejs/vue-next/commit/28b4c317b412e0c08bb791d647d4234078c41542))


### Performance Improvements

* **reactivity:** ref should not trigger if value did not change ([b0d4df9](https://github.com/vuejs/vue-next/commit/b0d4df974339a570fd30263797cf948619e1f57b)), closes [#1012](https://github.com/vuejs/vue-next/issues/1012)



# [3.0.0-beta.3](https://github.com/vuejs/vue-next/compare/v3.0.0-beta.2...v3.0.0-beta.3) (2020-04-20)


### Bug Fixes

* **runtime-core:** should not cast prop value if prop did not change ([171cfa4](https://github.com/vuejs/vue-next/commit/171cfa404f33a451376dcb84d66ddae012c343ec)), closes [#999](https://github.com/vuejs/vue-next/issues/999)
* **warn:** fix component name inference in warning trace ([0278992](https://github.com/vuejs/vue-next/commit/0278992f78834bc8df677c4e8ec891bb79510edb))


### Features

* **build:** provide more specific warnings for runtime compilation ([e954ba2](https://github.com/vuejs/vue-next/commit/e954ba21f04f0ef848c687233fcb849d75e4153f)), closes [#1004](https://github.com/vuejs/vue-next/issues/1004)
* **runtime-core:** improve warning for extraneous event listeners ([#1005](https://github.com/vuejs/vue-next/issues/1005)) ([cebad64](https://github.com/vuejs/vue-next/commit/cebad64d224ff9a2b7976643c85d55d8ec53ee54)), closes [#1001](https://github.com/vuejs/vue-next/issues/1001)
* **runtime-core:** more specific warning for failed v-on fallthrough ([ab844fd](https://github.com/vuejs/vue-next/commit/ab844fd1692007cf2be4d01a9062caa36fa1d280)), closes [#1001](https://github.com/vuejs/vue-next/issues/1001)
* **warn:** infer anonymous component named based on resolve name ([dece610](https://github.com/vuejs/vue-next/commit/dece6102aa84c115a3d6481c6e0f27e5b4be3ef1))


### Performance Improvements

* **core:** use `startsWith` instead of `indexOf` ([#989](https://github.com/vuejs/vue-next/issues/989)) ([054ccec](https://github.com/vuejs/vue-next/commit/054ccecd58c36b909661598f43a4056ed07e59c2))



# [3.0.0-beta.2](https://github.com/vuejs/vue-next/compare/v3.0.0-beta.1...v3.0.0-beta.2) (2020-04-17)


### Bug Fixes

* **runtime-core:** fix user attached public instance properties that start with "$" ([d7ca1c5](https://github.com/vuejs/vue-next/commit/d7ca1c5c6e75648793d670299c9059b6db9b1715))
* **watch:** fix deep watchers on refs containing primitives ([#984](https://github.com/vuejs/vue-next/issues/984)) ([99fd158](https://github.com/vuejs/vue-next/commit/99fd158d090594a433b57d9ff9420f3aed48ad2d))


### Features

* **types:** expose `ComponentCustomOptions` for declaring custom options ([c0adb67](https://github.com/vuejs/vue-next/commit/c0adb67c2e10d07af74304accbc1c79d19f6c196))
* **types:** expose `ExtractPropTypes` ([#983](https://github.com/vuejs/vue-next/issues/983)) ([4cf5e07](https://github.com/vuejs/vue-next/commit/4cf5e07608a85f1526b89e90ee3710d40cb5a964))
* **types** add `ComponentCustomProperties` interface ([#982](https://github.com/vuejs/vue-next/issues/982)) ([be21cfb](https://github.com/vuejs/vue-next/commit/be21cfb1db1a60fb0f2dda57d7f62d1c126a064b))



# [3.0.0-beta.1](https://github.com/vuejs/vue-next/compare/v3.0.0-alpha.13...v3.0.0-beta.1) (2020-04-16)


### Bug Fixes

* **reactivity:** remove Symbol.observable ([#968](https://github.com/vuejs/vue-next/issues/968)) ([4d014dc](https://github.com/vuejs/vue-next/commit/4d014dc3d361c52ac6192c063100ad8655a6e397))


### Code Refactoring

* **reactivity:** adjust APIs ([09b4202](https://github.com/vuejs/vue-next/commit/09b4202a22ae03072a8a8405511e37f65b626568))


### Features

* **runtime-core:** skip emit warn if has equivalent onXXX prop ([0709380](https://github.com/vuejs/vue-next/commit/0709380c5faf0a86c25a0564781fdb2650c9c353))


### Performance Improvements

* **runtime-core:** use raw context on component options init ([bfd6744](https://github.com/vuejs/vue-next/commit/bfd6744fb1db36a02914ef48da7116636343f313))


### BREAKING CHANGES

* **reactivity:** Reactivity APIs adjustments:

- `readonly` is now non-tracking if called on plain objects.
  `lock` and `unlock` have been removed. A `readonly` proxy can no
  longer be directly mutated. However, it can still wrap an already
  reactive object and track changes to the source reactive object.

- `isReactive` now only returns true for proxies created by `reactive`,
   or a `readonly` proxy that wraps a `reactive` proxy.

- A new utility `isProxy` is introduced, which returns true for both
  reactive or readonly proxies.

- `markNonReactive` has been renamed to `markRaw`.



# [3.0.0-alpha.13](https://github.com/vuejs/vue-next/compare/v3.0.0-alpha.12...v3.0.0-alpha.13) (2020-04-15)


### Bug Fixes

* **compiler-core:** should not generate CLASS/STYLE patch flags on components ([a6e2b10](https://github.com/vuejs/vue-next/commit/a6e2b1052a4d461767147a6c13854fcb4f9509d2)), closes [#677](https://github.com/vuejs/vue-next/issues/677)
* **runtime-core:** fix kebab-case props update ([7cbf684](https://github.com/vuejs/vue-next/commit/7cbf68461118ced0c7c6eb79a395ae2b148e3737)), closes [#955](https://github.com/vuejs/vue-next/issues/955)
* **runtime-core:** should resolve value instead of delete for dynamic props with options ([c80b857](https://github.com/vuejs/vue-next/commit/c80b857eb5b19f48f498147479a779af9953be32))
* **runtime-dom:** fix patching for attributes starting with `on` ([6eb3399](https://github.com/vuejs/vue-next/commit/6eb339931185a57cc36ddb6e12314a5283948169)), closes [#949](https://github.com/vuejs/vue-next/issues/949)
* **runtime-dom:** should patch svg innerHtml ([#956](https://github.com/vuejs/vue-next/issues/956)) ([27b5c71](https://github.com/vuejs/vue-next/commit/27b5c71944637bc04d715382851cc63ca7efc47a))
* **runtime-dom/v-on:** support event.stopImmediatePropagation on multiple listeners ([d45e475](https://github.com/vuejs/vue-next/commit/d45e47569d366b932c0e3461afc6478b45a4602d)), closes [#916](https://github.com/vuejs/vue-next/issues/916)
* **scheduler:** sort jobs before flushing ([78977c3](https://github.com/vuejs/vue-next/commit/78977c399734da7c4f8d58f2ccd650533e89249f)), closes [#910](https://github.com/vuejs/vue-next/issues/910) [/github.com/vuejs/vue-next/issues/910#issuecomment-613097539](https://github.com//github.com/vuejs/vue-next/issues/910/issues/issuecomment-613097539)
* **types:** UnwrapRef should bail on DOM element types ([#952](https://github.com/vuejs/vue-next/issues/952)) ([33ccfc0](https://github.com/vuejs/vue-next/commit/33ccfc0a8b69de13065c4b995f88722dd72a1ae9)), closes [#951](https://github.com/vuejs/vue-next/issues/951)


### Code Refactoring

* **reactivity:** remove stale API `markReadonly` ([e8a866e](https://github.com/vuejs/vue-next/commit/e8a866ec9945ec0464035be4c4c58d6212080a50))
* **runtime-core:** remove emit return value ([55566e8](https://github.com/vuejs/vue-next/commit/55566e8f520eee8a07b85221174989c47c443c35))


### Features

* **reactivity:** add support for `customRef` API ([b83c580](https://github.com/vuejs/vue-next/commit/b83c5801315e5e28ac51ecff743206e665f4d868))
* **reactivity:** add support for `toRef` API ([486dc18](https://github.com/vuejs/vue-next/commit/486dc188fe1593448d2bfb0c3c4c3c02b2d78ea4))
* **runtime-core:** detect and warn against components made reactive ([2e06f5b](https://github.com/vuejs/vue-next/commit/2e06f5bbe84155588dea82d90822a41dc93d0688)), closes [#962](https://github.com/vuejs/vue-next/issues/962)
* **runtime-core:** warn async data() ([3e7bb7d](https://github.com/vuejs/vue-next/commit/3e7bb7d110818d7b90ca4acc47afc30508f465b7))


### Reverts

* Revert "feat(reactivity): add effect to public api (#909)" (#961) ([9e9d264](https://github.com/vuejs/vue-next/commit/9e9d2644127a17f770f325d1f1c88b12a34c8789)), closes [#909](https://github.com/vuejs/vue-next/issues/909) [#961](https://github.com/vuejs/vue-next/issues/961)


### BREAKING CHANGES

* **reactivity:** `markReadonly` has been removed.
* **runtime-dom:** Only props starting with `on` followed by an uppercase
letter or a non-letter character are considered event listeners.
* **runtime-core:** this.$emit() and setupContext.emit() no longer
return values. For logic that relies on return value of listeners,
the listener should be declared as an `onXXX` prop and be called
directly. This still allows the parent component to pass in
a handler using `v-on`, since `v-on:foo` internally compiles
to `onFoo`.

    ref: https://github.com/vuejs/rfcs/pull/16



# [3.0.0-alpha.12](https://github.com/vuejs/vue-next/compare/v3.0.0-alpha.11...v3.0.0-alpha.12) (2020-04-08)


### Bug Fixes

* **compiler:** should not condense `&nbsp;` ([8c17535](https://github.com/vuejs/vue-next/commit/8c17535a470501f7f4ec3747cd3de25d9169c505)), closes [#945](https://github.com/vuejs/vue-next/issues/945)
* **compiler:** should only strip leading newline directly in pre tag ([be666eb](https://github.com/vuejs/vue-next/commit/be666ebd59027eb2fc96595c1a6054ecf62832e8))
* **compiler:** support full range of entity decoding in browser builds ([1f6e72b](https://github.com/vuejs/vue-next/commit/1f6e72b11051561abe270fa233cf52d5aba01d6b))
* **compiler-core:** elements with dynamic keys should be forced into blocks ([d531686](https://github.com/vuejs/vue-next/commit/d531686f9154c2ef7f1d877c275df62a8d8da2a5)), closes [#916](https://github.com/vuejs/vue-next/issues/916)
* **reactivity:** track reactive keys in raw collection types ([5dcc645](https://github.com/vuejs/vue-next/commit/5dcc645fc068f9a467fa31ba2d3c2a59e68a9fd7)), closes [#919](https://github.com/vuejs/vue-next/issues/919)
* **runtime-core:** fix globalProperties in check on instance render proxy ([c28a919](https://github.com/vuejs/vue-next/commit/c28a9196b2165e8ce274b2708d6d772024c2933a))
* **runtime-core:** set fragment root children should also update dynamicChildren ([#944](https://github.com/vuejs/vue-next/issues/944)) ([a27e9ee](https://github.com/vuejs/vue-next/commit/a27e9ee9aea3487ef3ef0c8a5df53227fc172886)), closes [#943](https://github.com/vuejs/vue-next/issues/943)
* **runtime-dom:** fix getModelAssigner order in vModelCheckbox ([#926](https://github.com/vuejs/vue-next/issues/926)) ([da1fb7a](https://github.com/vuejs/vue-next/commit/da1fb7afef75470826501fe6e9d81e5af296fea7))
* **runtime-dom:** support native onxxx handlers ([2302dea](https://github.com/vuejs/vue-next/commit/2302dea1624d4b964fed71e30089426212091c11)), closes [#927](https://github.com/vuejs/vue-next/issues/927)
* **slots:** should update compiled dynamic slots ([8444078](https://github.com/vuejs/vue-next/commit/84440780f9e45aa5b060180078b769f27757c7bd))
* **transition:** fix dynamic transition update on nested HOCs ([b8da8b2](https://github.com/vuejs/vue-next/commit/b8da8b2dfac96558df1d038aac3bbe63bd42a8ce))
* **transition:** should ship props declarations in production ([4227831](https://github.com/vuejs/vue-next/commit/42278317e15a202e4e1c8f7084eafa7bb13f1ade))
* **types:** accept generic Component type in h() ([c1d5928](https://github.com/vuejs/vue-next/commit/c1d5928f3b240a4a69bcd8d88494e4fe8d2e625b)), closes [#922](https://github.com/vuejs/vue-next/issues/922)
* **v-model:** handle dynamic assigners and array assigners ([f42d11e](https://github.com/vuejs/vue-next/commit/f42d11e8e19f7356f4e1629cd07c774c9af39288)), closes [#923](https://github.com/vuejs/vue-next/issues/923)


### Features

* **asyncComponent:** add `onError` option for defineAsyncComponent ([e804463](https://github.com/vuejs/vue-next/commit/e80446349215159c002223a41baeb5a8bc0f444c))
* **runtime-core:** improve component public instance proxy inspection ([899287a](https://github.com/vuejs/vue-next/commit/899287ad35d8b74e76a71f39772a92f261dfa4f8))


### BREAKING CHANGES

* **compiler:** compiler options have been adjusted.
    - new option `decodeEntities` is added.
    - `namedCharacterReferences` option has been removed.
    - `maxCRNameLength` option has been removed.
* **asyncComponent:** `retryWhen` and `maxRetries` options for
`defineAsyncComponent` has been replaced by the more flexible `onError`
option, per https://github.com/vuejs/rfcs/pull/148



# [3.0.0-alpha.11](https://github.com/vuejs/vue-next/compare/v3.0.0-alpha.10...v3.0.0-alpha.11) (2020-04-04)


### Bug Fixes

* **compiler:** fix pre tag whitespace handling ([7f30cb5](https://github.com/vuejs/vue-next/commit/7f30cb577257ad5765261bbffa3cae862259fcab)), closes [#908](https://github.com/vuejs/vue-next/issues/908)
* **compiler-core/slots:** should support on-component named slots ([a022b63](https://github.com/vuejs/vue-next/commit/a022b63605820c97923413ee457ba1fb69a5221e))
* **compiler-sfc:** always use offset for template block sourcemaps ([#911](https://github.com/vuejs/vue-next/issues/911)) ([db50009](https://github.com/vuejs/vue-next/commit/db5000935306214b31e33865cd57935e80e27d41))
* **inject:** allow default value to be `undefined` ([#894](https://github.com/vuejs/vue-next/issues/894)) ([94562da](https://github.com/vuejs/vue-next/commit/94562daea70fde33a340bb7b57746523c3660a8e)), closes [#892](https://github.com/vuejs/vue-next/issues/892)
* **portal:** portal should always remove its children when unmounted ([16cd8ee](https://github.com/vuejs/vue-next/commit/16cd8eee7839cc4613f17642bf37b39f7bdf1fce))
* **reactivity:** scheduled effect should not execute if stopped ([0764c33](https://github.com/vuejs/vue-next/commit/0764c33d3da8c06d472893a4e451e33394726a42)), closes [#910](https://github.com/vuejs/vue-next/issues/910)
* **runtime-core:** support attr merging on child with root level comments ([e42cb54](https://github.com/vuejs/vue-next/commit/e42cb543947d4286115b6adae6e8a5741d909f14)), closes [#904](https://github.com/vuejs/vue-next/issues/904)
* **runtime-dom:** v-cloak should be removed after compile on the root element ([#893](https://github.com/vuejs/vue-next/issues/893)) ([0ed147d](https://github.com/vuejs/vue-next/commit/0ed147d33610b86af72cbadcc4b32e6069bcaf08)), closes [#890](https://github.com/vuejs/vue-next/issues/890)
* **runtime-dom:** properly support creating customized built-in element ([b1d0b04](https://github.com/vuejs/vue-next/commit/b1d0b046afb1e8f4640d8d80b6eeaf9f89e892f7))
* **transition:** warn only when there is more than one rendered child ([#903](https://github.com/vuejs/vue-next/issues/903)) ([37b1dc8](https://github.com/vuejs/vue-next/commit/37b1dc8242608b072d14fd2a5e52f5d40829ea52))
* **types:** allow use PropType with Function ([#915](https://github.com/vuejs/vue-next/issues/915)) ([026eb72](https://github.com/vuejs/vue-next/commit/026eb729f3d1566e95f2f4253d76c20e86d1ec9b)), closes [#748](https://github.com/vuejs/vue-next/issues/748)
* **types:** export missing types from runtime-core ([#889](https://github.com/vuejs/vue-next/issues/889)) ([412ec86](https://github.com/vuejs/vue-next/commit/412ec86128fa33fa41ce435c493fd8275a785fea))
* **types/reactivity:** add generics constraint for markNonReactive ([f3b6559](https://github.com/vuejs/vue-next/commit/f3b6559408fb42ff6dc0c67001c9c67093f2b059)), closes [#917](https://github.com/vuejs/vue-next/issues/917)


### Code Refactoring

* **runtime-core:** adjust attr fallthrough behavior ([21bcdec](https://github.com/vuejs/vue-next/commit/21bcdec9435700cac98868a36716b49a7766c48d))
* rename `<portal>` to `<teleport>` ([eee5095](https://github.com/vuejs/vue-next/commit/eee50956924d7d2c916cdb8b99043da616e53af5))
* **runtime-core:** rename `createAsyncComponent` to `defineAsyncComponent` ([#888](https://github.com/vuejs/vue-next/issues/888)) ([ebc5873](https://github.com/vuejs/vue-next/commit/ebc587376ca1fb4bb8a20d4137332740605753c8))


### Features

* **asyncComponent:** retry support ([c01930e](https://github.com/vuejs/vue-next/commit/c01930e60b4abf481900cdfcc2ba422890c41656))
* **compiler-core:** export `transformElement` from compiler-core ([#907](https://github.com/vuejs/vue-next/issues/907)) ([20f4965](https://github.com/vuejs/vue-next/commit/20f4965b45d410a2fe95310ecf7293b2b7f46f36))
* **compiler-core:** support v-is ([b8ffbff](https://github.com/vuejs/vue-next/commit/b8ffbffaf771c259848743cf4eb1a5ea31795aaa))
* **portal:** hydration support for portal disabled mode ([b74bab2](https://github.com/vuejs/vue-next/commit/b74bab216c3be68ab046451cf5e5b5bec5f19483))
* **portal:** SSR support for multi portal shared target ([e866434](https://github.com/vuejs/vue-next/commit/e866434f0c54498dd0fc47d48287a1d0ada36388))
* **portal:** SSR support for portal disabled prop ([9ed9bf3](https://github.com/vuejs/vue-next/commit/9ed9bf3687a770aebc265839065832761e6bafa1))
* **portal:** support disabled prop ([8ce3da0](https://github.com/vuejs/vue-next/commit/8ce3da0104db9bdd89929724c6d841ac3dfb7336))
* **portal:** support multiple portal appending to same target ([aafb880](https://github.com/vuejs/vue-next/commit/aafb880a0a9e023b62cf8fb3ae269b31f22ac84e))
* **reactivity:** add effect to public api ([#909](https://github.com/vuejs/vue-next/issues/909)) ([6fba241](https://github.com/vuejs/vue-next/commit/6fba2418507d9c65891e8d14bd63736adb377556))
* **runtime-core:** config.performance tracing support ([e93e426](https://github.com/vuejs/vue-next/commit/e93e426bfad13f40c8f1d80b8f45ac5d0926c2fc))
* **runtime-core:** emits validation and warnings ([c7c3a6a](https://github.com/vuejs/vue-next/commit/c7c3a6a3bef6275be8f9f8873358421017bb5386))
* **runtime-core:** failed component resolution should fallback to native element ([cb31eb4](https://github.com/vuejs/vue-next/commit/cb31eb4d0a0afdd2abf9e3897d9aac447dd0264b))
* **runtime-core:** support app.config.globalProperties ([27873db](https://github.com/vuejs/vue-next/commit/27873dbe1c09ac6a058d815949a4e13831513fd0))
* **runtime-core:** type and attr fallthrough support for emits option ([bf473a6](https://github.com/vuejs/vue-next/commit/bf473a64eacab21d734d556c66cc190aa4ff902d))
* **templateRef:** should work with direct reactive property ([449ab03](https://github.com/vuejs/vue-next/commit/449ab039feb10df7179898b13ecc45028a043002)), closes [#901](https://github.com/vuejs/vue-next/issues/901)
* **templateRef:** support template ref for all vnode types ([55b364d](https://github.com/vuejs/vue-next/commit/55b364decc903a6c7fccd1cdcdcfc79948c848a2))


### BREAKING CHANGES

* **runtime-core:** attribute fallthrough behavior has been adjusted
according to https://github.com/vuejs/rfcs/pull/154
* `<portal>` has been renamed to `<teleport>`.

    `target` prop is also renamed to `to`, so the new usage will be:

    ```html
    <Teleport to="#modal-layer" :disabled="isMobile">
      <div class="modal">
        hello
      </div>
    </Teleport>
    ```

    The primary reason for the renaming is to avoid potential naming
    conflict with [native portals](https://wicg.github.io/portals/).
* **asyncComponent:** async component `error` and `loading` options have been
renamed to `errorComponent` and `loadingComponent` respectively.
* **runtime-core:** `createAsyncComponent` has been renamed to `defineAsyncComponent` for consistency with `defineComponent`.



# [3.0.0-alpha.10](https://github.com/vuejs/vue-next/compare/v3.0.0-alpha.9...v3.0.0-alpha.10) (2020-03-24)


### Bug Fixes

* fix option merge global mixins presence check ([10ad965](https://github.com/vuejs/vue-next/commit/10ad965100a88e28cb528690f2e09070fefc8872))
* **compiler-core:** assign patchFlag for template v-if fragment ([a1da9c2](https://github.com/vuejs/vue-next/commit/a1da9c28a0a7030124b1deb9369685760c67be47)), closes [#850](https://github.com/vuejs/vue-next/issues/850)
* **compiler-core:** support interpolation in RCDATA mode (e.g. textarea) ([0831b98](https://github.com/vuejs/vue-next/commit/0831b98eac344d9bdfd6f6e922902adb91ea180a))
* **keep-alive:** should update re-activated component with latest props ([1237387](https://github.com/vuejs/vue-next/commit/123738727a0af54fd632bf838dc3aa024722ee41))
* **reactivity:** should not observe frozen objects ([1b2149d](https://github.com/vuejs/vue-next/commit/1b2149dbb2dd224d01e90c1a9332bfe67aa465ce)), closes [#867](https://github.com/vuejs/vue-next/issues/867)
* **reactivity:** should not trigger map keys iteration when keys did not change ([45ba06a](https://github.com/vuejs/vue-next/commit/45ba06ac5f49876b4f05e5996f595b2c4a761f47)), closes [#877](https://github.com/vuejs/vue-next/issues/877)
* **runtime-core:** fix boolean props validation ([3b282e7](https://github.com/vuejs/vue-next/commit/3b282e7e3c96786af0a5ff61822882d1ed3f4db3))
* **runtime-dom:** invalid lineGradient svg tag ([#863](https://github.com/vuejs/vue-next/issues/863)) ([d425818](https://github.com/vuejs/vue-next/commit/d425818901428ff919a0179fc910410cbcfa119b)), closes [#862](https://github.com/vuejs/vue-next/issues/862)
* **TransitionGroup:** ignore comment node when warn (fix[#869](https://github.com/vuejs/vue-next/issues/869)) ([#875](https://github.com/vuejs/vue-next/issues/875)) ([0dba5d4](https://github.com/vuejs/vue-next/commit/0dba5d44e60d33b909f4e4d05663c7ddf746a1f2))
* do not drop SFC runtime behavior code in global builds ([4c1a193](https://github.com/vuejs/vue-next/commit/4c1a193617bee8ace6fad289b78e9d2557cb081e)), closes [#873](https://github.com/vuejs/vue-next/issues/873)
* dynamic component fallback to native element ([f529dbd](https://github.com/vuejs/vue-next/commit/f529dbde236e9eaedbded78e926951a189234f9c)), closes [#870](https://github.com/vuejs/vue-next/issues/870)
* **runtime-core:** fix component proxy props presence check ([b3890a9](https://github.com/vuejs/vue-next/commit/b3890a93e39342fd16e5fd72c59f361fc211309c)), closes [#864](https://github.com/vuejs/vue-next/issues/864)
* **suspense:** clear effects on suspense resolve ([ebc1ca8](https://github.com/vuejs/vue-next/commit/ebc1ca8eff82789987c09a9f6a934898b00153ff))
* **transition:** fix duration prop validation ([0dc2478](https://github.com/vuejs/vue-next/commit/0dc24785699101fa24d2a68786feaaac8a887520)), closes [#868](https://github.com/vuejs/vue-next/issues/868)


### Features

* **asyncComponent:** SSR/hydration support for async component ([cba2f1a](https://github.com/vuejs/vue-next/commit/cba2f1aadbd0d4ae246040ecd5a91d8dd4e8fd1a))
* **runtime-core:** async component support ([c3bb316](https://github.com/vuejs/vue-next/commit/c3bb3169f497fc834654d8ae700f18b1a6613127))
* **runtime-core:** support `config.optionMergeStrategies` ([528621b](https://github.com/vuejs/vue-next/commit/528621ba41b1d7113940077574217d01d182b35f))
* add hook for transforming h's arguments ([#851](https://github.com/vuejs/vue-next/issues/851)) ([b7d1e0f](https://github.com/vuejs/vue-next/commit/b7d1e0fa2ffe4561a589580eca6e92171c311347))


### Performance Improvements

* **transform-vif:** don't need to createBlock for a component ([#853](https://github.com/vuejs/vue-next/issues/853)) ([a3601e9](https://github.com/vuejs/vue-next/commit/a3601e9fa73d10f524ed3bdf3ae44df8847c1230))



# [3.0.0-alpha.9](https://github.com/vuejs/vue-next/compare/v3.0.0-alpha.8...v3.0.0-alpha.9) (2020-03-16)


### Bug Fixes

* **build:** remove __RUNTIME_COMPILE__ flag ([206640a](https://github.com/vuejs/vue-next/commit/206640a2d859a9ce9c19f22e201692f15a8d1da3)), closes [#817](https://github.com/vuejs/vue-next/issues/817)
* **compiler-core:** fix property shorthand detection ([586e5bb](https://github.com/vuejs/vue-next/commit/586e5bb8003916ba6be9b3394087df80328657f4)), closes [#845](https://github.com/vuejs/vue-next/issues/845)
* **compiler-ssr:** fix input w/ v-bind="obj" codegen ([3b40fc5](https://github.com/vuejs/vue-next/commit/3b40fc56dba56a5c1085582d11f3287e9317a151))
* **compiler-ssr:** should pass necessary tag names for dynamic v-bind ([a46f3b3](https://github.com/vuejs/vue-next/commit/a46f3b354d451a857df750a318bd0536338008cd))
* **runtime-core:** always set invalid vnode type ([#820](https://github.com/vuejs/vue-next/issues/820)) ([28a9bee](https://github.com/vuejs/vue-next/commit/28a9beed1624de9812e0f4ce9b63f7f3ed2c6db8))
* **runtime-core:** empty boolean props ([#844](https://github.com/vuejs/vue-next/issues/844)) ([c7ae269](https://github.com/vuejs/vue-next/commit/c7ae2699724bd5206ce7d2db73b86c1ef5947641)), closes [#843](https://github.com/vuejs/vue-next/issues/843)
* **runtime-core:** pass instance proxy as data() argument ([#828](https://github.com/vuejs/vue-next/issues/828)) ([d9dd1d8](https://github.com/vuejs/vue-next/commit/d9dd1d8a0ac81d7d463e0788bb2e75b2d4866db6))
* **runtime-dom:** patch xlink attribute ([#842](https://github.com/vuejs/vue-next/issues/842)) ([d318576](https://github.com/vuejs/vue-next/commit/d318576d74f8756e471942ff44d2af2a4661d775))
* simplify and use correct ctx in withCtx ([4dc8ffc](https://github.com/vuejs/vue-next/commit/4dc8ffc3788c38aff3e4c0f271d0ca111f723140))
* **runtime-core:** pass prev value to hostPatchProp ([#809](https://github.com/vuejs/vue-next/issues/809)) ([cd34603](https://github.com/vuejs/vue-next/commit/cd34603864142d5468486ec3f379679b22014a1b)), closes [#808](https://github.com/vuejs/vue-next/issues/808)
* **runtime-core:** should allow empty string and 0 as valid vnode key ([#807](https://github.com/vuejs/vue-next/issues/807)) ([54a0e93](https://github.com/vuejs/vue-next/commit/54a0e93c276f95a35b3bd6510a7f52d967fd3b7f))
* **types:** app.component should accept defineComponent return type ([#822](https://github.com/vuejs/vue-next/issues/822)) ([1e9d131](https://github.com/vuejs/vue-next/commit/1e9d1319c3f66a0a7430a4f6ac7b508486894b6b)), closes [#730](https://github.com/vuejs/vue-next/issues/730)


### Code Refactoring

* **runtime-core:** adjust patchProp value arguments order ([ca5f39e](https://github.com/vuejs/vue-next/commit/ca5f39ee3501a1d9cacdb74108318c15ee7c0abb))


### Features

* **compiler-core:** wrap slot functions with render context ([ecd7ce6](https://github.com/vuejs/vue-next/commit/ecd7ce60d5234a7a0dbc11add6a690c3f9ff0617))
* **compiler-sfc:** add ssr option ([3b2d236](https://github.com/vuejs/vue-next/commit/3b2d23671409f8ac358252311bf5212882fa985a))
* **runtime-core:** add special property to get class component options ([#821](https://github.com/vuejs/vue-next/issues/821)) ([dd17fa1](https://github.com/vuejs/vue-next/commit/dd17fa1c9071b9685c379e1b12102214b757cf35))
* **runtime-core:** implement RFC-0020 ([bb7fa3d](https://github.com/vuejs/vue-next/commit/bb7fa3dabce73de63d016c75f1477e7d8bed8858))
* **runtime-core:** set context for manual slot functions as well ([8a58dce](https://github.com/vuejs/vue-next/commit/8a58dce6034944b18c2e507b5d9ab8177f60e269))
* **server-renderer:** render suspense in vnode mode ([#727](https://github.com/vuejs/vue-next/issues/727)) ([589aeb4](https://github.com/vuejs/vue-next/commit/589aeb402c58f463cc32d5e7728b56614bc9bf33))
* **ssr:** compiler-ssr support for Suspense ([80c625d](https://github.com/vuejs/vue-next/commit/80c625dce33610e53c953e9fb8fde26e3e10e358))
* **ssr:** hide comment anchors during hydration in dev mode ([cad5bcc](https://github.com/vuejs/vue-next/commit/cad5bcce40b9f2aaa520ccbd377cd5419650e55f))
* **ssr:** improve fragment mismatch handling ([60ed4e7](https://github.com/vuejs/vue-next/commit/60ed4e7e0821a2932660b87fbf8d5ca953e0e073))
* **ssr:** support getSSRProps for vnode directives ([c450ede](https://github.com/vuejs/vue-next/commit/c450ede12d1a93a70271a2fe7fcb6f8efcf1cd4c))
* **ssr/suspense:** suspense hydration ([a3cc970](https://github.com/vuejs/vue-next/commit/a3cc970030579f2c55d893d6e83bbc05324adad4))
* **types:** export `ErrorTypes` ([#840](https://github.com/vuejs/vue-next/issues/840)) ([760c3e0](https://github.com/vuejs/vue-next/commit/760c3e0fd67f6360995cdbb125f9eae4e024f3af))


### Reverts

* Revert "refactor(directives): remove binding.instance" ([2370166](https://github.com/vuejs/vue-next/commit/23701666cb487e55d05b74d66990361051715ba4))


### BREAKING CHANGES

* **runtime-core:** data no longer supports object format (per RFC-0020)
* **runtime-core:** `RendererOptions.patchProp` arguments order has changed

  The `prevValue` and `nextValue` position has been swapped to keep it
  consistent with other functions in the renderer implementation. This
  only affects custom renderers using the `createRenderer` API.



# [3.0.0-alpha.8](https://github.com/vuejs/vue-next/compare/v3.0.0-alpha.7...v3.0.0-alpha.8) (2020-03-06)


### Bug Fixes

* **directives:** ignore invalid directive hooks ([7971b04](https://github.com/vuejs/vue-next/commit/7971b0468c81483dd7026204518f7c03187d13c4)), closes [#795](https://github.com/vuejs/vue-next/issues/795)
* **portal:** fix portal placeholder text ([4397528](https://github.com/vuejs/vue-next/commit/439752822c175c737e58896e0f365f2b02bab577))
* **reactivity:** allow effect trigger inside no-track execution contexts ([274f81c](https://github.com/vuejs/vue-next/commit/274f81c5db83f0f77e1aba3240b2134a2474a72f)), closes [#804](https://github.com/vuejs/vue-next/issues/804)
* **reactivity:** Map/Set identity methods should work even if raw value contains reactive entries ([cc69fd7](https://github.com/vuejs/vue-next/commit/cc69fd72e3f9ef3572d2be40af71d22232e1b9af)), closes [#799](https://github.com/vuejs/vue-next/issues/799)
* **reactivity:** should not trigger length dependency on Array delete ([a306658](https://github.com/vuejs/vue-next/commit/a3066581f3014aae31f2d96b96428100f1674166)), closes [#774](https://github.com/vuejs/vue-next/issues/774)
* **runtime-core:** ensure inherited attrs update on optimized child root ([6810d14](https://github.com/vuejs/vue-next/commit/6810d1402e214a12fa274ff5fb7475bad002d1b1)), closes [#677](https://github.com/vuejs/vue-next/issues/677) [#784](https://github.com/vuejs/vue-next/issues/784)
* **slots:** fix conditional slot ([3357ff4](https://github.com/vuejs/vue-next/commit/3357ff438c6ff0d4fea67923724dd3cb99ff2756)), closes [#787](https://github.com/vuejs/vue-next/issues/787)
* **ssr:** fix ssr on-the-fly compilation + slot fallback branch helper injection ([3be3785](https://github.com/vuejs/vue-next/commit/3be3785f945253918469da456a14a2d9381bcbd0))


### Code Refactoring

* **runtime-core:** adjust attr fallthrough behavior ([e1660f4](https://github.com/vuejs/vue-next/commit/e1660f4338fbf4d2a434e13193a58e00f844379b)), closes [#749](https://github.com/vuejs/vue-next/issues/749)
* **runtime-core:** revert setup() result reactive conversion ([e67f655](https://github.com/vuejs/vue-next/commit/e67f655b2687042fcc74dc0993581405abed56de))


### Features

* **compiler-core:** switch to @babel/parser for expression parsing ([8449a97](https://github.com/vuejs/vue-next/commit/8449a9727c942b6049c9e577c7c15b43fdca2867))
* **compiler-ssr:** compile portal ([#775](https://github.com/vuejs/vue-next/issues/775)) ([d8ed0e7](https://github.com/vuejs/vue-next/commit/d8ed0e7fbf9bbe734667eb94e809235e79e431eb))
* **ssr:** hydration mismatch handling ([91269da](https://github.com/vuejs/vue-next/commit/91269da52c30abf6c50312555b715f5360224bb0))


### BREAKING CHANGES

* **runtime-core:** adjust attr fallthrough behavior

    Updated per pending RFC https://github.com/vuejs/rfcs/pull/137

    - Implicit fallthrough now by default only applies for a whitelist
      of attributes (class, style, event listeners, a11y attributes, and
      data attributes).

    - Fallthrough is now applied regardless of whether the component has
* **runtime-core:** revert setup() result reactive conversion

    Revert 6b10f0c & a840e7d. The motivation of the original change was
    avoiding unnecessary deep conversions, but that can be achieved by
    explicitly marking values non-reactive via `markNonReactive`.

    Removing the reactive conversion behavior leads to an usability
    issue in that plain objects containing refs (which is what most
    composition functions will return), when exposed as a nested
    property from `setup()`, will not unwrap the refs in templates. This
    goes against the "no .value in template" intuition and the only
    workaround requires users to manually wrap it again with `reactive()`.

    So in this commit we are reverting to the previous behavior where
    objects returned from `setup()` are implicitly wrapped with
    `reactive()` for deep ref unwrapping.



# [3.0.0-alpha.7](https://github.com/vuejs/vue-next/compare/v3.0.0-alpha.6...v3.0.0-alpha.7) (2020-02-26)


### Bug Fixes

* **renderSlot:** set slot render as a STABLE_FRAGMENT ([#776](https://github.com/vuejs/vue-next/issues/776)) ([8cb0b83](https://github.com/vuejs/vue-next/commit/8cb0b8308801159177ec16ab5a3e23672c4c1d00)), closes [#766](https://github.com/vuejs/vue-next/issues/766)
* **runtime-core:** fix slot fallback + slots typing ([4a5b91b](https://github.com/vuejs/vue-next/commit/4a5b91bd1faec76bbaa0522b095f4a07ca88a9e5)), closes [#773](https://github.com/vuejs/vue-next/issues/773)
* **runtime-core:** make watchEffect ignore deep option ([#765](https://github.com/vuejs/vue-next/issues/765)) ([19a799c](https://github.com/vuejs/vue-next/commit/19a799c28b149b14e85d9e2081fa65ed58d108ba))
* **runtime-core:** set appContext.provides to Object.create(null) ([#781](https://github.com/vuejs/vue-next/issues/781)) ([04f83fa](https://github.com/vuejs/vue-next/commit/04f83fa6810e07915e98b94c954ff0c1859aaa49))
* **template-explorer:** rename watch -> watchEffect ([#780](https://github.com/vuejs/vue-next/issues/780)) ([59393dd](https://github.com/vuejs/vue-next/commit/59393dd75766720330cb69e22086c97a392dbbe4))
* **template-ref:** fix string template refs inside slots ([3eab143](https://github.com/vuejs/vue-next/commit/3eab1438432a3bab15ccf2f6092fc3e4355f3cdd))
* **types:** ref value type unwrapping should happen at creation time ([d4c6957](https://github.com/vuejs/vue-next/commit/d4c6957e2d8ac7920a649f3a3576689cd5e1099f))
* **types:** shallowRef should not unwrap value type ([3206e5d](https://github.com/vuejs/vue-next/commit/3206e5dfe58fd0e93644d13929558d71c5171888))


### Code Refactoring

* **directives:** remove binding.instance ([52cc7e8](https://github.com/vuejs/vue-next/commit/52cc7e823148289b3dcdcb6b521984ab815fce79))


### BREAKING CHANGES

* **directives:** custom directive bindings no longer expose instance

    This is a rarely used property that creates extra complexity in
    ensuring it points to the correct instance. From a design
    perspective, a custom directive should be scoped to the element and
    data it is bound to and should not have access to the entire
    instance in the first place.



# [3.0.0-alpha.6](https://github.com/vuejs/vue-next/compare/v3.0.0-alpha.5...v3.0.0-alpha.6) (2020-02-22)


### Bug Fixes

* **compiler-core:** should alias name in helperString ([#743](https://github.com/vuejs/vue-next/issues/743)) ([7b987d9](https://github.com/vuejs/vue-next/commit/7b987d9450fc7befcd0946a0d53991d27ed299ec)), closes [#740](https://github.com/vuejs/vue-next/issues/740)
* **compiler-dom:** properly stringify class/style bindings when hoisting static strings ([1b9b235](https://github.com/vuejs/vue-next/commit/1b9b235663b75db040172d2ffbee1dd40b4db032))
* **reactivity:** should trigger all effects when array length is mutated ([#754](https://github.com/vuejs/vue-next/issues/754)) ([5fac655](https://github.com/vuejs/vue-next/commit/5fac65589b4455b98fd4e2f9eb3754f0acde97bb))
* **sfc:** inherit parent scopeId on child root ([#756](https://github.com/vuejs/vue-next/issues/756)) ([9547c2b](https://github.com/vuejs/vue-next/commit/9547c2b93d6d8f469314cfe055960746a3e3acbe))
* **types:** improve ref typing, close [#759](https://github.com/vuejs/vue-next/issues/759) ([627b9df](https://github.com/vuejs/vue-next/commit/627b9df4a293ae18071009d9cac7a5e995d40716))
* **types:** update setup binding unwrap types for 6b10f0c ([a840e7d](https://github.com/vuejs/vue-next/commit/a840e7ddf0b470b5da27b7b2b8b5fcf39a7197a2)), closes [#738](https://github.com/vuejs/vue-next/issues/738)


### Code Refactoring

* preserve refs in reactive arrays ([775a7c2](https://github.com/vuejs/vue-next/commit/775a7c2b414ca44d4684badb29e8e80ff6b5d3dd)), closes [#737](https://github.com/vuejs/vue-next/issues/737)


### Features

* **reactivity:** expose unref and shallowRef ([e9024bf](https://github.com/vuejs/vue-next/commit/e9024bf1b7456b9cf9b913c239502593364bc773))
* **runtime-core:** add watchEffect API ([99a2e18](https://github.com/vuejs/vue-next/commit/99a2e18c9711d3d1f79f8c9c59212880efd058b9))


### Performance Improvements

* **effect:** optimize effect trigger for array length mutation ([#761](https://github.com/vuejs/vue-next/issues/761)) ([76c7f54](https://github.com/vuejs/vue-next/commit/76c7f5426919f9d29a303263bc54a1e42a66e94b))
* **reactivity:** only trigger all effects on Array length mutation if new length is shorter than old length ([33622d6](https://github.com/vuejs/vue-next/commit/33622d63600ba0f18ba4dae97bda882c918b5f7d))


### BREAKING CHANGES

* **runtime-core:** replace `watch(fn, options?)` with `watchEffect`

    The `watch(fn, options?)` signature has been replaced by the new
    `watchEffect` API, which has the same usage and behavior. `watch`
    now only supports the `watch(source, cb, options?)` signature.

* **reactivity:** reactive arrays no longer unwraps contained refs

    When reactive arrays contain refs, especially a mix of refs and
    plain values, Array prototype methods will fail to function
    properly - e.g. sort() or reverse() will overwrite the ref's value
    instead of moving it (see #737).

    Ensuring correct behavior for all possible Array methods while
    retaining the ref unwrapping behavior is exceedingly complicated; In
    addition, even if Vue handles the built-in methods internally, it
    would still break when the user attempts to use a 3rd party utility
    function (e.g. lodash) on a reactive array containing refs.

    After this commit, similar to other collection types like Map and
    Set, Arrays will no longer automatically unwrap contained refs.

    The usage of mixed refs and plain values in Arrays should be rare in
    practice. In cases where this is necessary, the user can create a
    computed property that performs the unwrapping.



# [3.0.0-alpha.5](https://github.com/vuejs/vue-next/compare/v3.0.0-alpha.4...v3.0.0-alpha.5) (2020-02-18)


### Bug Fixes

* **compiler:** fix v-for fragment openBlock argument ([12fcf9a](https://github.com/vuejs/vue-next/commit/12fcf9ab953acdbb8706b549c7e63f69482a495a))
* **compiler-core:** fix keep-alive when used in templates ([ade07c6](https://github.com/vuejs/vue-next/commit/ade07c64a1f98c0958e80db0458c699c21998f64)), closes [#715](https://github.com/vuejs/vue-next/issues/715)
* **compiler-core:** only check is prop on `<component>` ([78c4f32](https://github.com/vuejs/vue-next/commit/78c4f321cd0902a117c599ac705dda294fa198ed))
* **compiler-core:** relax error on unknown entities ([730d329](https://github.com/vuejs/vue-next/commit/730d329f794caf1ea2cc47628f8d74ef2d07f96e)), closes [#663](https://github.com/vuejs/vue-next/issues/663)
* **compiler-core:** should apply text transform to if branches ([e0f3c6b](https://github.com/vuejs/vue-next/commit/e0f3c6b352ab35adcad779ef0ac9670acf3d7b37)), closes [#725](https://github.com/vuejs/vue-next/issues/725)
* **compiler-core:** should not hoist element with cached + merged event handlers ([5455e8e](https://github.com/vuejs/vue-next/commit/5455e8e69a59cd1ff72330b1aed9c8e6aedc4b36))
* **compiler-dom:** fix duplicated transforms ([9e51297](https://github.com/vuejs/vue-next/commit/9e51297702f975ced1cfebad9a46afc46f0593bb))
* **compiler-sfc:** handle empty nodes with src attribute ([#695](https://github.com/vuejs/vue-next/issues/695)) ([2d56dfd](https://github.com/vuejs/vue-next/commit/2d56dfdc4fcf824bba4c0166ca5471258c4f883b))
* **compiler-ssr:** import helpers from correct packages ([8f6b669](https://github.com/vuejs/vue-next/commit/8f6b6690a2011846446804267ec49073996c3800))
* **computed:** support arrow function usage for computed option ([2fb7a63](https://github.com/vuejs/vue-next/commit/2fb7a63943d9d995248cb6d2d4fb5f22ff2ac000)), closes [#733](https://github.com/vuejs/vue-next/issues/733)
* **reactivity:** avoid cross-component dependency leaks in setup() ([d9d63f2](https://github.com/vuejs/vue-next/commit/d9d63f21b1e6f99f2fb63d736501095b131e5ad9))
* **reactivity:** effect should handle self dependency mutations ([e8e6772](https://github.com/vuejs/vue-next/commit/e8e67729cb7649d736be233b2a5e00768dd6f4ba))
* **reactivity:** trigger iteration effect on Map.set ([e1c9153](https://github.com/vuejs/vue-next/commit/e1c9153b9ed71f9b2e1ad4f9018c51d239e7dcd0)), closes [#709](https://github.com/vuejs/vue-next/issues/709)
* **runtime-core:** ensure renderCache always exists ([8383e54](https://github.com/vuejs/vue-next/commit/8383e5450e4f9679ac8a284f1c3960e3ee5b5211))
* **runtime-core:** fix keep-alive tree-shaking ([5b43764](https://github.com/vuejs/vue-next/commit/5b43764eacb59ff6ebba3195a55af4ac0cf253bb))
* **runtime-core:** fix ShapeFlags tree shaking ([0f67aa7](https://github.com/vuejs/vue-next/commit/0f67aa7da50d6ffc543754a42f1e677af11f9173))
* **runtime-core:** handle component updates with only class/style bindings ([35d91f4](https://github.com/vuejs/vue-next/commit/35d91f4e18ccb72cbf39a86fe8f39060f0bf075e))
* **runtime-core:** render context set should not unwrap reactive values ([27fbfbd](https://github.com/vuejs/vue-next/commit/27fbfbdb8beffc96134c931425f33178c23a72db))
* **runtime-core:** rework vnode hooks handling ([cfadb98](https://github.com/vuejs/vue-next/commit/cfadb98011e188114bb822ee6f678cd09ddac7e3)), closes [#684](https://github.com/vuejs/vue-next/issues/684)
* **runtime-core:** should not return early on text patchFlag ([778f3a5](https://github.com/vuejs/vue-next/commit/778f3a5e886a1a1136bc8b00b849370d7c4041be))
* **runtime-core/scheduler:** avoid duplicate updates of child component ([8a87074](https://github.com/vuejs/vue-next/commit/8a87074df013fdbb0e88f34074c2605e4af2937c))
* **runtime-core/scheduler:** invalidate job ([#717](https://github.com/vuejs/vue-next/issues/717)) ([fe9da2d](https://github.com/vuejs/vue-next/commit/fe9da2d0e4f9b338252b1b62941ee9ead71f0346))
* **runtime-core/watch:** trigger watcher with undefined as initial value ([#687](https://github.com/vuejs/vue-next/issues/687)) ([5742a0b](https://github.com/vuejs/vue-next/commit/5742a0b826fe77d2310acb530667adb758822f66)), closes [#683](https://github.com/vuejs/vue-next/issues/683)
* **runtime-dom/ssr:** properly handle xlink and boolean attributes ([e6e2c58](https://github.com/vuejs/vue-next/commit/e6e2c58234cab46fa530c383c0f7ae1cb3494da3))
* **ssr:** avoid hard-coded ssr checks in cjs builds ([bc07e95](https://github.com/vuejs/vue-next/commit/bc07e95ca84686bfa43798a444a3220581b183d8))
* **ssr:** fix class/style rendering + ssrRenderComponent export name ([688ad92](https://github.com/vuejs/vue-next/commit/688ad9239105625f7b63ac43181dfb2e9d1d4720))
* **ssr:** render components returning render function from setup ([#720](https://github.com/vuejs/vue-next/issues/720)) ([4669215](https://github.com/vuejs/vue-next/commit/4669215ca2f82d90a1bd730613259f3167e199cd))
* **transition-group:** handle multiple move-classes ([#679](https://github.com/vuejs/vue-next/issues/679)) ([5495c70](https://github.com/vuejs/vue-next/commit/5495c70c4a3f740ef4ac575ffee5466ca747cca1)), closes [#678](https://github.com/vuejs/vue-next/issues/678)
* **types:** app.component should accept defineComponent return type ([57ee5df](https://github.com/vuejs/vue-next/commit/57ee5df364f03816e548f4f3bf05edc7a089c362)), closes [#730](https://github.com/vuejs/vue-next/issues/730)
* **types:** ensure correct oldValue typing based on lazy option ([c6a9787](https://github.com/vuejs/vue-next/commit/c6a9787941ca99877d268182a5bb57fcf8b80b75)), closes [#719](https://github.com/vuejs/vue-next/issues/719)
* **v-on:** transform click.right and click.middle modifiers ([028f748](https://github.com/vuejs/vue-next/commit/028f748c32f80842be39897fdacc37f6700f00a7)), closes [#735](https://github.com/vuejs/vue-next/issues/735)
* remove effect from public API ([4bc4cb9](https://github.com/vuejs/vue-next/commit/4bc4cb970f7a65177948c5d817bb43ecb0324636)), closes [#712](https://github.com/vuejs/vue-next/issues/712)
* **v-model:** should use dynamic directive on input with dynamic v-bind ([1f2de9e](https://github.com/vuejs/vue-next/commit/1f2de9e232409b09c97b67d0824d1450beed6eb1))


### Code Refactoring

* **watch:** adjust watch API behavior ([9571ede](https://github.com/vuejs/vue-next/commit/9571ede84bb6949e13c25807cc8f016ace29dc8a))


### Features

* **compiler:** mark hoisted trees with patchFlag ([175f8aa](https://github.com/vuejs/vue-next/commit/175f8aae8d009e044e3674f7647bf1397f3a794a))
* **compiler:** warn invalid children for transition and keep-alive ([4cc39e1](https://github.com/vuejs/vue-next/commit/4cc39e14a297f42230f5aac5ec08e3c98902b98d))
* **compiler-core:** support mode: cjs in codegen ([04da2a8](https://github.com/vuejs/vue-next/commit/04da2a82e8fbde2b60b2392bc4bdcc5e61113202))
* **compiler-core/v-on:** support [@vnode-xxx](https://github.com/vnode-xxx) usage for vnode hooks ([571ed42](https://github.com/vuejs/vue-next/commit/571ed4226be618dcc9f95e4c2da8d82d7d2f7750))
* **compiler-dom:** handle constant expressions when stringifying static content ([8b7c162](https://github.com/vuejs/vue-next/commit/8b7c162125cb72068727a76ede8afa2896251db0))
* **compiler-dom/runtime-dom:** stringify eligible static trees ([27913e6](https://github.com/vuejs/vue-next/commit/27913e661ac551f580bd5fd42b49fe55cbe8dbb8))
* **reactivity:** add shallowReactive function ([#689](https://github.com/vuejs/vue-next/issues/689)) ([7f38c1e](https://github.com/vuejs/vue-next/commit/7f38c1e0ff5a7591f67ed21aa3a2944db2e72a27))
* **runtime-core/reactivity:** expose shallowReactive ([#711](https://github.com/vuejs/vue-next/issues/711)) ([21944c4](https://github.com/vuejs/vue-next/commit/21944c4a42a65f20245794fa5f07add579b7121f))
* **server-renderer:** support on-the-fly template compilation ([#707](https://github.com/vuejs/vue-next/issues/707)) ([6d10a6c](https://github.com/vuejs/vue-next/commit/6d10a6c77242aec98103f15d6cb672ba63c18abf))
* **ssr:** render portals ([#714](https://github.com/vuejs/vue-next/issues/714)) ([e495fa4](https://github.com/vuejs/vue-next/commit/e495fa4a1872d03ed59252e7ed5dd2b708adb7ae))
* **ssr:** support portal hydration ([70dc3e3](https://github.com/vuejs/vue-next/commit/70dc3e3ae74f08d53243e6f078794c16f359e272))
* **ssr:** useSSRContext ([fd03149](https://github.com/vuejs/vue-next/commit/fd031490fb89b7c0d1d478b586151a24324101a3))


### Performance Improvements

* prevent renderer hot functions being inlined by minifiers ([629ee75](https://github.com/vuejs/vue-next/commit/629ee75588fc2ca4ab2b3786046f788d3547b6bc))
* **reactivity:** better computed tracking ([#710](https://github.com/vuejs/vue-next/issues/710)) ([8874b21](https://github.com/vuejs/vue-next/commit/8874b21a7e2383a8bb6c15a7095c1853aa5ae705))


### BREAKING CHANGES

* **watch:** `watch` behavior has been adjusted.

    - When using the `watch(source, callback, options?)` signature, the
      callback now fires lazily by default (consistent with 2.x
      behavior).

      Note that the `watch(effect, options?)` signature is still eager,
      since it must invoke the `effect` immediately to collect
      dependencies.

    - The `lazy` option has been replaced by the opposite `immediate`
      option, which defaults to `false`. (It's ignored when using the
      effect signature)

    - Due to the above changes, the `watch` option in Options API now
      behaves exactly the same as 2.x.

    - When using the effect signature or `{ immediate: true }`, the
      initial execution is now performed synchronously instead of
      deferred until the component is mounted. This is necessary for
      certain use cases to work properly with `async setup()` and
      Suspense.

      The side effect of this is the immediate watcher invocation will
      no longer have access to the mounted DOM. However, the watcher can
      be initiated inside `onMounted` to retain previous behavior.



# [3.0.0-alpha.4](https://github.com/vuejs/vue-next/compare/v3.0.0-alpha.3...v3.0.0-alpha.4) (2020-01-27)


### Bug Fixes

* **reactivity:** Array methods relying on identity should work with raw values ([aefb7d2](https://github.com/vuejs/vue-next/commit/aefb7d282ed716923ca1a288a63a83a94af87ebc))
* **runtime-core:** instance should not expose non-declared props ([2884831](https://github.com/vuejs/vue-next/commit/2884831065e16ccf5bd3ae1ee95116803ee3b18c))
* **runtime-dom:** should not access document in non-browser env ([48152bc](https://github.com/vuejs/vue-next/commit/48152bc88ea817ae23e2987dce99d64b426366c1)), closes [#657](https://github.com/vuejs/vue-next/issues/657)
* **v-model/emit:** update:camelCase events should trigger kebab case equivalent ([2837ce8](https://github.com/vuejs/vue-next/commit/2837ce842856d51dfbb55e3fa4a36a352446fb54)), closes [#656](https://github.com/vuejs/vue-next/issues/656)


### Code Refactoring

* adjust `createApp` related API signatures ([c07751f](https://github.com/vuejs/vue-next/commit/c07751fd3605f301dc0f02fd2a48acc7ba7a0397))
* remove implicit reactive() call on renderContext ([6b10f0c](https://github.com/vuejs/vue-next/commit/6b10f0cd1da942c1d96746672b5f595df7d125b5))


### Performance Improvements

* **ssr:** avoid unnecessary async overhead ([297282a](https://github.com/vuejs/vue-next/commit/297282a81259289bfed207d0c9393337aea70117))


### BREAKING CHANGES

* object returned from `setup()` are no longer implicitly
passed to `reactive()`.

  The renderContext is the object returned by `setup()` (or a new object
  if no setup() is present). Before this change, it was implicitly passed
  to `reactive()` for ref unwrapping. But this has the side effect of
  unnecessary deep reactive conversion on properties that should not be
  made reactive (e.g. computed return values and injected non-reactive
  objects), and can lead to performance issues.

  This change removes the `reactive()` call and instead performs a
  shallow ref unwrapping at the render proxy level. The breaking part is
  when the user returns an object with a plain property from `setup()`,
  e.g. `return { count: 0 }`, this property will no longer trigger
  updates when mutated by a in-template event handler. Instead, explicit
  refs are required.

  This also means that any objects not explicitly made reactive in
  `setup()` will remain non-reactive. This can be desirable when
  exposing heavy external stateful objects on `this`.
* `createApp` API has been adjusted.

  - `createApp()` now accepts the root component, and optionally a props
  object to pass to the root component.
  - `app.mount()` now accepts a single argument (the root container)
  - `app.unmount()` no longer requires arguments.

  New behavior looks like the following:

  ``` js
  const app = createApp(RootComponent)
  app.mount('#app')
  app.unmount()
  ```



# [3.0.0-alpha.3](https://github.com/vuejs/vue-next/compare/v3.0.0-alpha.2...v3.0.0-alpha.3) (2020-01-22)


### Bug Fixes

* Suspense should include into dynamic children ([#653](https://github.com/vuejs/vue-next/issues/653)) ([ec63623](https://github.com/vuejs/vue-next/commit/ec63623fe8d395e1cd759f27b90b1ccc1b616931)), closes [#649](https://github.com/vuejs/vue-next/issues/649)
* **compiler-core:** avoid override user keys when injecting branch key ([#630](https://github.com/vuejs/vue-next/issues/630)) ([aca2c2a](https://github.com/vuejs/vue-next/commit/aca2c2a81e2793befce516378a02afd1e4da3d3d))
* **compiler-core:** force `<svg>` into blocks for correct runtime isSVG ([f2ac28b](https://github.com/vuejs/vue-next/commit/f2ac28b31e9f1e8ebcd68ca9a1e8ea29653b0916))
* **compiler-sfc:** only transform relative asset URLs ([#628](https://github.com/vuejs/vue-next/issues/628)) ([c71ca35](https://github.com/vuejs/vue-next/commit/c71ca354b9368135b55676c5817cebffaf3fd9c5))
* **dom:** fix `<svg>` and `<foreignObject>` mount and updates ([4f06eeb](https://github.com/vuejs/vue-next/commit/4f06eebc1c2a29d0e4165c6e87f849732ec2cd0f))
* **runtime-core:** condition for parent node check should be any different nodes ([c35fea3](https://github.com/vuejs/vue-next/commit/c35fea3d608acbb571ace6693284061e1cadf7ba)), closes [#622](https://github.com/vuejs/vue-next/issues/622)
* **runtime-core:** isSVG check should also apply for patch branch ([035b656](https://github.com/vuejs/vue-next/commit/035b6560f7eb64ce940ed0d06e19086ad9a3890f)), closes [#639](https://github.com/vuejs/vue-next/issues/639)
* **runtime-core:** should not warn unused attrs when accessed via setup context ([751d838](https://github.com/vuejs/vue-next/commit/751d838fb963e580a40df2d84840ba2198480185)), closes [#625](https://github.com/vuejs/vue-next/issues/625)
* **transition:** handle multiple transition classes ([#638](https://github.com/vuejs/vue-next/issues/638)) ([#645](https://github.com/vuejs/vue-next/issues/645)) ([98d50d8](https://github.com/vuejs/vue-next/commit/98d50d874dcb32a246216b936e442e5b95ab4825))


### Features

* **runtime-core:** emit now returns array of return values from all triggered handlers ([e81c8a3](https://github.com/vuejs/vue-next/commit/e81c8a32c7b66211cbaecffa93efd4629ec45ad9)), closes [#635](https://github.com/vuejs/vue-next/issues/635)
* **runtime-core:** support app.unmount(container) ([#601](https://github.com/vuejs/vue-next/issues/601)) ([04ac6c4](https://github.com/vuejs/vue-next/commit/04ac6c467a4122877c204d7494c86f89498d2dc6)), closes [#593](https://github.com/vuejs/vue-next/issues/593)



# [3.0.0-alpha.2](https://github.com/vuejs/vue-next/compare/v3.0.0-alpha.1...v3.0.0-alpha.2) (2020-01-13)


### Bug Fixes

* **compiler/v-on:** handle multiple statements in v-on handler (close [#572](https://github.com/vuejs/vue-next/issues/572)) ([137893a](https://github.com/vuejs/vue-next/commit/137893a4fdd3d2b901adca31e30d916df925b108))
* **compiler/v-slot:** handle implicit default slot mixed with named slots ([2ac4b72](https://github.com/vuejs/vue-next/commit/2ac4b723e010082488b5be64af73e41c9677a28d))
* **reactivity:** should delete observe value ([#598](https://github.com/vuejs/vue-next/issues/598)) ([63a6563](https://github.com/vuejs/vue-next/commit/63a656310676e3927b2e57d813fd6300c0a42590)), closes [#597](https://github.com/vuejs/vue-next/issues/597)
* **runtime-core:** allow classes to be passed as plugins ([#588](https://github.com/vuejs/vue-next/issues/588)) ([8f616a8](https://github.com/vuejs/vue-next/commit/8f616a89c580bc211540d5e4d60488ff24d024cc))
* **runtime-core:** should preserve props casing when component has no declared props ([bb6a346](https://github.com/vuejs/vue-next/commit/bb6a346996ce0bf05596c605ba5ddbe0743ef84b)), closes [#583](https://github.com/vuejs/vue-next/issues/583)
* **runtime-core/renderer:** fix v-if toggle inside blocks ([2e9726e](https://github.com/vuejs/vue-next/commit/2e9726e6a219d546cd28e4ed42be64719708f047)), closes [#604](https://github.com/vuejs/vue-next/issues/604) [#607](https://github.com/vuejs/vue-next/issues/607)
* **runtime-core/vnode:** should not render boolean values in vnode children (close [#574](https://github.com/vuejs/vue-next/issues/574)) ([84dc5a6](https://github.com/vuejs/vue-next/commit/84dc5a686275528733977ea1570e0a892ba3e177))
* **types:** components options should accept components defined with defineComponent ([#602](https://github.com/vuejs/vue-next/issues/602)) ([74baea1](https://github.com/vuejs/vue-next/commit/74baea108aa93377c4959f9a6b8bc8f9548700ba))
* **watch:** remove recorded effect on manual stop ([#590](https://github.com/vuejs/vue-next/issues/590)) ([453e688](https://github.com/vuejs/vue-next/commit/453e6889da22e7224b638261a32438bdf5c62e41))



# [3.0.0-alpha.1](https://github.com/vuejs/vue-next/compare/v3.0.0-alpha.0...v3.0.0-alpha.1) (2020-01-02)


### Bug Fixes

* **runtime-core:** pass options to plugins ([#561](https://github.com/vuejs/vue-next/issues/561)) ([4d20981](https://github.com/vuejs/vue-next/commit/4d20981eb069b20e1627916b977aedb2d68eca86))
* **sfc:** treat custom block content as raw text ([d6275a3](https://github.com/vuejs/vue-next/commit/d6275a3c310e6e9426f897afe35ff6cdb125c023))
* mounting new children ([7d436ab](https://github.com/vuejs/vue-next/commit/7d436ab59a30562a049e199ae579df7ac8066829))
* **core:** clone mounted hoisted vnodes on patch ([47a6a84](https://github.com/vuejs/vue-next/commit/47a6a846311203fa59584486265f5da387afa51d))
* **fragment:** perform direct remove when removing fragments ([2fdb499](https://github.com/vuejs/vue-next/commit/2fdb499bd96b4d1a8a7a1964d59e8dc5dacd9d22))


### Features

* **hmr:** root instance reload ([eda495e](https://github.com/vuejs/vue-next/commit/eda495efd824f17095728a4d2a6db85ca874e5ca))


### Performance Improvements

* **compiler-core:** simplify `advancePositionWithMutation` ([#564](https://github.com/vuejs/vue-next/issues/564)) ([ad2a0bd](https://github.com/vuejs/vue-next/commit/ad2a0bde988de743d4abc62b681b6a4888545a51))



# [3.0.0-alpha.0](https://github.com/vuejs/vue-next/compare/a8522cf48c09efbb2063f129cf1bea0dae09f10a...v3.0.0-alpha.0) (2019-12-20)

For changes between 2.x and 3.0 up to this release, please refer to merged RFCs [here](https://github.com/vuejs/rfcs/pulls?q=is%3Apr+is%3Amerged+label%3A3.x).
