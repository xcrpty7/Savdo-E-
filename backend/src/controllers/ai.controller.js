const { GoogleGenerativeAI } = require("@google/generative-ai");
const prisma = require("../config/prisma");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

exports.askAI = async (req, res) => {
    try {
        const { prompt, question, language } = req.body;
        const finalPrompt = prompt || question;

        if (!finalPrompt) {
            return res.status(400).json({
                success: false,
                message: "Savol (prompt yoki question) talab qilinadi"
            });
        }

        if (!process.env.GEMINI_API_KEY) {
            console.error("GEMINI_API_KEY is not defined in backend .env!");
            return res.status(500).json({ success: false, message: "AI API key is missing" });
        }

        // Fetch context data using Prisma
        const products = await prisma.product.findMany({ take: 20 });
        const recentSales = await prisma.sale.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10
        });

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

        res.json({
            success: true,
            data: text
        });
    } catch (error) {
        console.error("AI Error Full:", error);
        res.status(500).json({
            success: false,
            message: error.message || "AI xizmatida xatolik yuz berdi"
        });
    }
};
