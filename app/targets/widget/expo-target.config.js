// The iPhone home-screen widget: tonight's challenge and the evening streak.
// Built by @bacons/apple-targets at prebuild (development or App Store build only).
/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'widget',
  name: 'LampionWidget',
  displayName: 'Lampion',
  icon: '../../assets/icon.png',
  deploymentTarget: '17.0',
  colors: {
    $accent: '#F4B45E',
    $widgetBackground: '#0D0F1E',
    night: '#0D0F1E',
    amber: '#F4B45E',
    gold: '#FFD98E',
    ink: '#EFE8D8',
    muted: '#9CA2C6',
  },
  entitlements: {
    'com.apple.security.application-groups': config.ios.entitlements['com.apple.security.application-groups'],
  },
});
