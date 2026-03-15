const AppError = require('../utils/appError.jsx');
const { idParams, pagination, requireObject } = require('./commonValidators.jsx');

function clientSearchQuery(query) {
  requireObject(query || {}, 'Query');
  const { page, limit } = pagination(query || {});
  let active;

  if (query.active !== undefined) {
    if (query.active !== 'true' && query.active !== 'false') {
      throw new AppError('Parâmetro active inválido', 400);
    }
    active = query.active === 'true';
  }

  return {
    search: typeof query.search === 'string' && query.search.trim().length > 0 ? query.search.trim() : undefined,
    active,
    page,
    limit,
  };
}

module.exports = {
  clientSearchQuery,
  userIdParams: (params) => idParams(params, 'id'),
};
