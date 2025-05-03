const express = require('express');
const router = express.Router();
const Currency = require('../models/Currency');

router.get('/', async (req, res) => {
  try {
    const currencies = await Currency.find({ is_deleted: false });
    res.json(currencies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  const { code, name, symbol, exchange_rate } = req.body;

  if (!code || !name || !symbol || !exchange_rate) {
    return res.status(400).json({ message: 'All fields are required!' });
  }

  try {
    const newCurrency = new Currency({ code, name, symbol, exchange_rate });
    await newCurrency.save();
    res.status(201).json(newCurrency);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updatedCurrency = await Currency.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedCurrency) {
      return res.status(404).json({ message: 'Currency not found' });
    }
    res.json(updatedCurrency);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deletedCurrency = await Currency.findByIdAndUpdate(req.params.id, { is_deleted: true }, { new: true });
    if (!deletedCurrency) {
      return res.status(404).json({ message: 'Currency not found' });
    }
    res.json(deletedCurrency);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
