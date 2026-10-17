// Expo config plugin: keeps Android builds within ~2–3 GB of RAM (the dev machine has 6 GB, 8 cores).
// Applied on every `expo prebuild`, so regenerating android/ never loses these settings.
//  - smaller Gradle heap, Kotlin compiled in-process, at most 2 Gradle workers
//  - native (C++) compilation limited to 2 parallel clang processes via a CMake job pool
//    (by default ninja runs one per core + 2, ~1 GB each, which runs the machine out of memory)
const { withGradleProperties, withProjectBuildGradle } = require('expo/config-plugins');

const SETTINGS = {
  'org.gradle.jvmargs': '-Xmx1536m -XX:MaxMetaspaceSize=384m -XX:+UseSerialGC',
  'kotlin.compiler.execution.strategy': 'in-process',
  'org.gradle.workers.max': '2',
};

const MARKER = '// [withLowMemoryGradle] limit parallel C++ compiles';
const CMAKE_POOL = `
${MARKER}
def lowMemCmakePool = { p ->
  p.android.defaultConfig.externalNativeBuild.cmake.arguments '-DCMAKE_JOB_POOLS=compile=2;link=1', '-DCMAKE_JOB_POOL_COMPILE=compile', '-DCMAKE_JOB_POOL_LINK=link'
}
subprojects { sub ->
  sub.plugins.withId('com.android.library') { lowMemCmakePool(sub) }
  sub.plugins.withId('com.android.application') { lowMemCmakePool(sub) }
}
`;

module.exports = function withLowMemoryGradle(config) {
  config = withGradleProperties(config, (cfg) => {
    for (const [key, value] of Object.entries(SETTINGS)) {
      cfg.modResults = cfg.modResults.filter((p) => !(p.type === 'property' && p.key === key));
      cfg.modResults.push({ type: 'property', key, value });
    }
    return cfg;
  });
  return withProjectBuildGradle(config, (cfg) => {
    if (!cfg.modResults.contents.includes(MARKER)) cfg.modResults.contents += CMAKE_POOL;
    return cfg;
  });
};
