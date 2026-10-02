// Lampion only schedules local reminders (no server, nothing sent): the push entitlement that
// expo-notifications adds by default is removed, so the app asks Apple for no push capability.
const { withEntitlementsPlist } = require('expo/config-plugins');

module.exports = (config) => withEntitlementsPlist(config, (c) => {
  delete c.modResults['aps-environment'];
  return c;
});
