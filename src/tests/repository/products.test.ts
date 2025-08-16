import ProductsRepository from '../../repository/products';
import Product from '../../interfaces/products';
import db from '../../../config/database/database';

jest.mock('../../../config/database/database', () => ({
  transaction: jest.fn((callback) => {
    const mockTrx = (tableName: string) => {
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          id: 1,
          name: 'Produto Teste',
          description: 'Descrição Teste',
          price: 10.5,
          category: 'Categoria Teste',
          pictureUrl: 'http://localhost:3000/produto.jpg'
        })
      };
      return queryBuilder;
    };

    mockTrx.rollback = jest.fn();
    mockTrx.destroy = jest.fn();
    mockTrx.commit = jest.fn();

    return callback(mockTrx);
  })
}));

describe('ProductsRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('deve retornar um produto pelo id', async () => {
      const id = 1;
      const result = await ProductsRepository.findById(id);
      
      expect(result).toEqual({
        id: 1,
        name: 'Produto Teste',
        description: 'Descrição Teste',
        price: 10.5,
        category: 'Categoria Teste',
        pictureUrl: 'http://localhost:3000/produto.jpg'
      });
      expect(db.transaction).toHaveBeenCalledTimes(1);
    });
  });
}); 