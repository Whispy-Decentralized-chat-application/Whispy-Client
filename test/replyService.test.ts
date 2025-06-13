// test/replyService.test.ts

const dbMock = {
  getConnectedUser: jest.fn(),
  select: jest.fn().mockReturnThis(),
  context: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  run: jest.fn(),
  insert: jest.fn().mockReturnThis(),
  value: jest.fn().mockReturnThis(),
};

const modelsMock = { reply: 'ReplyTable' };
const contextsMock = { whispy_test: 'testContext' };

jest.mock('@/app/ceramic/orbisDB', () => ({
  db: dbMock,
  models: modelsMock,
  contexts: contextsMock,
}));

import {
  replyToPost,
  retrieveReplies,
  getNumberOfReplies,
} from '@/app/ceramic/replyService';

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('replyService', () => {
  describe('replyToPost', () => {
    it('lanza error si no hay sesión', async () => {
      dbMock.getConnectedUser.mockResolvedValue(null);
      await expect(replyToPost('post1', 'contenido')).rejects.toThrow('No hay sesión de usuario activa');
    });

    it('crea un reply correctamente', async () => {
      dbMock.getConnectedUser.mockResolvedValue({ user: { did: 'user1' } });
      dbMock.insert.mockReturnThis();
      dbMock.value.mockReturnThis();
      dbMock.context.mockReturnThis();
      dbMock.run.mockResolvedValue({ success: true });

      await replyToPost('post1', 'mi respuesta');

      expect(dbMock.insert).toHaveBeenCalledWith('ReplyTable');
      expect(dbMock.value).toHaveBeenCalledWith(expect.objectContaining({
        content: 'mi respuesta',
        postId: 'post1',
        writer: 'user1',
      }));
      expect(dbMock.context).toHaveBeenCalledWith('testContext');
      expect(dbMock.run).toHaveBeenCalled();
    });

    it('loggea error si ocurre una excepción', async () => {
      dbMock.getConnectedUser.mockResolvedValue({ user: { did: 'user1' } });
      dbMock.insert.mockReturnThis();
      dbMock.value.mockReturnThis();
      dbMock.context.mockReturnThis();
      dbMock.run.mockRejectedValue(new Error('fail reply'));

      await replyToPost('post1', 'respuesta fallida');
      expect(console.error).toHaveBeenCalledWith('Error creating reply:', expect.any(Error));
    });
  });

  describe('retrieveReplies', () => {
    it('devuelve las replies de un post', async () => {
      dbMock.select.mockReturnThis();
      dbMock.context.mockReturnThis();
      dbMock.from.mockReturnThis();
      dbMock.where.mockReturnThis();
      dbMock.run.mockResolvedValue({
        columns: [],
        rows: [
          { stream_id: 'r1', content: 'Reply 1' },
          { stream_id: 'r2', content: 'Reply 2' },
        ],
      });

      const result = await retrieveReplies('post99');
      expect(result).toEqual([
        { stream_id: 'r1', content: 'Reply 1' },
        { stream_id: 'r2', content: 'Reply 2' },
      ]);
    });
  });

  describe('getNumberOfReplies', () => {
    it('devuelve el número de replies de un post', async () => {
      dbMock.select.mockReturnThis();
      dbMock.context.mockReturnThis();
      dbMock.from.mockReturnThis();
      dbMock.where.mockReturnThis();
      dbMock.run.mockResolvedValue({
        columns: [],
        rows: [{ stream_id: 'r1' }, { stream_id: 'r2' }, { stream_id: 'r3' }],
      });

      const result = await getNumberOfReplies('postXYZ');
      expect(result).toBe(3);
    });
  });
});
