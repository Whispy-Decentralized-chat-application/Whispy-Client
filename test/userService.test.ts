// test/userService.test.ts

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

const modelsMock = { user: 'UserTable' };
const contextsMock = { whispy_test: 'testContext' };


// Mockea dependencias externas con import absoluto para funcionar con Jest + tsconfig paths
jest.mock('@/app/ceramic/criptoService', () => ({
  encryptWithPassword: jest.fn().mockResolvedValue('encrypted'),
  generateKeyPair: jest.fn().mockResolvedValue({ publicKey: 'public', privateKey: 'private' }),
}));



// Mockea orbisDB con import absoluto
jest.mock('@/app/ceramic/orbisDB', () => ({
  db: dbMock,
  models: modelsMock,
  contexts: contextsMock,
}));


import {
  getMe,
  getUserByBcAdress,
  registerUser,
  searchUsersByUsername,
  getUserByUsername,
  getUserById
} from "@/app/ceramic/userService";

// Mock de localStorage para Node.js/jsdom si hace falta
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
});

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});



beforeEach(() => {
  jest.clearAllMocks();
});

describe('userService', () => {

  describe('getMe', () => {
    it('lanza error si no hay sesión', async () => {
      dbMock.getConnectedUser.mockResolvedValue(null);
      await expect(getMe()).rejects.toThrow("No hay sesión de usuario activa");
    });

    it('devuelve el usuario si hay sesión', async () => {
      dbMock.getConnectedUser.mockResolvedValue({ user: { did: 'did:123' } });
      dbMock.run.mockResolvedValue({ rows: [{ username: 'juan' }] });
      const user = await getMe();
      expect(user).toEqual({ username: 'juan' });
    });
  });

  describe('getUserByBcAdress', () => {
    it('lanza error si no hay sesión', async () => {
      dbMock.getConnectedUser.mockResolvedValue(null);
      await expect(getUserByBcAdress('0xabc')).rejects.toThrow("No hay sesión de usuario activa");
    });

    it('devuelve usuario por dirección', async () => {
      dbMock.getConnectedUser.mockResolvedValue({ user: { did: 'did:abc' } });
      dbMock.run.mockResolvedValue({ rows: [{ username: 'lucas' }] });
      const user = await getUserByBcAdress('0xabc');
      expect(user).toEqual({ username: 'lucas' });
    });

    it('lidia con usuario no encontrado', async () => {
      dbMock.getConnectedUser.mockResolvedValue({ user: { did: 'did:abc' } });
      dbMock.run.mockResolvedValue({ rows: [] });
      const user = await getUserByBcAdress('0xabc');
      expect(user).toBeUndefined();
    });
  });

  describe('getUserByUsername', () => {
    it('devuelve usuario por username', async () => {
      dbMock.getConnectedUser.mockResolvedValue({ user: { did: 'did:x' } });
      dbMock.run.mockResolvedValue({ rows: [{ username: 'sofia' }] });
      const user = await getUserByUsername('sofia');
      expect(user).toEqual({ username: 'sofia' });
    });

    it('lanza error si no hay sesión', async () => {
      dbMock.getConnectedUser.mockResolvedValue(null);
      await expect(getUserByUsername('sofia')).rejects.toThrow("No hay sesión de usuario activa");
    });
  });

  describe('getUserById', () => {
    it('devuelve usuario por stream_id', async () => {
      dbMock.getConnectedUser.mockResolvedValue({ user: { did: 'did:x' } });
      dbMock.run.mockResolvedValue({ rows: [{ id: 'id123' }] });
      const user = await getUserById('id123');
      expect(user).toEqual({ id: 'id123' });
    });

    it('lanza error si no hay sesión', async () => {
      dbMock.getConnectedUser.mockResolvedValue(null);
      await expect(getUserById('id123')).rejects.toThrow("No hay sesión de usuario activa");
    });
  });

  describe('registerUser', () => {
    it('registra usuario y guarda en localStorage', async () => {
      dbMock.getConnectedUser.mockResolvedValue({ user: { did: 'did:reg' } });
      dbMock.run.mockResolvedValueOnce({}); // para insert
      dbMock.run.mockResolvedValueOnce({ rows: [{ username: 'juan' }] }); // para getMe

      const setItemSpy = jest.spyOn(window.localStorage, 'setItem');
      const result = await registerUser('juan', '123');
      expect(result).toBe('private');
      expect(setItemSpy).toHaveBeenCalledWith('orbis:key', 'encrypted');
      expect(setItemSpy).toHaveBeenCalledWith('orbis:user', JSON.stringify({ username: 'juan' }));
      setItemSpy.mockRestore();
    });

    it('lanza error si hay excepción al registrar', async () => {
      dbMock.getConnectedUser.mockResolvedValue({ user: { did: 'did:reg' } });
      dbMock.run.mockRejectedValue(new Error('DB error'));
      await expect(registerUser('juan', '123')).rejects.toThrow("Error al registrar el usuario");
    });
  });

  describe('searchUsersByUsername', () => {
    it('devuelve filas encontradas', async () => {
      dbMock.run.mockResolvedValue({ columns: [], rows: [{ username: 'ana' }, { username: 'andres' }] });
      const rows = await searchUsersByUsername('an');
      expect(rows).toEqual([{ username: 'ana' }, { username: 'andres' }]);
    });

    it('devuelve array vacío si no encuentra usuarios', async () => {
      dbMock.run.mockResolvedValue({ columns: [], rows: [] });
      const rows = await searchUsersByUsername('zzz');
      expect(rows).toEqual([]);
    });
  });

});
