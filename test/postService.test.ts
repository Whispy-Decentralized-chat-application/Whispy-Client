// test/postService.test.ts

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

const modelsMock = { post: 'PostTable' };
const contextsMock = { whispy_test: 'testContext' };

jest.mock('@/app/ceramic/orbisDB', () => ({
  db: dbMock,
  models: modelsMock,
  contexts: contextsMock,
}));

import {
  retrieveCommunityPosts,
  createPost,
  retrievePost,
} from '@/app/ceramic/postService';

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('postService', () => {
  describe('retrieveCommunityPosts', () => {
    it('devuelve los posts de una comunidad', async () => {
      dbMock.select.mockReturnThis();
      dbMock.context.mockReturnThis();
      dbMock.from.mockReturnThis();
      dbMock.where.mockReturnThis();
      dbMock.run.mockResolvedValue({
        columns: [],
        rows: [
          { stream_id: 'p1', title: 'Post 1' },
          { stream_id: 'p2', title: 'Post 2' },
        ],
      });

      const result = await retrieveCommunityPosts('community123');
      expect(result).toEqual([
        { stream_id: 'p1', title: 'Post 1' },
        { stream_id: 'p2', title: 'Post 2' },
      ]);
    });
  });

  describe('createPost', () => {
    it('lanza error si no hay sesión', async () => {
      dbMock.getConnectedUser.mockResolvedValue(null);
      await expect(createPost('texto', 'commID', 'Titulo')).rejects.toThrow('No hay sesión de usuario activa');
    });

    it('crea un post correctamente', async () => {
      dbMock.getConnectedUser.mockResolvedValue({ user: { did: 'user1' } });
      dbMock.insert.mockReturnThis();
      dbMock.value.mockReturnThis();
      dbMock.context.mockReturnThis();
      dbMock.run.mockResolvedValue({ success: true });

      await createPost('contenido', 'comunidad', 'Un título');

      expect(dbMock.insert).toHaveBeenCalledWith('PostTable');
      expect(dbMock.value).toHaveBeenCalledWith(expect.objectContaining({
        content: 'contenido',
        communityId: 'comunidad',
        title: 'Un título',
        date: expect.any(String),
      }));
      expect(dbMock.context).toHaveBeenCalledWith('testContext');
      expect(dbMock.run).toHaveBeenCalled();
    });

    it('loggea error si ocurre una excepción', async () => {
      dbMock.getConnectedUser.mockResolvedValue({ user: { did: 'user1' } });
      dbMock.insert.mockReturnThis();
      dbMock.value.mockReturnThis();
      dbMock.context.mockReturnThis();
      dbMock.run.mockRejectedValue(new Error('fail post'));

      await createPost('contenido', 'comunidad', 'Titulo Error');
      expect(console.error).toHaveBeenCalledWith('Error creating post:', expect.any(Error));
    });
  });

  describe('retrievePost', () => {
    it('devuelve un post por id', async () => {
      dbMock.select.mockReturnThis();
      dbMock.context.mockReturnThis();
      dbMock.from.mockReturnThis();
      dbMock.where.mockReturnThis();
      dbMock.run.mockResolvedValue({
        columns: [],
        rows: [{ stream_id: 'p9', title: 'Único post' }]
      });

      const result = await retrievePost('p9');
      expect(result).toEqual({ stream_id: 'p9', title: 'Único post' });
    });
  });
});
