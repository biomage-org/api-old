const roles = require('../../../src/api.v2/helpers/roles');
const fake = require('../../test-utils/constants');


describe('tests for the roles logic', () => {
  test(' isRoleAuthorized authorizes all roles to GET', async () => {
    roles.ROLE_NAMES.forEach((role) => {
      const isAuthorized = roles.isRoleAuthorized(role, '*', 'GET');
      expect(isAuthorized).toEqual(true);
    });
  });
});
