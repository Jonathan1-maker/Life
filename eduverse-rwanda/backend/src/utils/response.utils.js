const success = (res, data, message = 'Success', status = 200) =>
  res.status(status).json({ success: true, message, data });

const paginate = (res, data, total, page, limit) =>
  res.json({
    success: true,
    data,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit),
    },
  });

module.exports = { success, paginate };
