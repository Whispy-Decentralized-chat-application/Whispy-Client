// test/reportService.test.ts

// 1. Mocks
const dbMock = {
  getConnectedUser: jest.fn(),
  insert: jest.fn().mockReturnThis(),
  value: jest.fn().mockReturnThis(),
  context: jest.fn().mockReturnThis(),
  run: jest.fn(),
};

const modelsMock = { report: 'ReportTable' };
const contextsMock = { whispy_test: 'testContext' };

// 2. Mock orbisDB
jest.mock('@/app/ceramic/orbisDB', () => ({
  db: dbMock,
  models: modelsMock,
  contexts: contextsMock,
}));

// 3. Import function
import { reportObject } from '@/app/ceramic/reportService';

// 4. Mock localStorage y console
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

describe('reportService', () => {
  describe('reportObject', () => {
    it('lanza error si no hay sesión', async () => {
      dbMock.getConnectedUser.mockResolvedValue(null);

      await expect(reportObject('obj123', 'spam')).rejects.toThrow("No hay sesión de usuario activa");
    });

    it('crea un reporte correctamente', async () => {
      dbMock.getConnectedUser.mockResolvedValue({ user: { did: 'did:xyz' } });
      (window.localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify({ stream_id: 'user42' }));
      dbMock.run.mockResolvedValue({ success: true });

      await expect(reportObject('obj123', 'abuso')).resolves.toBeUndefined();

      expect(dbMock.insert).toHaveBeenCalledWith('ReportTable');
      expect(dbMock.value).toHaveBeenCalledWith(expect.objectContaining({
        reportedId: 'obj123',
        reason: 'abuso',
        reporterId: 'user42',
        date: expect.any(String),
      }));
      expect(dbMock.context).toHaveBeenCalledWith('testContext');
      expect(dbMock.run).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        "Report created successfully:",
        { success: true }
      );
    });

    it('funciona aunque no haya usuario en localStorage', async () => {
      dbMock.getConnectedUser.mockResolvedValue({ user: { did: 'did:abc' } });
      (window.localStorage.getItem as jest.Mock).mockReturnValue(null);
      dbMock.run.mockResolvedValue({ ok: true });

      await expect(reportObject('objXYZ', 'inapropiado')).resolves.toBeUndefined();
      expect(dbMock.value).toHaveBeenCalledWith(expect.objectContaining({
        reportedId: 'objXYZ',
        reason: 'inapropiado',
        reporterId: null,
        date: expect.any(String),
      }));
    });

    it('loggea el error si ocurre un error en el proceso', async () => {
      dbMock.getConnectedUser.mockResolvedValue({ user: { did: 'did:abc' } });
      (window.localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify({ stream_id: 'errUser' }));
      dbMock.run.mockRejectedValue(new Error('DB error'));

      await reportObject('objError', 'error-test');
      expect(console.error).toHaveBeenCalledWith(
        "Error creating report:",
        expect.any(Error)
      );
    });
  });
});
