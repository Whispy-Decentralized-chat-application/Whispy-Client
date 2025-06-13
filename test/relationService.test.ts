// test/relationService.test.ts

// 1. Define los mocks primero
const dbMock = {
  getConnectedUser: jest.fn(),
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  context: jest.fn().mockReturnThis(),
  run: jest.fn(),
  insert: jest.fn().mockReturnThis(),
  value: jest.fn().mockReturnThis(),
  raw: jest.fn().mockReturnThis(),
};

const modelsMock = { user: 'UserTable', friend_event: 'FriendEventTable' };
const contextsMock = { whispy_test: 'testContext' };

// 2. Mockea orbisDB
jest.mock('@/app/ceramic/orbisDB', () => ({
  db: dbMock,
  models: modelsMock,
  contexts: contextsMock,
}));

// 3. Importa las funciones a testear
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  retrieveFriendRequests,
  retrieveContacts,
  isFriend,
} from '@/app/ceramic/relationService';

// 4. Mock de localStorage y console.log/warn para consola limpia
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
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('relationService', () => {

  describe('sendFriendRequest', () => {
    it('inserta evento de REQUEST correctamente', async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify({ stream_id: 'my_id' }));
      dbMock.insert.mockReturnThis();
      dbMock.value.mockReturnThis();
      dbMock.context.mockReturnThis();
      dbMock.run.mockResolvedValue({ result: 'ok' });

      await expect(sendFriendRequest('peer_id')).resolves.toBeUndefined();

      expect(dbMock.insert).toHaveBeenCalledWith('FriendEventTable');
      expect(dbMock.value).toHaveBeenCalledWith(expect.objectContaining({
        requester: 'my_id',
        userPeer: 'peer_id',
        type: 'REQUEST',
        lastMod: expect.any(String),
      }));
    });
  });

  describe('acceptFriendRequest', () => {
    it('inserta evento de ACCEPT correctamente', async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify({ stream_id: 'me' }));
      dbMock.insert.mockReturnThis();
      dbMock.value.mockReturnThis();
      dbMock.context.mockReturnThis();
      dbMock.run.mockResolvedValue({ result: 'ok' });

      await expect(acceptFriendRequest('peer_id', 'event123')).resolves.toBeUndefined();

      expect(dbMock.insert).toHaveBeenCalledWith('FriendEventTable');
      expect(dbMock.value).toHaveBeenCalledWith(expect.objectContaining({
        requester: 'me',
        userPeer: 'peer_id',
        eventPeer: 'event123',
        type: 'ACCEPT',
        lastMod: expect.any(String),
      }));
    });
  });

  describe('rejectFriendRequest', () => {
    it('inserta evento de REJECT correctamente', async () => {

      dbMock.insert.mockReturnThis();
      dbMock.value.mockReturnThis();
      dbMock.context.mockReturnThis();
      dbMock.run.mockResolvedValue({ result: 'ok' });

      await expect(rejectFriendRequest('peerid', 'event321')).resolves.toBeUndefined();

      expect(dbMock.insert).toHaveBeenCalledWith('FriendEventTable');
      expect(dbMock.value).toHaveBeenCalledWith(expect.objectContaining({
        userPeer: 'peerid',
        eventPeer: 'event321',
        type: 'REJECT',
        lastMod: expect.any(String),
      }));
    });
  });

  describe('retrieveFriendRequests', () => {
    it('devuelve lista de solicitudes de amistad', async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify({ stream_id: 'my_id' }));
      dbMock.select.mockReturnThis();
      dbMock.context.mockReturnThis();
      dbMock.raw.mockReturnThis();
      dbMock.run.mockResolvedValue({
        rows: [
          { username: 'pepe', userStream: 'peer1', eventToRespond: 'evt1' },
          { username: 'lola', userStream: 'peer2', eventToRespond: 'evt2' },
        ],
      });

      const requests = await retrieveFriendRequests();
      expect(requests).toEqual([
        { username: 'pepe', userStream: 'peer1', eventToRespond: 'evt1' },
        { username: 'lola', userStream: 'peer2', eventToRespond: 'evt2' },
      ]);
    });

    it('devuelve [] y lanza warning si no hay usuario en localStorage', async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(null);

      const requests = await retrieveFriendRequests();
      expect(requests).toEqual([]);
      expect(console.warn).toHaveBeenCalledWith("No hay usuario en localStorage");
    });
  });

  describe('retrieveContacts', () => {
    it('devuelve lista de contactos', async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify({ stream_id: 'me' }));
      dbMock.select.mockReturnThis();
      dbMock.context.mockReturnThis();
      dbMock.raw.mockReturnThis();
      dbMock.run.mockResolvedValue({
        rows: [
          { stream_id: 'user1', username: 'ana' },
          { stream_id: 'user2', username: 'bob' },
        ],
      });

      const contacts = await retrieveContacts();
      expect(contacts).toEqual([
        { stream_id: 'user1', username: 'ana' },
        { stream_id: 'user2', username: 'bob' },
      ]);
    });

    it('devuelve [] y lanza warning si no hay usuario en localStorage', async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(null);

      const contacts = await retrieveContacts();
      expect(contacts).toEqual([]);
      expect(console.warn).toHaveBeenCalledWith("No hay usuario en localStorage");
    });
  });

  describe('isFriend', () => {
    it('devuelve true si el usuario está en la lista de contactos', async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify({ stream_id: 'me' }));
      // Mockea retrieveContacts para devolver contacto esperado
      const contactsMock = [
        { stream_id: 'otherid', username: 'lola' },
        { stream_id: 'someoneelse', username: 'paco' },
      ];
      // Sobrescribe retrieveContacts por un mock temporal
      const retrieveContactsSpy = jest.spyOn(require('@/app/ceramic/relationService'), 'retrieveContacts');
      retrieveContactsSpy.mockResolvedValue(contactsMock);

      const result = await isFriend('otherid');
      expect(result).toBe(true);

      retrieveContactsSpy.mockRestore();
    });

    it('devuelve false si el usuario no está en la lista de contactos', async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify({ stream_id: 'me' }));
      const contactsMock = [{ stream_id: 'someoneelse', username: 'paco' }];
      const retrieveContactsSpy = jest.spyOn(require('@/app/ceramic/relationService'), 'retrieveContacts');
      retrieveContactsSpy.mockResolvedValue(contactsMock);

      const result = await isFriend('noexiste');
      expect(result).toBe(false);

      retrieveContactsSpy.mockRestore();
    });

    it('devuelve false y lanza warning si no hay usuario en localStorage', async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(null);

      const result = await isFriend('alguien');
      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalledWith("No hay usuario en localStorage");
    });
  });

});
