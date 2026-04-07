const fs = require('fs');
const path = require('path');

// Fix react-native-tts build.gradle jcenter issue
const ttsGradlePath = path.join(
  __dirname,
  '../node_modules/react-native-tts/android/build.gradle',
);

if (fs.existsSync(ttsGradlePath)) {
  let content = fs.readFileSync(ttsGradlePath, 'utf8');

  // Replace jcenter() with google() and mavenCentral()
  if (content.includes('jcenter()')) {
    content = content.replace(
      /repositories\s*\{\s*jcenter\(\)\s*\}/g,
      'repositories {\n        google()\n        mavenCentral()\n    }',
    );

    // Update gradle version
    content = content.replace(
      /classpath 'com\.android\.tools\.build:gradle:1\.3\.1'/,
      "classpath 'com.android.tools.build:gradle:7.4.2'",
    );

    // Update SDK versions
    content = content.replace(
      /compileSdkVersion safeExtGet\('compileSdkVersion', 26\)/,
      "compileSdkVersion safeExtGet('compileSdkVersion', 34)",
    );
    content = content.replace(
      /buildToolsVersion safeExtGet\('buildToolsVersion', '26\.0\.3'\)/,
      "buildToolsVersion safeExtGet('buildToolsVersion', '34.0.0')",
    );
    content = content.replace(
      /minSdkVersion safeExtGet\('minSdkVersion', 16\)/,
      "minSdkVersion safeExtGet('minSdkVersion', 21)",
    );
    content = content.replace(
      /targetSdkVersion safeExtGet\('targetSdkVersion', 26\)/,
      "targetSdkVersion safeExtGet('targetSdkVersion', 34)",
    );

    // Add google() to repositories section
    content = content.replace(
      /repositories\s*\{\s*mavenCentral\(\)\s*\}/,
      'repositories {\n    google()\n    mavenCentral()\n}',
    );

    fs.writeFileSync(ttsGradlePath, content, 'utf8');
    console.log('✅ Fixed react-native-tts build.gradle');
  }
}
