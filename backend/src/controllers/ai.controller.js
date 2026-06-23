const { GoogleGenerativeAI } = require("@google/generative-ai");
const Product = require("../models/Product.model");
const Sale = require("../models/Sale.model");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

exports.askAI = asyncHandler(async (req, res) => {
  const { prompt, question, language } = req.body;
  const finalPrompt = prompt || question;

  if (!finalPrompt) {
    throw new ApiError(400, "Savol (prompt yoki question) talab qilinadi");
  }

  if (!process.env.GEMINI_API_KEY) {
    throw new ApiError(500, "AI API key is missing");
  }

  const products = await Product.find({ owner: req.user._id }).limit(20);
  const recentSales = await Sale.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(10);

  const context = `
    Siz "Savdo-E" do'kon boshqaruv tizimining aqlli yordamchisiz.
    Do'kon ma'lumotlari:
    Mahsulotlar soni: ${products.length}
    Oxirgi sotuvlar soni: ${recentSales.length}

    Mahsulotlar ro'yxati (namuna):
    ${products.map(p => `${p.name}: ${p.sellPrice} so'm, Qoldiq: ${p.stock} ${p.unit}`).join('\n')}

    Foydalanuvchi tili: ${language || 'uz'}

    Vazifangiz:
    1. Mahsulotlar to'g'risidagi savollarga aniq javob bering.
    2. Biznesni rivojlantirish bo'yicha maslahatlar bering.
    3. Savolga qisqa va lo'nda, do'stona tarzda ${language === 'ru' ? 'rus' : language === 'en' ? 'ingliz' : 'o\'zbek'} tilida javob bering.
    4. Agar biror narsani bilmasangiz, muloyimlik bilan ayting.

    Foydalanuvchi so'rovi: ${finalPrompt}
  `;

  const result = await model.generateContent(context);
  const response = await result.response;
  const text = response.text();

  res.json(new ApiResponse(200, text, "AI javob"));
});
