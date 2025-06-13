// test/communityService.test.ts

const dbMock = {
  getConnectedUser: jest.fn(),
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  context: jest.fn().mockReturnThis(),
  run: jest.fn(),
  insert: jest.fn().mockReturnThis(),
  value: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  raw: jest.fn().mockReturnThis(),
};

const modelsMock = { 
  community: 'CommunityTable', 
  community_membership: 'CommunityMembershipTable' 
};
const contextsMock = { whispy_test: 'testContext' };

jest.mock('@/app/ceramic/orbisDB', () => ({
  db: dbMock,
  models: modelsMock,
  contexts: contextsMock,
}));

import {
  retrieveMyCommunities,
  joinCommunity,
  leaveCommunity,
  createCommunity,
  searchCommunities,
  getCommunityById,
  checkJoined
} from '@/app/ceramic/communityService';

beforeAll(() => {
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    },
    writable: true,
  });
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('communityService', () => {
  describe('retrieveMyCommunities', () => {
    it('devuelve comunidades del usuario', async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify({ stream_id: 'user1' }));
      dbMock.select.mockReturnThis();
      dbMock.context.mockReturnThis();
      dbMock.raw.mockReturnThis();
      dbMock.run.mockResolvedValue({
        columns: [],
        rows: [
          { stream_id: 'com1', name: 'Comunidad 1' },
          { stream_id: 'com2', name: 'Comunidad 2' }
        ]
      });

      const result = await retrieveMyCommunities();
      expect(result).toEqual([
        { stream_id: 'com1', name: 'Comunidad 1' },
        { stream_id: 'com2', name: 'Comunidad 2' }
      ]);
    });
  });

  describe('joinCommunity', () => {
    it('crea nueva membresía si no existe', async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify({ stream_id: 'user2' }));
      dbMock.getConnectedUser.mockResolvedValue({ user: { did: 'did:xyz' } });
      dbMock.select.mockReturnThis();
      dbMock.context.mockReturnThis();
      dbMock.from.mockReturnThis();
      dbMock.where.mockReturnThis();
      dbMock.run
        .mockResolvedValueOnce({ rows: [] })  // No existe membresía
        .mockResolvedValueOnce({});           // Inserción

      dbMock.insert.mockReturnThis();
      dbMock.value.mockReturnThis();

      await joinCommunity('communityX');
      expect(dbMock.insert).toHaveBeenCalledWith('CommunityMembershipTable');
      expect(dbMock.value).toHaveBeenCalledWith(expect.objectContaining({
        communityId: 'communityX',
        userId: 'user2',
        active: true
      }));
    });

    it('actualiza membresía si ya existe', async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify({ stream_id: 'user2' }));
      dbMock.getConnectedUser.mockResolvedValue({ user: { did: 'did:xyz' } });
      dbMock.select.mockReturnThis();
      dbMock.context.mockReturnThis();
      dbMock.from.mockReturnThis();
      dbMock.where.mockReturnThis();

      dbMock.run
        .mockResolvedValueOnce({ rows: [{ stream_id: 'memb1', active: false }] })  // Ya existe
        .mockResolvedValueOnce({}); // Actualización

      dbMock.update.mockReturnThis();
      dbMock.set.mockReturnThis();

      await joinCommunity('communityX');
      expect(dbMock.update).toHaveBeenCalledWith('memb1');
      expect(dbMock.set).toHaveBeenCalledWith({ active: true });
    });

    it('loggea error si hay excepción', async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify({ stream_id: 'user2' }));
      dbMock.getConnectedUser.mockRejectedValue(new Error('fail'));
      await joinCommunity('communityY');
      expect(console.error).toHaveBeenCalledWith("Error creating community membership:", expect.any(Error));
    });
  });

  describe('leaveCommunity', () => {
    it('actualiza la membresía a inactive', async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify({ stream_id: 'userX' }));
      dbMock.getConnectedUser.mockResolvedValue({ user: { did: 'did:123' } });
      dbMock.select.mockReturnThis();
      dbMock.context.mockReturnThis();
      dbMock.from.mockReturnThis();
      dbMock.where.mockReturnThis();
      dbMock.run
        .mockResolvedValueOnce({ rows: [{ stream_id: 'memb2', active: true }] })
        .mockResolvedValueOnce({});

      dbMock.update.mockReturnThis();
      dbMock.set.mockReturnThis();

      await leaveCommunity('commYY');
      expect(dbMock.update).toHaveBeenCalledWith('memb2');
      expect(dbMock.set).toHaveBeenCalledWith({ active: false });
    });

    it('loggea error si hay excepción', async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify({ stream_id: 'userX' }));
      dbMock.getConnectedUser.mockRejectedValue(new Error('fail2'));
      await leaveCommunity('commYY');
      expect(console.error).toHaveBeenCalledWith("Error updating community membership:", expect.any(Error));
    });
  });

  describe('createCommunity', () => {
    it('crea comunidad y añade membresía', async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify({ stream_id: 'user3' }));
      dbMock.getConnectedUser.mockResolvedValue({ user: { did: 'did:yo' } });
      dbMock.insert.mockReturnThis();
      dbMock.value.mockReturnThis();
      dbMock.context.mockReturnThis();

      dbMock.run
        .mockResolvedValueOnce({ id: 'commNew' }) // Inserción comunidad
        .mockResolvedValueOnce({});               // Inserción membresía

      await createCommunity('TestCom', 'Descripción');
      expect(dbMock.insert).toHaveBeenCalledWith('CommunityTable');
      expect(dbMock.value).toHaveBeenCalledWith(expect.objectContaining({
        name: 'TestCom',
        description: 'Descripción',
        creator: 'user3',
        admins: ['user3'],
      }));
      expect(dbMock.insert).toHaveBeenCalledWith('CommunityMembershipTable');
      expect(dbMock.value).toHaveBeenCalledWith(expect.objectContaining({
        communityId: 'commNew',
        userId: 'user3',
        active: true
      }));
    });

    it('loggea error si hay excepción', async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify({ stream_id: 'user3' }));
      dbMock.getConnectedUser.mockRejectedValue(new Error('fail3'));
      await createCommunity('TestCom', 'Descripción');
      expect(console.error).toHaveBeenCalledWith("Error creating community:", expect.any(Error));
    });
  });

  describe('searchCommunities', () => {
    it('busca comunidades y devuelve coincidencias', async () => {
      dbMock.select.mockReturnThis();
      dbMock.context.mockReturnThis();
      dbMock.raw.mockReturnThis();
      dbMock.run.mockResolvedValue({
        columns: [],
        rows: [
          { stream_id: 'com1', name: 'Test1', description: 'Desc1' },
          { stream_id: 'com2', name: 'Test2', description: 'Desc2' }
        ]
      });

      const result = await searchCommunities('Test');
      expect(result).toEqual([
        { stream_id: 'com1', name: 'Test1', description: 'Desc1' },
        { stream_id: 'com2', name: 'Test2', description: 'Desc2' }
      ]);
    });
  });

  describe('getCommunityById', () => {
    it('devuelve comunidad por id', async () => {
      dbMock.select.mockReturnThis();
      dbMock.context.mockReturnThis();
      dbMock.from.mockReturnThis();
      dbMock.where.mockReturnThis();
      dbMock.run.mockResolvedValue({
        columns: [],
        rows: [{ stream_id: 'idX', name: 'Test Community' }]
      });

      const result = await getCommunityById('idX');
      expect(result).toEqual({ stream_id: 'idX', name: 'Test Community' });
    });
  });

  describe('checkJoined', () => {
    it('devuelve true si existe membresía activa', async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify({ stream_id: 'user3' }));
      dbMock.getConnectedUser.mockResolvedValue({ user: { did: 'did:yo' } });
      dbMock.select.mockReturnThis();
      dbMock.context.mockReturnThis();
      dbMock.from.mockReturnThis();
      dbMock.where.mockReturnThis();
      dbMock.run.mockResolvedValue({ rows: [{ active: true }] });

      const result = await checkJoined('commZ');
      expect(result).toBe(true);
    });

    it('devuelve false si no existe membresía', async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify({ stream_id: 'user3' }));
      dbMock.getConnectedUser.mockResolvedValue({ user: { did: 'did:yo' } });
      dbMock.select.mockReturnThis();
      dbMock.context.mockReturnThis();
      dbMock.from.mockReturnThis();
      dbMock.where.mockReturnThis();
      dbMock.run.mockResolvedValue({ rows: [] });

      const result = await checkJoined('commZ');
      expect(result).toBe(false);
    });
  });
});
