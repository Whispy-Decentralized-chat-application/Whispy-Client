// test/likeService.test.ts

const dbMock = {
  getConnectedUser: jest.fn(),
  select: jest.fn().mockReturnThis(),
  context: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  run: jest.fn(),
  insert: jest.fn().mockReturnThis(),
  value: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
};

const modelsMock = { likes: 'LikesTable' };
const contextsMock = { whispy_test: 'testContext' };

jest.mock('@/app/ceramic/orbisDB', () => ({
  db: dbMock,
  models: modelsMock,
  contexts: contextsMock,
}));

import {
  likeObject,
  underlikeObject,
  getNumberOfLikes,
  checkLike,
} from '@/app/ceramic/likeService';

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('likeService', () => {
  describe('likeObject', () => {
    it('lanza error si no hay sesión', async () => {
      dbMock.getConnectedUser.mockResolvedValue(null);
      await expect(likeObject('obj1')).rejects.toThrow('No hay sesión de usuario activa');
    });

    it('crea un nuevo like si no existe', async () => {
      dbMock.getConnectedUser.mockResolvedValue({ user: { did: 'user1' } });
      dbMock.select.mockReturnThis();
      dbMock.context.mockReturnThis();
      dbMock.from.mockReturnThis();
      dbMock.where.mockReturnThis();
      dbMock.run
        .mockResolvedValueOnce({ rows: [] }) // No hay like previo
        .mockResolvedValueOnce({}); // Insert like
      dbMock.insert.mockReturnThis();
      dbMock.value.mockReturnThis();

      await likeObject('obj1');
      expect(dbMock.insert).toHaveBeenCalledWith('LikesTable');
      expect(dbMock.value).toHaveBeenCalledWith(expect.objectContaining({
        objectId: 'obj1',
        userId: 'user1',
        active: true
      }));
    });

    it('actualiza like si ya existe', async () => {
      dbMock.getConnectedUser.mockResolvedValue({ user: { did: 'user1' } });
      dbMock.select.mockReturnThis();
      dbMock.context.mockReturnThis();
      dbMock.from.mockReturnThis();
      dbMock.where.mockReturnThis();
      dbMock.run
        .mockResolvedValueOnce({ rows: [{ stream_id: 'likeId', active: false }] }) // Hay like previo
        .mockResolvedValueOnce({}); // Update
      dbMock.update.mockReturnThis();
      dbMock.set.mockReturnThis();

      await likeObject('obj1');
      expect(dbMock.update).toHaveBeenCalledWith('likeId');
      expect(dbMock.set).toHaveBeenCalledWith({ active: true });
    });

    it('loggea error si ocurre excepción', async () => {
      dbMock.getConnectedUser.mockResolvedValue({ user: { did: 'user1' } });
      dbMock.select.mockImplementationOnce(() => { throw new Error('fail like'); });
      await likeObject('obj1');
      expect(console.error).toHaveBeenCalledWith('Error liking post:', expect.any(Error));
    });
  });

  describe('underlikeObject', () => {
    it('lanza error si no hay sesión', async () => {
      dbMock.getConnectedUser.mockResolvedValue(null);
      await expect(underlikeObject('obj1')).rejects.toThrow('No hay sesión de usuario activa');
    });

    it('actualiza el like a inactivo si existe', async () => {
      dbMock.getConnectedUser.mockResolvedValue({ user: { did: 'user2' } });
      dbMock.select.mockReturnThis();
      dbMock.context.mockReturnThis();
      dbMock.from.mockReturnThis();
      dbMock.where.mockReturnThis();
      dbMock.run
        .mockResolvedValueOnce({ rows: [{ stream_id: 'likeId', active: true }] })
        .mockResolvedValueOnce({});
      dbMock.update.mockReturnThis();
      dbMock.set.mockReturnThis();

      await underlikeObject('obj2');
      expect(dbMock.update).toHaveBeenCalledWith('likeId');
      expect(dbMock.set).toHaveBeenCalledWith({ active: false });
    });

    it('loggea si no existe el like para un underlike', async () => {
      dbMock.getConnectedUser.mockResolvedValue({ user: { did: 'user2' } });
      dbMock.select.mockReturnThis();
      dbMock.context.mockReturnThis();
      dbMock.from.mockReturnThis();
      dbMock.where.mockReturnThis();
      dbMock.run.mockResolvedValueOnce({ rows: [] });

      await underlikeObject('obj3');
      // No se hace update ni insert, solo log
      expect(dbMock.update).not.toHaveBeenCalled();
    });

    it('loggea error si ocurre excepción', async () => {
      dbMock.getConnectedUser.mockResolvedValue({ user: { did: 'user2' } });
      dbMock.select.mockImplementationOnce(() => { throw new Error('fail unlike'); });
      await underlikeObject('obj1');
      expect(console.error).toHaveBeenCalledWith('Error unliking post:', expect.any(Error));
    });
  });

  describe('getNumberOfLikes', () => {
    it('devuelve el número de likes activos', async () => {
      dbMock.select.mockReturnThis();
      dbMock.context.mockReturnThis();
      dbMock.from.mockReturnThis();
      dbMock.where.mockReturnThis();
      dbMock.run.mockResolvedValue({
        rows: [
          { objectId: 'obj4', active: true },
          { objectId: 'obj4', active: true },
        ]
      });

      const result = await getNumberOfLikes('obj4');
      expect(result).toBe(2);
    });
  });

  describe('checkLike', () => {
    it('lanza error si no hay sesión', async () => {
      dbMock.getConnectedUser.mockResolvedValue(null);
      await expect(checkLike('obj5')).rejects.toThrow('No hay sesión de usuario activa');
    });

    it('devuelve true si existe like activo', async () => {
      dbMock.getConnectedUser.mockResolvedValue({ user: { did: 'user3' } });
      dbMock.select.mockReturnThis();
      dbMock.context.mockReturnThis();
      dbMock.from.mockReturnThis();
      dbMock.where.mockReturnThis();
      dbMock.run.mockResolvedValue({ rows: [{ stream_id: 'likeId', active: true }] });

      const result = await checkLike('obj6');
      expect(result).toBe(true);
    });

    it('devuelve false si no existe like activo', async () => {
      dbMock.getConnectedUser.mockResolvedValue({ user: { did: 'user3' } });
      dbMock.select.mockReturnThis();
      dbMock.context.mockReturnThis();
      dbMock.from.mockReturnThis();
      dbMock.where.mockReturnThis();
      dbMock.run.mockResolvedValue({ rows: [] });

      const result = await checkLike('obj7');
      expect(result).toBe(false);
    });

    it('loggea error si ocurre excepción', async () => {
      dbMock.getConnectedUser.mockResolvedValue({ user: { did: 'user3' } });
      dbMock.select.mockImplementationOnce(() => { throw new Error('fail check'); });
      await checkLike('obj8');
      expect(console.error).toHaveBeenCalledWith('Error checking like:', expect.any(Error));
    });
  });
});
