const sampleText = `
https://www.w3.org/2001/06/utf-8-test/UTF-8-demo.html
ABCDEFGHIJKLMNOPQRSTUVWXYZ /0123456789
abcdefghijklmnopqrstuvwxyz £©µÀÆÖÞßéöÿ
–—‘“”„†•…‰™œŠŸž€ ΑΒΓΔΩαβγδω АБВГДабвгд
∀∂∈ℝ∧∪≡∞ ↑↗↨↻⇣ ┐┼╔╘░►☺♀ ﬁ�⑀₂ἠḂӥẄɐː⍎אԱა
Μπορώ να φάω σπασμένα γυαλιά χωρίς να πάθω τίποτα.
Ég get etið gler án þess að meiða mig.
Mogę jeść szkło, i mi nie szkodzi.
Pot să mănânc sticlă și ea nu mă rănește.
Я можу їсти шкло, й воно мені не пошкодить.
Կրնամ ապակի ուտել և ինծի անհանգիստ չըներ։
მინას ვჭამ და არა მტკივა.
मैं काँच खा सकता हूँ, मुझे उस से कोई पीडा नहीं होती.
אני יכול לאכול זכוכית וזה לא מזיק לי.
أنا قادر على أكل الزجاج و هذا لا يؤلمني.
میں کانچ کھا سکتا ہوں اور مجھے تکلیف نہیں ہوتی ۔
زه شيشه خوړلې شم، هغه ما نه خوږوي
.من می توانم بدونِ احساس درد شيشه بخورم
私はガラスを食べられます。それは私を傷つけません。
ฉันกินกระจกได้ แต่มันไม่ทำให้ฉันเจ็บ
我能吞下玻璃而不伤身体。
我能吞下玻璃而不傷身體。
Μπορῶ νὰ φάω σπασμένα γυαλιὰ χωρὶς νὰ πάθω τίποτα.
Я могу есть стекло, оно мне не вредит.
∮ E⋅da = Q,  n → ∞, ∑ f(i) = ∏ g(i), ∀x∈ℝ: ⌈x⌉ = −⌊−x⌋, α ∧ ¬β = ¬(¬α ∨ β),
2H₂ + O₂ ⇌ 2H₂O, R = 4.7 kΩ, ⌀ 200 mm
😀 😃 😄 😁 😆 😅 🤣 😂 🙂 🙃
🌯 🫔 🥙 🧆 🥚 🍳 🥘 🍲 🫕 🥣 🥗 🍿 🧈 🧂 🥫
🔡 🔢 🔣 🔤 🆎 🆑 🆒 🆓 🆔 🆕 🆖 🆗 🆘 🆙
`;

const charWidthCache = {};

function fillTextOptImpl(ctx, text, x, y, maxWidth, clip, textLimitFactor) {
    if (!charWidthCache[ctx.font]) {
        let metrics = ctx.measureText(sampleText);
        charWidthCache[ctx.font] = metrics.width / sampleText.length;
    }

    if (clip) {
        let averageCharWidth = charWidthCache[ctx.font];
        let maxLength = parseInt((clip.width / averageCharWidth) * textLimitFactor);
        if (maxLength < text.length) text = text.substring(0, maxLength);

        ctx.save();
        ctx.beginPath();
        ctx.rect(clip.x, clip.y, clip.width, clip.height);
        ctx.clip();
    }

    ctx.fillText(text, x, y, maxWidth);

    if (clip) ctx.restore();
}

if (typeof module !== "undefined" && module["exports"]) {
    module.exports = fillTextOptImpl;
}
