function success(data = null, message = 'success') {
  return {
    code: 200,
    message,
    data
  };
}

function error(message = 'error', code = 500, data = null) {
  return {
    code,
    message,
    data
  };
}

function paginate(list = [], total = 0, page = 1, pageSize = 10) {
  return {
    list,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
}

module.exports = {
  success,
  error,
  paginate
};
