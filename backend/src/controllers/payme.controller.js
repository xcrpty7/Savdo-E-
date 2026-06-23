const { handlePaymeRequest } = require('../services/payme.service');

async function webhook(req, res) {
  try {
    const auth = req.headers['authorization'] || '';
    const expected = 'Basic ' + Buffer.from(
      `Paycom:${process.env.PAYME_SECRET_KEY || 'test_secret'}`
    ).toString('base64');

    if (auth !== expected) {
      return res.status(200).json({ error: { code: -32504, message: 'Unauthorized' } });
    }

    const result = await handlePaymeRequest(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(200).json({ error: { code: -32400, message: 'Internal error' } });
  }
}

module.exports = { webhook };
