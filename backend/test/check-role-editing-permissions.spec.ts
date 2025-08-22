import { expect } from 'chai';
import {
  canEditRole,
  getMaxPermissionRank,
  canAssignPermissionsBelowOwnLevel,
} from '../src/helpers/check-role-editing-permissions';

describe('check-role-editing-permissions', () => {
  describe('canEditRole', () => {
    it('should allow editing when assigner outranks target', () => {
      const result = canEditRole(['Admin'], 'Moderator');
      expect(result).to.be.true;
    });

    it('should deny editing when target has equal or higher rank', () => {
      const result = canEditRole(['Moderator'], 'Admin');
      expect(result).to.be.false;
    });

    it('should deny editing Banned or Muted even if assigner outranks', () => {
      const resultBanned = canEditRole(['Owner'], 'Banned');
      const resultMuted = canEditRole(['Admin'], 'Muted');
      expect(resultBanned).to.be.false;
      expect(resultMuted).to.be.false;
    });
  });

  describe('getMaxPermissionRank', () => {
    it('should return the max rank from permissions', () => {
      const result = getMaxPermissionRank(['canBan', 'canDeleteChannels']);
      expect(result).to.equal(3);
    });

    it('should return 0 for unknown permissions', () => {
      const result = getMaxPermissionRank(['unknownPerm']);
      expect(result).to.equal(0);
    });
  });

  describe('canAssignPermissionsBelowOwnLevel', () => {
    it('should allow if target max permission is lower', () => {
      const result = canAssignPermissionsBelowOwnLevel(
        ['canDeleteChannels'],
        ['canMute']
      );
      expect(result).to.be.true;
    });

    it('should deny if target max permission is equal or higher', () => {
      const result = canAssignPermissionsBelowOwnLevel(
        ['canMute'],
        ['canDeleteChannels']
      );
      expect(result).to.be.false;
    });
  });
});
