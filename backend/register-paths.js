// Register TypeScript path aliases for compiled JavaScript
const tsConfigPaths = require('tsconfig-paths');
const path = require('path');

// Load TypeScript configuration
const tsConfig = require('./tsconfig.json');

// Register path aliases
tsConfigPaths.register({
  baseUrl: path.join(__dirname, 'dist'),
  paths: {
    '@/*': ['src/*'],
    '@/config/*': ['src/config/*'],
    '@/controllers/*': ['src/controllers/*'],
    '@/middleware/*': ['src/middleware/*'],
    '@/models/*': ['src/models/*'],
    '@/routes/*': ['src/routes/*'],
    '@/services/*': ['src/services/*'],
    '@/types/*': ['src/types/*'],
    '@/utils/*': ['src/utils/*']
  }
});